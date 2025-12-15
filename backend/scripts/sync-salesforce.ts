#!/usr/bin/env node
/**
 * Sync de valores de Study_Interest__c → Supabase lead_studies
 * Usando Global Value Set: ValuesStudiesInterest
 */

import "dotenv/config";
import { getDbPool } from "../src/config/db-connection";
import { SalesforceAuthProvider } from "../src/integrations/salesforce-auth-provider";
import { SalesforceService } from "../src/integrations/salesforce-service";

async function main() {
  const pool = getDbPool();

  const {
    SALESFORCE_DOMAIN,
    SALESFORCE_CLIENT_ID,
    SALESFORCE_CLIENT_SECRET,
    SALESFORCE_API_VERSION
  } = process.env;

  if (!SALESFORCE_DOMAIN || !SALESFORCE_CLIENT_ID || !SALESFORCE_CLIENT_SECRET) {
    console.error("[sync-lead-studies] ERROR: faltan credenciales en .env");
    process.exit(1);
  }

  const auth = new SalesforceAuthProvider({
    domain: SALESFORCE_DOMAIN,
    clientId: SALESFORCE_CLIENT_ID,
    clientSecret: SALESFORCE_CLIENT_SECRET,
    apiVersion: SALESFORCE_API_VERSION || "v60.0",
  });

  const sf = new SalesforceService(auth);

  console.log("[sync-lead-studies] Consultando picklist Study_Interest__c en Salesforce (Global Value Set)...");

  // ⚠️ Esto SÍ funciona con Global Value Set
  const soql = `
    SELECT Id, MasterLabel, IsActive
    FROM GlobalValueSetTranslation
    WHERE GlobalValueSet.DeveloperName = 'ValuesStudiesInterest'
  `;

  const records = await sf.query(soql);

  const values = records
    .filter((r: any) => r.IsActive)
    .map((r: any) => ({
      api_name: r.MasterLabel,
      label: r.MasterLabel
    }));

  console.log(`[sync-lead-studies] Valores activos encontrados: ${values.length}`);

  // Leer valores existentes
  const existingRes = await pool.query(`SELECT api_name FROM lead_studies`);
  const existing = new Set(existingRes.rows.map((x) => x.api_name));

  let inserted = 0;
  let updated = 0;

  for (const v of values) {
    const api = v.api_name;

    if (existing.has(api)) {
      await pool.query(
        `
        UPDATE lead_studies
        SET updated_at = now(), active = true, label = $2
        WHERE api_name = $1
        `,
        [api, v.label]
      );
      updated++;
    } else {
      await pool.query(
        `
        INSERT INTO lead_studies (api_name, label, active)
        VALUES ($1, $2, true)
        `,
        [api, v.label]
      );
      inserted++;
    }
  }

  console.log("=======================================================");
  console.log("[sync-lead-studies] RESULTADOS:");
  console.log(`Insertados: ${inserted}`);
  console.log(`Actualizados: ${updated}`);
  console.log(`Totales activos: ${values.length}`);
  console.log("=======================================================");

  await pool.end();
}

main().catch((err) => {
  console.error("[sync-lead-studies] ERROR inesperado", err);
  process.exit(1);
});
