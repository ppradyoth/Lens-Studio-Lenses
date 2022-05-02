// ClothSimulation.js
// Version: 0.0.1
// Event: onAwake()
// Description: Provides functions to modify cloth simulation

// @input Asset.RenderMesh clothMesh
// @input Asset.Material material {"showIf":"useFabricController", "showIfValue":"false"}

// @ui {"widget":"separator"}
// @input vec4 bindVertexColor = {1.0, 0.0, 0.0, 1} {"widget":"color"}
// @input SceneObject followObject

// @ui {"widget":"separator"}
// @ui {"widget":"group_start", "label":"Simulation Settings"}
// @input float stretchStiffness = 0.1 {"label":"Stretch Stiffness", "showIf":"useFabricController", "showIfValue":"false", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
// @input float bendStiffness = 0.1 {"label":"Bend Stiffness", "showIf":"useFabricController", "showIfValue":"false", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
// @input float airFriction = 0.1 {"label":"Air Friction", "showIf":"useFabricController", "showIfValue":"false", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
// @input int bendMode = 1 {"label":"Bend Mode", "widget":"combobox", "showIf":"useFabricController", "showIfValue":"false", "values":[{"label":"Isometric", "value":0},{"label":"Linear", "value":1}]}

// @input bool enableRepulsion = true
// @input float repulsionOffset = 0.1 {"label":"Repulsion Offset", "widget":"slider", "min":0.0, "max":10.0, "step":0.01, "showIf" : "enableRepulsion"}
// @input float repulsionStiffness = 0.1 {"label":"Repulsion Stiffness", "widget":"slider", "min":0.0, "max":10.0, "step":0.01, "showIf" : "enableRepulsion"}
// @input float repulsionFriction = 0.1 {"label":"Repulsion Friction", "widget":"slider", "min":0.0, "max":10.0, "step":0.01, "showIf" : "enableRepulsion"}

// @input float mass = 1.0 {"label":"Mass", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
// @input vec3 gravity
// @input int iterations = 60
// @input int framerate = 30
// @ui {"widget":"group_end"}

// @ui {"widget":"separator"}
// @input bool useFabricController = false
// @input Component.ScriptComponent fabricControllerScript {"label":"Fabric Controller", "showIf":"useFabricController", "showIfValue":"true"}

// @ui {"widget":"separator"}
// @input bool overrideVertexSettings = false
// @input Component.ScriptComponent[] vertexControllerScripts {"label":"Vertex Controller", "showIf":"overrideVertexSettings", "showIfValue":"true"}

// @ui {"widget":"separator"}
// @input bool useColliders = false
// @input Component.HairSimulationColliderComponent[] colliders {"showIf" : "useColliders"}


var COLOR_MASK = new vec4b(true,true,true,true);

var sceneObject = script.getSceneObject();
var transform = sceneObject.getTransform();
var clothVisual = sceneObject.createComponent("Component.ClothVisual");

initialize();

function initialize() {

    if (!clothVisual) {
        print("ERROR: Can't create Component.ClothVisual");
        return;
    }

    if (!script.clothMesh) {
        print("ERROR: Cloth Mesh is not set");
        return;
    }

    if (!script.useFabricController) {
        if (!script.material) {
            print("ERROR: Material is not set");
            return;
        }
        
        clothVisual.mainMaterial = script.material;
        clothVisual.bendStiffness = script.bendStiffness;
        clothVisual.stretchStiffness = script.stretchStiffness;
        clothVisual.friction = script.airFriction;
        clothVisual.repulsionEnabled = script.enableRepulsion;
    
        if (script.enableRepulsion) {
            clothVisual.repulsionOffset = script.repulsionOffset;
            clothVisual.repulsionStiffness = script.repulsionStiffness;
            clothVisual.repulsionFriction = script.repulsionFriction;    
        }
        
    } else if (!script.fabricControllerScript) {
        print("ERROR: Fabric Controller Script is not set");
        return;
    }

    clothVisual.mesh = script.clothMesh;
    clothVisual.mass = script.mass;  
    clothVisual.gravity = script.gravity;
    clothVisual.bendMode = script.bendMode;
    clothVisual.iterationsPerStep = script.iterations;
    clothVisual.frameRate = script.framerate;

    if (script.useColliders) {
        clothVisual.colliders = script.colliders;
    }

    clothVisual.updateNormalsEnabled = true;
    clothVisual.mergeCloseVerticesEnabled = true;
    clothVisual.onInitialized = clothInitCallback;

}

