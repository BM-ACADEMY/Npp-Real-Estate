import { md, waLink } from '../lib/markup.js';
import { useSite } from '../lib/SiteContext.js';

export function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.5-.6a11 11 0 0 1-4.3-3.8c-.5-.7-.8-1.5-.8-2.2 0-.7.3-1.1.5-1.4.2-.2.4-.3.6-.3h.4c.2 0 .3 0 .5.4l.7 1.6c0 .2 0 .3-.1.4l-.3.4-.2.2c-.1.1-.2.2 0 .5.2.3.7 1.1 1.4 1.7.9.8 1.6 1 1.9 1.2.2.1.4 0 .5-.1l.6-.8c.2-.2.3-.2.5-.1l1.6.8c.2.1.4.2.4.3.1.1.1.5-.1 1.1Z" />
    </svg>
  );
}

/** Content text with [link](url) and **bold** support. */
export function Md({ as: Tag = 'p', text, ...rest }) {
  return <Tag {...rest} dangerouslySetInnerHTML={{ __html: md(text) }} />;
}

const BTN = { bloom: 'btn btn-bloom', wa: 'btn btn-wa', line: 'btn btn-line', light: 'btn btn-light', ghost: 'btn btn-ghost' };

/** A content button: go = "wa" | "tel" | external URL | site path. */
export function Action({ a, pos, full }) {
  const { site, waMsg } = useSite();
  const cls = BTN[a.style || 'bloom'] + (full ? ' btn-full' : '');
  if (a.go === 'wa') {
    return (
      <a className={cls} href={waLink(site.waNumber, a.msg || waMsg)} target="_blank" rel="noopener" data-pos={pos}>
        <WaIcon /> {a.label}
      </a>
    );
  }
  if (a.go === 'tel') return <a className={cls} href={`tel:${site.phone}`} data-pos={pos}>{a.label}</a>;
  if (/^https?:/.test(a.go)) return <a className={cls} href={a.go} target="_blank" rel="noopener">{a.label}</a>;
  return <a className={cls} href={a.go}>{a.label}</a>;
}
