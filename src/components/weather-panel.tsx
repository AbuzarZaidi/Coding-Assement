"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/client";
import type { WeatherReport } from "@/lib/types";

const STORAGE_KEY = "field-notes-city";

export function WeatherPanel() {
  const [city, setCity] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [draft, setDraft] = useState("");
  const [report, setReport] = useState<WeatherReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)?.trim() || "Lahore";
    setCity(saved);
    setDraft(saved);
  }, []);

  useEffect(() => {
    if (!city) return;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await api<{ weather: WeatherReport }>(
          `/api/weather?city=${encodeURIComponent(city!)}`,
          { signal: controller.signal },
        );
        setReport(data.weather);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setReport(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load the forecast.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [city, reloadKey]);

  function search(event: FormEvent) {
    event.preventDefault();
    const next = draft.trim();
    if (!next) {
      setError("Enter a city name.");
      return;
    }
    localStorage.setItem(STORAGE_KEY, next);
    setCity(next);
    setReloadKey((current) => current + 1);
  }

  const place = report
    ? [report.city, report.region || report.country].filter(Boolean).join(", ")
    : city;

  return (
    <aside className="rounded-[1.25rem] bg-night p-5 text-[#f6efe2] shadow-[0_24px_50px_-36px_rgba(28,23,18,0.7)] sm:p-6">
      <p className="text-xs font-semibold tracking-[0.18em] text-[#e7c27a] uppercase">
        Weather
      </p>
      <h2 className="mt-2 font-serif text-2xl">{place || "Forecast"}</h2>

      <form onSubmit={search} className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="city">
          City
        </label>
        <input
          id="city"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="City"
          maxLength={80}
          className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm outline-none placeholder:text-white/40 focus:border-[#e7c27a]"
        />
        <button
          type="submit"
          className="rounded-full bg-[#e7c27a] px-4 py-2 text-sm font-semibold text-night"
        >
          Look up
        </button>
      </form>

      {loading ? (
        <div className="mt-6 space-y-3" aria-hidden="true">
          <div className="h-14 w-24 animate-pulse rounded-xl bg-white/10" />
          <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
          <div className="grid grid-cols-4 gap-2 pt-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-xl bg-white/10" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="mt-6">
          <p role="alert" className="text-sm leading-6 text-[#f0b4a8]">
            {error}
          </p>
          <button
            type="button"
            className="mt-3 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold"
            onClick={() => setReloadKey((current) => current + 1)}
          >
            Try again
          </button>
        </div>
      ) : report ? (
        <div className="mt-6">
          <p className="font-serif text-6xl leading-none tracking-tight">
            {report.current.temperature}
            <span className="text-3xl">°</span>
          </p>
          <p className="mt-2 text-sm text-white/75">
            {report.current.condition}. Feels like{" "}
            {report.current.apparentTemperature}°.
          </p>
          <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-white/50">Humidity</dt>
              <dd className="mt-1 font-semibold">{report.current.humidity}%</dd>
            </div>
            <div>
              <dt className="text-white/50">Wind</dt>
              <dd className="mt-1 font-semibold">{report.current.windSpeed} km/h</dd>
            </div>
            <div>
              <dt className="text-white/50">Today</dt>
              <dd className="mt-1 font-semibold">
                {report.daily[0]
                  ? `${report.daily[0].tempMax}° / ${report.daily[0].tempMin}°`
                  : "—"}
              </dd>
            </div>
          </dl>
          <ul className="mt-5 grid grid-cols-4 gap-2">
            {report.daily.map((day) => (
              <li
                key={day.date}
                className="rounded-xl bg-white/10 px-2 py-3 text-center"
              >
                <p className="text-xs text-white/55">{day.label}</p>
                <p className="mt-2 text-sm font-semibold">{day.tempMax}°</p>
                <p className="text-xs text-white/55">{day.condition}</p>
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-xl bg-[#243640] px-4 py-3 text-sm leading-6 text-[#f6efe2]">
            {report.outlook}
          </p>
          <p className="mt-4 text-xs text-white/45">
            Data by{" "}
            <a
              href={report.attributionUrl}
              className="underline decoration-white/30 underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              {report.source}
            </a>
          </p>
        </div>
      ) : null}
    </aside>
  );
}
