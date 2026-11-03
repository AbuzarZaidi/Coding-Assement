import type { WeatherReport } from "@/lib/types";

type GeoResult = {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
};

type ForecastResponse = {
  timezone?: string;
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    weather_code?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: Array<number | null>;
  };
};

export function describeWeather(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  return "Changing";
}

export function outlookFor(condition: string, precipitation: number | null) {
  if (precipitation !== null && precipitation >= 60) {
    return "Rain is likely. Keep outdoor tasks flexible.";
  }
  if (precipitation !== null && precipitation >= 30) {
    return "Some chance of rain. Leave room to move anything that has to happen outside.";
  }
  if (condition === "Clear" || condition === "Partly cloudy") {
    return "A clear stretch. Good conditions for anything that needs to happen outside.";
  }
  if (condition === "Thunderstorm") {
    return "Storms in the forecast. Hold outdoor work until it passes.";
  }
  return `${condition} today. Check the afternoon before you commit to being outside.`;
}

export async function fetchWeather(city: string): Promise<WeatherReport> {
  const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geoUrl.searchParams.set("name", city);
  geoUrl.searchParams.set("count", "1");
  geoUrl.searchParams.set("language", "en");
  geoUrl.searchParams.set("format", "json");

  const geoResponse = await fetch(geoUrl, {
    signal: AbortSignal.timeout(8000),
  });
  if (!geoResponse.ok) {
    throw new Error("The location service did not respond.");
  }

  const geoJson = (await geoResponse.json()) as { results?: GeoResult[] };
  const place = geoJson.results?.[0];
  if (!place) {
    throw new Error(`No match for “${city}”. Try a larger nearby city.`);
  }

  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.searchParams.set("latitude", String(place.latitude));
  forecastUrl.searchParams.set("longitude", String(place.longitude));
  forecastUrl.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
  );
  forecastUrl.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  forecastUrl.searchParams.set("timezone", place.timezone || "auto");
  forecastUrl.searchParams.set("forecast_days", "4");

  const forecastResponse = await fetch(forecastUrl, {
    signal: AbortSignal.timeout(8000),
  });
  if (!forecastResponse.ok) {
    throw new Error("The forecast service did not respond.");
  }

  const forecast = (await forecastResponse.json()) as ForecastResponse;
  const current = forecast.current;
  if (
    current?.temperature_2m === undefined ||
    current.weather_code === undefined
  ) {
    throw new Error("The forecast did not include current conditions.");
  }

  const timezone = forecast.timezone || place.timezone || "UTC";
  const days = forecast.daily?.time ?? [];
  const daily = days.slice(0, 4).map((date, index) => {
    const code = forecast.daily?.weather_code?.[index] ?? 0;
    return {
      date,
      label: dayLabel(date, index, timezone),
      condition: describeWeather(code),
      tempMax: Math.round(forecast.daily?.temperature_2m_max?.[index] ?? 0),
      tempMin: Math.round(forecast.daily?.temperature_2m_min?.[index] ?? 0),
      precipitationProbability:
        forecast.daily?.precipitation_probability_max?.[index] ?? null,
    };
  });

  const condition = describeWeather(current.weather_code);
  const todayPrecip = daily[0]?.precipitationProbability ?? null;

  return {
    city: place.name,
    region: place.admin1 || "",
    country: place.country || "",
    timezone,
    current: {
      temperature: Math.round(current.temperature_2m),
      apparentTemperature: Math.round(
        current.apparent_temperature ?? current.temperature_2m,
      ),
      humidity: Math.round(current.relative_humidity_2m ?? 0),
      windSpeed: Math.round(current.wind_speed_10m ?? 0),
      condition,
    },
    daily,
    outlook: outlookFor(condition, todayPrecip),
    source: "Open-Meteo",
    attributionUrl: "https://open-meteo.com/",
  };
}

function dayLabel(date: string, index: number, timezone: string) {
  if (index === 0) return "Today";
  const parsed = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    timeZone: timezone,
  }).format(parsed);
}
