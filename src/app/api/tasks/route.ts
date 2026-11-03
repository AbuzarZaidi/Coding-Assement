import { connection } from "next/server";
import { createTask, listTasks, parseTaskWrite } from "@/lib/tasks";

export async function GET() {
  await connection();
  try {
    const tasks = await listTasks();
    return Response.json({ tasks });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not load tasks." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body instanceof Response) return body;

  const parsed = parseTaskWrite(body, false);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const task = await createTask(parsed.data);
    return Response.json({ task }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not create the task." },
      { status: 500 },
    );
  }
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
}
