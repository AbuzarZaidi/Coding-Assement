import { TaskBoard } from "@/components/task-board";
import { WeatherPanel } from "@/components/weather-panel";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-8 flex flex-col gap-3 sm:mb-10">
        <p className="text-xs font-semibold tracking-[0.22em] text-stamp uppercase">
          Field Notes
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-serif text-4xl tracking-tight text-ink sm:text-5xl">
            Today&apos;s list
          </h1>
          <p className="max-w-sm text-sm leading-6 text-ink-soft">
            Add, edit, complete, and remove tasks. The forecast comes from
            Open-Meteo so the day is visible beside the work.
          </p>
        </div>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <TaskBoard />
        <WeatherPanel />
      </div>
    </div>
  );
}
