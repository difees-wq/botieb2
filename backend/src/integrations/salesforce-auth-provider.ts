import fetch from "node-fetch";
import { IntegrationError } from "../domain/errors";

export interface SalesforceAuthConfig {
  domain: string; // e.g. https://login.salesforce.com OR https://yourinstance.my.salesforce.com
  clientId: string;
  clientSecret: string;
  apiVersion: string; // e.g. v60.0
}

interface TokenCache {
  accessToken: string;
  issuedAt: number;
  expiresIn?: number; // seconds (Salesforce may or may not return this for client_credentials)
}

export class SalesforceAuthProvider {
  private cache: TokenCache | null = null;

  constructor(private readonly config: SalesforceAuthConfig) {}

  // Public getters to expose sanitized domain and API version.
  get domain(): string {
    return this.config.domain.replace(/\/$/, "");
  }

  get apiVersion(): string {
    return this.config.apiVersion;
  }

  private isValid(cache: TokenCache | null): boolean {
    if (!cache) return false;
    if (!cache.expiresIn) return true; // Without explicit expiry, assume valid until failure.
    const now = Date.now();
    return now < cache.issuedAt + (cache.expiresIn - 30) * 1000; // subtract 30s safety window
  }

  async getAccessToken(): Promise<string> {
    if (this.isValid(this.cache)) {
      return this.cache!.accessToken;
    }
    // Nuevo flujo: Refresh Token OAuth
    const refreshToken = process.env.SALESFORCE_REFRESH_TOKEN;
    if (!refreshToken) {
      throw new IntegrationError(
        "SALESFORCE_OAUTH_MISSING_REFRESH_TOKEN",
        "Missing SALESFORCE_REFRESH_TOKEN environment variable"
      );
    }

    const url = `${this.config.domain}/services/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: body.toString()
    });

    if (!res.ok) {
      throw new IntegrationError(
        "SALESFORCE_OAUTH_ERROR",
        `Refresh token error: ${res.status} ${res.statusText}`
      );
    }

    const json: any = await res.json();
    if (!json.access_token) {
      throw new IntegrationError("SALESFORCE_OAUTH_RESPONSE_INVALID", "Missing access_token in response");
    }

    this.cache = {
      accessToken: json.access_token,
      issuedAt: Date.now(),
      // Algunos responses pueden incluir expires_in; si no, se usará hasta que falle.
      expiresIn: json.expires_in ? Number(json.expires_in) : undefined
    };

    return this.cache.accessToken;
  }

  // Invalidate cached token to force refresh on next access.
  invalidateToken(): void {
    this.cache = null;
  }
}
