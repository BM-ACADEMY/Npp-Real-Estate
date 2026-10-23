# SEO plan review — website build vs NPP-SEO-Plan-Sep-Dec-2026.xlsx
Run `npm run seo-audit` in client/ any time: it compares every built page with the locked workbook (title, description, H1, schema, required internal links). Currently: **all 12 planned pages match exactly.**

## Technical SEO checklist (workbook tab) — status after this build
| # | Item | Status | Who does what is left |
|---|---|---|---|
| 1 | Server-side / pre-rendering | **Done.** Every page is plain HTML (works with JavaScript off) | — |
| 2 | 301 redirects from old platform URLs | **Done** in server/app.js (`/properties*`, `/post-requirement` → buy; `/post-property` → sell; `/business/agent`, `/business/builders-promoter` → partner; `/business/owner` → NRI) | Developer: test against the real list of old URLs from Search Console |
| 3 | Unique title, description, one H1 | **Done**, enforced by verify.js + seo-audit.js | — |
| 4 | Search Console + GA4 verified | Open | SEO: add the property, send the GA4 ID (GA4_ID env) |
| 5 | Sitemap + robots.txt | **Done**, generated on every build; production robots allows crawling, staging blocks it | SEO: submit sitemap |
| 6 | Schema (RealEstateAgent, Service, FAQPage, BreadcrumbList, Organization, Article) | **Done**, generated from the visible FAQ so it cannot drift | SEO: run Google Rich Results Test on staging |
| 7 | LocalBusiness with address + geo | **Done** (Contact page: address, postcode 605013, coordinates 11.9436453, 79.8185191, hours, photo) | SEO: confirm it passes the Rich Results Test |
| 8 | Core Web Vitals green on mobile | Built light: no framework, no images yet, ~15 KB of JS | Developer: run PageSpeed on staging after photos are added |
| 9 | WebP images + alt text | Waiting on photos | Designer: WebP, under 200 KB, descriptive alt text |
| 10 | GA4 conversion events | **Done in code**, all 12 events with the plan's parameters (names, phones and free text are never sent) | SEO: mark them as conversions in GA4 |
| 11 | Forms tagged by source page → CRM | **Done**: every row carries source page, URL, referrer, UTM | — |
| 12 | WhatsApp click tracking | **Done** on every WhatsApp button, with `button_position` | — |
| 13 | Canonical tags | **Done** | — |
| 14 | Tamil version of property management page | **Draft written**: client/content/pages/nri-property-management-pondicherry-ta.json (unpublished) | **A Tamil reader must review it**, then set `"published": true` |
| 15 | hreflang | **Done**; switches on automatically with the Tamil page | — |
| 16 | Breadcrumbs | **Done** (visible + schema) | — |
| 17 | Custom 404 | **Done**, noindex, routes to the main services, real 404 status | — |
| 18 | HTTPS / www / trailing slash | **Done** in server: set `CANONICAL_HOST=nammapondyproperties.com` | Developer: set it, check behind the host's proxy |
| 19 | Lazy-load embeds | No embeds on the site yet | Designer/dev: use `loading="lazy"` for any map or Instagram embed |
| 20 | Bing Webmaster | Open | SEO |

## GA4 tracking plan — implemented
requirement_submit (source_page, property_type, budget_band) · valuation_request (area, property_type) · property_check_request (country, property_type, rented_or_vacant) · video_call_request (country, timezone) · project_enquiry · partner_apply (area, years_experience) · shoot_booking (location) · whatsapp_click (button_position) · phone_click · document_check_request · faq_open (question) · scroll_75 (article_slug, articles only).
Extra events added for the new features: `general_enquiry` (contact form and popup), `popup_shown`, `guide_click`.
Events fire only after the server confirms the lead is saved, so counts match the Sheet.

## Things I changed to match the plan
- Reel Shoot description now says "Rs 4,500" and Kottakuppam description uses a colon, exactly as the workbook says.
- About now carries Organization schema; Contact carries LocalBusiness schema.
- Buyer form budget is now a dropdown of bands (needed for `budget_band`).

## Flags the owner should decide (found while reviewing)
1. **Phone mismatch.** The site (and its schema) now use **8220969669**. Google Business Profile still shows 094038 92971. Change the profile (and Instagram bio, JustDial, Sulekha, IndiaMART and every other listing) to 8220969669 so the number is identical everywhere. The old 8056889971 must be removed from all listings.
2. **Opening hours mismatch.** Google shows opening at 9:30 am; the site says 10 AM to 7 PM. Fix one or the other.
3. **GBP category.** Google shows "Property management company". The plan's primary is "Real estate agency", with Property management company and Real estate consultant as secondary.
4. **GBP address** has a stray colon ("First floor, : 78, Lenin St"). Fix it there so it matches the site.
5. **Instagram figures are old.** The site shows "13,000+" followers and views for 26 Jun to 25 Jul 2026. Google currently shows 12K+ for Instagram and 7.3K+ for Facebook. The plan's own rule: never publish a number you cannot show. Refresh from Insights before launch; verify.js warns until the date text changes. Note the Sell and Reel titles/descriptions also say 13K+/13,000+, so if the true number is below 13,000, the locked wording must change in the workbook first.
6. **Entity name** in the footer/About is now Afra Ventures Pvt Ltd. Confirm the GST wording before launch.

## Still to do (not part of the 13-page site)
- 9 more area guides (only Kottakuppam is built; the plan has 10) and 23 more articles (1 of 24 built: the guide).
- Keyword volumes in Google Keyword Planner (the workbook column is blank; the plan says confirm before finalising titles).
- GBP rebuild, reviews programme (20 genuine reviews), citations, backlinks: all SEO tasks, not code.
