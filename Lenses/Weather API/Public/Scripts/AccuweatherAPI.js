// AccuweatherAPI.js
// Version: 1.0.0
// Event: OnAwake
// Description: This script has functions to allow your code to use the Accuweather API

// @input Asset.RemoteServiceModule remoteServiceModule


var AccuweatherConditions = ["SUNNY", "WINDY", "SNOW", "CLEAR_NIGHT", "CLOUDY", "HAIL", "LIGHTNING", "LOW_VISIBILITY", "PARTIAL_CLOUDY", "PARTIAL_CLOUDY_NIGHT", "RAINY", "HOT", "COLD", "UNKNOWN"];

/*
 * @param {string} response A raw API response from an Accuweather API
 * @param {function} cb A callback to call with error and result data once the response has been parsed and error checked
 *
*/
function handleAPIResponse(response, cb) {
    if (response.statusCode !== 1) {
        print("ERROR: The API call did not succeed!. Please check your request");
        cb(true);
    } else {
        try {
            var parsedBody = JSON.parse(response.body);
            if (cb) {
                cb(false, parsedBody);
            }
        } catch (e) {
            print("ERROR: Failed to parse response");
            if (cb) {
                cb(true);
            }
        }
    }
}

/*
 * @param {string} lat Latitude to format into a Accuweather request body
 * @param {string} lng Longitude to format into a Accuweather request body
 *
*/
var formatLatLong = function(lat, lng) {
    return JSON.stringify({"lat": lat, "lng": lng});
};

/*
 * @param {string} latitude Latitude of desired condition and forecast
 * @param {string} longitude Longitude of desired condition and forecast
 * @param {function} cb A callback to call with error and result data
 * This function gets the current condition as well as both daily and hourly forecasts for the input latitude, longitude
 *
*/
var getCurrentConditionAndForecast = function(latitude, longitude, cb) {
    var req = global.RemoteApiRequest.create();
    req.endpoint = "current_condition_and_forecast";
    req.body = formatLatLong(latitude, longitude);
    script.remoteServiceModule.performApiRequest(req, function(response) {
        handleAPIResponse(response, cb);
    });
};

/*
 * @param {string} latitude Latitude of desired condition 
 * @param {string} longitude Longitude of desired condition 
 * @param {function} cb A callback to call with error and result data
 * This function gets the current condition for the input latitude, longitude
 *
*/
var getCurrentCondition = function(latitude, longitude, cb) {
    var req = global.RemoteApiRequest.create();
    req.endpoint = "current_condition";
    req.body = formatLatLong(latitude, longitude);
    script.remoteServiceModule.performApiRequest(req, function(response) {
        handleAPIResponse(response, cb);
    });
};

/*
 * @param {string} latitude Latitude for the hourly forecast 
 * @param {string} longitude Longitude for the hourly forecast 
 * @param {function} cb A callback to call with error and result data
 * This function gets an hourly forecast for the input latitude, longitude
 *
*/
var getHourlyForecast = function(latitude, longitude, cb) {
    var req = global.RemoteApiRequest.create();
    req.endpoint = "hourly_forecast";
    req.body = formatLatLong(latitude, longitude);
    script.remoteServiceModule.performApiRequest(req, function(response) {
        handleAPIResponse(response, cb);
    });
};

/*
 * @param {string} latitude Latitude for the daily forecast 
 * @param {string} longitude Longitude for the daily forecast 
 * @param {function} cb A callback to call with error and result data
 * This function gets a daily forecast for the input latitude, longitude
 *
*/
var getDailyForecast = function(latitude, longitude, cb) {
    var req = global.RemoteApiRequest.create();
    req.endpoint = "daily_forecast";
    req.body = formatLatLong(latitude, longitude);
    script.remoteServiceModule.performApiRequest(req, function(response) {
        handleAPIResponse(response, cb);
    });
};


script.api.getCurrentConditionAndForecast = getCurrentConditionAndForecast;
script.api.getCurrentCondition = getCurrentCondition;
script.api.getHourlyForecast = getHourlyForecast;
script.api.getDailyForecast = getDailyForecast;
global.AccuweatherConditions = AccuweatherConditions;