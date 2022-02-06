// ParticleTriggerController.js
// Version: 0.0.1
// Event: Lens Initialized
// Description: Allows you to start and stop a particle based on Behavior, or from a script API call
//
// Make sure to enable External Time Input on your Particles
// ---- LOCAL API USAGE ----
// Trigger particles
//  script.api.startParticles();
//
// End particles
//  script.api.endParticles();

// @input Component.MaterialMeshVisual particleMaterial
// @input int spawnMaxParticles = 100
// @ui {"widget":"separator"}
// @ui {"label":"Behavior Script Triggers"}
// @input Component.ScriptComponent startBehavior
// @input Component.ScriptComponent endBehavior

// the particle to trigger
var mat;

// Use particle material input if available, otherwise look on current object
if (script.particleMaterial) {
    mat = script.particleMaterial.mainPass;
} else {
    var materialMeshVisual = script.getSceneObject()
        .getComponent("Component.MaterialMeshVisual");
    
    if (materialMeshVisual) {
        mat = materialMeshVisual.mainPass;
    }
}

// Allow users to start and end particles by script:
script.api.startParticles = startParticles;
script.api.endParticles = endParticles;

// Allow users to start and end particles by Behavior:
if (script.startBehavior && script.startBehavior.api.addTriggerResponse) {
    script.startBehavior.api.addTriggerResponse(startParticles);
}

if (script.endBehavior && script.endBehavior.api.addTriggerResponse) {
    script.endBehavior.api.addTriggerResponse(endParticles);  
}

var event = script.createEvent("UpdateEvent");
event.enabled = false;
event.bind(function(eventData) {
    mat.externalTimeInput += getDeltaTime();
});

function startParticles() {
    mat.externalTimeInput = 0;
    mat.spawnMaxParticles = script.spawnMaxParticles;
    event.enabled = true;
}

function endParticles() {
    mat.externalTimeInput = 0;
    mat.spawnMaxParticles = 0;
    event.enabled = false;	
}