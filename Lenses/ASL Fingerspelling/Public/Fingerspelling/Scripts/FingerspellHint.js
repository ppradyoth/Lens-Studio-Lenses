// -----JS CODE-----
// FingerspellHint.js
// Allows to display a hand sign that corresponds to the letter of the ASL alphabet

// @input Component.Text hintText {"label" : "Text Component"}
// @input Component.AnimationMixer mixer {"label" : "Animation Mixer"}
// @input float animationSpeed = 1.0
// @input Component.ObjectTracking objectTracking {"label" : "Hand Tracking"}

var isLeft = false;
// animation clip names
const IDLE_LAYER = "idle";
const IDLE_TO_LAYER = "idle_to_";
const TO_IDLE_LAYER = "_to_idle";
const LOOP_LAYER = "_loop";
const Z_LAYER = "idle_to_Z_loop";

const AnimType = {};
AnimType[IDLE_LAYER] = 0;
AnimType[IDLE_TO_LAYER] = 1;
AnimType[TO_IDLE_LAYER] = 2;
AnimType[LOOP_LAYER] = 3;

var anim = {
    currType: AnimType[IDLE_LAYER],
    next: "idle",
    prev: "idle",
    nextLetter: "",
    currentLetter: "",
};

var hintParent;
var flipT;
var flipScale;
var layerNamesAvailable;
var updateEvent;

function setText(text, isFinished) {
    script.hintText.text = text;
    script.hintText.enabled = !isFinished;
}

function initialize() {
    hintParent = script.mixer.getSceneObject();
    flipT = hintParent.getTransform();
    flipScale = flipT.getLocalScale();
    layerNamesAvailable = script.mixer.getLayers().map(function(layer) {
        return layer.name;
    });
    script.mixer.speedRatio = script.animationSpeed;
    setText("@ShowOpen");
    updateEvent = script.createEvent("UpdateEvent");
    updateEvent.bind(checkHandShown);
}

function flip() {
    flipScale.x = Math.abs(flipScale.x);
    if (isLeft) {
        flipScale.x = -flipScale.x;
    }
    flipT.setLocalScale(flipScale);
}

function checkSide() {
    if (script.objectTracking.isTracking()) {
        if (script.objectTracking.objectSpecificData.isLeft) {
            if (!isLeft) {
                isLeft = true;
                flip();
            }
        } else if (isLeft) {
            isLeft = false;
            flip();
        }
    }
}

function playAnim(layerName, letter) {
    anim.currType = AnimType[layerName];
    if (letter == "Z") {
        if (layerName == TO_IDLE_LAYER) {
            playNext();
            return;
        } else {
            layerName = Z_LAYER;
        }
    } else if (layerName == IDLE_TO_LAYER) {
        layerName += letter;
    } else {
        layerName = letter + layerName;
    }

    if (layerNamesAvailable.indexOf(layerName) < 0) {
        print(layerName + " not found for " + letter);
        return;
    }

    script.mixer.startWithCallback(layerName, 0, 1, playNext);
    script.mixer.getLayer(layerName).disabled = false;
}

function playNext() {
    checkSide();
    if (anim.currType == AnimType[IDLE_LAYER]) {
        if (anim.nextLetter == "") {
            playAnim(IDLE_LAYER, "");
            setText("", false);
        } else {
            anim.currentLetter = anim.nextLetter;
            playAnim(IDLE_TO_LAYER, anim.currentLetter);
            setText(anim.currentLetter, false);
        }
    } else if (anim.currType == AnimType[IDLE_TO_LAYER]) {
        if (anim.currentLetter == anim.nextLetter) {
            playAnim(LOOP_LAYER, anim.currentLetter);
            setText(anim.currentLetter, false);
        } else {
            playAnim(TO_IDLE_LAYER, anim.currentLetter);
            setText(anim.currentLetter, true);
        }
    } else if (anim.currType == AnimType[LOOP_LAYER]) {
        if (anim.currentLetter == anim.nextLetter) {
            playAnim(LOOP_LAYER, anim.currentLetter);
            setText(anim.currentLetter, false);
        } else {
            playAnim(TO_IDLE_LAYER, anim.currentLetter);
            setText(anim.currentLetter, true);
        }
    } else if (anim.currType == AnimType[TO_IDLE_LAYER]) {
        if (anim.nextLetter == "") {
            playAnim(IDLE_LAYER, "");
            setText(anim.currentLetter, true);
        } else {
            anim.currentLetter = anim.nextLetter;
            playAnim(IDLE_TO_LAYER, anim.currentLetter);
            setText(anim.currentLetter, false);
        }
    }
}

function checkHandShown() {
    if (script.objectTracking.isTracking()) {
        playAnim(IDLE_LAYER, "");
        updateEvent.enabled = false;
    }
}

    
function checkInputs() {
    if (!script.mixer) {
        print("ERROR, set animation mixer " + script.getSceneObject().name);
        return false;
    }
    if (!script.hintText) {
        print("ERROR, text component is not set on " + script.getSceneObject().name);
        return false;
    }
    if (!script.objectTracking) {
        print("ERROR, hand tracking is not set on " + script.getSceneObject().name);
        return false;
    }
    return true;
}

if (checkInputs()) {
    initialize();
} else {
    print("ERROR, Script was not initialized properly");
}

// public api

// show hint
script.api.show = function() {
    hintParent.enabled = true;
};
// hide hint
script.api.hide = function() {
    hintParent.enabled = false;
};
// show letter
script.api.showLetter = function(c) {
    anim.nextLetter = c.toUpperCase();
};
// update hand side
script.api.checkSide = checkSide;

