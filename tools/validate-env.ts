
import "dotenv/config";

const required = [
  "DATABASE_URL",
  "SALESFORCE_CLIENT_ID",
  "SALESFORCE_CLIENT_SECRET",
  "SALESFORCE_USERNAME",
  "SALESFORCE_PASSWORD"
];

let ok = true;

for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing env: ${key}`);
    ok = false;
  }
}

if (!ok) process.exit(1);

console.log("✓ All env vars OK");

