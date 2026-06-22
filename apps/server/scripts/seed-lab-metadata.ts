import "dotenv/config";

import { prisma } from "../src/lib/prisma.js";
import { createLabRegistry } from "../src/services/lab-registry.js";
import { syncLabMetadataToDatabase } from "../src/services/lab-metadata-sync.js";

const labRegistry = createLabRegistry();

try {
  const labs = await labRegistry.listLabs();
  const result = await syncLabMetadataToDatabase(labs);

  console.log(
    `synced ${result.categories} categories, ${result.labs} labs, ${result.variants} variants`,
  );
} finally {
  await prisma.$disconnect();
}
