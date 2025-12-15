export interface ChatState {
  messages: Array<{ from: "bot" | "user"; text: string }>;
}

