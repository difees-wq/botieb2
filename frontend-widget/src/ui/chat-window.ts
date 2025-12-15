import { ApiClient } from "../core/api-client";
import { SessionManager } from "../core/session-manager";
import logoIeb from '../assets/logo-ieb.png';


export class ChatWindow {
  private el: HTMLDivElement | null = null;
  public hasOpenedManually = false;
  public hasLoadedInitialMessage = false;
  private renderer: any = null;
  private messagesContainer: HTMLElement | null = null;
  private sending = false;
  private inactivityTimer: number | null = null;
  // moved to the top of the class; remove duplicate

  mount(): void {
    if (this.el) return;
    const container = document.createElement('div');
    container.id = 'ieb-chat-window';
    container.style.display = 'none';

    // Header
    const header = document.createElement('div');
    header.className = 'chat-header';

    const logo = document.createElement('img');
    logo.src = logoIeb;
    logo.alt = 'IEB';
    logo.style.height = '45px';

  // Actions container (minimize + close) aligned to the right
  const actions = document.createElement('div');
  actions.className = 'chat-header-actions';

  const minBtn = document.createElement('button');
  minBtn.type = 'button';
  minBtn.textContent = '–';
  minBtn.className = 'chat-minimize-btn';
  minBtn.addEventListener('click', () => this.minimize());

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = '✕';
  closeBtn.className = 'chat-close-btn';
  closeBtn.addEventListener('click', () => this.close());

  actions.appendChild(minBtn);
  actions.appendChild(closeBtn);

  header.appendChild(logo);
  header.appendChild(actions);

  // Messages container
  const messages = document.createElement('div');
  messages.className = 'chat-messages';
  this.messagesContainer = messages;

  container.appendChild(header);
  container.appendChild(messages);

    document.body.appendChild(container);
    this.el = container;
  }

