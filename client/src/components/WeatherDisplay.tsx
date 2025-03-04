import { Cloud, CloudRain, Sun, ThermometerSun } from "lucide-react";

interface WeatherInfo {
  temperature: number;
  description: string;
  icon: string;
  precipitation: number;
  resolvedLocation?: string;
}

interface WeatherDisplayProps {
  weather: WeatherInfo;
  className?: string;
}

export default function WeatherDisplay({ weather, className = "" }: WeatherDisplayProps) {
  const getWeatherIcon = (iconCode?: string) => {
    if (!iconCode) return null;
    // Map OpenWeather icon codes to Lucide icons
    if (iconCode.includes('01')) return <Sun className="h-4 w-4" />;
    if (iconCode.includes('02') || iconCode.includes('03') || iconCode.includes('04')) 
      return <Cloud className="h-4 w-4" />;
    if (iconCode.includes('09') || iconCode.includes('10') || iconCode.includes('11')) 
      return <CloudRain className="h-4 w-4" />;
    return <ThermometerSun className="h-4 w-4" />;
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {getWeatherIcon(weather.icon)}
      <span>{Math.round(weather.temperature)}°F</span>
      {weather.resolvedLocation && (
        <span className="text-xs text-muted-foreground ml-1">
          ({weather.resolvedLocation})
        </span>
      )}
      {weather.precipitation > 0 && (
        <span className="text-muted-foreground">
          ({Math.round(weather.precipitation)}% chance of rain)
        </span>
      )}
    </div>
  );
}
