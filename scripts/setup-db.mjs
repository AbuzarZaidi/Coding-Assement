import { execSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";

if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  console.log("Created .env from .env.example");
}

try {
  execSync("docker info", { stdio: "ignore" });
} catch {
  console.error(
    "Docker is not running. Start Docker Desktop, then run npm run setup again.",
  );
  process.exit(1);
}

execSync("docker compose up -d", { stdio: "inherit" });

const deadline = Date.now() + 60_000;
let ready = false;
while (Date.now() < deadline) {
  try {
    execSync("docker compose exec -T db pg_isready -U fieldnotes -d fieldnotes", {
      stdio: "ignore",
    });
    ready = true;
    break;
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

if (!ready) {
  console.error("Postgres did not become ready in time.");
  process.exit(1);
}

execSync("npx prisma generate", { stdio: "inherit" });
execSync("npx prisma migrate deploy", { stdio: "inherit" });
execSync("node prisma/seed.js", { stdio: "inherit" });
