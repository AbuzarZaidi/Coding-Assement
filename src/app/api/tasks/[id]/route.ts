import {
  deleteTask,
  isNotFound,
  updateTask,
  parseTaskWrite,
} from "@/lib/tasks";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return Response.json({ error: "Task not found." }, { status: 404 });
  }
  return Response.json({
    task: {
      ...task,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    },
  });
}

async function update(request: Request, { params }: Context) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = parseTaskWrite(body, true);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const task = await updateTask(id, parsed.data);
    return Response.json({ task });
  } catch (error) {
    if (isNotFound(error)) {
      return Response.json({ error: "Task not found." }, { status: 404 });
    }
    console.error(error);
    return Response.json(
      { error: "Could not update the task." },
      { status: 500 },
    );
  }
}

export const PATCH = update;
export const PUT = update;

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  try {
    await deleteTask(id);
    return Response.json({ ok: true });
  } catch (error) {
    if (isNotFound(error)) {
      return Response.json({ error: "Task not found." }, { status: 404 });
    }
    console.error(error);
    return Response.json(
      { error: "Could not delete the task." },
      { status: 500 },
    );
  }
}