function bindClothVertexPosition(vertexIndicesArg, bindingObj) {
    for (var i = 0; i < vertexIndicesArg.length; i++) {
        clothVisual.setVertexBinding(vertexIndicesArg[i], bindingObj);
    }
}

function isBindColorFound(clothVisualArg,color) {
    var isFound = false;
    
    for (var i = 0; i < clothVisualArg.getAllColors().length; i++) {
        if (clothVisualArg.getAllColors()[i].equal(color)) {
            isFound = true;
            return isFound;
        }
    }

    return isFound;
}

function clothInitCallback(clothVisualArg) {

    
    if (clothVisualArg.getAllColors().length == 0) {
        print("ERROR: No Vertex Color from 3D Model");
        return;
    }
    
    var isFound = isBindColorFound(clothVisualArg, script.bindVertexColor);
    
    if (!isFound) {
        print("ERROR: Can't find Bind Vertex Color from 3D Model. Please choose colors from: " + clothVisual.getAllColors());
        return;
    }

    var indices = clothVisualArg.getPointIndicesByColor(script.bindVertexColor, COLOR_MASK);       
        
    if (script.followObject) {   
        sceneObject.setParent(script.followObject);   
        transform.setLocalPosition(vec3.zero());
        bindClothVertexPosition(indices, script.followObject);
    } else {
        print("WARNING: Follow Object is not set");
    }
    
    if (script.useFabricController) {
        setFromFabricMaterialController(); 
    }  
   
    if (script.overrideVertexSettings) {
        setFromVertexController(clothVisualArg);
    }
    
    clothVisualArg.resetSimulation(); 
}

function setFromVertexController(clothVisualArg) {
    
    if (!script.vertexControllerScripts || script.vertexControllerScripts.length == 0) {
        print("ERROR: Vertex Controller Scripts are not added");
        return;
    }
    
    for (var i = 0; i < script.vertexControllerScripts.length; i++) {
        
        if (!script.vertexControllerScripts[i]) {
            print("ERROR: Vertex Controller Script " + i +" is not set");
            return;
        }
        
        if (!script.vertexControllerScripts[i].api.getVertexColorProperty) {
            print("ERROR: Can't get properties from Vertex Controller Script");
            return;
        }
            
       
        var property = script.vertexControllerScripts[i].api.getVertexColorProperty();
        
        if (!property) {
            print("ERROR: Can't get properties from Vertex Controller Script "+ i);
            return;
        }
            

        var indices = clothVisualArg.getPointIndicesByColor(property.color, COLOR_MASK);
        
        if (!indices || indices.length == 0) {
            print("ERROR: No matching vertex color from Vertex Controller Script "+ i +" with Cloth Mesh");
            return;
        }
        for (var j = 0; j < indices.length; j++) {

            var vertexSettings = clothVisualArg.getVertexSettings(indices[j]);
            
            vertexSettings.mass = property.mass;               
            vertexSettings.massGlobalWeight = property.massGlobalWeight;  
            
            vertexSettings.stretchStiffness = property.stretchStiffness;
            vertexSettings.stretchStiffnessGlobalWeight = property.stretchStiffnessGlobalWeight;
            
            vertexSettings.bendStiffness = property.bendStiffness;
            vertexSettings.bendStiffnessGlobalWeight = property.bendStiffnessGlobalWeight;
            
            vertexSettings.friction = property.friction;               
            vertexSettings.frictionGlobalWeight = property.frictionGlobalWeight;  
            
            clothVisualArg.setVertexSettings(indices[j], vertexSettings);  

        }
    }
            
}

function setFromFabricMaterialController() {
    var properties = null;
    
    if (script.fabricControllerScript.api && script.fabricControllerScript.api.getCurrentFabricProperty) {
        properties = script.fabricControllerScript.api.getCurrentFabricProperty();
    }
    
    if (!properties) {
        print("ERROR: Can't get properties from Fabric Controller");
        return;
    }


    if (properties.material) {
        clothVisual.clearMaterials();
        clothVisual.addMaterial(properties.material);
    }

    clothVisual.bendMode = properties.bendMode;                      
    clothVisual.stretchStiffness = properties.stretchStiffness;
    clothVisual.bendStiffness = properties.bendStiffness;
    clothVisual.friction = properties.friction;
}
