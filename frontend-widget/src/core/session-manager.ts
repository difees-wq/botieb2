type SessionData = {
  sessionId?: string;
  visitorHash: string;
  urlOrigen: string;
};

const KEY = 'ieb-chat-session';

export class SessionManager {
  getSessionData(): SessionData {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    const visitorHash = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const urlOrigen = window.location.origin;
    const data: SessionData = { visitorHash, urlOrigen };
    this.saveSessionData(data);
    return data;
  }

  saveSessionData(data: SessionData): void {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  setSessionId(sessionId: string): void {
    const current = this.getSessionData();
    current.sessionId = sessionId;
    this.saveSessionData(current);
  }

  clearSession(): void {
    // Reset sessionId and rotate visitorHash so backend treats as a new session
    const newVisitorHash = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const data: SessionData = {
      sessionId: undefined,
      visitorHash: newVisitorHash,
      urlOrigen: window.location.origin
    };
    this.saveSessionData(data);
  }
}

