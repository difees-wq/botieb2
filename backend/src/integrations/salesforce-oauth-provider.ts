import { HttpClient } from "./http-client.js";
import { RetryPolicy } from "./retry-policy.js";
import { IntegrationError } from "../domain/errors.js";

export interface SalesforceOAuthConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  securityToken: string;
  loginUrl: string;
}

export interface SalesforceTokenResponse {
  access_token: string;
  instance_url: string;
  token_type: string;
  issued_at: string;
  signature: string;
}

export class SalesforceOAuthProvider {
  constructor(
    private readonly http: HttpClient,
    private readonly retry: RetryPolicy,
    private readonly config: SalesforceOAuthConfig
  ) {}

  async getToken(): Promise<SalesforceTokenResponse> {
    const payload = new URLSearchParams({
      grant_type: "password",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      username: this.config.username,
      password: `${this.config.password}${this.config.securityToken}`
    });

    const attempt = async () => {
      const response = await this.http.post(
        `${this.config.loginUrl}/services/oauth2/token`,
        payload.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          }
        }
      );

      if (!response.ok) {
        throw new IntegrationError(
          "SALESFORCE_OAUTH_ERROR",
          `OAuth failed: ${response.status} ${response.statusText}`
        );
      }

      return (await response.json()) as SalesforceTokenResponse;
    };

    return this.retry.execute(attempt);
  }
}

