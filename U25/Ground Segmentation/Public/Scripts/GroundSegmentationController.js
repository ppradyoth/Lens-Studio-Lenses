// GroundSegmentationController.js
// Version: 0.0.1
// Event: Lens Initialized
// Description: Setup for ground segmentation materials and objects

//@ui {"widget":"label", "label":"Apply these Materials to child objects to be masked: "}
//@ui {"widget":"label", "label":"<ul><li>Occluded Graph Unlit [DUPLICATE_ME]</li></ul>"}
//@ui {"widget":"label", "label":"<ul><li>Occluded Graph PBR [DUPLICATE_ME]</li></ul>"}
//@ui {"widget":"label", "label":"Make sure to link processed_segmentation_texture"}
//@ui {"widget":"label", "label":"to u_segmentationTexture in materials for segmentation"}
//@ui {"widget":"separator"}

//@input bool Advanced
//@input Component.Camera camera {"showIf":"Advanced", "showIfValue": true}
//@input Asset.Material processCamMat {"showIf":"Advanced", "showIfValue": true}
//@input Asset.Texture placeholderTexture {"showIf":"Advanced", "showIfValue": true, "hint" : "This script will replace placeholderTexture with processedTexture. \n Without placeholderTexture objects would not be visible in scene view \n since processedTexture is not initialized at start"}
//@input Asset.Texture processedTexture {"showIf":"Advanced", "showIfValue": true}
//@input Asset.Texture deviceCameraTexture {"showIf":"Advanced", "showIfValue": true}



var previousProjectionMatrix;
var previousViewMatrix;
var previousCapturedViewMatrix;
var resetThisFrame = true;
var isInitialized = false;
var cameraTransform = script.camera.getTransform();
var currentScreenResolution = new vec2(9999, 9999);
var desiredResolution = new vec2(0.5, 0.5);
var optimizedProcessedTarget = false;

function onTurnOn() {
    if (!validateInputs()) {
        return;
    }
    script.processedTexture.control.clearColorEnabled = true;
    script.processedTexture.control.clearColor = new vec4(0, 0, 0, 0);
    previousProjectionMatrix = getProjectionMatrix();
    previousViewMatrix = getViewMatrix();
    previousCapturedViewMatrix = getViewMatrix();
    script.placeholderTexture.control = script.processedTexture.control;
    isInitialized = true;
}

function onUpdate() {
    if (!isInitialized) {
        return;
    }
    optimizeProcessedTarget();
    setRenderTargetClearColor();
    assignMatrixes();
}

function getProjectionMatrix() {
    var fovX = script.camera.fov;
    var cameraAspect = script.camera.aspect;
    var fovY = (cameraAspect >= 1) ? 2*Math.atan(Math.tan(fovX/2)*script.camera.aspect) : 2*Math.atan(Math.tan(fovX/2)*(1/script.camera.aspect));
    return mat4.perspective(fovY, cameraAspect, script.camera.near, script.camera.far);
}
function getViewMatrix() {
    return cameraTransform.getWorldTransform().inverse();
}

function setRenderTargetClearColor() {
    script.processedTexture.control.clearColorEnabled = resetThisFrame;    
    resetThisFrame = false;
}

function onTrackingReset() {
    resetThisFrame = true;
}

function assignMatrixes() {
    var currentViewMatrix = getViewMatrix();
    var currentProjectionMatrix = getProjectionMatrix();
    script.processCamMat.mainPass.u_projectionMatrix = currentProjectionMatrix;
    script.processCamMat.mainPass.u_previousProjectionMatrix = previousProjectionMatrix;
    script.processCamMat.mainPass.u_previousViewMatrix = previousViewMatrix;
    previousViewMatrix = currentViewMatrix;
    previousProjectionMatrix = currentProjectionMatrix;
    script.processCamMat.mainPass.u_capturedViewMatrix = previousCapturedViewMatrix;
    previousCapturedViewMatrix = cameraTransform.getInvertedWorldTransform();
}



function optimizeProcessedTarget() { 
    if (!optimizedProcessedTarget) {
        var screenResolution = new vec2(script.deviceCameraTexture.getWidth(), script.deviceCameraTexture.getHeight());
        if (screenResolution.x >= 160 && 
        screenResolution.y >= 320 &&
        screenResolution.x !== currentScreenResolution.x &&
        screenResolution.y !== currentScreenResolution.y) {
            currentScreenResolution = screenResolution;
            var resolution = screenResolution.scale(desiredResolution);
            resolution = new vec2(Math.round(resolution.x), Math.round(resolution.y));
            script.processedTexture.control.useScreenResolution = false;
            script.processedTexture.control.resolution = resolution;
        }
        optimizedProcessedTarget = true;
    }
}

function validateInputs() {
    if (!script.camera) {
        debugPrint("ERROR: Make sure Camera object exist and set it under the advanced checkbox.");
        return false;
    }
    if (!script.processCamMat) {
        debugPrint("ERROR: Make sure processCamMat resource exist and set it under the advanced checkbox.");
        return false;
    }
    if (!script.placeholderTexture) {
        debugPrint("ERROR: Make sure placeholder segmentation texture is set");
        return false;
    }
    if (!script.processedTexture) {
        debugPrint("ERROR: Make sure processedTexture resource exist and set it under the advanced checkbox.");
        return false;
    }
    if (!script.deviceCameraTexture) {
        debugPrint("ERROR: Make sure Device Camera Texture resource exist and set it under the advanced checkbox.");
        return false;
    }
    return true;
}


function debugPrint(_message) {
    print("GroundSegmentationController, " + _message);
}

script.createEvent("SurfaceTrackingResetEvent").bind(onTrackingReset);
script.createEvent("TurnOnEvent").bind(onTurnOn);
script.createEvent("UpdateEvent").bind(onUpdate);