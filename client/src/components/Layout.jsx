import { waLink } from '../lib/markup.js';
import { useSite } from '../lib/SiteContext.js';
import { WaIcon } from './Basics.jsx';

export function Header({ navKey }) {
  const { site, waMsg } = useSite();
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="site-head">
        <div className="wrap head-in">
          <a className="logo" href="/">
            <span className="mark" aria-hidden="true"></span>
            <span><b>{site.name}</b><span>{site.tagline}</span></span>
          </a>
          <a className="btn btn-wa btn-sm head-cta" href={waLink(site.waNumber, waMsg)} target="_blank" rel="noopener" data-pos="header">
            <WaIcon /> {site.phoneDisplay}
          </a>
          <nav className="mainnav" aria-label="Main">
            <ul>
              {site.nav.map((n) => (
                <li key={n.key}><a href={n.href} aria-current={n.key === navKey ? 'page' : undefined}>{n.label}</a></li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}

export function Crumbs({ page }) {
  if (page.path === '/') return null;
  const c = page.crumbs;
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <div className="wrap">
        <ol>
          {c.map((x, i) =>
            i === c.length - 1 ? <li key={i} aria-current="page">{x.name}</li> : <li key={i}><a href={x.url}>{x.name}</a></li>
          )}
        </ol>
      </div>
    </nav>
  );
}

export function Footer() {
  const { site, waMsg } = useSite();
  const waHref = waLink(site.waNumber, waMsg);
  const navByKey = Object.fromEntries(site.nav.map((n) => [n.key, n]));
  const list = (keys) => keys.map((k) => <li key={k}><a href={navByKey[k].href}>{navByKey[k].label}</a></li>);
  return (
    <>
      <footer className="site-foot">
        <div className="wrap foot-in">
          <div className="foot-brand"><h2>{site.name}</h2><p>{site.footerBlurb}</p></div>
          <nav aria-label="Services"><h2>Services</h2><ul>{list(site.footerServices)}</ul></nav>
          <nav aria-label="For owners abroad"><h2>Owners abroad</h2><ul>{list(site.footerAbroad)}</ul></nav>
          <div>
            <h2>Talk to us</h2>
            <ul className="plain">
              <li><a href={waHref} target="_blank" rel="noopener" data-pos="footer">WhatsApp {site.phoneDisplay}</a></li>
              <li><a href={`tel:${site.phone}`} data-pos="footer">Call {site.phoneDisplay}</a></li>
              <li><a href={site.instagram} target="_blank" rel="noopener">{site.instagramHandle}</a></li>
              <li>{site.hours.label}</li>
            </ul>
          </div>
        </div>
        <div className="wrap foot-base">
          <p>
            &copy; 2026 {site.name}{site.tradingEntity ? `, part of ${site.tradingEntity}` : ''}. Looking for property listings? Visit{' '}
            <a href={site.plotOneUrl || '#'} rel="noopener">The Plot One</a>.
          </p>
        </div>
      </footer>
      <div className="mobilebar">
        <a className="btn btn-wa" href={waHref} target="_blank" rel="noopener" data-pos="mobile-bar"><WaIcon /> WhatsApp us</a>
        <a className="btn btn-ghost" href={`tel:${site.phone}`} data-pos="mobile-bar">Call</a>
      </div>
    </>
  );
}
