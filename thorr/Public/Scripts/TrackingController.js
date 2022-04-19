// TrackingController.js
// Version: 0.0.3
// Event: Lens Initialized
// Description: The script uses tracking component to attach objects to the body
// @input bool isTrackingEnabled {"label":"Tracking"}
//@ui {"widget":"group_start", "label":"Switch To One Tracker Based On FPS (Auto Optimize)", "showIf":"isTrackingEnabled"}
// @input bool autoOptimizeFps {"label":"Enabled"}
// @input int minimumFps = 15 {"label":"Min FPS To Switch", "widget":"slider", "min":1, "max":25, "step":1, "showIf":"autoOptimizeFps"}
//@ui {"widget":"group_end"}
// @ui {"widget":"separator"}
// @input SceneObject[] applyToObjects  {"label":"Tracking Objects"}
// @input bool advanced
//@ui {"widget":"group_start", "label":"Properties", "showIf":"advanced"}
//@ui {"widget":"group_start", "label":"Trackers"}
// @input Component.Head head
// @input bool enableBodyTracking
//@ui {"widget":"group_start", "label":"Body Tracker", "showIf":"enableBodyTracking"}
// @input Component.ObjectTracking leftShoulder
// @input Component.ObjectTracking rightShoulder
// @input Component.ObjectTracking leftHip
// @input Component.ObjectTracking rightHip
//@ui {"widget":"group_end"}
//@ui {"widget":"group_end"}
//@ui {"widget":"group_start", "label":"Apply Tracking to"}
// @input bool applyPosition = true {"label":"Position"}
// @input bool applyRotation = true {"label":"Rotation"}
// @input bool applyScale = true {"label":"Scale"}
//@ui {"widget":"group_end"}
// @input Asset.Texture segmentationTex {"label":"Segmentation Texture"}
// @input Asset.Material imgMat {"label":"Default Image Material"}
// @input Component.Camera perpectiveCamera
// @input Component.Camera orthoCam
//@ui {"widget":"group_end"}




const SKIP_INITIAL_TIME = 1.0;
var frameCounter = 0;
var rotationSmoothing = 8;
var deltaTime = 0;
var lSScreenTrans, rSScreenTrans, lHScreenTrans, rHScreenTrans;
var lSTracker, rSTracker, lHTracker, rHTracker;
var isInit = false;
var neckOffset = new vec3(0, -10, 0);
var headBaseScaleVec = new vec3(20, 0, -30);
var maxFaceDist = 120;
var faceToBodyScaleFactor = 0.22; // Match scale between face and full-body tracking
var failedFPSTest = false;
var lowResSegmentationTexture;
var lowResSegmentationData;
var lowResSegmentationDataFloat;
var segmetantionCOM;

var faceDistMult = 1.0;
var position = new vec2(0, 0),
    rotation = 0,
    scale = 0.6;

script.api.getTrackedObjects = getTrackedObjects;
script.api.addToTrackedObjects = addToTrackedObjects;

function onStart() {
    isInit = validateInputs();
    if (!isInit) {
        return;
    }
    initBodyTrackers();
    initCOMTracking();

    // fix scale for preview videos without camera properties
    if (script.perpectiveCamera.fov > 1.5 && global.deviceInfoSystem.isEditor()) {
        faceDistMult = 1.8;
        headBaseScaleVec.z *= 1.3;
    }
}

function initBodyTrackers() {
    lSTracker = script.leftShoulder;
    rSTracker = script.rightShoulder;
    lHTracker = script.leftHip;
    rHTracker = script.rightHip;

    lSScreenTrans = lSTracker ? lSTracker.getSceneObject().getComponent("Component.ScreenTransform") : undefined;
    rSScreenTrans = rSTracker ? rSTracker.getSceneObject().getComponent("Component.ScreenTransform") : undefined;
    lHScreenTrans = lHTracker ? lHTracker.getSceneObject().getComponent("Component.ScreenTransform") : undefined;
    rHScreenTrans = rHTracker ? rHTracker.getSceneObject().getComponent("Component.ScreenTransform") : undefined;

    if (!script.isTrackingEnabled || !script.enableBodyTracking) {
        setBodyTrackersEnabled(false);
    }
}

function onUpdate() {
    if (!isInit || !script.isTrackingEnabled) {
        return;
    }

    if (!global.deviceInfoSystem.isEditor()) {
        autoFpsOptimize();
    }
    updateTracking();
    setBodyTrackersEnabled(script.enableBodyTracking && !haveFaceTrackingSafeDist() && !failedFPSTest);
}

function updateTracking() {
    if (haveHipTracking()) {
        fullBodyTracking();
    } else {
        faceTracking();
    }
}


function convertBlock(incomingData) { // incoming data is a UInt8Array
    var i, l = incomingData.length;
    for (i = 0; i < l; i++) {
        lowResSegmentationDataFloat[i] = incomingData[i];
    }
    return lowResSegmentationDataFloat;
}

