import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.deleteMany({});
  console.log(`Deleted ${result.count} user(s) and all related app data.`);
  console.log("Sign in again to start with a fresh profile.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
