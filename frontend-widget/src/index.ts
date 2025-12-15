import { ChatButton } from "./ui/chat-button";
import { ChatWindow } from "./ui/chat-window";
import { MessageRenderer } from "./ui/message-renderer";
import { ApiClient } from "./core/api-client";
import { SessionManager } from "./core/session-manager";
import "./styles/variables.css";
import "./styles/base.css";

const button = new ChatButton();
const windowWidget = new ChatWindow();

button.mount();
windowWidget.mount();

// Attach renderer to chat window
const containerEl = document.getElementById("ieb-chat-window")?.querySelector('.chat-messages') as HTMLElement | null;
if (containerEl) {
	const renderer = new MessageRenderer(containerEl);
	windowWidget.attachRenderer(renderer);
}

document.addEventListener("ieb-chat-open", async () => {
    windowWidget.hasOpenedManually = true;
    windowWidget.open();

    // 🔥 Solo cargar el mensaje inicial una vez
    if (!windowWidget.hasLoadedInitialMessage) {
        windowWidget.hasLoadedInitialMessage = true;

        const api = new ApiClient();
        const sm = new SessionManager();
        const sess = sm.getSessionData();

        try {
            // Limpiar cualquier residuo anterior antes de solicitar el mensaje inicial
            if (containerEl) {
                containerEl.innerHTML = "";
            }
            const res = await api.next({
                sessionId: sess.sessionId ?? null,
                visitorHash: sess.visitorHash,
                urlOrigen: "web-widget",
                userInput: null
            });

            if (res?.sessionId) sm.setSessionId(res.sessionId);

            windowWidget.renderBackendResponse(res);
        } catch {
            windowWidget.addBotMessage("Parece que hay problemas de conexión. Inténtalo de nuevo.");
        }
    }
});


// Auto-open after 45 seconds if not opened manually
setTimeout(() => {
	if (!windowWidget.hasOpenedManually) {
		dispatchEvent(new CustomEvent("ieb-chat-open"));
	}
}, 45000);