function fullBodyTracking() {
    var lsPos = lSScreenTrans.position;
    var rsPos = rSScreenTrans.position;
    var topCenter = lsPos.add(rsPos).uniformScale(0.5);
    var lhPos = lHScreenTrans.position;
    var rhPos = rHScreenTrans.position;
    var bottomCenter = lhPos.add(rhPos).uniformScale(0.5);

    position = bottomCenter.add(topCenter).uniformScale(0.5);
    rotation = Math.atan2(topCenter.y - bottomCenter.y, topCenter.x - bottomCenter.x) - 0.5 * Math.PI;
    scale = faceToBodyScaleFactor *
        ((lSScreenTrans.anchors.right - lSScreenTrans.anchors.left) +
            (rSScreenTrans.anchors.right - rSScreenTrans.anchors.left));

    setTransform(position, rotation, scale);
}

function faceTracking() {
    if (lowResSegmentationTexture.control.getLoadStatus() == LoadStatus.Loaded) {

        // calculate Center Of Mask Mass
        var w = lowResSegmentationTexture.getWidth();
        var h = lowResSegmentationTexture.getHeight();
        TensorMath.textureToGrayscale(lowResSegmentationTexture, lowResSegmentationData, new vec3(w, h, 1));
        TensorMath.softArgMax(convertBlock(lowResSegmentationData), new vec3(w, h, 1), segmetantionCOM, true);

        var position2d;

        if (haveFaceTracking()) {
            var neckPoint = script.head.getTransform().getWorldPosition().add(neckOffset);
            var neck2d = script.perpectiveCamera.worldSpaceToScreenSpace(neckPoint.add(new vec3(0, 40, 0)));
            neck2d.y = 1 - neck2d.y;

            // estimate scale
            scale = (script.perpectiveCamera.worldSpaceToScreenSpace(new vec3(headBaseScaleVec.x, 0, neckPoint.z)).x - 0.5) / (script.perpectiveCamera.worldSpaceToScreenSpace(headBaseScaleVec).x - 0.5);

            // rotation
            var dir;
            if (script.head.getFacesCount() == 1) {
                // only one face, estimate rotation
                dir = neck2d.sub(new vec2(segmetantionCOM[0] / w, segmetantionCOM[1] / h));
                dir.x *= script.perpectiveCamera.aspect;
                rotation = -Math.atan2(-dir.y, dir.x) - Math.PI / 2;
            } else {
                // multiple faces, reset rotation
                dir = new vec2(0, 1);
                rotation = 0;
            }

            // adjust position based on neck position and rotation (calculated from neck point)
            var dir3d = (new vec3(dir.x, dir.y, 0)).normalize();
            position2d = script.perpectiveCamera.worldSpaceToScreenSpace(neckPoint.add(dir3d.uniformScale(-20)));
            // average position2d and COM
            position2d = position2d.add(new vec2(segmetantionCOM[0] / w, 1 - segmetantionCOM[1] / h)).uniformScale(0.5);
        } else {
            // No face tracking
            // Position based only on Center Of Mask Mass
            position2d = new vec2(segmetantionCOM[0] / w, 1 - segmetantionCOM[1] / h);
            // reset rotation
            rotation = 0;
        }

        // Translate normalized coordinates (0-1) to orthographic coordinates
        position = new vec3((position2d.x - 0.5) * script.orthoCam.getOrthographicSize().x,
            (1 - position2d.y - 0.5) * script.orthoCam.getOrthographicSize().y, -40);

        setTransform(position, rotation, scale);
    }
}

function setTransform(pos, rot, sc) {
    for (var i in script.applyToObjects) {
        var trans = script.applyToObjects[i].getTransform();

        if (script.applyPosition) {
            trans.setWorldPosition(pos);
        }
        if (script.applyScale) {
            trans.setLocalScale(new vec3(sc, sc, 1));
        }
        if (script.applyRotation) {
            var curRotation = quat.fromEulerAngles(0, 0, rot);
            var smoothedRot = quat.lerp(trans.getLocalRotation(), curRotation, rotationSmoothing * getDeltaTime());
            trans.setLocalRotation(smoothedRot);
        }
    }
}

function validateInputs() {
    if (script.applyToObjects.length == 0) {
        print("WARNING: Make sure to add at least a scene object to Tracking objects");
        return false;
    }
    for (var i in script.applyToObjects) {
        if (isNull(script.applyToObjects[i])) {
            print("ERROR: Make sure all objects are set in the Tracking Objects list");
            return false;
        }
    }
    if (!script.head) {
        print("ERROR: Make sure to set the Head Tracker to the script");
        return false;
    }
    if (script.enableBodyTracking) {
        if (!script.leftShoulder) {
            print("ERROR: Make sure to set the Left Shoulder Tracker to the script");
            return false;
        }
        if (!script.rightShoulder) {
            print("ERROR: Make sure to set the Right Shoulder Tracker to the script");
            return false;
        }
        if (!script.leftHip) {
            print("ERROR: Make sure to set the Left Hip Tracker to the script");
            return false;
        }
        if (!script.rightHip) {
            print("ERROR: Make sure to set the Right Hip Tracker to the script");
            return false;
        }
    }
    if (!script.perpectiveCamera) {
        print("ERROR: Make sure to set the Perspective Camera to the script");
        return false;
    }

    return true;
}

