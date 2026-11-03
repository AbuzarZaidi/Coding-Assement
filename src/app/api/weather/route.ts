import { NextRequest } from "next/server";
import { fetchWeather } from "@/lib/weather";

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city")?.trim() ?? "";
  if (!city) {
    return Response.json({ error: "Enter a city name." }, { status: 400 });
  }
  if (city.length > 80) {
    return Response.json(
      { error: "City name must be 80 characters or fewer." },
      { status: 400 },
    );
  }

  try {
    const weather = await fetchWeather(city);
    return Response.json({ weather });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load the forecast.";
    const status = message.startsWith("No match") ? 404 : 502;
    if (status === 502) console.error(error);
    return Response.json({ error: message }, { status });
  }
}
