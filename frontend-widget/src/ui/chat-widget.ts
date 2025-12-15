import { MessageRenderer } from "./message-renderer";
import { SessionManager } from "../core/session-manager";

export class ChatWidget {
  private container: HTMLElement;
  private messagesContainer: HTMLElement;
  private renderer: MessageRenderer;
  private session = new SessionManager();

  constructor() {
    // Crear contenedor principal
    this.container = document.createElement("div");
    this.container.id = "ieb-chat-widget";

    // Crear contenedor interno para mensajes
    this.messagesContainer = document.createElement("div");
    this.messagesContainer.className = "chat-messages";

    // Inicializar renderer con el contenedor correcto
    this.renderer = new MessageRenderer(this.messagesContainer);

    // Insertar messagesContainer dentro del widget
    this.container.appendChild(this.messagesContainer);
  }

  mount() {
    document.body.appendChild(this.container);

    // Ya no existe renderIntro().
    // Aquí NO dibujamos nada: el flujo empieza llamando /api/chat/next userInput=null 
    // desde index.ts (Fase 4).
  }
}


