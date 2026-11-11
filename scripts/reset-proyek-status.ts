import { prisma } from "../lib/prisma";
import { StatusProyek } from "@prisma/client";

async function main() {
  console.log("Mereset status proyek seed_proyek_001 ke TENDER_DIBUKA...");
  const proyek = await prisma.proyek.update({
    where: { id: "seed_proyek_001" },
    data: {
      status: StatusProyek.TENDER_DIBUKA,
      tenggatProposal: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`Berhasil! Status proyek '${proyek.judul}' (ID: ${proyek.id}) kini: ${proyek.status}`);
}

main()
  .catch((e) => {
    console.error("Gagal mereset status proyek:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

