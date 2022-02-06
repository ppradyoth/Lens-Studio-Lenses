// PatternDesigner.js
// Version: 0.0.1
// Event: Lens Initialized
// Description: The script help user to place a design in screen space and uses slider to customize the look

// @input bool useBackgroundColor
// @ui {"widget":"group_start", "label":"Background Color", "showIf":"useBackgroundColor"}
// @input vec4 backgroundColor = {1,1,1,1} {"label":"Color","widget":"color"}
// @input float colorAlpha = 1.0 {"widget":"slider", "label":"Transparency", "min":0.0, "max":1.0, "step":0.01}
// @ui {"widget":"group_end"}
// @ui {"widget":"separator"}
// @input bool useImage
// @ui {"widget":"group_start", "label":"Image", "showIf":"useImage"}
// @input Asset.Texture imageTexture
// @input float imageAlpha = 1.0 {"widget":"slider", "min":0.0, "max":1.0, "step":0.01, "label": "Image Transparency"}
// @input int imageBlendMode = 0 {"widget":"combobox", "values":[{"label":"Normal", "value":0}, {"label": "Screen", "value": 3}, {"label": "Multiply", "value": 10} ]}
// @input int fillMode = 1 {"widget":"combobox", "values":[{"label":"Fit", "value":0}, {"label":"Fill", "value":1}, {"label":"Stretch", "value":2}]}
// @input bool tiled = false
// @ui {"widget": "group_start", "label": "Tiled Settings", "showIf":"tiled", "showIfValue":"true"}
// @input float tileDensity = 1.0 {"widget":"slider", "min":1.0, "max":100.0, "step":1.0}
// @input bool scrolling = false {"label": "Animate"}
// @input float scrollSpeedX = -0.2 {"widget":"slider", "label": "Animate Speed X", "min":-5.0, "max":5.0, "step":0.1, "showIf":"scrolling"}
// @input float scrollSpeedY = -0.2 {"widget":"slider", "label": "Animate Speed Y", "min":-5.0, "max":5.0, "step":0.1, "showIf":"scrolling"}
// @ui {"widget": "group_end"}
// @ui {"widget":"group_start", "label":"Transform"}
// @input float imageSize = 1.0 {"label":"Size", "widget":"slider", "min":0.0, "max":10.0, "step":0.01}
// @input float imageOffsetX = 0.0 {"label":"Offset X","widget":"slider", "min":-1.0, "max":1.0, "step":0.01}
// @input float imageOffsetY = 0.0 {"label":"Offset Y", "widget":"slider", "min":-1.0, "max":1.0, "step":0.01}
// @input float imageRotation = 0.0 {"label":"Rotate","widget":"slider", "min":0.0, "max":360.0, "step":0.5}
// @ui {"widget": "group_end"}
// @ui {"widget": "group_end"}
// @ui {"widget":"separator"}
// @input bool advanced
// @ui {"widget":"group_start", "label":"Properties", "showIf":"advanced"}
// @input Asset.Material tiledMaterial
// @input Asset.Material backgroundMaterial
// @input Component.RenderMeshVisual meshVisual
// @input Component.ScriptComponent trackingController
// @ui {"widget": "group_end"}

function initialize() {
    if (!validateInputs()) {
        return;
    }

    var thisLayer = script.meshVisual.getSceneObject().layer;
    var thisRenderOrder = script.meshVisual.getRenderOrder();
    var objectHolder = script.getSceneObject();

    //============= CREATE AND SET BACKGROUND VALUES ==============================
    var backgroundImage = createImageObject("Background", objectHolder, thisLayer);
    backgroundImage.mainMaterial = script.backgroundMaterial.clone();
    var backgroundPass = backgroundImage.mainMaterial.mainPass;
    backgroundPass.depthTest = false;
    backgroundPass.baseColor = script.backgroundColor;
    backgroundPass.opacity = script.colorAlpha;
    backgroundImage.setRenderOrder(thisRenderOrder - 1);
    backgroundImage.enabled = script.useBackgroundColor;

    configureGraphicTransform({
        transformObject: backgroundImage.getSceneObject().getTransform(),
        scale: 100,
        offsetX: 0,
        offsetY: 0,
        rotation: 0
    });

    //============= CREATE AND SET FRONT IMAGE VALUES ============================
    var tiledImage = createImageObject("Tiled", objectHolder, thisLayer);
    var fillModeEnums = [StretchMode.Fit, StretchMode.Fill, StretchMode.Stretch];
    var billboardImage = (script.imageTexture) ? script.imageTexture : null;
    tiledImage.mainMaterial = script.tiledMaterial.clone();
    var tiledImagePass = tiledImage.mainMaterial.mainPass;
    tiledImage.setRenderOrder(thisRenderOrder);
    tiledImage.enabled = script.useImage;
    tiledImage.stretchMode = fillModeEnums[script.fillMode];
    tiledImagePass.baseTex = billboardImage;
    tiledImagePass.opacity = script.imageAlpha;
    tiledImagePass.blendMode = script.imageBlendMode;
    tiledImagePass.animation = script.scrolling && script.tiled;
    tiledImagePass.uvOffset = (script.tiled) ?
        new vec2(script.scrollSpeedX, script.scrollSpeedY) :
        vec2.one();
    tiledImagePass.uvScale = (script.tiled) ?
        new vec2(script.tileDensity, script.tileDensity) :
        vec2.one();

    configureGraphicTransform({
        transformObject: tiledImage.getSceneObject().getTransform(),
        scale: script.imageSize,
        offsetX: script.imageOffsetX,
        offsetY: script.imageOffsetY,
        rotation: script.imageRotation
    });

    if (script.trackingController) {
        script.trackingController.api.addToTrackedObjects(objectHolder);
    }
}

function configureGraphicTransform(option) {
    var offsetAddons = 20;
    var rotationDivider = 0.0175;
    var scaleAddons = (script.tiled) ? 15 : 2;

    var thisTrans = option.transformObject;
    var offsetTo = new vec3(option.offsetX * offsetAddons, option.offsetY * offsetAddons, -40);
    var scaleTo = new vec3(option.scale * scaleAddons, option.scale * scaleAddons, 1);
    var rotateTo = quat.angleAxis((option.rotation * rotationDivider), vec3.forward());

    thisTrans.setWorldPosition(offsetTo);
    thisTrans.setWorldScale(scaleTo);
    thisTrans.setWorldRotation(rotateTo);
}

function createImageObject(objectName, parent, renderLayer) {
    var imgObj = global.scene.createSceneObject(objectName);
    var img = imgObj.createComponent("Component.Image");

    imgObj.setParent(parent);
    imgObj.layer = renderLayer;

    return img;
}

function validateInputs() {
    if (!script.meshVisual) {
        print("ERROR: Make sure to set a mesh visual on the script so the script can read the render order from that");
        return false;
    }
    if (!script.tiledMaterial) {
        print("ERROR: Make sure to set the tile material to the script in the Advance section");
        return false;
    }
    if (!script.backgroundMaterial) {
        print("ERROR: Make sure to set the background material to the script in the Advance section");
        return false;
    }
    if (!script.trackingController) {
        print("WARNING: For tracking to works make sure to set the Tracking Controller script component to the script in the Advance section");
    } else {
        if (!script.trackingController.api.addToTrackedObjects) {
            print("ERROR: Please make sure the trackingController script contains the addToTrackedObjects function");
            return false;
        }
    }

    return true;
}

initialize();