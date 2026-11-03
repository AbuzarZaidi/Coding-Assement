"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/client";
import type { Task } from "@/lib/types";

type Filter = "all" | "open" | "done";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "done", label: "Done" },
];

export function TaskBoard() {
  const titleId = useId();
  const notesId = useId();
  const editTitleRef = useRef<HTMLInputElement>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function load(signal?: AbortSignal) {
    setLoadError("");
    try {
      const data = await api<{ tasks: Task[] }>("/api/tasks", { signal });
      setTasks(data.tasks);
    } catch (error) {
      if (signal?.aborted) return;
      setLoadError(
        error instanceof Error ? error.message : "Could not load tasks.",
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (editingId) editTitleRef.current?.focus();
  }, [editingId]);

  const openCount = tasks.filter((task) => !task.completed).length;
  const doneCount = tasks.length - openCount;
  const visible = tasks.filter((task) => {
    if (filter === "open") return !task.completed;
    if (filter === "done") return task.completed;
    return true;
  });

  async function addTask(event: FormEvent) {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) {
      setFormError("Title is required.");
      return;
    }

    setAdding(true);
    setFormError("");
    setActionError("");
    try {
      const data = await api<{ task: Task }>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title: nextTitle, notes: notes.trim() }),
      });
      setTasks((current) => placeTask(current.filter((task) => task.id !== data.task.id), data.task));
      setTitle("");
      setNotes("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not add the task.");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditNotes(task.notes);
    setConfirmDeleteId(null);
    setActionError("");
  }

  async function saveEdit(taskId: string) {
    const nextTitle = editTitle.trim();
    if (!nextTitle) {
      setActionError("Title is required.");
      return;
    }

    setSavingId(taskId);
    setActionError("");
    try {
      const data = await api<{ task: Task }>(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: nextTitle, notes: editNotes.trim() }),
      });
      setTasks((current) =>
        placeTask(
          current.filter((task) => task.id !== data.task.id),
          data.task,
        ),
      );
      setEditingId(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not save the task.");
    } finally {
      setSavingId(null);
    }
  }

  async function toggleTask(task: Task) {
    const previous = tasks;
    const nextCompleted = !task.completed;
    setTasks((current) =>
      placeTask(
        current.filter((item) => item.id !== task.id),
        { ...task, completed: nextCompleted },
      ),
    );
    setActionError("");
    try {
      const data = await api<{ task: Task }>(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: nextCompleted }),
      });
      setTasks((current) =>
        placeTask(
          current.filter((item) => item.id !== data.task.id),
          data.task,
        ),
      );
    } catch (error) {
      setTasks(previous);
      setActionError(error instanceof Error ? error.message : "Could not update the task.");
    }
  }

  async function removeTask(taskId: string) {
    setSavingId(taskId);
    setActionError("");
    try {
      await api<{ ok: boolean }>(`/api/tasks/${taskId}`, { method: "DELETE" });
      setTasks((current) => current.filter((task) => task.id !== taskId));
      setConfirmDeleteId(null);
      if (editingId === taskId) setEditingId(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not delete the task.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="panel" aria-labelledby="task-heading">
      <div className="border-b border-line px-5 py-5 sm:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 id="task-heading" className="font-serif text-2xl text-ink">
              Tasks
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {loading
                ? "Loading the list…"
                : `${openCount} open · ${doneCount} done`}
            </p>
          </div>
        </div>

        <form onSubmit={addTask} className="grid gap-3">
          <div className="grid gap-1.5">
            <label htmlFor={titleId} className="text-sm font-medium text-ink">
              Task
            </label>
            <input
              id={titleId}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={160}
              placeholder="What needs doing?"
              className="field"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor={notesId} className="text-sm font-medium text-ink">
              Notes <span className="font-normal text-ink-soft">optional</span>
            </label>
            <textarea
              id={notesId}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={2000}
              rows={2}
              placeholder="A detail you will want later"
              className="field resize-y"
            />
          </div>
          {formError ? (
            <p role="alert" className="text-sm text-stamp">
              {formError}
            </p>
          ) : null}
          <div>
            <button type="submit" className="btn-primary" disabled={adding}>
              {adding ? "Adding…" : "Add task"}
            </button>
          </div>
        </form>
      </div>

      <div className="flex flex-wrap gap-2 px-5 py-4 sm:px-6">
        {filters.map((item) => {
          const count =
            item.id === "open"
              ? openCount
              : item.id === "done"
                ? doneCount
                : tasks.length;
          const selected = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setFilter(item.id)}
              className={selected ? "chip chip-on" : "chip"}
            >
              {item.label}
              <span className="tabular-nums text-ink-soft">{count}</span>
            </button>
          );
        })}
      </div>

      {actionError ? (
        <p role="alert" className="px-5 pb-2 text-sm text-stamp sm:px-6">
          {actionError}
        </p>
      ) : null}

      {loading ? (
        <ul className="divide-y divide-line border-t border-line" aria-hidden="true">
          {[0, 1, 2].map((item) => (
            <li key={item} className="px-5 py-4 sm:px-6">
              <div className="h-4 w-2/3 animate-pulse rounded bg-line" />
              <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-line/70" />
            </li>
          ))}
        </ul>
      ) : loadError ? (
        <div className="border-t border-line px-5 py-8 sm:px-6">
          <p role="alert" className="text-sm text-stamp">
            {loadError}
          </p>
          <button
            type="button"
            className="btn-ghost mt-3"
            onClick={() => {
              setLoading(true);
              void load();
            }}
          >
            Try again
          </button>
        </div>
      ) : visible.length === 0 ? (
        <p className="border-t border-line px-5 py-10 text-sm leading-6 text-ink-soft sm:px-6">
          {emptyCopy(filter, tasks.length)}
        </p>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {visible.map((task) => {
            const editing = editingId === task.id;
            const busy = savingId === task.id;
            return (
              <li key={task.id} className="px-5 py-4 sm:px-6">
                {editing ? (
                  <form
                    className="grid gap-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void saveEdit(task.id);
                    }}
                  >
                    <label className="grid gap-1.5 text-sm font-medium">
                      Task
                      <input
                        ref={editTitleRef}
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        maxLength={160}
                        className="field font-normal"
                        onKeyDown={(event) => {
                          if (event.key === "Escape") setEditingId(null);
                        }}
                      />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                      Notes
                      <textarea
                        value={editNotes}
                        onChange={(event) => setEditNotes(event.target.value)}
                        maxLength={2000}
                        rows={2}
                        className="field resize-y font-normal"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button type="submit" className="btn-primary" disabled={busy}>
                        {busy ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => setEditingId(null)}
                        disabled={busy}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={task.completed}
                      aria-label={
                        task.completed
                          ? `Mark “${task.title}” as open`
                          : `Mark “${task.title}” as completed`
                      }
                      onClick={() => void toggleTask(task)}
                      className={
                        task.completed
                          ? "check check-on"
                          : "check"
                      }
                    >
                      {task.completed ? (
                        <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
                          <path
                            d="M3.2 8.3 6.4 11.4 12.8 4.6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <p
                          className={
                            task.completed
                              ? "text-ink-soft line-through decoration-ink-soft/70"
                              : "text-ink"
                          }
                        >
                          {task.title}
                        </p>
                        <time
                          dateTime={task.createdAt}
                          className="text-xs text-ink-soft"
                        >
                          {formatAdded(task.createdAt)}
                        </time>
                      </div>
                      {task.notes ? (
                        <p className="mt-1 text-sm leading-6 text-ink-soft">
                          {task.notes}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {confirmDeleteId === task.id ? (
                          <>
                            <span className="self-center text-sm text-ink">
                              Delete this task?
                            </span>
                            <button
                              type="button"
                              className="btn-danger"
                              disabled={busy}
                              onClick={() => void removeTask(task.id)}
                            >
                              {busy ? "Deleting…" : "Delete"}
                            </button>
                            <button
                              type="button"
                              className="btn-ghost"
                              disabled={busy}
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Keep
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => startEdit(task)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => {
                                setConfirmDeleteId(task.id);
                                setEditingId(null);
                              }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function placeTask(tasks: Task[], task: Task) {
  const open = tasks.filter((item) => !item.completed);
  const done = tasks.filter((item) => item.completed);
  if (task.completed) done.unshift(task);
  else open.unshift(task);
  return [...open, ...done];
}

function emptyCopy(filter: Filter, total: number) {
  if (total === 0) return "Nothing on the list yet. Add the first task above.";
  if (filter === "open") return "Everything open is finished.";
  if (filter === "done") return "No completed tasks yet.";
  return "Nothing on the list yet.";
}

function formatAdded(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}
