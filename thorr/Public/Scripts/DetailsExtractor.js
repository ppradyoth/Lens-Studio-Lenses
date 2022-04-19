// DetailsExtractor.js
// Version: 0.0.1
// Event: Lens Initialized
// Description: The script uses the post effects and RT to capture the shadow and details and apply that to an image

//@input bool advanced
//@input Asset.Texture inputTexture {"label":"Device Camera Tex", "showIf":"advanced"}
//@input Asset.Texture maskTexture {"label":"Segmentation Tex","showIf":"advanced"}
//@input Asset.Texture finalTex {"label":"Final Average RT", "showIf":"advanced"}
//@input Asset.Material firstColorExtractorMat {"label":"First Extractor", "showIf":"advanced"}
//@input Asset.Material finalExtractorMat {"label":"Final Extractor", "showIf":"advanced"}
//@input Asset.Material colorExtractorMaterial {"label":"Color Extractor", "showIf":"advanced"}
//@input int startingRenderOrder {"label":"Render Order From", "showIf":"advanced"}

var frame = 0;
var textureSet = false;

if (validateInputs()) {
    setWhiteBalance();
}

function onUpdate() {
    script.finalExtractorMat.mainPass.frame = frame;

    if (frame > 0.0) {
        if (!textureSet) {
            script.finalExtractorMat.mainPass.prevTex = script.finalTex;
            textureSet = true;
        }
        return;
    }
    frame++;
}

function setWhiteBalance() {
    // 243 x 243
    var rt243 = createRenderTarget(new vec2(243, 243));
    rt243.control.inputTexture = script.inputTexture;
    rt243.control.clearColorEnabled = true;
    createCamera(rt243, script.startingRenderOrder - 5);
    // 81 x 81
    var rt81 = createRenderTarget(new vec2(81, 81));
    rt81.control.clearDepthEnabled = true;
    var cam81 = createCamera(rt81, script.startingRenderOrder - 4);
    script.firstColorExtractorMat.mainPass.baseTex = rt243;
    script.firstColorExtractorMat.mainPass.uMask = script.maskTexture;
    createPostEffect(cam81.renderLayer, script.firstColorExtractorMat, 0);
    // 27 x 27
    var rt27 = createRenderTarget(new vec2(27, 27));
    var cam27 = createCamera(rt27, script.startingRenderOrder - 3);
    var mat27 = script.colorExtractorMaterial.clone();
    mat27.mainPass.baseTex = cam81.renderTarget;
    createPostEffect(cam27.renderLayer, mat27, 0);
    // 9 x 9
    var rt9 = createRenderTarget(new vec2(9, 9));
    var cam9 = createCamera(rt9, script.startingRenderOrder - 2);
    var mat9 = script.colorExtractorMaterial.clone();
    mat9.mainPass.baseTex = cam27.renderTarget;
    createPostEffect(cam9.renderLayer, mat9, 0);
    // 3 x 3
    var rt3 = createRenderTarget(new vec2(3, 3));
    var cam3 = createCamera(rt3, script.startingRenderOrder - 1);
    var mat3 = script.colorExtractorMaterial.clone();
    mat3.mainPass.baseTex = cam9.renderTarget;
    createPostEffect(cam3.renderLayer, mat3, 0);
    // 1 x 1
    var cam1 = createCamera(script.finalTex, script.startingRenderOrder);
    script.finalExtractorMat.mainPass.baseTex = rt3;
    createPostEffect(cam1.renderLayer, script.finalExtractorMat, 0);
}

function createPostEffect(renderLayer, material, renderOrder) {
    var postEffectObject = global.scene.createSceneObject("PostEffect");
    var postEffectComponent = postEffectObject.createComponent("Component.PostEffectVisual");

    postEffectObject.layer = renderLayer;

    postEffectComponent.clearMaterials();
    postEffectComponent.addMaterial(material);
    postEffectComponent.setRenderOrder(renderOrder);

    return postEffectObject;
}

function createRenderTarget(resolution) {
    var renderTarget = global.scene.createRenderTargetTexture();
    renderTarget.control.useScreenResolution = false;
    renderTarget.control.resolution = resolution;
    renderTarget.control.clearColorEnabled = false;
    renderTarget.control.clearColor = new vec4(0.0, 0.0, 0.0, 0.0);
    renderTarget.control.clearDepthEnabled = false;
    renderTarget.control.fxaa = false;
    renderTarget.control.msaa = false;
    return renderTarget;
}

function createCamera(renderTargets, renderOrder) {
    var cameraObject = global.scene.createSceneObject("Camera");
    var cameraComponent = cameraObject.createComponent("Component.Camera");
    cameraComponent.enabled = true;

    cameraComponent.renderLayer = LayerSet.makeUnique();
    cameraComponent.near = 1.0;
    cameraComponent.far = 1000.0;
    cameraComponent.devicePropertyUsage = Camera.DeviceProperty.All;
    cameraComponent.renderOrder = renderOrder;
    cameraComponent.renderTarget = renderTargets;

    return cameraComponent;
}

function validateInputs() {
    if (!script.inputTexture) {
        print("ERROR: Make sure to set the Device Camera Texture to the script");
        return false;
    }
    if (!script.maskTexture) {
        print("ERROR: Make sure to set the Segmentation Texture to the script");
        return false;
    }
    if (!script.finalTex) {
        print("ERROR: Make sure to set the Final Average Render Target to the script");
        return false;
    }
    if (!script.finalExtractorMat) {
        print("ERROR: Make sure to set the final_extractor material to the script");
        return false;
    }
    if (!script.colorExtractorMaterial) {
        print("ERROR: Make sure to set the color_extractor material to the script");
        return false;
    }
    if (!script.firstColorExtractorMat) {
        print("ERROR: Make sure to set the first_extractor material to the script");
        return false;
    }

    return true;
}

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.bind(onUpdate);