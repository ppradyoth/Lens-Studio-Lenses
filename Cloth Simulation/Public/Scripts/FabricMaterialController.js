// FabricMaterialController.js
// Version: 0.0.1
// Event: onAwake()
// Description: Provides api functions to modify properties of specific material

// @input string fabricType = "plastic"  {"widget":"combobox", "values":[{"label":"Plastic", "value":"plastic"}, {"label":"Silk", "value":"silk"}, {"label":"Lace", "value":"lace"},{"label":"Stripe","value":"stripe"}]}

// @input Asset.Material plasticMaterial {"label":"Plastic Material", "showIf":"fabricType", "showIfValue":"plastic" }
// @input Asset.Material laceMaterial {"label":"Lace Material", "showIf":"fabricType", "showIfValue":"lace" }
// @input Asset.Material silkMaterial {"label":"SilK Material", "showIf":"fabricType", "showIfValue":"silk" }
// @input Asset.Material stripeMaterial {"label":"Stripe Material", "showIf":"fabricType", "showIfValue":"stripe" }


//@ui {"widget":"group_start", "label":"Plastic Properties" , "showIf":"fabricType", "showIfValue":"plastic"}
//@input float plasticStretchStiffness = 0.56 {"label":"Stretch Stiffness", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
//@input float plasticBendStiffness = 0.71 {"label":"Bend Stiffness", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
//@input float plasticFriction = 0.17 {"label":"Air Friction", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
//@input float plasticBendMode = 1 {"label":"Bend Mode", "widget":"combobox", "values":[{"label":"Isometric", "value":0},{"label":"Linear", "value":1}]}
//@ui {"widget":"group_end"}

//@ui {"widget":"group_start", "label":"Lace Properties" , "showIf":"fabricType", "showIfValue":"lace"}
//@input float laceStretchStiffness = 0.08 {"label":"Stretch Stiffness", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
//@input float laceBendStiffness = 0.13 {"label":"Bend Stiffness", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
//@input float laceFriction = 0.46 {"label":"Air Friction", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
//@input float laceBendMode = 1 {"label":"Bend Mode", "widget":"combobox", "values":[{"label":"Isometric", "value":0},{"label":"Linear", "value":1}]}
//@ui {"widget":"group_end"}

//@ui {"widget":"group_start", "label":"Silk Properties" , "showIf":"fabricType", "showIfValue":"silk"}
//@input float silkStretchStiffness = 0.41 {"label":"Stretch Stiffness", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
//@input float silkBendStiffness = 0.39 {"label":"Bend Stiffness", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
//@input float silkFriction = 0.47 {"label":"Air Friction", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
//@input float silkBendMode = 0 {"label":"Bend Mode", "widget":"combobox", "values":[{"label":"Isometric", "value":0},{"label":"Linear", "value":1}]}
//@ui {"widget":"group_end"}

//@ui {"widget":"group_start", "label":"Stripe Properties" , "showIf":"fabricType", "showIfValue":"stripe"}
//@input float stripeStretchStiffness = 0.28 {"label":"Stretch Stiffness", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
//@input float stripeBendStiffness = 0.21 {"label":"Bend Stiffness", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
//@input float stripeFriction = 0.54 {"label":"Air Friction", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
//@input float stripeBendMode = 0 {"label":"Bend Mode", "widget":"combobox", "values":[{"label":"Isometric", "value":0},{"label":"Linear", "value":1}]}
//@ui {"widget":"group_end"}


script.api.getFabricType = function() {
    return script.fabricType;
};

script.api.getCurrentFabricProperty = function() {
    var simulationProperty = null;

    switch (script.fabricType) {
        case "silk":
            simulationProperty = {   
                fabric:"silk", 
                stretchStiffness: script.silkStretchStiffness,
                bendStiffness: script.silkBendStiffness, 
                friction: script.silkFriction,
                bendMode: script.silkBendMode,
                material: script.silkMaterial,
            };
            break;
        case "lace":
            simulationProperty = {   
                fabric:"lace", 
                stretchStiffness: script.laceStretchStiffness,
                bendStiffness: script.laceBendStiffness, 
                friction: script.laceFriction,
                bendMode: script.laceBendMode,
                material: script.laceMaterial,
            };
            break;
        case "plastic":
            simulationProperty = {   
                fabric:"plastic", 
                stretchStiffness: script.plasticStretchStiffness,
                bendStiffness: script.plasticBendStiffness, 
                friction: script.plasticFriction,
                bendMode: script.plasticBendMode,
                material: script.plasticMaterial,
            };
            break;
        case "stripe":
            simulationProperty = {   
                fabric:"stripe", 
                stretchStiffness: script.stripeStretchStiffness,
                bendStiffness: script.stripeBendStiffness, 
                friction: script.stripeFriction,
                bendMode: script.stripeBendMode,
                material: script.stripeMaterial,
            };
            break;

        default:
            print("ERROR: Unknown fabricType " + script.fabricType);
    

    }
    
    if (!simulationProperty.material) {
        print("ERROR: " + script.fabricType + " material is not set");
    }

    return simulationProperty;

};



