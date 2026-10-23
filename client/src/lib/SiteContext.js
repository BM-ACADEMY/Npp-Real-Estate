import { createContext, useContext } from 'react';

/** { site, waMsg } — site.json plus the page's default WhatsApp message. */
export const SiteContext = createContext(null);
export const useSite = () => useContext(SiteContext);
