// SetOrthoCameraSize.js
// Version: 0.0.1
// Event: Lens Initialized
// Description: The script automatically set the orthographic size based on the cameras aspect

//@ui {"widget":"label", "label":"NOTE: Make sure to place the script on"}
//@ui {"widget":"label", "label":"an Orthographic Camera."}

var cam = script.getSceneObject().getComponent("Component.Camera");
var frameDelay = 1;
var unifiedCamSize = 20;
var isInit = false;

if (isNull(cam)) {
    print("ERROR: Please assign this script on a Orthographic Camera.");
} else {
    isInit = true;
}

function onUpdate() {
    if (!isInit) {
        return;
    }

    if (frameDelay > 0) {
        frameDelay--;
        return;
    } else if (frameDelay == 0) {
        setCameraSize();
        frameDelay = -1;
    }
}

function setCameraSize() {
    var width = cam.renderTarget.getWidth();
    var height = cam.renderTarget.getHeight();
    var unitsPerPixel = unifiedCamSize / width;
    var desiredHalfHeight = 0.5 * unitsPerPixel * height;
    cam.size = desiredHalfHeight;
}

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.bind(onUpdate);