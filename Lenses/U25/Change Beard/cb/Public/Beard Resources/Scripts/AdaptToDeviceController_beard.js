// -----JS CODE-----
// AdaptToDeviceController_beard.js
// Version: 0.0.1
// Event: Initialized
// Description: This script demonstrates how you can adapt your ML Lenses based on device performance. 
// Notes: This script is based on StyleTransferController, except adapted for the beard add/remove model

//@input Component.MLComponent mlComponent
//@input int runMode = 1 {"widget":"combobox", "values":[{"label":"Adapt to Device Performance", "value":1}, {"label":"Run Always", "value":2}, {"label":"Run on Tap", "value":3}]}

//@input Component.MaterialMeshVisual outputImage

//@ui {"widget":"separator"}
//@input bool advanced
//these names have to match your model input and output names
//@input string input1Name = "data" {"showIf" : "advanced"}
//@input string output1Name = "output_0" {"showIf" : "advanced"}
//@ui {"widget":"separator", "showIf" : "advanced"}
//@input float faceCenterMouthWeight = 1.15 {"showIf" : "advanced"}
//@input vec2 faceCropScale = {0.792, 0.567} {"showIf" : "advanced"}
//@ui {"widget":"separator", "showIf" : "advanced"}
//@input SceneObject[] camerasToFreeze {"showIf" : "advanced"}
//@input Asset.Texture cropTexture {"showIf" : "advanced"}
//@ui {"widget":"separator", "showIf" : "advanced"}
//@input SceneObject loader {"showIf" : "advanced"}
//@input SceneObject photoButton  {"showIf" : "advanced"}
//@input SceneObject resetButton  {"showIf" : "advanced"}


var mlComponent;
var config;
var currentDevicePerformanceIndex;
var frameProcessed = false;
var rectSetter;
var nextFrameDisableCamera = false;

// If using `Adapt to Device Performance` mode and 
// current device's  ML performance index is less 
// than this value, Lens will use `Run on Tap` mode.
var lowMLPerformanceIndexBreakpoint = 4;

function init() {
    if (!checkAllInputSet()) {
        return;
    }

    mlComponent = script.mlComponent;
    mlComponent.onLoadingFinished = wrapFunction(mlComponent.onLoadingFinished, onMLLoaded);

    // Represents the device's ML performance.
    // The higher the number, the faster the performance.
    // As of April 2020, the range of index is (0 - 8).
    // As more performant device become available, the maximum index will increase.

    currentDevicePerformanceIndex = global.deviceInfoSystem.performanceIndexes.ml;
}

function onMLLoaded() {

    config = getConfig();

    if (config) {
        setCropSettings();
        setupRunSettings(currentDevicePerformanceIndex);
    }
}

function getConfig() {

    var input1;
    var mlOutput1;

    try {
        input1 = mlComponent.getInput(script.input1Name);
    } catch (e) {
        debugPrint(e + ". Please set valid Input 1 Name that is matching MLAsset output name");
        return null;
    }
    if (!input1.texture) {
        input1.texture = script.cropTexture;
    }

    try {
        mlOutput1 = mlComponent.getOutput(script.output1Name);
    } catch (e) {
        debugPrint(e + ". Please set valid Output 1 Name that is matching MLAsset output name");
        return null;
    }
    if (!mlOutput1.texture) {
        debugPrint("Error, Please create Output Texture on the ML Component");
    }

    return {
        input1: input1,
        output1: mlOutput1,
    };
}

function setCropSettings() {

    script.cropTexture.control.faceCenterMouthWeight = script.faceCenterMouthWeight;
    script.cropTexture.control.textureScale = script.faceCropScale;

}

function setupRunSettings(index) {

    var shouldRunOnDemand = (script.runMode == 1 && index < lowMLPerformanceIndexBreakpoint) || (script.runMode == 3);

    if (shouldRunOnDemand) {
        runOnDemand();
    } else {
        runAlways();
    }
}

