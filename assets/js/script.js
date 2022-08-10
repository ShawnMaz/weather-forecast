var apiKey = "7ba92f1d054eb9a7fd1a5209120f4d15";
var weatherIcon;

var searchFormEl = document.querySelector("#search-form");
var displayAreaEl = document.querySelector("#display-area");
var searchResultsEl = document.querySelector("#search-results");

var listOfCities = [];

var getUvColourCode = function (uvIndex) {
  var colour;
  switch (uvIndex) {
    case 0:
    case 1:
    case 2:
      colour = "green";
      break;
    case 3:
    case 4:
    case 5:
      colour = "yellow";
      break;
    case 6:
    case 7:
      colour = "orange";
      break;
    case 8:
    case 9:
    case 10:
      colour = "red";
      break;
    case 11:
      colour = "purple";
      break;
  }
  return colour;
};

var showData = function (cityInfo, dailyForecast, weeklyForecast) {
  displayAreaEl.innerHTML = `
        <div class="card-body border border-dark rounded my-3">
            <h2 class="card-title">${cityInfo.nameOfCity} - ${dailyForecast.date} <img src="https://openweathermap.org/img/w/${dailyForecast.weatherIcon}.png"></h2>
            <p class="card-text">Temp: ${dailyForecast.temperature}</p>
            <p class="card-text">Wind: ${dailyForecast.windSpeed}</p>
            <p class="card-text">Humidity: ${dailyForecast.humidity}</p>
            <p class="card-text">UV Index: <span class="p-1 bg-custom ${dailyForecast.uvIndexColour}">${dailyForecast.uvIndex}</span></p>
        </div> 
    `;

    var fiveDayForecastCardSectionEl = document.createElement("section");
    fiveDayForecastCardSectionEl.classList = "d-flex flex-column";
    var h3El = document.createElement("h3");
    h3El.textContent = "5-Day Forecast:";
    fiveDayForecastCardSectionEl.appendChild(h3El);

    var fiveDayForcastCard = document.createElement("div");
    fiveDayForcastCard.classList = "d-flex justify-content-between flex-wrap";

    for (var i = 0; i < weeklyForecast.length; i++){
        fiveDayForcastCard.innerHTML += `
        <div class="card-body bg-info rounded text-white col-md-2 mb-3">
            <h6 class="card-title">${weeklyForecast[i].date}</h6>
            <img src="https://openweathermap.org/img/w/${weeklyForecast[i].weatherIcon}.png">
            <p class="card-text">Temp: ${weeklyForecast[i].temerature}</p>
            <p class="card-text">Wind: ${weeklyForecast[i].windSpeed}</p>
            <p class="card-text">Humidity: ${weeklyForecast[i].humidity}</p>
        </div>
        `;
    }
    fiveDayForecastCardSectionEl.appendChild(fiveDayForcastCard);
    displayAreaEl.appendChild(fiveDayForecastCardSectionEl);
    weeklyForecast = []; // empty out 5 day forecast
};

var convertToKph = function (mps) {
  return (mps * (1 / 1000) * 3600).toFixed(2);
};

var showSearchResults = function(){ 
  searchResultsEl.innerHTML = "";

  if(listOfCities.length > 0){
    for (var i = listOfCities.length - 1; i >= 0; i--){
      var buttonEl = document.createElement("button");
      buttonEl.classList = "btn btn-secondary mb-3";
      buttonEl.setAttribute("data-city-name", listOfCities[i].nameOfCity);
      buttonEl.textContent = `${listOfCities[i].nameOfCity}`;
      searchResultsEl.appendChild(buttonEl);
    }
  }  
};

var readSearchResults = function(){
  listOfCities = JSON.parse(localStorage.getItem("searchHistory")) || [];
};

var updateSearchResults = function(cityInfo){
  for(var i = 0; i < listOfCities.length; i++){
    if (listOfCities[i].nameOfCity === cityInfo.nameOfCity){
      listOfCities.splice(i,1);
    }
  }  
  listOfCities.push(cityInfo);
  if(listOfCities.length > 10){
    listOfCities.shift();
  }
  localStorage.setItem("searchHistory", JSON.stringify(listOfCities));
};

