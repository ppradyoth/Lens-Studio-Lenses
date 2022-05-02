// UIWeatherDay.js
// Version: 1.0.0
// Event: OnAwake
// Description: This script displays the time, temperature, and a visual representation of the current weather condition.


// @input Component.Text temperature
// @input Component.Text time
// A list of icons in the same order as the conditions in global.AccuweatherConditions from AccuweatherAPI.js
// @input SceneObject[] conditionIcons

// Labels for days of the week
const weekdays = ["Sun", "Mon", "Tues", "Wed", "Thu", "Fri", "Sat"];

var checkInputs = function() {
    if (global.AccuweatherConditions.length != script.conditionIcons.length) {
        print("ERROR: Mismatch in number of conditions to condition icons");
    }
};

/*
 * @param {Number} temp The temperature to display
 *
*/
var setTemperature = function(temp) {
    script.temperature.text = temp.toFixed(0) + "°";
};

/*
 * @param {Number} epochMs The UTC time in ms of the forecast
 * @param {Number} timezoneOffsetS The UTC timezone offset of the forecast in
 *
*/
var setTime = function(epochMs, timezoneOffsetS) {
    var date = new Date(0);
    var timeZoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
    date.setUTCMilliseconds(parseInt(epochMs) + (timezoneOffsetS * 1000) + timeZoneOffsetMs);
    script.time.text = weekdays[date.getDay()];
};

/*
 * Sets the time label to "Now" for displaying current conditions
 *
*/
var setTimeToNow = function() {
    script.time.text = "Now";
};

/*
 * @param {String} The weather condition to display an icon for.
 *
*/
var setCondition = function(condition) {
    var targetIcon;
    for (var i = 0; i < global.AccuweatherConditions.length; i++) {
        var currIcon =  script.conditionIcons[i];
        if (condition === global.AccuweatherConditions[i]) {
            targetIcon = currIcon;
            targetIcon.enabled = true;
        } else {
            if (!targetIcon) {
                currIcon.enabled = false;
            } else if (targetIcon && targetIcon !== currIcon) {
                currIcon.enabled = false;
            }
        }
    }
};

checkInputs();

script.api.setTemperature = setTemperature;
script.api.setTimeToNow = setTimeToNow;
script.api.setCondition = setCondition;
script.api.setTime = setTime;