function autoFpsOptimize() {
    if (!script.autoOptimizeFps || failedFPSTest) {
        return;
    }
    deltaTime += getDeltaTime();
    if (deltaTime <= SKIP_INITIAL_TIME) {
        return;
    }
    frameCounter++;
    if (deltaTime >= SKIP_INITIAL_TIME + 1.0) {
        if (frameCounter < script.minimumFps) {
            failedFPSTest = true;
            print("Warning: low FPS detected.");
        }
        deltaTime = SKIP_INITIAL_TIME;
        frameCounter = 0;
    }
}

function setBodyTrackersEnabled(enable) {
    if (lSTracker) {
        lSTracker.enabled = enable;
    }
    if (rSTracker) {
        rSTracker.enabled = enable;
    }
    if (lHTracker) {
        lHTracker.enabled = enable;
    }
    if (rHTracker) {
        rHTracker.enabled = enable;
    }
}

function haveHipTracking() {
    if (!lHTracker || !rHTracker) {
        return false;
    }

    return lHTracker.isTracking() && rHTracker.isTracking() && lHTracker.enabled && rHTracker.enabled;
}

function haveFaceTracking() {
    return script.head.getFacesCount() > script.head.faceIndex;
}

function haveFaceTrackingSafeDist() {
    if (haveFaceTracking()) {
        var faceDist = script.head.getTransform().getWorldPosition().distance(script.perpectiveCamera.getTransform().getWorldPosition());
        if (faceDist * faceDistMult < maxFaceDist) {
            return true;
        }
    }
    return false;
}

function getTrackedObjects() {
    return script.applyToObjects;
}

function addToTrackedObjects(objectToBeTracked) {
    script.applyToObjects.push(objectToBeTracked);
}

function initCOMTracking() {
    lowResSegmentationTexture = createLowResSegmentationTexture();
    var w = lowResSegmentationTexture.getWidth();
    var h = lowResSegmentationTexture.getHeight();
    lowResSegmentationData = new Uint8Array(w * h);
    lowResSegmentationDataFloat = new Float32Array(w * h);
    segmetantionCOM = new Float32Array(2);
}

function createLowResSegmentationTexture() {
    var lowResSegRt = createRenderTarget(new vec2(90, 160));
    var lowResCamera = createCamera(lowResSegRt, 0);
    createScreenImage(lowResCamera.getSceneObject(), script.segmentationTex, lowResCamera.renderLayer, script.imgMat.clone());
    return lowResSegRt;
}

function createRenderTarget(resolution) {
    var renderTarget = global.scene.createRenderTargetTexture();
    renderTarget.control.useScreenResolution = false;
    renderTarget.control.resolution = resolution;
    renderTarget.control.clearDepthEnabled = true;
    renderTarget.control.fxaa = false;
    renderTarget.control.msaa = false;
    return renderTarget;
}

function createCamera(renderTargets, renderOrder) {
    var cameraObject = global.scene.createSceneObject("Camera");
    var cameraComponent = cameraObject.createComponent("Component.Camera");
    cameraComponent.enabled = true;

    cameraComponent.renderLayer = LayerSet.makeUnique();
    cameraComponent.type = Camera.Type.Orthographic;
    cameraComponent.near = 1.0;
    cameraComponent.far = 1000.0;
    cameraComponent.devicePropertyUsage = Camera.DeviceProperty.All;
    cameraComponent.renderOrder = renderOrder;
    cameraComponent.renderTarget = renderTargets;

    return cameraComponent;
}

function createScreenImage(parent, segTex, camLayer, mat) {
    var imgObj = global.scene.createSceneObject("Image");

    imgObj.setParent(parent);

    var screenTransComp = imgObj.createComponent("Component.ScreenTransform");
    screenTransComp.anchors.left = -1;
    screenTransComp.anchors.right = 1;
    screenTransComp.anchors.bottom = -1;
    screenTransComp.anchors.top = 1;
    screenTransComp.position = new vec3(0, 0, -40);


    var imgComp = imgObj.createComponent("Component.Image");

    imgComp.mainMaterial = mat;
    imgComp.mainMaterial.mainPass.baseTex = segTex;
    imgObj.layer = camLayer;

    return imgComp;
}

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.bind(onUpdate);

var startEvent = script.createEvent("OnStartEvent");
startEvent.bind(onStart);
