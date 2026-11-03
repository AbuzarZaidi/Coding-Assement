import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Task, TaskWrite } from "@/lib/types";

const TITLE_MAX = 160;
const NOTES_MAX = 2000;

type ParseResult =
  | { ok: true; data: TaskWrite }
  | { ok: false; error: string };

export function parseTaskWrite(body: unknown, partial: boolean): ParseResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const input = body as Record<string, unknown>;
  const data: TaskWrite = {};
  const hasTitle = Object.prototype.hasOwnProperty.call(input, "title");
  const hasNotes = Object.prototype.hasOwnProperty.call(input, "notes");
  const hasCompleted = Object.prototype.hasOwnProperty.call(input, "completed");

  if (!partial || hasTitle) {
    if (typeof input.title !== "string") {
      return { ok: false, error: "Title is required." };
    }
    const title = input.title.trim();
    if (!title) {
      return { ok: false, error: "Title is required." };
    }
    if (title.length > TITLE_MAX) {
      return {
        ok: false,
        error: `Title must be ${TITLE_MAX} characters or fewer.`,
      };
    }
    data.title = title;
  }

  if (hasNotes) {
    if (input.notes !== null && typeof input.notes !== "string") {
      return { ok: false, error: "Notes must be a string." };
    }
    const notes = input.notes === null ? "" : input.notes.trim();
    if (notes.length > NOTES_MAX) {
      return {
        ok: false,
        error: `Notes must be ${NOTES_MAX} characters or fewer.`,
      };
    }
    data.notes = notes;
  }

  if (hasCompleted) {
    if (typeof input.completed !== "boolean") {
      return { ok: false, error: "Completed must be true or false." };
    }
    data.completed = input.completed;
  }

  if (partial && !hasTitle && !hasNotes && !hasCompleted) {
    return { ok: false, error: "Provide a title, notes, or completed flag." };
  }

  return { ok: true, data };
}

export function isNotFound(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

export async function listTasks(): Promise<Task[]> {
  const tasks = await prisma.task.findMany({
    orderBy: [{ completed: "asc" }, { updatedAt: "desc" }],
  });
  return tasks.map(serializeTask);
}

export async function createTask(data: TaskWrite): Promise<Task> {
  const task = await prisma.task.create({
    data: {
      title: data.title ?? "",
      notes: data.notes ?? "",
      completed: data.completed ?? false,
    },
  });
  return serializeTask(task);
}

export async function updateTask(id: string, data: TaskWrite): Promise<Task> {
  const task = await prisma.task.update({
    where: { id },
    data,
  });
  return serializeTask(task);
}

export async function deleteTask(id: string): Promise<void> {
  await prisma.task.delete({ where: { id } });
}

function serializeTask(task: {
  id: string;
  title: string;
  notes: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Task {
  return {
    id: task.id,
    title: task.title,
    notes: task.notes,
    completed: task.completed,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
