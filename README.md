# Field Notes

A small task list. You can add a task, edit it, mark it done, and delete it. Tasks are stored in PostgreSQL. The page also shows the weather for a city, using the public [Open-Meteo](https://open-meteo.com/) API. No API key is needed.

Please check the screenshots in the `screenshots` folder as well. They show the running app on a desktop layout, including the task list and the edit form.

## Screenshots

Task list, with the weather panel:

![Task list and weather](screenshots/task-list.png)

Editing a task:

![Editing a task](screenshots/edit-task.png)

## Requirements

- Node.js 22 or newer
- Docker Desktop

## Setup

```bash
npm install
npm run setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run setup` starts Postgres, applies the migration, and inserts three sample tasks when the table is empty.

Postgres listens on port **5433**:

```
postgresql://fieldnotes:fieldnotes@localhost:5433/fieldnotes?schema=public
```

Port 5433 keeps this database off the usual 5432 port, in case Postgres is already installed on the machine.

If you want to use your own Postgres server, copy `.env.example` to `.env`, set `DATABASE_URL`, then run:

```bash
npx prisma migrate deploy
npm run db:seed
```

`npm run setup` creates `.env` from `.env.example` when `.env` is not there yet.

## Using the app

- Add a task. Notes are optional.
- Edit the title and the notes.
- Mark a task done, or open it again.
- Delete a task. The row asks you to confirm first.
- Filter the list: All, Open, or Done.
- Type a city and look up the weather.

## API

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/api/tasks` | List tasks. Open tasks come first. |
| `POST` | `/api/tasks` | Create a task |
| `GET` | `/api/tasks/:id` | Get one task |
| `PATCH` or `PUT` | `/api/tasks/:id` | Update the title, notes, and/or completed flag |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `GET` | `/api/weather?city=Lahore` | Current weather and a four-day forecast |

Create a task:

```bash
curl -s -X POST http://localhost:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Call the client","notes":"Confirm Friday"}'
```

Mark it done:

```bash
curl -s -X PATCH http://localhost:3000/api/tasks/TASK_ID \
  -H 'Content-Type: application/json' \
  -d '{"completed":true}'
```

Weather:

```bash
curl -s 'http://localhost:3000/api/weather?city=Lahore'
```

A bad request returns `400` and `{ "error": "..." }`. A missing task returns `404`.

## Database

The Prisma model is in `prisma/schema.prisma`:

```prisma
model Task {
  id        String   @id @default(cuid())
  title     String
  notes     String   @default("")
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

The migration in `prisma/migrations/20261103133000_init/migration.sql` creates this table:

```sql
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);
```

## Weather

`GET /api/weather` looks the city up, then requests the current conditions and four daily forecasts from Open-Meteo. The page shows a loading state, a message when the city cannot be found, and a retry when the request fails. Weather data is from [Open-Meteo](https://open-meteo.com/).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run setup` | Start Postgres, migrate, and seed |
| `npm run dev` | Start the app |
| `npm run db:up` | Start only the database container |
| `npm run db:seed` | Add sample tasks if the table is empty |
| `npm run build` | Production build |
