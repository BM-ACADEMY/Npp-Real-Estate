import { hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
import { attribution, initAnalytics } from './lib/analytics.js';

// The page HTML is already rendered; React takes over using the same props it was rendered with.
const props = JSON.parse(document.getElementById('npp-data').textContent);
initAnalytics(props.npp);
attribution(); // remember UTM + referrer from the landing page for later enquiries
hydrateRoot(document.getElementById('root'), <App {...props} />);
