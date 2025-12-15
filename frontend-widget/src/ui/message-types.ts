export interface BotMessage {
  role: "bot";
  text: string;
}

export interface UserMessage {
  role: "user";
  text: string;
}

export interface ChoiceOption {
  valor: string;
  texto: string;
}

export interface ChoiceMessage {
  role: "bot";
  type: "choice";
  text: string;
  options: ChoiceOption[];
}

export interface FormMessage {
  role: "bot";
  type: "form";
  text: string;
  fields: Array<{ campo: string; label: string; required: boolean }>;
}

export type ChatMessage =
  | BotMessage
  | UserMessage
  | ChoiceMessage
  | FormMessage;
