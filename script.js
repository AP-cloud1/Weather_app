const apiKey = "37178cf9ec1f39840844a2d2e4706da1"; // Replace with your OpenWeatherMap API key
const searchInput = document.querySelector('.search-input');
const searchButton = document.querySelector('.search-button');
const weatherIcon = document.querySelector('.weather-icon');
const weatherDetails = document.querySelector('.weather-details');
const forecastContainer = document.querySelector('.forecast-container');

// List of common country names for validation
const commonCountries = [
    'united states', 'usa', 'united kingdom', 'uk', 'india', 'china', 'japan', 'germany',
    'france', 'italy', 'canada', 'australia', 'spain', 'brazil', 'mexico', 'russia',
    'south korea', 'indonesia', 'turkey', 'saudi arabia', 'switzerland', 'sweden',
    'norway', 'denmark', 'finland', 'iceland', 'ireland', 'scotland', 'wales',
    'netherlands', 'belgium', 'portugal', 'greece', 'egypt', 'south africa', 'nigeria',
    'kenya', 'pakistan', 'bangladesh', 'thailand', 'vietnam', 'malaysia', 'singapore'
];

// Error message display
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Remove any existing error message
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Insert error message after search box
    const searchBox = document.querySelector('.search-box');
    searchBox.parentNode.insertBefore(errorDiv, searchBox.nextSibling);
    
    // Hide weather details
    weatherDetails.classList.add('hidden');
    forecastContainer.classList.add('hidden');
    
    // Auto-remove error after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Check if input might be a country name
function isCountryName(input) {
    input = input.toLowerCase().trim();
    return commonCountries.includes(input) || 
           commonCountries.some(country => 
               input.includes(country) || country.includes(input)
           );
}

function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 7) return 'sunrise';
    if (hour >= 7 && hour < 17) return 'day';
    if (hour >= 17 && hour < 19) return 'sunset';
    return 'night';
}

function setBackground(weatherCode, timeOfDay) {
    const body = document.body;
    body.className = ''; // Reset classes
    body.classList.add(timeOfDay, weatherCode);
}

async function checkWeather(city) {
    try {
        // Input validation
        if (!city || city.trim() === '') {
            showError('Please enter a city name');
            return;
        }

        // Check if input might be a country name
        if (isCountryName(city)) {
            showError('Please enter a city name, not a country name');
            return;
        }

        // Show loading state
        searchButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        searchButton.disabled = true;

        const [weatherResponse, forecastResponse] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`)
        ]);
        
        // Handle different HTTP error codes
        if (weatherResponse.status === 404 || forecastResponse.status === 404) {
            showError('City not found. Please check the spelling and try again.');
            return;
        }
        
        if (weatherResponse.status === 401 || forecastResponse.status === 401) {
            showError('API key error. Please try again later.');
            return;
        }
        
        if (!weatherResponse.ok || !forecastResponse.ok) {
            showError('Unable to fetch weather data. Please try again later.');
            return;
        }

        const weatherData = await weatherResponse.json();
        const forecastData = await forecastResponse.json();

        // Update current weather
        document.querySelector('.temp').innerHTML = Math.round(weatherData.main.temp) + "°C";
        document.querySelector('.city').innerHTML = weatherData.name;
        document.querySelector('.humidity').innerHTML = weatherData.main.humidity + "%";
        document.querySelector('.wind').innerHTML = weatherData.wind.speed + " km/h";
        document.querySelector('.feels-like').innerHTML = Math.round(weatherData.main.feels_like) + "°C";
        
        // Update sunrise/sunset times
        const sunrise = new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const sunset = new Date(weatherData.sys.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        document.querySelector('.sunrise-time').innerHTML = sunrise;
        document.querySelector('.sunset-time').innerHTML = sunset;

        // Update weather icon and background
        const weatherCode = weatherData.weather[0].main.toLowerCase();
        weatherIcon.src = getWeatherIcon(weatherCode);
        setBackground(weatherCode, getTimeOfDay());

        // Update forecast
        updateForecast(forecastData);

        // Show weather details
        weatherDetails.classList.remove('hidden');
        forecastContainer.classList.remove('hidden');

        // Remove any existing error message
        const errorMessage = document.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }

    } catch (error) {
        showError('An error occurred. Please try again later.');
        console.error('Weather App Error:', error);
    } finally {
        // Reset search button
        searchButton.innerHTML = '<i class="fas fa-search"></i>';
        searchButton.disabled = false;
    }
}

function getWeatherIcon(weatherCode) {
    const iconMap = {
        'clear': 'https://openweathermap.org/img/wn/01d@2x.png',
        'clouds': 'https://openweathermap.org/img/wn/02d@2x.png',
        'rain': 'https://openweathermap.org/img/wn/10d@2x.png',
        'drizzle': 'https://openweathermap.org/img/wn/09d@2x.png',
        'thunderstorm': 'https://openweathermap.org/img/wn/11d@2x.png',
        'snow': 'https://openweathermap.org/img/wn/13d@2x.png',
        'mist': 'https://openweathermap.org/img/wn/50d@2x.png'
    };
    return iconMap[weatherCode] || iconMap['clear'];
}

function updateForecast(forecastData) {
    const forecastHTML = forecastData.list
        .filter((item, index) => index % 8 === 0) // Get one forecast per day
        .slice(0, 5) // Get 5 days
        .map(day => {
            const date = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
            const temp = Math.round(day.main.temp);
            const icon = getWeatherIcon(day.weather[0].main.toLowerCase());
            return `
                <div class="forecast-day">
                    <p>${date}</p>
                    <img src="${icon}" alt="weather" class="forecast-icon">
                    <p>${temp}°C</p>
                </div>
            `;
        })
        .join('');
    
    forecastContainer.innerHTML = forecastHTML;
}

function updateWeatherAnimation(weatherCode) {
    const weatherAnimation = document.querySelector('.weather-animation');
    weatherAnimation.style.display = weatherCode === 'clear' ? 'none' : 'block';

    // Add more specific animations based on weather type
    if (weatherCode === 'clouds' || weatherCode === 'rain') {
        document.querySelectorAll('.cloud').forEach(cloud => {
            cloud.style.animation = 'moveCloud 15s infinite linear';
        });
    }
}

// Event Listeners
searchButton.addEventListener('click', () => {
    checkWeather(searchInput.value);
});

searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        checkWeather(searchInput.value);
    }
});

// Add input validation
searchInput.addEventListener('input', () => {
    // Remove any error message when user starts typing
    const errorMessage = document.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
});

// Initial state
weatherDetails.classList.add('hidden');
forecastContainer.classList.add('hidden');

// Set initial background based on time of day
setBackground('clear', getTimeOfDay());
