import { db, syncDevelopmentSchema, ensureDevEnvironment } from "../index";

async function main() {
  try {
    ensureDevEnvironment();
    await syncDevelopmentSchema();
    process.exit(0);
  } catch (error) {
    console.error('Schema sync failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
