(function () {
  const WELCOME = "Hi! I'm Matt's AI assistant. Ask me about his projects and skills, get advice on your own project idea, or tap **Work with Matthew** below to send him your project details directly.";
  const SUGGESTIONS = [
    { label: 'What projects has Matthew built?', action: 'message' },
    { label: 'What is his tech stack?', action: 'message' },
    { label: 'How can I contact him?', action: 'message' }
  ];
  const STORAGE_KEY = 'devfolio-chat-history';
  const MAX_HISTORY_MESSAGES = 20;

  let messages = loadMessages();
  let leadState = null;
  let isOpen = false;
  let isLoading = false;

  function buildWidget() {
    // Floating button
    const btn = document.createElement('button');
    btn.id = 'chat-btn';
    btn.setAttribute('aria-label', 'Open AI Assistant');
    btn.setAttribute('aria-controls', 'chat-panel');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = iconChat();
    btn.addEventListener('click', togglePanel);
    document.body.appendChild(btn);

    // Panel
    const panel = document.createElement('div');
    panel.id = 'chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'AI Assistant');
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `
      <div id="chat-header">
        <div class="avatar">${iconBot()}</div>
        <div class="info">
          <div class="name">Matt's AI Assistant</div>
          <div class="status">Powered by Gemini</div>
        </div>
        <button id="chat-clear" aria-label="Start new chat" title="Start new chat">${iconNewChat()}<span>New</span></button>
        <button id="chat-close" aria-label="Close AI Assistant" title="Close">${iconClose()}</button>
      </div>
      <div id="chat-messages" aria-label="Conversation"></div>
      <div id="chat-lead-bar">
        <button id="chat-lead-btn" type="button">${iconBriefcase()}<span>Work with Matthew</span></button>
      </div>
      <div id="chat-suggestions" aria-label="Suggested questions"></div>
      <div id="chat-status" class="chat-sr-only" aria-live="polite"></div>
      <div id="chat-input-row">
        <label for="chat-input" class="chat-sr-only">Message the AI Assistant</label>
        <textarea id="chat-input" placeholder="Ask about Matthew or his work…" rows="1" maxlength="2000"></textarea>
        <button id="chat-send" aria-label="Send">${iconSend()}</button>
      </div>
    `;
    document.body.appendChild(panel);

    panel.querySelector('#chat-clear').addEventListener('click', clearConversation);
    panel.querySelector('#chat-close').addEventListener('click', () => setPanelOpen(false));
    panel.querySelector('#chat-send').addEventListener('click', sendMessage);
    panel.querySelector('#chat-lead-btn').addEventListener('click', startLeadFlow);
    panel.querySelector('#chat-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    panel.querySelector('#chat-input').addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 80) + 'px';
    });
    document.addEventListener('keydown', handleGlobalKeydown);

    const suggestions = panel.querySelector('#chat-suggestions');
    SUGGESTIONS.forEach((suggestion) => {
      const button = document.createElement('button');
      button.className = 'chat-suggestion';
      button.type = 'button';
      button.textContent = suggestion.label;
      button.addEventListener('click', () => {
        if (suggestion.action === 'lead') {
          startLeadFlow();
          return;
        }
        const input = document.getElementById('chat-input');
        input.value = suggestion.label;
        sendMessage();
      });
      suggestions.appendChild(button);
    });

    appendMessage('ai', WELCOME);
    messages.forEach((message) => appendMessage(message.role, message.content));
    updateClearButton();
    updateSuggestions();
  }

  function loadMessages() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    try {
      const parsed = JSON.parse(stored);
      const isValid = Array.isArray(parsed)
        && parsed.length <= MAX_HISTORY_MESSAGES
        && parsed.length % 2 === 0
        && parsed.every((message, index) => (
          message
          && message.role === (index % 2 === 0 ? 'user' : 'ai')
          && typeof message.content === 'string'
          && message.content.length > 0
          && message.content.length <= 2000
        ));

      if (!isValid) {
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }

      return parsed;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }

  function saveMessages() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    updateClearButton();
    updateSuggestions();
  }

  function updateClearButton() {
    const clearButton = document.getElementById('chat-clear');
    if (clearButton) {
      clearButton.disabled = isLoading || messages.length === 0;
    }
  }

  function updateSuggestions() {
    const suggestions = document.getElementById('chat-suggestions');
    if (suggestions) {
      suggestions.hidden = messages.length > 0 || isLoading;
    }
  }

  function setStatus(message) {
    const status = document.getElementById('chat-status');
    if (status) status.textContent = message;
  }

  function clearConversation() {
    if (isLoading || messages.length === 0) return;
    if (!window.confirm('Start a new chat? Your saved conversation on this device will be cleared.')) return;

    messages = [];
    leadState = null;
    localStorage.removeItem(STORAGE_KEY);
    removeLeadControls();
    const container = document.getElementById('chat-messages');
    container.replaceChildren();
    appendMessage('ai', WELCOME);
    updateClearButton();
    updateSuggestions();
    setStatus('Started a new chat.');
    document.getElementById('chat-input')?.focus();
  }

  function togglePanel() {
    setPanelOpen(!isOpen);
  }

  function setPanelOpen(open) {
    isOpen = open;
    const panel = document.getElementById('chat-panel');
    const btn = document.getElementById('chat-btn');
    panel.classList.toggle('open', isOpen);
    panel.setAttribute('aria-hidden', String(!isOpen));
    btn.innerHTML = isOpen ? iconClose() : iconChat();
    btn.setAttribute('aria-label', isOpen ? 'Close AI Assistant' : 'Open AI Assistant');
    btn.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      setTimeout(() => document.getElementById('chat-input')?.focus(), 250);
    } else {
      btn.focus();
    }
  }

  function handleGlobalKeydown(event) {
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      setPanelOpen(false);
    }
  }

  function ensureMessageCapacity(additionalMessages) {
    while (messages.length + additionalMessages > MAX_HISTORY_MESSAGES && messages.length >= 2) {
      messages = messages.slice(2);
    }
  }

  /**
   * Lead capture flow — qualifies a project and emails it to Matthew via EmailJS
   */

  const LEAD_STEPS = {
    type: {
      kicker: 'Work with Matthew · Step 1 of 3',
      question: "Great! Let's get your project to Matthew. What do you need?",
      options: [
        ['Government or enterprise portal', 'A government or enterprise portal (registration, licensing, admin systems)'],
        ['Business website or web app', 'A business website or web application'],
        ['AI chatbot or integration', 'An AI chatbot or AI integration'],
        ['Something else', 'Something else']
      ]
    },
    timeline: {
      kicker: 'Work with Matthew · Step 2 of 3',
      question: 'When do you need it?',
      options: [
        ['As soon as possible', 'As soon as possible'],
        ['Within 1-3 months', 'Within 1 to 3 months'],
        ['Just exploring for now', 'Just exploring for now']
      ]
    }
  };

  function startLeadFlow() {
    if (isLoading || (leadState && leadState.step !== 'done')) return;

    removeLeadControls();
    leadState = { step: 'type', answers: {} };

    ensureMessageCapacity(2);
    const request = 'I want to work with Matthew on a project.';
    messages.push({ role: 'user', content: request });
    appendMessage('user', request, true);
    messages.push({ role: 'ai', content: LEAD_STEPS.type.question });
    const reveal = appendMessage('ai', LEAD_STEPS.type.question, true);
    saveMessages();

    reveal.then(() => {
      renderLeadControls();
      setStatus('Project inquiry started.');
    });
  }

  async function handleLeadOption(stepKey, shortLabel, fullLabel) {
    if (!leadState) return;
    removeLeadControls();
    leadState.answers[stepKey] = fullLabel;

    ensureMessageCapacity(2);
    messages.push({ role: 'user', content: shortLabel });
    appendMessage('user', shortLabel, true);

    if (stepKey === 'type') {
      leadState.step = 'timeline';
      messages.push({ role: 'ai', content: LEAD_STEPS.timeline.question });
      const reveal = appendMessage('ai', LEAD_STEPS.timeline.question, true);
      saveMessages();
      await reveal;
      renderLeadControls();
      return;
    }

    leadState.step = 'form';
    const ask = 'Almost done! Leave your name, email, and a short description, and Matthew will get back to you within 24 hours.';
    messages.push({ role: 'ai', content: ask });
    const reveal = appendMessage('ai', ask, true);
    saveMessages();
    await reveal;
    renderLeadControls();
  }

  function renderLeadControls() {
    removeLeadControls();
    if (!leadState || leadState.step === 'done') return;

    const container = document.getElementById('chat-messages');
    if (!container) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'chat-lead-controls';
    wrapper.className = 'chat-msg ai';
    const card = document.createElement('div');
    card.className = 'chat-lead-card';
    wrapper.appendChild(card);

    if (leadState.step === 'form') {
      renderLeadForm(card);
    } else {
      const step = LEAD_STEPS[leadState.step];
      const kicker = document.createElement('div');
      kicker.className = 'chat-lead-kicker';
      kicker.textContent = step.kicker;
      card.appendChild(kicker);

      const options = document.createElement('div');
      options.className = 'chat-lead-options';
      step.options.forEach(([short, full]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chat-lead-option';
        button.textContent = short;
        button.addEventListener('click', () => handleLeadOption(leadState.step, short, full));
        options.appendChild(button);
      });
      card.appendChild(options);
    }

    container.appendChild(wrapper);
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }

  function renderLeadForm(card) {
    const kicker = document.createElement('div');
    kicker.className = 'chat-lead-kicker';
    kicker.textContent = 'Work with Matthew · Step 3 of 3';
    card.appendChild(kicker);

    const form = document.createElement('form');
    form.className = 'chat-lead-form';
    form.innerHTML = `
      <input type="text" name="lead-name" placeholder="Your name" required minlength="2" maxlength="50">
      <input type="email" name="lead-email" placeholder="Your email" required>
      <textarea name="lead-details" placeholder="Briefly describe your project…" required minlength="10" maxlength="500" rows="3"></textarea>
      <button type="submit" class="chat-lead-submit">Send to Matthew</button>
    `;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitLead(form);
    });
    card.appendChild(form);
  }

  async function submitLead(form) {
    const submitButton = form.querySelector('.chat-lead-submit');
    const name = form.elements['lead-name'].value.trim();
    const email = form.elements['lead-email'].value.trim();
    const details = form.elements['lead-details'].value.trim();
    if (!name || !email || !details || !window.emailjs) {
      if (!window.emailjs) setStatus('Sending is unavailable right now. Please use the contact form below.');
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';

    const summary = [
      'New project lead from the portfolio chatbot:',
      `Project type: ${leadState.answers.type || 'Not specified'}`,
      `Timeline: ${leadState.answers.timeline || 'Not specified'}`,
      `Details: ${details}`
    ].join('\n');

    try {
      await emailjs.send('service_g6gseym', 'template_44d7bcl', {
        name,
        email,
        subject: 'New project lead (portfolio chatbot)',
        message: summary
      });

      leadState.step = 'done';
      removeLeadControls();
      ensureMessageCapacity(2);
      messages.push({ role: 'user', content: `Project details sent. (${name}, ${email})` });
      appendMessage('user', 'Project details sent ✔', true);
      const thanks = `**Thanks, ${name}!** Your project details are on their way to Matthew - he typically replies within 24 hours at the email you provided. Feel free to keep asking me anything in the meantime.`;
      messages.push({ role: 'ai', content: thanks });
      saveMessages();
      await appendMessage('ai', thanks, true);
      setStatus('Project details sent to Matthew.');
    } catch (error) {
      submitButton.disabled = false;
      submitButton.textContent = 'Send to Matthew';
      setStatus('Sending failed. Please try again.');
      console.error('Lead send error:', error);
    }
  }

  function removeLeadControls() {
    document.getElementById('chat-lead-controls')?.remove();
  }

  function appendMessage(role, text, animate = false) {
    const container = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    renderMessageContent(bubble, text);
    const shouldAnimate = animate
      && role === 'ai'
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealOperations = shouldAnimate ? prepareReveal(bubble) : null;
    msg.appendChild(bubble);
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;

    if (animate && role === 'user' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      msg.classList.add('chat-enter');
      msg.addEventListener('animationend', () => msg.classList.remove('chat-enter'), { once: true });
    }

    if (revealOperations) {
      return revealMessage(revealOperations, container);
    }

    return Promise.resolve();
  }

  function renderMessageContent(bubble, text) {
    const textNodes = [];
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    let list = null;
    let listType = null;

    lines.forEach((line) => {
      const dividerMatch = line.match(/^\s*(?:\*{3,}|-{3,}|_{3,})\s*$/);
      const headingMatch = line.match(/^\s*(#{1,3})\s+(.+)$/);
      const unorderedMatch = line.match(/^\s*[-*]\s+(.+)$/);
      const orderedMatch = line.match(/^\s*\d+\.\s+(.+)$/);

      if (dividerMatch) {
        list = null;
        listType = null;
        bubble.appendChild(document.createElement('hr'));
        return;
      }

      if (headingMatch) {
        list = null;
        listType = null;
        const level = Math.min(5, headingMatch[1].length + 2);
        const heading = document.createElement(`h${level}`);
        appendInlineFormatting(heading, headingMatch[2], textNodes);
        bubble.appendChild(heading);
        return;
      }

      if (unorderedMatch || orderedMatch) {
        const nextListType = orderedMatch ? 'ol' : 'ul';
        if (!list || listType !== nextListType) {
          list = document.createElement(nextListType);
          listType = nextListType;
          bubble.appendChild(list);
        }
        const item = document.createElement('li');
        appendInlineFormatting(item, (unorderedMatch || orderedMatch)[1], textNodes);
        list.appendChild(item);
        return;
      }

      list = null;
      listType = null;
      if (!line.trim()) return;

      const paragraph = document.createElement('p');
      appendInlineFormatting(paragraph, line, textNodes);
      bubble.appendChild(paragraph);
    });

    if (!bubble.childNodes.length) {
      appendTextNode(bubble, text, textNodes);
    }

    return textNodes;
  }

  function appendInlineFormatting(parent, text, textNodes) {
    const pattern = /(\*\*[^*]+\*\*|\*[^*\n]+\*)/g;
    let cursor = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > cursor) {
        appendTextNode(parent, text.slice(cursor, match.index), textNodes);
      }

      const marker = match[0];
      const formatted = document.createElement(marker.startsWith('**') ? 'strong' : 'em');
      const markerLength = marker.startsWith('**') ? 2 : 1;
      appendTextNode(formatted, marker.slice(markerLength, -markerLength), textNodes);
      parent.appendChild(formatted);
      cursor = match.index + marker.length;
    }

    if (cursor < text.length) {
      appendTextNode(parent, text.slice(cursor), textNodes);
    }
  }

  function appendTextNode(parent, text, textNodes) {
    const node = document.createTextNode(text);
    parent.appendChild(node);
    textNodes.push({ node, text });
  }

  function prepareReveal(bubble) {
    const operations = [];
    const sourceNodes = Array.from(bubble.childNodes);
    bubble.replaceChildren();

    sourceNodes.forEach((node) => queueRevealNode(node, bubble, operations));
    return operations;
  }

  function queueRevealNode(source, targetParent, operations) {
    if (source.nodeType === Node.TEXT_NODE) {
      source.textContent.split(/(\s+)/).forEach((text) => {
        if (!text) return;
        operations.push({
          type: /^\s+$/.test(text) ? 'whitespace' : 'token',
          parent: targetParent,
          text
        });
      });
      return;
    }

    if (source.nodeType !== Node.ELEMENT_NODE) return;

    const clone = source.cloneNode(false);
    operations.push({ type: 'structure', parent: targetParent, node: clone });
    Array.from(source.childNodes).forEach((child) => queueRevealNode(child, clone, operations));
  }

  function revealMessage(operations, container) {
    const tokenCount = operations.filter((operation) => operation.type === 'token').length;
    const stagger = Math.min(28, 3800 / Math.max(tokenCount - 1, 1));
    let operationIndex = 0;
    let lastAnimation = null;
    let lastScrollTime = 0;
    let autoFollow = true;

    const stopAutoFollow = () => {
      autoFollow = false;
    };
    container.addEventListener('wheel', stopAutoFollow, { passive: true });
    container.addEventListener('touchstart', stopAutoFollow, { passive: true });

    function followOutput(force = false) {
      if (!autoFollow) return;

      const now = performance.now();
      if (!force && now - lastScrollTime < 140) return;

      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      lastScrollTime = now;
    }

    return new Promise((resolve) => {
      function revealNext() {
        while (operationIndex < operations.length && operations[operationIndex].type !== 'token') {
          const operation = operations[operationIndex];
          if (operation.type === 'structure') {
            operation.parent.appendChild(operation.node);
          } else {
            operation.parent.appendChild(document.createTextNode(operation.text));
          }
          operationIndex += 1;
        }

        if (operationIndex >= operations.length) {
          followOutput(true);
          const completion = lastAnimation ? lastAnimation.finished : Promise.resolve();
          completion.then(() => {
            container.removeEventListener('wheel', stopAutoFollow);
            container.removeEventListener('touchstart', stopAutoFollow);
            resolve();
          });
          return;
        }

        const operation = operations[operationIndex];
        const token = document.createElement('span');
        token.className = 'chat-reveal-token';
        token.textContent = operation.text;
        operation.parent.appendChild(token);
        operationIndex += 1;

        lastAnimation = token.animate(
          [
            { opacity: 0, filter: 'blur(2px)', transform: 'translateY(2px)' },
            { opacity: 1, filter: 'blur(0)', transform: 'translateY(0)' }
          ],
          {
            duration: 460,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'forwards'
          }
        );

        followOutput();
        window.setTimeout(revealNext, stagger);
      }

      revealNext();
    });
  }

  function showTyping() {
    const container = document.getElementById('chat-messages');
    const el = document.createElement('div');
    el.className = 'chat-msg ai';
    el.id = 'chat-typing';
    el.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }

  function removeTyping() {
    document.getElementById('chat-typing')?.remove();
  }

  async function sendMessage() {
    if (isLoading) return;
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    if (leadState && leadState.step !== 'done') {
      leadState = null;
      removeLeadControls();
    }

    input.value = '';
    input.style.height = 'auto';

    ensureMessageCapacity(1);
    messages.push({ role: 'user', content: text });
    appendMessage('user', text, true);

    isLoading = true;
    document.getElementById('chat-send').disabled = true;
    document.getElementById('chat-messages').setAttribute('aria-busy', 'true');
    updateClearButton();
    updateSuggestions();
    setStatus('AI Assistant is preparing a response.');
    showTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });
      const data = await res.json();
      removeTyping();

      if (!res.ok || data.error) {
        const errorMessage = getErrorMessage(res.status);
        appendMessage('ai', errorMessage);
        messages.pop();
        saveMessages();
        setStatus(errorMessage);
      } else {
        messages.push({ role: 'ai', content: data.reply });
        saveMessages();
        await appendMessage('ai', data.reply, true);
        setStatus('Response complete.');
      }
    } catch {
      removeTyping();
      const errorMessage = 'I could not connect. Check your internet connection, then resend your message.';
      appendMessage('ai', errorMessage);
      messages.pop();
      saveMessages();
      setStatus(errorMessage);
    } finally {
      isLoading = false;
      document.getElementById('chat-send').disabled = false;
      document.getElementById('chat-messages').setAttribute('aria-busy', 'false');
      updateClearButton();
      updateSuggestions();
      document.getElementById('chat-input')?.focus();
    }
  }

  function getErrorMessage(status) {
    if (status === 400) return 'I could not send that message. Shorten it and try again.';
    if (status === 403) return 'Chat is unavailable on this page. Refresh the site and try again.';
    if (status === 429) return 'The assistant is receiving many requests. Wait a moment, then try again.';
    return 'The assistant is temporarily unavailable. Please try again in a moment.';
  }

  function iconChat() {
    return `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.83L3 20l1.1-3.3A7.93 7.93 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`;
  }
  function iconClose() {
    return `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`;
  }
  function iconNewChat() {
    return `<svg width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 20H5a2 2 0 01-2-2V7a2 2 0 012-2h7m5-3v6m-3-3h6M8 12h8M8 16h5"/></svg>`;
  }
  function iconBot() {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2z"/><path d="M19 2l.75 2.25L22 5l-2.25.75L19 8l-.75-2.25L16 5l2.25-.75L19 2z"/><path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z"/></svg>`;
  }
  function iconSend() {
    return `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>`;
  }
  function iconBriefcase() {
    return `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m-6 6h20"/></svg>`;
  }

  // Build the widget only after the page has fully loaded and the
  // preloader has faded, then pop the button in.
  function initWidget() {
    setTimeout(() => {
      buildWidget();
      document.getElementById('chat-btn').classList.add('chat-btn-enter');
    }, 1100);
  }

  if (document.readyState === 'complete') {
    initWidget();
  } else {
    window.addEventListener('load', initWidget);
  }
})();
