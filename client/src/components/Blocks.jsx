import { Fragment } from 'react';
import { Action, Md } from './Basics.jsx';
import { EnquiryForm } from './EnquiryForm.jsx';

function Sec({ block }) {
  return (
    <>
      {block.h && <h2>{block.h}</h2>}
      {(block.paras || []).map((p, i) => <Md key={i} text={p} />)}
      {block.bullets && <ul className="list">{block.bullets.map((b, i) => <Md as="li" key={i} text={b} />)}</ul>}
      {block.cta && (
        <div className="cta-actions" style={{ marginTop: 22 }}>
          {block.cta.map((a, i) => <Action key={i} a={a} pos="section" />)}
        </div>
      )}
    </>
  );
}

function Door({ href, k, d, go }) {
  return (
    <a className="door" href={href}>
      <span className="k">{k}</span><span className="d">{d}</span><span className="go" aria-hidden="true">{go} &rarr;</span>
    </a>
  );
}

function Doors({ block }) {
  return (
    <>
      <h2>{block.h}</h2>
      <div className="doors">{block.items.map((d, i) => <Door key={i} href={d.go} k={d.k} d={d.d} go="Read more" />)}</div>
    </>
  );
}

function Stats({ block }) {
  return <dl className="stats">{block.items.map((s, i) => <div className="stat" key={i}><dt>{s.v}</dt><dd>{s.l}</dd></div>)}</dl>;
}

function Cta({ block }) {
  return (
    <div className={'cta' + (block.tone === 'deep' ? ' deep' : '')}>
      <h2>{block.h}</h2>
      {block.p && <Md text={block.p} />}
      <div className="cta-actions">{block.actions.map((a, i) => <Action key={i} a={a} pos="cta" />)}</div>
      {block.note && <p className="cta-note">{block.note}</p>}
    </div>
  );
}

function Steps({ block }) {
  return (
    <>
      <h2>{block.h}</h2>
      {block.intro && <Md text={block.intro} />}
      <ol className="steps">{block.items.map((s, i) => <li className="step" key={i}><h3>{s.h}</h3><Md text={s.d} /></li>)}</ol>
    </>
  );
}

function Table({ block }) {
  return (
    <>
      <h2>{block.h}</h2>
      {block.intro && <Md text={block.intro} />}
      <div className="tablewrap" tabIndex={0} role="region" aria-label={block.h}>
        <table>
          <thead><tr>{block.cols.map((c, i) => <th scope="col" key={i}>{c}</th>)}</tr></thead>
          <tbody>
            {block.rows.map((r, i) => (
              <tr key={i}><th scope="row">{r[0]}</th>{r.slice(1).map((c, j) => <td key={j}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      {block.after && <Md text={block.after} />}
    </>
  );
}

function Faq({ block }) {
  return (
    <>
      <h2>{block.h}</h2>
      <div className="faq">
        {block.items.map((q, i) => (
          <details key={i} open={i === 0}><summary>{q.q}</summary><div className="answer"><p>{q.a}</p></div></details>
        ))}
      </div>
    </>
  );
}

function Nearby({ block }) {
  if (!block.items.length) return null;
  return (
    <>
      <h2>{block.h}</h2>
      <ul className="nearby">{block.items.map((i) => <li key={i.go}><a className="chip" href={i.go}>{i.name}</a></li>)}</ul>
    </>
  );
}

function Articles({ block }) {
  return block.groups.map((g) => (
    <Fragment key={g.name}>
      <h2>{g.name}</h2>
      <div className="doors">{g.items.map((p) => <Door key={p.path} href={p.path} k={p.h1} d={p.description} go="Read the guide" />)}</div>
    </Fragment>
  ));
}

function Quotes({ block }) {
  if (!block.items || !block.items.length) return null; // never render placeholder testimonials
  return (
    <>
      <h2>{block.h || 'What our clients say'}</h2>
      <div className="quotes">
        {block.items.map((q, i) => (
          <figure className="quote" key={i}>
            <blockquote><p>{q.text}</p></blockquote>
            <figcaption>
              <span className="av" aria-hidden="true">{q.initials}</span>
              <span><b>{q.name}</b><span>{q.role}</span></span>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}

const BLOCKS = {
  sec: Sec, doors: Doors, stats: Stats, cta: Cta, steps: Steps, table: Table, faq: Faq,
  note: ({ block }) => <div className="note"><Md text={block.text} /></div>,
  nearby: Nearby, articles: Articles, quotes: Quotes,
  form: ({ block, page }) => <EnquiryForm block={block} page={page} />,
};

/** Blocks that render nothing are skipped entirely, so they do not take a section or flip the band. */
const isEmpty = (block) =>
  (block.type === 'nearby' && !block.items.length) ||
  (block.type === 'articles' && !block.groups.length) ||
  (block.type === 'quotes' && !(block.items && block.items.length));

function Trust({ block }) {
  return (
    <section className="trust" aria-label={block.label || 'Why owners work with us'}>
      <div className="wrap trust-grid">
        {block.items.map((t, i) => <div className="trust-item" key={i}><h2 className="trust-h">{t.h}</h2><p>{t.p}</p></div>)}
      </div>
    </section>
  );
}

function Hero({ page }) {
  return (
    <section className="hero">
      <div className={'wrap hero-grid' + (page.hasHeroArt ? '' : ' solo')}>
        <div>
          <p className="eyebrow">{page.eyebrow || page.crumb || ''}</p>
          <h1>{page.h1}</h1>
          {page.tamilLine && <p className="tamil-line" lang="ta">{page.tamilLine}</p>}
          <Md className="lead" text={page.lead} />
          {page.heroActions && page.heroActions.length > 0 && (
            <div className="hero-actions">{page.heroActions.map((a, i) => <Action key={i} a={a} pos="hero" />)}</div>
          )}
        </div>
        {page.hasHeroArt && (
          <div className="hero-art">
            <img src={`/images/${page.heroImage}`} width="800" height="600" alt={page.heroAlt || ''} fetchpriority="high" />
          </div>
        )}
      </div>
    </section>
  );
}

export function PageBody({ page }) {
  const sections = [];
  let band = false;
  page.blocks.forEach((block, i) => {
    if (block.type === 'trust') return sections.push(<Trust key={i} block={block} />);
    const Block = BLOCKS[block.type];
    if (!Block) throw new Error(`${page.path}: unknown block type "${block.type}"`);
    if (isEmpty(block)) return;
    const isBand = block.band !== undefined ? block.band : band;
    sections.push(
      <section key={i} className={'blk' + (isBand ? ' band' : '')} id={block.id || undefined}>
        <div className="wrap"><Block block={block} page={page} /></div>
      </section>
    );
    band = !isBand;
  });
  return <><Hero page={page} />{sections}</>;
}
