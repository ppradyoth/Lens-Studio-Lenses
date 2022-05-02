// -----JS CODE-----
// SignToType.js
// Version: 0.1.0
// Description: Uses Fingerspell Detector and Fingerspell Hint to detect and display 
// the letter the user signed with their hand and appends it to the text component

//@input Component.ScriptComponent fingerspellController {"label" : "Detector"}
//@input Component.ScriptComponent handSignHintController {"label" : "Hint"}
//@ui {"widget" : "separator"}
// @input Component.Text textDisplay
// @input string defaultText = "Sign to Type..."
// @input float delayBeforeNextChar = 1

// State
var canAddText = true;
var hasTyped = false;

// Modify this function with your own experience!
function startExperience(fingerspell, handHint) {

    script.textDisplay.text = script.defaultText;

    // Delay next time user can add text
    var debounceEvent = script.createEvent("DelayedCallbackEvent");
    debounceEvent.bind(function() {
        canAddText = true;
    });

    // Callback for when user gestures a new letter
    fingerspell.onNewChar = function(c) {

        // Add character signed only after some time
        if (canAddText) {
            // Replace hint with the gestured letter
            if (handHint.showLetter) {
                handHint.showLetter(c);
            }

            // Reset text field on first sign
            if (!hasTyped) {
                script.textDisplay.text = "";
                hasTyped = true;
            }

            // Add current letter to the display
            script.textDisplay.text += c;

            // Allow text adding only after some time
            canAddText = false;
            debounceEvent.reset(script.delayBeforeNextChar);
        }
    };
}

function checkInputs() {
    if (!script.fingerspellController) {
        print("ERROR: Please assign Fingerspell Detector to the Detector field");
        return false;
    }
    if (!script.handSignHintController) {
        print("ERROR: Please assign Fingerspell Hint Script to the Hint field");
        return false;
    }
    return true;
}

function initialize() {
    startExperience(script.fingerspellController.api, script.handSignHintController.api);
}

if (checkInputs()) {
    script.createEvent("OnStartEvent").bind(initialize);
}