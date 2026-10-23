# Namma Pondy Properties website — User Manual (for the team)

## 1. What the website does
Every page ends in an enquiry. Visitors reach you in four ways: a form, the WhatsApp button, the Call button, or the small "Call me back" card that appears after about 30 seconds. All of them are tracked.

## 1a. How visitors are guided to the enquiry
On every service page a red "next step" button floats at the bottom of the screen (for example "Claim my free property check" on the Property Management page). It pulses after about 10 seconds, or once the visitor has read 40% of the page, then shows "Ready? Start here". Tapping it scrolls to the right form, highlights it and puts the cursor in the first box. It hides itself when the form is already on screen. The page never scrolls by itself, because that annoys visitors and Google. To change a page's button, edit its `guide` setting in client/content/pages/*.json (`label` for the words, `href` to send people to another page, or `false` to switch it off).

## 2. Where do leads land?  (check these in this order)
1. **Google Sheet → tab "Enquiries"**. One row per lead, newest at the bottom. This is your working list. Fill the Status, Owner, Next follow-up and Notes columns.
2. **Email alert**. Each new lead sends an email to the alert address with name, phone, page and a WhatsApp link.
3. **Leads page: `https://YOUR-SITE/admin/leads`** (asks for the admin username and password). Shows every lead, even if the Sheet was down. Red rows have not reached the Sheet yet; they retry every 5 minutes. "Download CSV" exports everything.
4. A copy is also kept by the website server itself (a file, or MongoDB if your developer switched it on).

A visitor only sees "Thank you" after the lead is saved **and** reaches the Sheet. If anything fails they are shown your WhatsApp number instead, so no lead is lost silently.

## 3. Daily routine (5 minutes)
- Open the Sheet. Call or WhatsApp every row whose Status is **New**, within office hours (promise on site: 2 working hours).
- Set Status to Contacted / Visit booked / Won / Lost. Write the next follow-up date.
- Open /admin/leads. If any red rows: tell the developer (usually the n8n login has expired).

## 4. What each form means
| Lead type (Form type) | Visitor asked for | Your action |
|---|---|---|
| requirement | to buy | share 2–3 verified options |
| document_check | free document check | WhatsApp them to send patta/EC/parent deed |
| valuation | valuation | book a site visit |
| property_check | free property check (NRI) | book the visit, send the walk-through video |
| video_call | video call | confirm a time in their time zone |
| project_enquiry | our layouts | send today's availability |
| partner_apply | agent/builder tie-up | invite to the office |
| shoot_booking | reel shoot | confirm a date |
| general_enquiry | contact form or popup | call back |

## 5. Changing text on the site (needs a developer or a careful editor)
All page text lives in `client/content/pages/*.json`. Change the words between the quotes, then run:
`cd client`, `npm run build:prod`, then `npm run verify`. Do not publish unless verify says **0 errors**.
- Phone, address, hours, entity name: `client/content/site.json`.
- Form fields and labels: `client/content/forms.json`.
- Adding a photo: put it in `client/public/images/` using the file name the page expects (for example `hero-pondicherry.jpg`, `og-home.jpg`); rebuild.
- Never delete the CTA blocks. The checker refuses a page with no enquiry form or CTA.

## 6. Go-live checklist (developer)
1. Set env vars (see docs/SETUP.md): SITE_ENV=production, N8N_WEBHOOK_URL, N8N_SECRET, ADMIN_USER, ADMIN_PASS, GA4_ID, META_PIXEL_ID.
2. Import n8n/enquiry-workflow.json; connect Google Sheet + Gmail; set alert email; activate.
3. Submit one real test form on every page; confirm the Sheet row, the email and /admin/leads.
4. Turn off staging noindex by building with SITE_ENV=production; submit the sitemap in Google Search Console.

## 7. If something looks wrong
| Symptom | Likely cause | Fix |
|---|---|---|
| Visitors see "could not send" | n8n down or login expired | reconnect Google in n8n; leads stay red in /admin/leads and re-send automatically |
| No email alerts | Gmail credential in n8n | reconnect |
| Page not found for an old link | missing redirect | add to REDIRECTS in server/app.js |

## Guides and area pages
/guides lists every article, grouped. To add one: copy a file in client/content/guides, set `article.order` and `article.group`, then in client/ run `npm run build` and `npm run verify`. Area pages are in client/content/pages/real-estate-*.json. See docs/FACT-CHECK.md.
