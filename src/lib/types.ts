export type Task = {
  id: string;
  title: string;
  notes: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TaskWrite = {
  title?: string;
  notes?: string;
  completed?: boolean;
};

export type WeatherDay = {
  date: string;
  label: string;
  condition: string;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number | null;
};

export type WeatherReport = {
  city: string;
  region: string;
  country: string;
  timezone: string;
  current: {
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
    condition: string;
  };
  daily: WeatherDay[];
  outlook: string;
  source: "Open-Meteo";
  attributionUrl: string;
};
