import dotenv from "dotenv";

dotenv.config();

export interface AppConfig {
  port: number;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
  allowedOrigins: string[];
  salesforce: {
    authUrl: string;
    apiBaseUrl: string;
    clientId: string;
    clientSecret: string;
    username: string;
    password: string;
    securityToken: string;
  };
}

export function loadAppConfig(): AppConfig {
  return {
    port: Number(process.env.PORT || 3001),

    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",

    allowedOrigins: (process.env.ALLOWED_ORIGINS || "*")
      .split(",")
      .map((x) => x.trim()),

    salesforce: {
      authUrl: process.env.SF_AUTH_URL || "",
      apiBaseUrl: process.env.SF_API_BASE_URL || "",
      clientId: process.env.SF_CLIENT_ID || "",
      clientSecret: process.env.SF_CLIENT_SECRET || "",
      username: process.env.SF_USERNAME || "",
      password: process.env.SF_PASSWORD || "",
      securityToken: process.env.SF_SECURITY_TOKEN || "",
    },
  };
}
