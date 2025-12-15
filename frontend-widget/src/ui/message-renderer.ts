export class MessageRenderer {
  constructor(private readonly container: HTMLElement) {}

  renderBotMessage(text: string): void {
    const bubble = document.createElement('div');
    bubble.className = 'msg-bot';
    bubble.innerHTML = text;
    bubble.style.willChange = 'transform, opacity';
    this.container.appendChild(bubble);
    return bubble as any;
  }

  renderUserMessage(text: string): HTMLElement {
    const bubble = document.createElement('div');
    bubble.className = 'msg-user';
    bubble.textContent = text;
    bubble.style.willChange = 'transform, opacity';
    this.container.appendChild(bubble);
    return bubble;
  }

  renderChoiceMessage(options: Array<{ valor: string; texto: string }>): HTMLElement {
    const list = document.createElement('div');
    list.className = 'choice-list';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.type = 'button';
      btn.textContent = opt.texto;
      btn.setAttribute('data-value', opt.valor);
      list.appendChild(btn);
    });
    this.container.appendChild(list);
    return list;
  }

  renderFormMessage(text: string, fields: Array<{ campo: string; label: string; required: boolean; textarea?: boolean }>): HTMLElement {
    // Bot text
    const bubble = document.createElement('div');
    bubble.className = 'msg-bot';
    bubble.innerHTML = text;
    this.container.appendChild(bubble);

    // Simple form UI (no submit logic)
    const form = document.createElement('form');
    form.className = 'chat-form';
    fields.forEach(f => {
      const wrapper = document.createElement('div');
      wrapper.className = 'form-field';

      const label = document.createElement('label');
      label.textContent = f.label;

      // Create input or textarea depending on field configuration
      let inputEl: HTMLInputElement | HTMLTextAreaElement;
      if ((f as any).textarea === true) {
        const ta = document.createElement('textarea');
        ta.name = f.campo;
        ta.required = !!f.required;
        ta.rows = 3;
        ta.maxLength = 250;
        (ta.style as any).resize = 'vertical';
        // Ensure textarea uses the same class styling as inputs (inputs have no explicit class, so keep none)
        ta.className = '';
        inputEl = ta;
      } else {
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.name = f.campo;
        inp.required = !!f.required;
        inputEl = inp;
      }

      wrapper.appendChild(label);
      wrapper.appendChild(inputEl);
      form.appendChild(wrapper);
    });
    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'form-submit';
    submit.textContent = 'Enviar';
    form.appendChild(submit);

    this.container.appendChild(form);
    return form;
  }

  renderEndMessage(text: string): HTMLElement {
    const bubble = document.createElement('div');
    bubble.className = 'msg-bot';
    bubble.innerHTML = text;
    this.container.appendChild(bubble);
    return bubble;
  }

  scrollNodeToTop(el: HTMLElement): void {
    const parent = this.container;
    parent.scrollTop = el.offsetTop;
  }
}

