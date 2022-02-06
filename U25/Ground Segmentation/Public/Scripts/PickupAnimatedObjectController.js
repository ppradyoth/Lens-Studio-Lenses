// PickupAnimatedObjectController.js
// Version: 0.0.1
// Event: Lens Initialized
// Description: Change animation when object is moved

//@input Component.AnimationMixer animationMixer

//@input bool switchAnimationOnPickup {"hint":"play a different animation when character is picked up"}
//@input string idleAnim {"showIf":"switchAnimationOnPickup", "showIfValue": true}
//@input string pickupAnim {"showIf":"switchAnimationOnPickup", "showIfValue": true}

var animationMixer = script.animationMixer;
var defaultAnimation = script.idleAnim;
var pickupAnimation = script.pickupAnim;

var initiated = false;

if (animationMixer) {

    if (!animationMixer.getLayer(defaultAnimation)) {
        debugPrint("ERROR: Name mismatched for Default Animiation Layer.");
        return;
    }
    
    if (!animationMixer.getLayer(pickupAnimation)) {
        debugPrint("ERROR: Name mismatched for PickUp Animiation Layer.");
        return;
    }
    
    animationMixer.autoplay = !script.switchAnimationOnPickup;
    if (script.switchAnimationOnPickup) {
        animationMixer.getLayer(defaultAnimation).weight = 1.0;
        animationMixer.getLayer(pickupAnimation).weight = 0.0;
        animationMixer.start(defaultAnimation,0,-1);
    }
    initiated = true;
} else {
    debugPrint("WARNING: Missing Animation Mixer.");
}

function onTouchStart() {
    if (animationMixer && initiated) {
        animationMixer.getLayer(defaultAnimation).weight = 0.0;
        animationMixer.getLayer(pickupAnimation).weight = 1.0;
        animationMixer.start(pickupAnimation,0,-1);
        animationMixer.stop(defaultAnimation);
    }
}

function onTouchEnd() {
    if (animationMixer && initiated) {
        animationMixer.getLayer(defaultAnimation).weight = 1.0;
        animationMixer.getLayer(pickupAnimation).weight = 0.0;
        animationMixer.start(defaultAnimation,0,-1);
        animationMixer.stop(pickupAnimation);
    }
}
script.createEvent("TouchStartEvent").bind(onTouchStart);
script.createEvent("TouchEndEvent").bind(onTouchEnd);

function debugPrint(_message) {
    print("PickupAnimatedObjectController, " + _message);
}
