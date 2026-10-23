import { renderToString } from 'react-dom/server';
import App from './App.jsx';

/** Renders one page to HTML. Used by the prerender build and the dev server. */
export function render(props) {
  return renderToString(<App {...props} />);
}
