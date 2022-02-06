// TrackingController.js
// Version: 0.0.1
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
// @input Component.ObjectTracking leftShoulder
// @input Component.ObjectTracking rightShoulder
// @input Component.ObjectTracking leftHip
// @input Component.ObjectTracking rightHip
// @input Component.ObjectTracking center
//@ui {"widget":"group_end"}
//@ui {"widget":"group_start", "label":"Apply Tracking to"}
// @input bool applyPosition = true {"label":"Position"}
// @input bool applyRotation = true {"label":"Rotation"}
// @input bool applyScale = true {"label":"Scale"}
//@ui {"widget":"group_end"}
//@ui {"widget":"group_end"}

const SKIP_INITIAL_TIME = 1.0;
var neckScale = 0.48;
var neckOffset = 9;
var frameCounter = 0;
var deltaTime = 0;
var lSScreenTrans, rSScreenTrans, lHScreenTrans, rHScreenTrans, centerScreenTrans;
var lSTracker, rSTracker, lHTracker, rHTracker, cTracker;
var isInit = false;

script.api.getTrackedObjects = getTrackedObjects;
script.api.addToTrackedObjects = addToTrackedObjects;

function onStart() {
    isInit = validateInputs();
    if (!isInit) {
        return;
    }
    setTrackers();
}

function setTrackers() {
    lSTracker = script.leftShoulder;
    rSTracker = script.rightShoulder;
    lHTracker = script.leftHip;
    rHTracker = script.rightHip;
    cTracker = script.center;

    lSScreenTrans = lSTracker.getSceneObject().getComponent("Component.ScreenTransform");
    rSScreenTrans = rSTracker.getSceneObject().getComponent("Component.ScreenTransform");
    lHScreenTrans = lHTracker.getSceneObject().getComponent("Component.ScreenTransform");
    rHScreenTrans = rHTracker.getSceneObject().getComponent("Component.ScreenTransform");
    centerScreenTrans = cTracker.getSceneObject().getComponent("Component.ScreenTransform");

    if (!script.isTrackingEnabled) {
        disableAllTrackers();
    }
}

function onUpdate() {
    if (!isInit || !script.isTrackingEnabled) {
        return;
    }

    if (!global.deviceInfoSystem.isEditor()) {
        autoFpsOptimize();
    }

    fullBodyTracking();
    toggleCenterTracking(!haveShoulderTracking() || !haveHipTracking());
    toggleContent(haveShoulderTracking() && haveHipTracking() || haveCenterTracking());
}

function fullBodyTracking() {
    if (!haveShoulderTracking() && !haveHipTracking()) {
        centerTracking();
        return;
    }

    var lsPos = lSScreenTrans.position;
    var rsPos = rSScreenTrans.position;
    var topCenter = lsPos.add(rsPos).uniformScale(0.5);
    var lhPos = lHScreenTrans.position;
    var rhPos = rHScreenTrans.position;
    var bottomCenter = lhPos.add(rhPos).uniformScale(0.5);

    var position = bottomCenter.add(topCenter).uniformScale(0.5);
    var rotation = Math.atan2(topCenter.y - bottomCenter.y, topCenter.x - bottomCenter.x) - 0.5 * Math.PI;
    var scale = 0.2 * (lSScreenTrans.anchors.right - lSScreenTrans.anchors.left);

    setTransform(position, rotation, scale);
}

function centerTracking() {
    if (!haveCenterTracking()) {
        return;
    }
    var scale = neckScale * (centerScreenTrans.anchors.right - centerScreenTrans.anchors.left);
    var rotation = centerScreenTrans.rotation.toEulerAngles().z;
    var offset = new vec3(neckOffset * scale * Math.sin(rotation),
        -neckOffset * scale * Math.cos(rotation),
        0);
    var position = centerScreenTrans.position.add(offset);

    setTransform(position, rotation, scale);
}

function setTransform(pos, rot, sc) {
    for (var i in script.applyToObjects) {
        var trans = script.applyToObjects[i].getTransform();

        if (script.applyPosition) {
            trans.setWorldPosition(pos);
        }
        if (script.applyScale) {
            trans.setLocalScale(new vec3(sc * 2.5, sc * 2.5, 1));
        }
        if (script.applyRotation) {
            trans.setLocalRotation(quat.fromEulerAngles(0, 0, rot));
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
    if (!script.center) {
        print("ERROR: Make sure to set the Center Tracker to the script");
        return false;
    }

    return true;
}

function autoFpsOptimize() {
    if (!script.autoOptimizeFps) {
        return;
    }
    deltaTime += getDeltaTime();
    if (deltaTime <= SKIP_INITIAL_TIME) {
        return;
    }
    frameCounter++;
    if (deltaTime <= SKIP_INITIAL_TIME + 1.0) {
        if (frameCounter < script.minimumFps) {
            toggleBodyTrackers(false);
            script.autoOptimizeFps = false;
        }
        deltaTime = SKIP_INITIAL_TIME;
        frameCounter = 0;
    }
}

function toggleBodyTrackers(status) {
    lSTracker.enabled = status;
    rSTracker.enabled = status;
    lHTracker.enabled = status;
    rHTracker.enabled = status;
}

function toggleCenterTracking(status) {
    cTracker.enabled = status;
}

function disableAllTrackers() {
    lSTracker.enabled = false;
    rSTracker.enabled = false;
    lHTracker.enabled = false;
    rHTracker.enabled = false;
    cTracker.enabled = false;
}

function toggleContent(status) {
    for (var i = 0; i < script.applyToObjects.length; i++) {
        script.applyToObjects[i].enabled = status;
    }
}

function haveShoulderTracking() {
    return lSTracker.isTracking() && rSTracker.isTracking() && lSTracker.enabled && rSTracker.enabled;
}

function haveHipTracking() {
    return lHTracker.isTracking() && rHTracker.isTracking() && lHTracker.enabled && rHTracker.enabled;
}

function haveCenterTracking() {
    return cTracker.isTracking();
}

function getTrackedObjects() {
    return script.applyToObjects;
}

function addToTrackedObjects(objectToBeTracked) {
    script.applyToObjects.push(objectToBeTracked);
}

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.bind(onUpdate);

var startEvent = script.createEvent("OnStartEvent");
startEvent.bind(onStart);