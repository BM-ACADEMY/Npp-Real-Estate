import { SiteContext } from './lib/SiteContext.js';
import { Crumbs, Footer, Header } from './components/Layout.jsx';
import { PageBody } from './components/Blocks.jsx';
import { GuideButton } from './components/GuideButton.jsx';
import { Popup } from './components/Popup.jsx';

/** One page of the site. Props come from scripts/site-data.js pageProps(). */
export default function App({ page, site, guide }) {
  return (
    <SiteContext.Provider value={{ site, waMsg: page.waMsg }}>
      <Header navKey={page.navKey} />
      <Crumbs page={page} />
      <main id="main">
        <article>
          <PageBody page={page} />
        </article>
      </main>
      <Footer />
      <GuideButton guide={guide} />
      <Popup />
    </SiteContext.Provider>
  );
}
