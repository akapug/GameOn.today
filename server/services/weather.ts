import { default as nodeFetch } from 'node-fetch';

if (!process.env.OPENWEATHER_API_KEY) {
  throw new Error('OPENWEATHER_API_KEY environment variable is required');
}

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/';

export interface WeatherInfo {
  temperature: number;
  description: string;
  icon: string;
  precipitation: number;
}

async function getCoordinates(location: string): Promise<{ lat: number; lon: number } | null> {
  try {
    // Add country code to improve accuracy, defaulting to US
    const searchQuery = location.includes(',') ? location : `${location},US`;

    console.log(`Searching for location: ${searchQuery}`);
    const response = await nodeFetch(
      `${BASE_URL}geo/1.0/direct?q=${encodeURIComponent(searchQuery)}&limit=5&appid=${API_KEY}`
    );
    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error(`Invalid response format for location: ${location}`);
      console.error('Response:', data);
      return null;
    }

    if (data.length === 0) {
      console.error(`No results found for location: ${location}`);
      return null;
    }

    console.log(`Found ${data.length} potential matches for ${location}`);

    // Parse input location and handle cases with no comma
    const parts = location.split(',');
    const inputCity = parts[0].trim().toLowerCase();
    const inputState = parts.length > 1 ? parts[1].trim().toLowerCase() : '';

    // Find best match by comparing city and state with fuzzy matching
    const bestMatch = data.find(loc => {
      const cityMatch = loc.name.toLowerCase().includes(inputCity) || 
                       inputCity.includes(loc.name.toLowerCase());
      const stateMatch = !inputState || 
                        (loc.state && loc.state.toLowerCase() === inputState) ||
                        (loc.state && loc.state.toLowerCase().includes(inputState));
      return loc.country === 'US' && (cityMatch || stateMatch);
    }) || data[0]; // Fallback to first result if no match

    console.log(`Selected location: ${bestMatch.name}, ${bestMatch.state || ''}, ${bestMatch.country}`);
    console.log(`Location resolved: ${bestMatch.name}, ${bestMatch.state || ''}, ${bestMatch.country}`);

    return {
      lat: bestMatch.lat,
      lon: bestMatch.lon
    };
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    return null;
  }
}

export async function getWeatherForecast(location: string, date: Date): Promise<WeatherInfo | null> {
  // Weather functionality temporarily disabled
  return null;
  /*try {
    const coords = await getCoordinates(location);
    if (!coords) return null;

    const response = await nodeFetch(
      `${BASE_URL}data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=imperial`
    );
    const data = await response.json() as any;

    if (!data || !data.list) {
      console.error('No forecast data received');
      return null;
    }

    // Find forecast for the same day, closest to the game time
    const targetDate = new Date(date);
    const targetDay = targetDate.getUTCDate();
    const targetMonth = targetDate.getUTCMonth();
    const targetYear = targetDate.getUTCFullYear();

    // Filter forecasts for the same day first
    const sameDayForecasts = data.list.filter((forecast: any) => {
      const forecastDate = new Date(forecast.dt * 1000);
      return forecastDate.getUTCDate() === targetDay &&
             forecastDate.getUTCMonth() === targetMonth &&
             forecastDate.getUTCFullYear() === targetYear;
    });

    if (sameDayForecasts.length === 0) {
      console.error('No forecasts available for target date');
      return null;
    }

    // Find closest time on the same day
    const targetTime = targetDate.getTime();
    const closestForecast = sameDayForecasts.reduce((prev: any, curr: any) => {
      const prevDiff = Math.abs(new Date(prev.dt * 1000).getTime() - targetTime);
      const currDiff = Math.abs(new Date(curr.dt * 1000).getTime() - targetTime);
      return currDiff < prevDiff ? curr : prev;
    });

    return {
      temperature: closestForecast.main.temp,
      description: closestForecast.weather[0].description,
      icon: closestForecast.weather[0].icon,
      precipitation: closestForecast.pop * 100 // Convert to percentage
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
  */
}