  open(): void {
    if (!this.el) return;
    this.el.classList.add('open');
    this.el.style.display = 'block';
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = 0;
    }
    this.resetInactivityTimer();
  }

  close(): void {
    if (!this.el) return;
    this.el.classList.remove('open');
    this.el.style.display = 'none';
    this.clearInactivityTimer();
    if (this.messagesContainer) {
      this.messagesContainer.innerHTML = "";
    }
    // Limpiar sesión y reiniciar inicio para que empiece en N1 al reabrir
    const sm = new SessionManager();
    sm.clearSession();
    this.hasLoadedInitialMessage = false;
  }

  // Minimize should only hide, not clear session or timer
  minimize(): void {
    if (!this.el) return;
    this.el.classList.remove('open');
    this.el.style.display = 'none';
    // Do NOT clear inactivity timer or session
  }

  attachRenderer(renderer: any): void {
    this.renderer = renderer;
  }

  addBotMessage(text: string): void {
    if (!this.renderer || !this.messagesContainer) return;
    console.log('[DEBUG BOT MESSAGE]', text);
    this.renderer.renderBotMessage(text);
  }

  addUserMessage(text: string): void {
    if (!this.renderer || !this.messagesContainer) return;
    this.renderer.renderUserMessage(text);
  }

  addChoiceMessage(text: string, options: Array<{ valor: string; texto: string }>): void {
    if (!this.renderer || !this.messagesContainer) return;
    this.renderer.renderChoiceMessage(options);
  }

  addFormMessage(text: string, fields: Array<{ campo: string; label: string; required: boolean }>): void {
    if (!this.renderer || !this.messagesContainer) return;
    this.renderer.renderFormMessage(text, fields);
  }

  // Interaction handlers
  bindChoiceHandlers(): void {
  if (!this.el) return;

  const buttons = this.el.querySelectorAll('.choice-btn');
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      this.resetInactivityTimer();
      const value = btn.getAttribute("data-value");
      const label = btn.textContent?.trim() || "";
      this.addUserMessage(label);
      this.dispatchUserInput({ value });
    });
  });
}


  bindFormHandlers(): void {
    if (!this.el) return;
    const forms = this.el.querySelectorAll('.chat-form');
    const form = forms.length ? (forms[forms.length - 1] as HTMLFormElement) : null;
    if (!form) return;
    const submit = form.querySelector('.form-submit') as HTMLButtonElement | null;
    if (submit) {
      submit.onclick = () => {
        this.resetInactivityTimer();
        const fields: Record<string, string> = {};
        form.querySelectorAll('input').forEach((input) => {
          const el = input as HTMLInputElement;
          fields[el.name] = el.value || '';
        });
        form.querySelectorAll('textarea').forEach((textarea) => {
          const el = textarea as HTMLTextAreaElement;
          fields[el.name] = el.value || '';
        });
        // minimal validation example: email if present
        if ('email' in fields && !fields['email']) {
          this.addBotMessage('El email es requerido.');
          return;
        }

        // Comportamiento original: mostrar únicamente "Enviado"
        this.addUserMessage('Enviado');

        // Deshabilitar el formulario tras el envío
        form.querySelectorAll('input').forEach((input) => {
          (input as HTMLInputElement).setAttribute('disabled', 'true');
        });
        form.querySelectorAll('textarea').forEach((textarea) => {
          (textarea as HTMLTextAreaElement).setAttribute('disabled', 'true');
        });

        this.dispatchUserInput(fields);
      };
    }
  }

  private async dispatchUserInput(userInput: any): Promise<void> {
    if (this.sending) return; // avoid double send
    this.sending = true;
    this.resetInactivityTimer();
    try {
      const api = new ApiClient();
      const sm = new SessionManager();
      const sess = sm.getSessionData();
      const payload = {
        sessionId: sess.sessionId ?? null,
        visitorHash: sess.visitorHash,
        urlOrigen: 'web-widget',
        userInput
      };
      const res = await api.next(payload);
      if (res?.sessionId) sm.setSessionId(res.sessionId);
      this.renderBackendResponse(res);
    } catch (e) {
      this.addBotMessage('Parece que hay problemas de conexión. Inténtalo de nuevo.');
      console.error(e);
    } finally {
      this.sending = false;
    }
  }

  public renderBackendResponse(res: any): void {
    const type = res?.type;
    const text = res?.botMessage || '';
    const options = res?.options || [];
    // Ensure initial bot message (N0) is shown when backend requests it
    if (res.forceBotMessage) {
      this.addBotMessage(res.botMessage);
    }
    // Deshabilita botones anteriores para evitar clics fuera de contexto
    document.querySelectorAll('.choice-btn').forEach(btn => {
      (btn as HTMLButtonElement).setAttribute('disabled', 'true');
      btn.classList.add('disabled');
    });
    switch (type) {
      case 'message':
        {
          const el = this.renderer.renderBotMessage(text);
          this.renderer.scrollNodeToTop(el);
        }
        break;

      case 'choice':
        if (res.currentNodeId !== "N0") {
          this.addBotMessage(text);
        }
        {
          const el = this.renderer.renderChoiceMessage(options);
          this.bindChoiceHandlers();
          this.renderer.scrollNodeToTop(el);
        }
        break;

      case 'dynamic':
        if (res.currentNodeId !== "N0") {
          this.addBotMessage(text);
        }
        {
          const el = this.renderer.renderChoiceMessage(options);
          this.bindChoiceHandlers();
          this.renderer.scrollNodeToTop(el);
        }
        break;

      case 'form':
        {
          // No añadir addBotMessage: el renderer ya incluye la burbuja del bot
          const el = this.renderer.renderFormMessage(text, options);
          this.bindFormHandlers();
          this.renderer.scrollNodeToTop(el);
        }
        break;

      case 'end':
        {
          const el = this.renderer.renderEndMessage(text);
          this.renderer.scrollNodeToTop(el);
          this.endSessionForInactivity(false);
        }
        break;

      default:
        {
          const el = this.renderer.renderBotMessage(text);
          this.renderer.scrollNodeToTop(el);
        }
    }
  }
  private readonly INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

  private resetInactivityTimer(): void {
    this.clearInactivityTimer();
    // Use window.setTimeout to get a numeric id compatible with TypeScript DOM lib
    this.inactivityTimer = window.setTimeout(() => {
      this.endSessionForInactivity(true);
    }, this.INACTIVITY_LIMIT_MS);
  }

  private clearInactivityTimer(): void {
    if (this.inactivityTimer !== null) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  private endSessionForInactivity(triggeredByTimer: boolean): void {
    // Clear timer regardless
    this.clearInactivityTimer();
    // Clear session data so a new conversation starts next time
    const sm = new SessionManager();
    sm.clearSession();
    // Close the window to indicate end of session
    this.close();
  }
}