var fetchApi = function (cityName) {
  var cityInfo = {};
  var apiUrlGeocoding = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${apiKey}`;
  fetch(apiUrlGeocoding).then(function (response) {
    if (response.ok) {
      response.json().then(function (data) {
        if (data.length > 0) {
          cityInfo.nameOfCity = data[0].name;
          cityInfo.latitude = data[0].lat;
          cityInfo.longitude = data[0].lon;

          var apiUrlDailyForecast = `https://api.openweathermap.org/data/2.5/onecall?lat=${cityInfo.latitude}&lon=${cityInfo.longitude}&appid=${apiKey}&units=metric`;
          var dailyForecast = {};
          fetch(apiUrlDailyForecast).then(function (response) {
            if (response.ok) {
              response.json().then(function (data) {
                dailyForecast.date = moment
                  .unix(data.current.dt)
                  .format("MMM Do[,] YYYY");
                dailyForecast.weatherIcon = data.current.weather[0].icon;
                dailyForecast.temperature = `${data.current.temp}°C`;
                dailyForecast.windSpeed = `${convertToKph(
                  data.current.wind_speed
                )} KPH`;
                dailyForecast.humidity = `${data.current.humidity}%`;
                dailyForecast.uvIndex = data.current.uvi;
                dailyForecast.uvIndexColour = getUvColourCode(
                  Math.floor(data.current.uvi)
                );

                var apiUrlFiveDayForecast = `https://api.openweathermap.org/data/2.5/forecast?lat=${cityInfo.latitude}&lon=${cityInfo.longitude}&appid=${apiKey}&units=metric`;
                var weeklyForecast = [];
                fetch(apiUrlFiveDayForecast).then(function (response) {
                  if (response.ok) {
                    response.json().then(function (data) {
                      for (var i = data.list.length - 1; i > 0; i -= 8) {
                        var futureForecast = {};
                        futureForecast.date = moment
                          .unix(data.list[i].dt)
                          .format("MMM Do[,] YYYY");
                        futureForecast.weatherIcon =
                          data.list[i].weather[0].icon;
                        futureForecast.temerature = `${data.list[i].main.temp}°C`;
                        futureForecast.windSpeed = `${convertToKph(
                          data.list[i].wind.speed
                        )} KPH`;
                        futureForecast.humidity = `${data.list[i].main.humidity}%`;
                        weeklyForecast.unshift(futureForecast);                        
                      }
                      showData(cityInfo, dailyForecast, weeklyForecast);
                      updateSearchResults(cityInfo);
                      showSearchResults();
                    });
                  } else {
                    alert("Error. Unable to get the 5 day forecast.");
                  }
                });
              });
            } else {
              alert(`Error. Unable to get daily forecast from the server.`);
            }
          });
        } else {
          alert(
            `Error. Unable to find city with the name ${cityInfo.nameOfCity}.`
          );
        }
      });
    } else {
      alert(`Error. Unable to find city with the name ${cityInfo.nameOfCity}.`);
    }
  });
};

readSearchResults();
showSearchResults();

var runWeatherDashboard = function (event) {
  event.preventDefault();

  var cityName = document.querySelector("input[name='search']").value;
  document.querySelector("input[name='search']").value = "";
  if (!cityName) {
    alert("Invalid city name entered");
    return false;
  }  
  displayAreaEl.innerHTML = "<h2>Loading...</h2>";
  fetchApi(cityName.toLowerCase());  
};

searchFormEl.addEventListener("submit", runWeatherDashboard);

var searchHistoryButtonHandler = function(event){
  if(event.target.matches(".btn")){
    var cityName = event.target.getAttribute("data-city-name");
  }
  if(cityName){
    displayAreaEl.innerHTML = "<h2>Loading...</h2>";
    fetchApi(cityName);
  }  
};

searchResultsEl.addEventListener("click", searchHistoryButtonHandler)
