// GroundParticleController.js
// Version: 0.0.1
// Event: Lens Initialized
// Description: Changes parameters on the particle material

// @input Asset.Material particleMaterial
//@input bool hasGroundParticles
// @input Asset.Material groundParticleMaterial {"showIf": "hasGroundParticles", "showIfValue": true}
//@ui {"widget":"group_start", "label":"IntensityController"}
// @input float intensity = 0.1 {"widget":"slider", "min":0.0, "max":1.0, "step":0.01}
//@ui {"widget":"group_end"}

function update(eventData) {
    if (script.particleMaterial != null) {
        script.particleMaterial.mainPass.spawnMaxParticles = lerp(0.0, 500.0, script.intensity);
        script.particleMaterial.mainPass.lifeTimeMinMax = vec2.lerp(new vec2(1.0,5.0), new vec2(4.0,5.0), script.intensity);
    }

    if (script.groundParticleMaterial != null) {
        script.groundParticleMaterial.mainPass.spawnMaxParticles = lerp(0.0, 500.0, script.intensity);
    }    
}

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.bind(update);

function lerp(a, b, t) {
    return a * (1.0 - t) + b * t;
}