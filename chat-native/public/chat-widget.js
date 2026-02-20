/**
 * Chat Widget Guia Central
 * Parse JSON, render HTML seguro, botão Abrir formulário
 */
(function () {
  "use strict";

  const MAX_MESSAGE_LENGTH = 600;
  const INITIAL_MESSAGE =
    "Olá! Posso te ajudar a identificar a certidão correta e abrir o formulário no Guia Central.";

  function getApiBase() {
    if (typeof window.GC_CHAT_API_BASE === "string" && window.GC_CHAT_API_BASE) {
      return window.GC_CHAT_API_BASE.replace(/\/$/, "");
    }
    return window.location.origin;
  }

  function renderMessageHTML(raw) {
    const text = String(raw || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    let out = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/&lt;(strong|b|br|ul|li)(\s[^&]*)?&gt;/gi, "<$1$2>");
    out = out.replace(/&lt;\/(strong|b|ul|li)&gt;/gi, "</$1>");
    out = out.replace(/&lt;br\s*\/?&gt;/gi, "<br>");
    const div = document.createElement("div");
    div.innerHTML = out;
    const walk = (node) => {
      if (node.nodeType === 1) {
        const tag = node.tagName.toLowerCase();
        if (!["strong", "b", "br", "ul", "li"].includes(tag)) {
          const frag = document.createDocumentFragment();
          while (node.firstChild) frag.appendChild(node.firstChild);
          node.parentNode.replaceChild(frag, node);
          return;
        }
        [].slice.call(node.childNodes).forEach(walk);
      }
    };
    [].slice.call(div.childNodes).forEach(walk);
    return div.innerHTML;
  }

  function createWidget() {
    if (document.getElementById("gc-chat-root")) return;

    const root = document.createElement("div");
    root.id = "gc-chat-root";

    root.innerHTML = `
      <button id="gc-chat-toggle" type="button" aria-label="Abrir chat">Ajuda</button>
      <div id="gc-chat-box" class="gc-hidden">
        <div id="gc-chat-header">
          <h3>Assistente Guia Central</h3>
          <p>Atendimento automático</p>
        </div>
        <div id="gc-chat-messages"></div>
        <div id="gc-chat-input-area">
          <textarea id="gc-chat-input" placeholder="Digite sua mensagem..." rows="1"></textarea>
          <button id="gc-chat-send" type="button">Enviar</button>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    const toggle = document.getElementById("gc-chat-toggle");
    const box = document.getElementById("gc-chat-box");
    const messages = document.getElementById("gc-chat-messages");
    const input = document.getElementById("gc-chat-input");
    const sendBtn = document.getElementById("gc-chat-send");

    let isOpen = false;
    let isSending = false;

    function appendMessage(text, type, url) {
      const wrap = document.createElement("div");
      wrap.className = "gc-msg-wrap gc-msg-wrap-" + type;
      const div = document.createElement("div");
      div.className = "gc-msg gc-msg-" + type;
      if (type === "bot") {
        div.innerHTML = renderMessageHTML(text);
      } else {
        div.textContent = text;
      }
      wrap.appendChild(div);
      if (url) {
        const btn = document.createElement("a");
        btn.href = url;
        btn.target = "_blank";
        btn.rel = "noopener";
        btn.className = "gc-msg-btn";
        btn.textContent = "Abrir formulário";
        wrap.appendChild(btn);
      }
      messages.appendChild(wrap);
      messages.scrollTop = messages.scrollHeight;
    }

    function removeTyping() {
      const typing = messages.querySelector(".gc-msg-typing");
      if (typing) typing.remove();
    }

    function showTyping() {
      removeTyping();
      const div = document.createElement("div");
      div.className = "gc-msg gc-msg-typing";
      div.textContent = "digitando…";
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function addInitialMessage() {
      if (messages.children.length === 0) {
        appendMessage(INITIAL_MESSAGE, "bot");
      }
    }

    function sendMessage() {
      const text = (input.value || "").trim();
      if (!text || isSending) return;

      if (text.length > MAX_MESSAGE_LENGTH) {
        appendMessage("Resuma sua dúvida em uma frase, por favor.", "bot");
        return;
      }

      isSending = true;
      sendBtn.disabled = true;
      input.value = "";
      appendMessage(text, "user");
      showTyping();

      (async function () {
        try {
          const res = await fetch(getApiBase() + "/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text }),
          });
          const data = await res.json();
          removeTyping();
          const msg = data.msg || data.reply || "Não consegui responder agora. Tente novamente.";
          const url = data.url || null;
          appendMessage(msg, "bot", url);
        } catch (err) {
          removeTyping();
          appendMessage("Não consegui responder agora. Tente novamente.", "bot", null);
        } finally {
          isSending = false;
          sendBtn.disabled = false;
        }
      })();
    }

    function isMobile() {
      return window.matchMedia("(max-width: 480px)").matches;
    }

    function applyViewportHeight() {
      if (!isMobile() || !box || box.classList.contains("gc-hidden")) return;
      const vv = window.visualViewport;
      if (!vv) return;
      const keyboardOpen = vv.height < window.innerHeight - 150;
      const bottomOffset = keyboardOpen ? 24 : 80;
      const h = Math.min(520, vv.height - bottomOffset);
      box.style.height = h + "px";
      box.style.maxHeight = h + "px";
      if (keyboardOpen) {
        box.style.top = vv.offsetTop + 8 + "px";
        box.style.bottom = "auto";
        box.style.left = vv.offsetLeft + 8 + "px";
        box.style.width = (vv.width - 16) + "px";
        requestAnimationFrame(function () {
          messages.scrollTop = messages.scrollHeight;
        });
      } else {
        box.style.top = "";
        box.style.bottom = "";
        box.style.left = "";
        box.style.right = "";
        box.style.width = "";
      }
    }

    function onInputFocus() {
      if (!isMobile()) return;
      applyViewportHeight();
      requestAnimationFrame(function () {
        input.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
      setTimeout(applyViewportHeight, 350);
    }

    function onInputBlur() {
      if (!isMobile()) return;
      box.style.height = "";
      box.style.maxHeight = "";
      box.style.top = "";
      box.style.bottom = "";
      box.style.left = "";
      box.style.right = "";
      box.style.width = "";
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", applyViewportHeight);
      window.visualViewport.addEventListener("scroll", applyViewportHeight);
    }

    toggle.addEventListener("click", function () {
      isOpen = !isOpen;
      box.classList.toggle("gc-hidden", !isOpen);
      if (isOpen) {
        addInitialMessage();
        applyViewportHeight();
        input.focus();
      } else {
        onInputBlur();
      }
    });

    input.addEventListener("focus", onInputFocus);
    input.addEventListener("blur", onInputBlur);

    sendBtn.addEventListener("click", sendMessage);

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createWidget);
  } else {
    createWidget();
  }
})();
