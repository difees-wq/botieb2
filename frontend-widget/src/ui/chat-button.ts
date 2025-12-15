import logoIeb from '../assets/logo-IEB.png';


export class ChatButton {
  private el: HTMLButtonElement | null = null;
  private isOpen = false;

  mount(): void {
    if (this.el) return;
    const btn = document.createElement('button');
    btn.id = 'ieb-chat-button';
    btn.setAttribute('aria-label', 'Abrir chat IEB');
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      background: 'var(--ieb-blue)',
      color: 'var(--text-light)',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    } as CSSStyleDeclaration);

    // Logo placeholder
    const logo = document.createElement('img');
    logo.src = logoIeb;
    logo.alt = 'IEB';
    Object.assign(logo.style, {
      width: '60px',
      height: 'auto'
    } as CSSStyleDeclaration);
    btn.appendChild(logo);

    btn.addEventListener('click', () => this.toggle());
    document.body.appendChild(btn);
    this.el = btn;
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    const eventName = this.isOpen ? 'ieb-chat-open' : 'ieb-chat-close';
    document.dispatchEvent(new CustomEvent(eventName));
  }
}
