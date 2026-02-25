const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const campaigns = await prisma.campaign.findMany({ take: 1 });
  if (campaigns.length === 0) {
    console.log("No campaigns found.");
    return;
  }
  const id = campaigns[0].id;
  try {
    await prisma.campaign.delete({ where: { id } });
    console.log("Successfully deleted.");
  } catch (e) {
    console.error("Error deleting:", e);
  }
}

main().finally(() => prisma.$disconnect());
