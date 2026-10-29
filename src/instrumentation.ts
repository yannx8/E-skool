// Runs once when the server starts: a missing or invalid variable stops it before any request.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getConfig } = await import("./config");
    getConfig();
  }
}
