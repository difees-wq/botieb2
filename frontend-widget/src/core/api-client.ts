export const API_BASE_URL = "http://localhost:3001";

export class ApiClient {
  async next(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/chat/next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error ${res.status}: ${text}`);
    }
    return res.json();
  }
}
