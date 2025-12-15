
import fs from "fs";
import path from "path";

const required = [
  "backend",
  "frontend-widget",
  "config",
  "docs",
  "db/migrations",
  "tools",
  "assets"
];

console.log("🔍 Checking repo structure...");

for (const dir of required) {
  if (!fs.existsSync(path.join(process.cwd(), dir))) {
    console.error("❌ Missing directory:", dir);
  } else {
    console.log("✓", dir);
  }
}

console.log("✓ Repo verification complete");


