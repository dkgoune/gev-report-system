import { runSeedClean } from "./seed/clean";

runSeedClean().catch((error: unknown) => {
  console.error("[seed:clean] Seed failed:", error);
  process.exit(1);
});
