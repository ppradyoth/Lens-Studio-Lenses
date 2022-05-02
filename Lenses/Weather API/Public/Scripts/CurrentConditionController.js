// CurrentConditionContrller.js
// Version: 1.0.0
// Event: OnAwake
// Description: This script calls the API to get the current weather. It then presents that data in a UIWeatherDay.

// @input Component.ScriptComponent accuweatherAPI
// @input string city
// @input Component.ScriptComponent uiWeatherDay
// @input SceneObject loadingObject
// @input float loadingTime = 0.15

var desiredCity;
var checkInputs = function() {
    if (Object.prototype.hasOwnProperty.call(global.CityCoordinates, script.city)) {
        desiredCity = global.CityCoordinates[script.city];
    } else {
        print("ERROR: No such city found in ExampleCities.js, please add coordinates for this city and try again");
        return false;
    }
    
    if (!script.accuweatherAPI) {
        print("ERROR: no accuweather API script input set on: " + script.getSceneObject().name);
        return false;
    }    
    
    return true;
};

var startLoading = function() {
    if (script.loadingObject) {
        script.loadingObject.enabled = true;
    }
};

var stopLoading = function() {
    if (script.loadingObject) {
        script.loadingObject.enabled = false;
    }
};


var init = function() {
    if (checkInputs()) {
        // Show loading if it takes longer than loadingTime
        var delayedLoading = script.createEvent("DelayedCallbackEvent");
        delayedLoading.bind(startLoading);
        delayedLoading.reset(script.loadingTime);
        script.uiWeatherDay.getSceneObject().enabled = false;
        script.accuweatherAPI.api.getCurrentCondition(desiredCity.latitude, desiredCity.longitude, function(err, parsedBody) {
            delayedLoading.enabled = false;               
            stopLoading(); 
            script.uiWeatherDay.getSceneObject().enabled = true;
            if (!err) {
                var currentCondition = parsedBody.currentCondition;
                var currUiWeatherDay = script.uiWeatherDay.api;
                currUiWeatherDay.setTemperature(currentCondition.temperatureF);
                currUiWeatherDay.setTimeToNow();
                currUiWeatherDay.setCondition(currentCondition.condition);
            }
        });
    }
};

init();