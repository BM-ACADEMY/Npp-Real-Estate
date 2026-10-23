const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Tiny inline markup: [text](url) and **bold**. Everything else is escaped text. Returns an HTML string. */
export const md = (s) =>
  esc(s)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
      const ext = /^https?:/.test(u);
      return `<a href="${u}"${ext ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

export const waLink = (waNumber, msg) => `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
