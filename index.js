const userLocation = document.getElementById("locationInput");
const searchBtn = document.getElementById("search");
const parentElem = document.getElementById("card");
const resultsList = document.getElementById("results-container");
const msg = document.getElementById("msg");
const toggleTempBtn = document.querySelector(".toggleDeg");
const geoButton = document.getElementById("geoBtn");
const recentSearches = [];

window.onload = init;

searchBtn.addEventListener("click", search);
geoButton.addEventListener("click", getGeoLocation);

function init() {
  const storedLocation = localStorage.getItem("userLocation");
  const userCoords = JSON.parse(storedLocation);

  if (storedLocation) {
    getWeatherData(userCoords[0], userCoords[1], userCoords[2], userCoords[3]);
  }
}

// Geolocation API
function getGeoLocation() {
  let locationArr = [];
  async function success(position) {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`;
    const response = await fetch(url);
    const data = await response.json();

    getWeatherData(
      data.principalSubdivision,
      data.city,
      data.latitude,
      data.longitude
    );

    locationArr.push(
      data.principalSubdivision,
      data.city,
      data.latitude,
      data.longitude
    );

    msg.textContent = "";

    localStorage.setItem("userLocation", JSON.stringify(locationArr));
  }

  function error() {
    msg.textContent = "Unable to retrieve your location";
  }

  if (!navigator.geolocation) {
    msg.textContent = "Geolocation is not supported by your browser";
  } else {
    msg.textContent = "Locating...";
    navigator.geolocation.getCurrentPosition(success, error);
  }
}

// Make a search
async function search() {
  msg.textContent = "";
  const userInput = userLocation.value.trim();

  if (!userInput) {
    msg.textContent = "Please enter a city or zipcode";
    resultsList.innerHTML = "";
    return;
  }

  try {
    const results = await getGeoCode(userInput);
    dispLocationRes(results);
  } catch (error) {
    msg.textContent = "Search failed. Try again.";
  }
}

// Search by CITY or ZIP CODE
async function getGeoCode(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query
  )}&count=10&language=en&format=json`;
  const response = await fetch(url);

  if (!response.ok) throw new Error(`Response status: ${response.status}`);
  const data = await response.json();

  console.log(data);

  return data.results || [];
}

// Get weather data using LATITUDE and LONGITUDE
async function getWeatherData(state, name, lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max,uv_index_clear_sky_max,rain_sum,showers_sum,snowfall_sum,precipitation_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,shortwave_radiation_sum,et0_fao_evapotranspiration&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto`;
  const response = await fetch(url);

  if (!response.ok) throw new Error(`Response status: ${response.status}`);
  const data = await response.json();

  const temp = data.current.temperature_2m;
  const wind = data.current.wind_speed_10m;
  const weather_code = data.current.weather_code;
  console.log(weather_code);

  console.log(data);

  displayWeather(state, name, temp, wind);
  recentlySearched(state, name, temp, weather_code);
}

function recentlySearched(state, name, temp, weather_code) {
  recentSearches.push({
    state: state,
    city: name,
    temp: temp,
    icon: weather_code,
  });

  localStorage.setItem("recentlySearched", JSON.stringify(recentSearches));
}



// Display weather data
function displayWeather(state, name, temp, wind) {
  let tempToFar;
  let tempToCel;
  const roundTemp = Math.round(temp);

  const html = `
    <p class="state">${state}</p>
    <p class="city">${name}</p>
    <p class="temp">${roundTemp} °C</p>
    <p class="windSpeed">Windspeed: ${wind}</p>
  `;

  const childElem = document.querySelector(".content-container");

  parentElem.appendChild(childElem);
  parentElem.style.display = "flex";
  childElem.innerHTML = html;

  let tempVal = document.querySelector(".temp");

  toggleTempBtn.addEventListener("click", () => {
    if (tempVal.innerText.includes("C")) {
      tempToFar = `${(temp * 9) / 5 + 32}`;
      tempVal.textContent = Math.round(tempToFar) + "°F";
    } else {
      tempToCel = `${(tempToFar - 32) / 1.8}`;
      tempVal.textContent = Math.round(tempToCel) + " °C";
    }
  });
}

function dispLocationRes(results) {
  resultsList.innerHTML = "";
  resultsList.style.display = "block";

  if (!results || results.length === 0) {
    resultsList.innerHTML =
      '<li class="empty"> No matches. Try a more specific name.</li>';
    return;
  }

  const items = results
    .map((r) => {
      const label = `${r.name}${r.admin1 ? ", " + r.admin1 : ""}, ${r.country}`;
      return `
      <li class="suggest"
        data-lat="${r.latitude}"
        data-lon="${r.longitude}"
        data-state="${r.admin1 || ""}"
        data-name="${r.name}">
        ${label}
      </li>`;
    })
    .join("");

  resultsList.innerHTML = items;
}

resultsList.addEventListener("click", (e) => {
  const li = e.target.closest(".suggest");
  if (!li) return;

  const lat = Number(li.dataset.lat);
  const lon = Number(li.dataset.lon);
  const state = li.dataset.state;
  const name = li.dataset.name;

  userLocation.value = li.textContent;
  resultsList.innerHTML = "";

  getWeatherData(state, name, lat, lon);
});
