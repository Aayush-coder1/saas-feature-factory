import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.agentEvent.create({
    data: {
      agentId: "seed",
      status: "seeded",
      featureId: "seed",
      messageType: "seed",
      payload: { message: "Database seeded successfully" },
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
