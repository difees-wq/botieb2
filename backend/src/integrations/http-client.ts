
import fetch, { RequestInit } from "node-fetch";

export interface HttpClientConfig {
timeoutMs: number;
maxRetries: number;
retryDelayMs: number;
}

export class HttpClient {
constructor(private readonly cfg: HttpClientConfig) {}

private async delay(ms: number) {
return new Promise(res => setTimeout(res, ms));
}

async request(url: string, options: RequestInit, attempt = 1): Promise<any> {
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), this.cfg.timeoutMs);

try {
  const res = await fetch(url, {
    ...options,
    signal: controller.signal
  });

  clearTimeout(timer);

  if (!res.ok) {
    // 5xx = reintentos
    if (res.status >= 500 && attempt <= this.cfg.maxRetries) {
      await this.delay(this.cfg.retryDelayMs);
      return this.request(url, options, attempt + 1);
    }

    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return res.json();
} catch (err: any) {
  clearTimeout(timer);

  const transient =
    err.name === "AbortError" ||
    err.message.includes("ECONNRESET") ||
    err.message.includes("ETIMEDOUT");

  if (transient && attempt <= this.cfg.maxRetries) {
    await this.delay(this.cfg.retryDelayMs);
    return this.request(url, options, attempt + 1);
  }

  throw err;
}


}

  // Método auxiliar mínimo para compatibilidad con integraciones que esperan post()
  async post(url: string, body: any, opts: { headers?: Record<string, string> } = {}) {
    return fetch(url, {
      method: "POST",
      headers: opts.headers,
      body
    });
  }
}

