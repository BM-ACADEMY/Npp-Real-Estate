# Namma Pondy Properties website

| Folder    | What it is                                                                 |
| --------- | -------------------------------------------------------------------------- |
| `client/` | Frontend — React app. Page text lives in `client/content/*.json`.          |
| `server/` | Backend — receives enquiry forms, leads page at `/admin/leads`.            |
| `seo/`    | SEO targets the build is checked against.                                  |
| `docs/`   | Setup, user manual, SEO notes.                                             |

## Run it on your computer

First time only:

    cd client
    npm install
    cd ..

Every time:

    npm run dev

Then open **http://localhost:5173**. Press Ctrl+C to stop.

More detail (production build, environment variables, n8n): [docs/SETUP.md](docs/SETUP.md).
