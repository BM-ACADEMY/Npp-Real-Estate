/* Guided next step: on every service page a floating "next step" button takes the visitor to the enquiry form
   (or to the right page). It nudges after a few seconds / once they have read ~40%, but never moves the page by itself. */
import { useEffect, useRef, useState } from 'react';
import { track } from '../lib/analytics.js';

const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

function flash(el) {
  el.classList.add('npp-flash'); setTimeout(() => el.classList.remove('npp-flash'), 2200);
  const i = el.querySelector('input:not([type=hidden]):not([tabindex="-1"]),select,textarea');
  if (i) try { i.focus({ preventScroll: true }); } catch (e) {}
}
function inView(el) { const r = el.getBoundingClientRect(); return r.top < innerHeight * 0.8 && r.bottom > innerHeight * 0.2; }

export function GuideButton({ guide }) {
  const [ready, setReady] = useState(false); // rendered only in the browser, after the target is found
  const [hide, setHide] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [tip, setTip] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    if (!guide) return;
    const target = guide.target ? document.getElementById(guide.target) : null;
    if (guide.target && !target) return;
    targetRef.current = target;
    setReady(true);
    if (location.hash) {
      const arrived = document.getElementById(location.hash.slice(1));
      if (arrived) setTimeout(() => flash(arrived), 400);
    }
    let nudged = false, tipTimer;
    function nudge() {
      if (nudged) return; nudged = true; setPulse(true);
      if (!target || !inView(target)) { setTip(true); tipTimer = setTimeout(() => setTip(false), 6000); }
    }
    function update() {
      const h = (target && inView(target)) || !!document.querySelector('.npp-pop');
      setHide(h); if (h) setTip(false);
      const d = document.documentElement; if ((d.scrollTop + innerHeight) / d.scrollHeight > 0.4) nudge();
    }
    window.addEventListener('scroll', update, { passive: true });
    const t = setTimeout(nudge, 10000);
    update();
    return () => { window.removeEventListener('scroll', update); clearTimeout(t); clearTimeout(tipTimer); };
  }, [guide]);

  if (!ready) return null;

  function onClick(e) {
    track('guide_click', { label: guide.label });
    const target = targetRef.current;
    if (target) {
      e.preventDefault();
      const reduce = reduceMotion();
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      setTimeout(() => flash(target), reduce ? 0 : 500);
    }
  }

  return (
    <>
      <a className={'npp-guide' + (pulse ? ' npp-pulse' : '') + (hide ? ' npp-hide' : '')} data-pos="guide" href={guide.href || '#' + guide.target} onClick={onClick}>
        <span className="npp-guide-t">{guide.label}</span><span aria-hidden="true"> ↓</span>
      </a>
      <div className="npp-guide-tip" role="status" hidden={!tip}>Ready? Start here</div>
    </>
  );
}
