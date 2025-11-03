let userLocation = document.getElementById("locationInput");
let searchBtn = document.getElementById("search");
let parentElem = document.getElementById("card");

searchBtn.addEventListener("click", search);

// Make a search
async function search() {
  let userInput = userLocation.value;

  if (userInput) {
    try {
      const { name, lat, lon } = await getGeoLocation(userInput);
      await getWeatherData(name, lat, lon);
    } catch (error) {
      console.log("error", error);
    }
  } else {
    alert("ERROR: Please enter a city or zip code");
  }
}

// Search by CITY or ZIP CODE
async function getGeoLocation(cityZip) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${cityZip}&count=1&language=en&format=json`;
  const response = await fetch(url);

  if (!response.ok) throw new Error(`Response status: ${response.status}`);
  const data = await response.json();
  const result = data.results[0];
  
  const name = result.name;
  const lat = result.latitude;
  const lon = result.longitude;

  return { name, lat, lon };
}

// Get weather data using LATITUDE and LONGITUDE
async function getWeatherData(name, lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m&timezone=auto`;
  const response = await fetch(url);

  if (!response.ok) throw new Error(`Response status: ${response.status}`);
  const data = await response.json();

  const temp = data.current.temperature_2m;
  const wind = data.current.wind_speed_10m;

  displayWeather(name, temp, wind);
}

// Display weather data
function displayWeather(name, temp, wind) {
  const namePara = document.createElement("p");
  const tempPara = document.createElement("p");
  const windPara = document.createElement("p");
  const childElem = document.querySelector(".content-container");

  parentElem.appendChild(childElem);
  parentElem.style.display = "flex";

  childElem.textContent = "";

  namePara.textContent = name;
  tempPara.textContent = temp + "°C";
  windPara.textContent = "Windspeed: " + wind;

  namePara.classList.add("location");
  tempPara.classList.add("temp");
  windPara.classList.add("windSpeed");

  childElem.appendChild(namePara);
  childElem.appendChild(tempPara);
  childElem.appendChild(windPara);
}
