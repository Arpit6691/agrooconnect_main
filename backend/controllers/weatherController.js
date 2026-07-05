const axios = require('axios');

// @desc    Get weather data
// @route   GET /api/weather
// @access  Public
exports.getWeather = async (req, res) => {
  try {
    const location = req.query.location || 'Kansas, USA';
    const apiKey = process.env.OPENWEATHER_API_KEY;

    let weatherData;

    try {
      if (!apiKey || apiKey === 'dummy_weather_key') {
        throw new Error('Valid OpenWeather API key is missing');
      }

      // Try to fetch current weather from real API
      const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`);
      const data = weatherRes.data;

      let forecast = [];
      try {
        // Fetch 5-day forecast
        const forecastRes = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${apiKey}&units=metric`);
        const list = forecastRes.data.list;

        const daysMap = {};
        list.forEach(item => {
          const date = new Date(item.dt * 1000);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          if (!daysMap[dayName]) {
            daysMap[dayName] = {
              day: dayName,
              temp: Math.round(item.main.temp_max) + '°',
              min: Math.round(item.main.temp_min) + '°',
              condition: item.weather[0].main === 'Clear' ? 'Sunny' : (item.weather[0].main === 'Rain' ? 'Rain' : 'Cloudy')
            };
          }
        });
        forecast = Object.values(daysMap).slice(0, 7);
      } catch (forecastErr) {
        console.error('Forecast fetch error:', forecastErr.message);
      }

      weatherData = {
        location: `${data.name}, ${data.sys.country}`,
        current: {
          temp: Math.round(data.main.temp),
          condition: data.weather[0].main === 'Clear' ? 'Sunny & Clear' : data.weather[0].main,
          wind: Math.round(data.wind.speed * 3.6) + ' km/h',
          humidity: data.main.humidity + '%',
          rainProb: data.clouds ? data.clouds.all + '%' : '0%'
        },
        forecast: forecast.length > 0 ? forecast : generateMockForecast()
      };

    } catch (apiError) {
      // If API fails (e.g. 401 Unauthorized because key is still activating), fallback to mock data
      console.warn(`OpenWeather API failed (${apiError.message}), falling back to mock data for: ${location}`);
      
      weatherData = {
        location: location.charAt(0).toUpperCase() + location.slice(1), // Capitalize search
        current: {
          temp: Math.floor(Math.random() * (35 - 15 + 1) + 15), // Random temp between 15 and 35
          condition: 'Sunny & Clear',
          wind: '12 km/h',
          humidity: '45%',
          rainProb: '10%'
        },
        forecast: generateMockForecast()
      };
    }

    res.status(200).json({ success: true, data: weatherData });
  } catch (err) {
    console.error('Weather Controller Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Helper for mock forecast
function generateMockForecast() {
  return [
    { day: 'Mon', temp: '22°', min: '13°', condition: 'Sunny' },
    { day: 'Tue', temp: '20°', min: '12°', condition: 'Rain' },
    { day: 'Wed', temp: '18°', min: '10°', condition: 'Rain' },
    { day: 'Thu', temp: '21°', min: '11°', condition: 'Cloudy' },
    { day: 'Fri', temp: '24°', min: '13°', condition: 'Sunny' },
    { day: 'Sat', temp: '26°', min: '14°', condition: 'Sunny' },
    { day: 'Sun', temp: '27°', min: '16°', condition: 'Sunny' }
  ];
}
