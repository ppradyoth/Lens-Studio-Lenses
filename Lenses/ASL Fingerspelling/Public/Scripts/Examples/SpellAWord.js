// -----JS CODE-----
// ShowHintOnGesture.js
// Version: 0.1.0
// Description:  Uses Fingerspell Detector and Fingerspell Hint to display 
// letters of a specified word combination on a screen one by one, show next letter  
// once the previous was detected and call a custom behavior trigger once all complete

//@input Component.ScriptComponent fingerspellController {"label" : "Detector"}
//@input Component.ScriptComponent handSignHintController {"label" : "Hint"}
//@ui {"widget" : "separator"}

// @input Component.Text textToSpell

// @input string onCompleteBehavior

var index = 0;

// Modify this function with your own experience!
function startExperience(fingerspell, handHint) {

    var textToSpell = script.textToSpell.text
        .toUpperCase() // Check against uppercase
        .replace(/[^a-zA-Z]/g, ""); // remove non alpha characters
    
    // Callback for when user gestures a new letter
    fingerspell.onNewChar = function(c) {
        // On user matching hint
        if (c == textToSpell.charAt(index)) {
            // Show next character
            index++;
            if (handHint.showLetter) {
                handHint.showLetter(textToSpell.charAt(index));
            }
            
            // When user has signed every character
            if (index >= textToSpell.length) {
                // Call behavior on complete
                global.behaviorSystem.sendCustomTrigger(script.onCompleteBehavior);
                
                // Reset everything
                index = 0;
                if (handHint.showLetter) {
                    handHint.showLetter(textToSpell.charAt(index));
                }
            }
        }
    };
   
    // Initialize first hint
    if (handHint.showLetter) {
        handHint.showLetter(textToSpell.charAt(index));
    }
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