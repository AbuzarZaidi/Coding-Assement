const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.task.count();
  if (existing > 0) {
    console.log(`Seed skipped: ${existing} task(s) already in the database.`);
    return;
  }

  await prisma.task.createMany({
    data: [
      {
        title: "Send the revised estimate",
        notes: "Include the weather panel as its own line item.",
        completed: false,
      },
      {
        title: "Walk through the task API with curl",
        notes: "Cover GET, POST, PATCH, and DELETE.",
        completed: false,
      },
      {
        title: "Pick up the printed brief",
        notes: "",
        completed: true,
      },
    ],
  });

  console.log("Seeded 3 sample tasks.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
