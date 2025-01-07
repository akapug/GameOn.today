import { OpenWeatherMap } from 'openweathermap-ts';
import fetch from 'node-fetch';

if (!process.env.OPENWEATHER_API_KEY) {
  throw new Error('OPENWEATHER_API_KEY environment variable is required');
}

const openWeather = new OpenWeatherMap({
  apiKey: process.env.OPENWEATHER_API_KEY || ''
});

export interface WeatherInfo {
  temperature: number;
  description: string;
  icon: string;
  precipitation: number;
}

async function getCoordinates(location: string) {
  try {
    const response = await fetch(
      `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${process.env.OPENWEATHER_API_KEY}`
    );
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Location not found');
    }

    return {
      lat: data[0].lat,
      lon: data[0].lon
    };
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    return null;
  }
}

export async function getWeatherForecast(location: string, date: Date) {
  try {
    const coordinates = await getCoordinates(location);
    if (!coordinates) {
      return null;
    }

    const forecast = await openWeather.getThreeHourForecastByGeoCoordinates(
      coordinates.lat,
      coordinates.lon
    );

    return forecast;
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}