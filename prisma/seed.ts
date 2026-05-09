import { runSeed } from "./seed/index";

runSeed().catch((error: unknown) => {
  console.error("[seed] Seed failed:", error);
  process.exit(1);
});
