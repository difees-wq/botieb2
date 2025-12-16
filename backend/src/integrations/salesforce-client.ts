import { IntegrationError } from "../domain/errors.js";

interface SalesforceTokenResponse {
  access_token: string;
  token_type?: string;
  issued_at?: string;
  scope?: string;
  signature?: string;
}

export interface LeadPayload {
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  Company?: string;
  Curso__c: string;
  A_o_de_inter_s__c: string; // año como string (p.ej. "2026")
  Contactar_por__c: string;   // "Llamada" | "Whatsapp" | "Correo electrónico"
  LeadSource: "ChatWeb";
  Description: string;        // Debe comenzar con "info id del chatweb: <visitorHash> ..."
}

export class SalesforceClient {
  private readonly clientId = process.env.SALESFORCE_CLIENT_ID || "";
  private readonly clientSecret = process.env.SALESFORCE_CLIENT_SECRET || "";
  private readonly refreshToken = process.env.SALESFORCE_REFRESH_TOKEN || "";
  private readonly instanceUrl = process.env.SALESFORCE_INSTANCE_URL || "";
  private readonly apiVersion = process.env.SALESFORCE_API_VERSION || "v59.0";

  // Refresh token grant → devuelve access_token nuevo (no se persiste)
  private async refreshAccessToken(): Promise<string> {
    const url = "https://login.salesforce.com/services/oauth2/token";

    const params = new URLSearchParams();
    params.set("grant_type", "refresh_token");
    params.set("client_id", this.clientId);
    params.set("client_secret", this.clientSecret);
    params.set("refresh_token", this.refreshToken);

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new IntegrationError("SF_OAUTH_ERROR", `OAuth refresh failed (${resp.status}): ${text}`);
    }

    const json = (await resp.json()) as SalesforceTokenResponse;
    if (!json.access_token) {
      throw new IntegrationError("SF_OAUTH_NO_TOKEN", "OAuth response did not include access_token");
    }
    return json.access_token;
  }

  // Crea un Lead en Salesforce y devuelve su Id
  async createLead(leadPayload: LeadPayload): Promise<string> {
    const token = await this.refreshAccessToken();

    const url = `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/Lead/`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(leadPayload)
    });

    const bodyText = await resp.text();
    console.log("====== DEBUG SF RAW RESPONSE ======");
    console.log("[SF RAW]:", bodyText);
    console.log("===================================");
    let bodyJson: any = null;
    try { bodyJson = bodyText ? JSON.parse(bodyText) : null; } catch { /* leave as text */ }

    if (!resp.ok) {
      // Salesforce errors often return array: [{message, errorCode, fields}]
      if (Array.isArray(bodyJson)) {
        const details = bodyJson.map((e) => `${e.errorCode}: ${e.message}`).join("; ");
        throw new IntegrationError("SF_CREATE_LEAD_ERROR", details || `HTTP ${resp.status}`);
      }
      throw new IntegrationError("SF_CREATE_LEAD_ERROR", bodyText || `HTTP ${resp.status}`);
    }

    // Success example: { id: "00Q...", success: true, errors: [] }
    if (bodyJson && bodyJson.id) {
      return String(bodyJson.id);
    }

    throw new IntegrationError("SF_CREATE_LEAD_NO_ID", "Lead created but no id returned");
  }
}
