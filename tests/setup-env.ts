// Loads .env.local into process.env for integration tests that need real
// Supabase credentials (service-role + anon keys). Uses Node's built-in
// process.loadEnvFile (Node 20.6+) instead of adding a dotenv dependency.
import { existsSync } from "node:fs";
import path from "node:path";

const envLocalPath = path.resolve(process.cwd(), ".env.local");

if (existsSync(envLocalPath)) {
  process.loadEnvFile(envLocalPath);
}
