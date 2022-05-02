// CameraSetupController.js
// Version: 0.0.1
// Event: Lens Initialized
// Description: Set up virtual cameras to smooth ground segmentation

//@input bool Advanced
//@input Asset.Material processCamMat {"showIf":"Advanced", "showIfValue": true}
//@input Asset.Material groundCamMat {"showIf":"Advanced", "showIfValue": true}
//@input Asset.Texture processCamRenderTarget {"showIf":"Advanced", "showIfValue": true}
//@input Asset.Texture groundCamRenderTarget {"showIf":"Advanced", "showIfValue": true}
//@input Asset.RenderMesh mesh {"showIf":"Advanced", "showIfValue": true}

function initializeCameras() {
    var processCam = createCamera("processCamera", 1,0, 0, script.processCamRenderTarget, 100000, false, false);
    addMeshToCamera(processCam, script.mesh, script.processCamMat);

    var virtualGroundCam = createCamera("GroundCamera", 2,0,0, script.groundCamRenderTarget,1000, false, false);  
    addMeshToCamera(virtualGroundCam, script.mesh, script.groundCamMat);
}

function createCamera(cameraName,layer,mipmap, order, renderTarget,far, clearColor, clearDepth) {
    var virtualCam = global.scene.createSceneObject(cameraName).createComponent("Component.Camera");
    virtualCam.getSceneObject().setParent(script.getSceneObject());
    virtualCam.getSceneObject().layer = LayerSet.fromNumber(layer);
    virtualCam.renderLayer = LayerSet.fromNumber(layer);
    virtualCam.renderTarget = renderTarget;
    virtualCam.renderOrder = order;
    virtualCam.mipmapLevel = mipmap;
    virtualCam.near = 1.00;
    virtualCam.far = far;
    virtualCam.enableClearColor = clearColor;
    virtualCam.enableClearDepth = clearDepth;

    return virtualCam;
}

function addMeshToCamera(camera, mesh, material) {
    var meshVisual = camera.getSceneObject().createComponent("Component.RenderMeshVisual");
    meshVisual.mesh = mesh;
    meshVisual.clearMaterials();
    meshVisual.addMaterial(material);
}

initializeCameras();