function runAlways() {

    mlComponent.runScheduled(true, MachineLearning.FrameTiming.OnRender, MachineLearning.FrameTiming.OnRender);
    mlComponent.onRunningFinished = wrapFunction(mlComponent.onRunningFinished, onMLFinishedProcessingFirstFrame);
    if (script.loader) {
        script.loader.enabled = false; 
    } 
    setOutputTexture(false);

}
// on demand functions
function runOnDemand() {

    rectSetter = script.outputImage.getSceneObject().getComponent("Component.RectangleSetter");

    mlComponent.onRunningFinished = wrapFunction(mlComponent.onRunningFinished, onMLFinishedProcessing);
    script.createEvent("UpdateEvent").bind(function() {
        if (nextFrameDisableCamera) {
            for (var i = 0; i < script.camerasToFreeze.length; i++) {
                if (script.camerasToFreeze[i]) {
                    script.camerasToFreeze[i].enabled = false; 
                }
            }
        }
        nextFrameDisableCamera = false;
    });
    script.createEvent("TapEvent").bind(onTap);

    if (script.loader) {
        script.loader.enabled = false; 
    }
    if (script.photoButton) {
        script.photoButton.enabled = true; 
    }

    setOutputTexture(false);
}

function onTap() {
    if (mlComponent.state == MachineLearning.ModelState.Idle) {
        if (!frameProcessed) {
            runOnce();
        } else {
            reset();
        }
    }
}

function runOnce() {

    if (rectSetter != null) {
        rectSetter.enabled = false; 
    }

    mlComponent.runScheduled(false, MachineLearning.FrameTiming.OnRender, MachineLearning.FrameTiming.None);

    if (script.loader) {
        script.loader.enabled = true; 
    }
    if (script.photoButton) {
        script.photoButton.enabled = false; 
    }
    
    nextFrameDisableCamera = true;
    frameProcessed = true;
}

function onMLFinishedProcessing() {

    setOutputTexture(true);

    if (script.loader) {
        script.loader.enabled = false; 
    }
    if (script.resetButton) {
        script.resetButton.enabled = true; 
    }

}

function onMLFinishedProcessingFirstFrame() {
    if (!frameProcessed) {
        setOutputTexture(true);
        frameProcessed = true;
    }
}

function reset() {

    setOutputTexture(false);

    for (var i = 0; i < script.camerasToFreeze.length; i++) {
        if (script.camerasToFreeze[i]) {
            script.camerasToFreeze[i].enabled = true; 
        }
    }
    if (rectSetter != null) {
        rectSetter.enabled = true; 
    }

    if (script.photoButton) {
        script.photoButton.enabled = true; 
    }
    if (script.resetButton) {
        script.resetButton.enabled = false; 
    }

    if (script.camera) {
        script.camera.enabled = true; 
    }

    frameProcessed = false;
    nextFrameDisableCamera = false;
}

function setOutputTexture(fromOutput) {
    if (fromOutput) {
        script.outputImage.enabled = true;
        script.outputImage.mainPass.baseTex = config.output1.texture;
    } else {
        script.outputImage.enabled = false;
    }
}


function checkAllInputSet() {

    if (!script.cropTexture) {
        debugPrint("Error: Please assign Crop Texture");
        return false;
    }

    if (!script.mlComponent) {
        debugPrint("Error: Please assign an ML Component which has a proxy texture output");
        return false;
    }

    if (!script.outputImage) {
        debugPrint("Error: Please assign Output Image to display output texture on");
        return false;
    }

    var camerasSet = false;
    if (script.camerasToFreeze) {
        camerasSet = true;
        for (var i = 0; i < script.camerasToFreeze.length; i++) {
            camerasSet = camerasSet && script.camerasToFreeze[i] != undefined;
        }
    }
    if (!camerasSet) {
        debugPrint("Warning: Cameras to freeze for a Tap fallback are not set");
    }

    if (!script.loader) {
        debugPrint("Warning: Loader Object is not set ");
    }

    if (!script.photoButton) {
        debugPrint("Warning: Photo Button is not set");
    } else {
        script.photoButton.enabled = false;
    }

    if (!script.resetButton) {
        debugPrint("Warning: Reset Button is not set");
    } else {
        script.resetButton.enabled = false;
    }
    return true;
}

function debugPrint(text) {
    print("AdaptToDeviceController, " + text);
}

function wrapFunction(origFunc, newFunc) {
    if (!origFunc) {
        return newFunc;
    }
    return function() {
        origFunc();
        newFunc();
    };
}

init();