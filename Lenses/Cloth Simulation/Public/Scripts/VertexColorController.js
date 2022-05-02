// VertexColorController.js
// Version: 0.0.1
// Event: Lens Initialized
// Description: Provides api functions to modify properties of specific vertex color
// @input vec4 vertexColor = {1, 1, 1, 1} {"widget":"color"}

//@input float mass = 1 {"label":"Mass", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
//@input float massGlobalWeight = 0 {"label":"Mass Global Weight", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}

//@input float stretchStiffness = 0.1 {"label":"Stretch Stiffness", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
//@input float stretchStiffnessGlobalWeight = 0 {"label":"Stretch Stiffness Global Weight", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}

//@input float bendStiffness = 0.1 {"label":"Bend Stiffness", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
//@input float bendStiffnessGlobalWeight = 0 {"label":"Bend Stiff GlobalWeight", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}

//@input float friction = 0.1 {"label":"Friction", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}
//@input float frictionGlobalWeight = 0 {"label":"Friction Global Weight", "widget":"slider", "min":0.0, "max":1.0, "step":0.01}

var colorProperty ={  
    color:script.vertexColor,
    
    mass: script.mass,
    massGlobalWeight: script.massGlobalWeight,
    
    stretchStiffness: script.stretchStiffness,
    stretchStiffnessGlobalWeight: script.stretchStiffnessGlobalWeight,
    
    bendStiffness: script.stretchStiffness, 
    bendStiffnessGlobalWeight: script.bendStiffnessGlobalWeight,
    
    friction: script.stretchStiffness,
    frictionGlobalWeight: script.frictionGlobalWeight,
};

script.api.getVertexColorProperty = function() {
        
    return colorProperty;

};
