// Instrumentation hook - currently unused but kept for future observability
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }
}
