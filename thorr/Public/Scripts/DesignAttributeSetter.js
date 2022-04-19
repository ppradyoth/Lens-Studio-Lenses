// DesignAttributeSetter.js
// Version: 0.0.1
// Event: Lens Initialized
// Description: The script automatically set the layer and enable the alpha channel on all of 
// the objects provided in Tracking Controller script

//@ui {"widget":"label", "label":"NOTE: This script automatically set the objects layer"}
//@ui {"widget":"label", "label":"and enable the alpha on each object. Disable this script"}
//@ui {"widget":"label", "label":"if you want to set these properties manually"}
// @ui {"widget":"separator"}
// @input Component.ScriptComponent trackingController
// @input Component.Camera orthographicCamera

var isInit = false;
var meshComps = [];
var textComps = [];
var trackedObjects = [];

function onStart() {
    isInit = validateInputs();
    if (!isInit) {
        return;
    }

    for (var i in trackedObjects) {
        getComponentsRecursive(trackedObjects[i], "Component.BaseMeshVisual", meshComps);
        getComponentsRecursive(trackedObjects[i], "Component.Text", textComps);
    }

    setLayer(meshComps, script.orthographicCamera);
    setLayer(textComps, script.orthographicCamera);

    var meshPass = getMeshPass(meshComps);
    renderAlphaPass(meshPass);
    renderAlphaPass(textComps);
}

function onUpdate() {
    if (global.deviceInfoSystem.isEditor() && isInit) {
        setLayer(meshComps, script.orthographicCamera);
        setLayer(textComps, script.orthographicCamera);
    }
}

function setLayer(objectsToBeSetLayer, cameraToGetLayer) {
    for (var i = 0; i < objectsToBeSetLayer.length; i++) {
        objectsToBeSetLayer[i].getSceneObject().layer = cameraToGetLayer.renderLayer;
    }
}

function getComponentsRecursive(sceneObject, typeName, resultList) {
    resultList = resultList || [];
    var ret = sceneObject.getComponents(typeName);
    var i;
    for (i = 0; i < ret.length; i++) {
        resultList.push(ret[i]);
    }
    for (i = 0; i < sceneObject.getChildrenCount(); i++) {
        getComponentsRecursive(sceneObject.getChild(i), typeName, resultList);
    }
    return resultList;
}

function renderAlphaPass(pass) {
    for (var i = 0; i < pass.length; i++) {
        pass[i].colorMask = new vec4b(true, true, true, true);
    }
}

function getMeshPass(meshObjects) {
    var pass = [];
    for (var i = 0; i < meshObjects.length; i++) {
        pass[i] = meshObjects[i].mainMaterial.mainPass;
    }
    return pass;
}

function validateInputs() {
    if (!script.trackingController) {
        print("ERROR: Make sure the Tracking Controller exist and set it to the script.");
        return false;
    }

    if (!script.trackingController.api.getTrackedObjects) {
        print("ERROR: Please make sure the trackingController script contains the getTrackedObjects function");
        return false;
    }

    trackedObjects = script.trackingController.api.getTrackedObjects();

    for (var i in trackedObjects) {
        if (isNull(trackedObjects[i])) {
            //Error is handled through trackingController script
            return false;
        }
    }

    if (!script.orthographicCamera) {
        print("ERROR: Make sure the Orthographic Camera exist and set it to the script.");
        return false;
    }

    return true;
}

var startEvent = script.createEvent("OnStartEvent");
startEvent.bind(onStart);

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.bind(onUpdate);