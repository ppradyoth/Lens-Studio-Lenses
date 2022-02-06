// PrintHourlyForecastExample.js
// Version: 1.0.0
// Event: OnAwake
// Description: This simple example calls the API to get the hourly forecast. It then prints the conditions for the hourly forecast.

// @input Component.ScriptComponent accuweatherAPI
// @input string city

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

var init = function() {
    if (checkInputs()) {
        script.accuweatherAPI.api.getHourlyForecast(desiredCity.latitude, desiredCity.longitude, function(err, parsedBody) {
            if (!err) {
                var hourlyForecast = parsedBody.hourlyForecast;
                var conditions = "";
                var temperatures = "";
                for (var i = 0; i < hourlyForecast.length; i++) {
                    var currForecast = hourlyForecast[i];
                    conditions += currForecast.condition + (i !== hourlyForecast.length - 1 ? ", " : "");
                    temperatures += currForecast.temperatureF + (i !== hourlyForecast.length - 1 ? ", " : "");
                }
                print("The conditions over the next " + hourlyForecast.length + " hours are: " + conditions);
                print("The temeperatures over the next " + hourlyForecast.length + " hours are: " + temperatures);
            }
        });
    }
};

init();
