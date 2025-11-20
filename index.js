const userLocation = document.getElementById("locationInput");
const searchBtn = document.getElementById("search");
const parentElem = document.getElementById("card");
const resultsList = document.getElementById("results-container");
const msg = document.getElementById("msg");
const toggleTempBtn = document.querySelector(".toggleDeg");
let tempToFar;
let tempToCel;

searchBtn.addEventListener("click", search);

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
    const results = await getGeoLocation(userInput);
    dispLocationRes(results);
  } catch (error) {
    msg.textContent = "Search failed. Try again.";
  }
}

// Search by CITY or ZIP CODE
async function getGeoLocation(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query
  )}&count=10&language=en&format=json`;
  const response = await fetch(url);

  if (!response.ok) throw new Error(`Response status: ${response.status}`);
  const data = await response.json();

  return data.results || [];
}

// Get weather data using LATITUDE and LONGITUDE
async function getWeatherData(state, name, lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,temperature_2m,wind_speed_10m,is_day&timezone=auto`;
  const response = await fetch(url);

  if (!response.ok) throw new Error(`Response status: ${response.status}`);
  const data = await response.json();

  const temp = data.current.temperature_2m;
  const wind = data.current.wind_speed_10m;

  displayWeather(state, name, temp, wind);
}

// Display weather data
function displayWeather(state, name, temp, wind) {
  const roundTemp = Math.round(temp)

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
