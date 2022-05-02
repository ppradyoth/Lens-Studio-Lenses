// MultipleDayForecastController.js
// Version: 1.0.0
// Event: OnAwake
// Description: This script calls the API to get the information for the current day and multiple days of forecasting. It then presents that data through UIWeatherDays.

// @input Component.ScriptComponent accuweatherAPI
// @input string city
// @input Component.ScriptComponent[] uiWeatherDays 
// @input SceneObject loadingObject
// @input float loadingTime = 0.15

var desiredCity;
var toggleUiWeatherDays = function(enabled) {
    for (var w = 0; w < script.uiWeatherDays.length; w++) {
        script.uiWeatherDays[w].getSceneObject().enabled = enabled;
    }
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

var checkInputs = function() {
    if (Object.prototype.hasOwnProperty.call(global.CityCoordinates, script.city)) {
        desiredCity = global.CityCoordinates[script.city];
    } else {
        print("ERROR: No such city found in Cities.js, please add coordinates for this city and try again");
        return false;
    }
    
    if (!script.accuweatherAPI) {
        print("ERROR: no accuweather API script input set on: " + script.getSceneObject().name);
        return false;
    }    
    
    stopLoading();
    
    return true;
};


var init = function() {
    if (checkInputs()) {
        // Show loading if it takes longer than loadingTime
        var delayedLoading = script.createEvent("DelayedCallbackEvent");
        delayedLoading.bind(startLoading);
        delayedLoading.reset(script.loadingTime);
        toggleUiWeatherDays(false);
        script.accuweatherAPI.api.getCurrentConditionAndForecast(desiredCity.latitude, desiredCity.longitude, function(err, parsedBody) {
            delayedLoading.enabled = false;            
            stopLoading();
            toggleUiWeatherDays(true);
            if (!err) {
                // Set first UI weather day to current condition, set rest to forecasts
                var currentCondition = parsedBody.currentCondition;
                var currUiWeatherDay = script.uiWeatherDays[0].api;
                currUiWeatherDay.setTemperature(currentCondition.temperatureF);
                currUiWeatherDay.setTimeToNow();
                currUiWeatherDay.setCondition(currentCondition.condition);
                var timezoneOffsetS = parsedBody.timeZone.offsetS;
                // Set rest of forecast
                var dailyForecast = parsedBody.dailyForecast;
                for (var i = 1; i < dailyForecast.length && i < script.uiWeatherDays.length; i++) {
                    currentCondition = dailyForecast[i].day;
                    currUiWeatherDay = script.uiWeatherDays[i].api;
                    currUiWeatherDay.setCondition(currentCondition.condition);
                    currUiWeatherDay.setTemperature(currentCondition.temperatureF);
                    currUiWeatherDay.setTime(currentCondition.epochMs, timezoneOffsetS);
                }
            }
        });
    }
};

init();