# PC Pricewatch PH

A React static site that presents live PC-part price history from the public Pricewatch Google Sheet. It uses Vite for local development and production builds, and deploys to GitHub Pages with no API key, environment variables, or backend.

## What it includes

- Live data from the selected Google Sheet tab (`gid=2041302730`)
- Search, category filtering, price-drop filtering, and sorting
- Latest price, previous-reading change, tracked range, and sparklines
- A detail view with a full price-history chart and the 12 most recent records
- Responsive layouts, keyboard navigation, reduced-motion support, and clear load/error states

## Public-data method

The page loads the Google Visualization API endpoint as JSONP:

```text
https://docs.google.com/spreadsheets/d/SHEET_ID/gviz/tq?gid=SHEET_GID&tqx=out:json;responseHandler:CALLBACK
```

JSONP is used because the direct CSV response does not provide a permissive browser CORS header. The fixed Google-hosted callback allows a static GitHub Pages site to read the public sheet without a proxy. The sheet must remain publicly viewable.

The parser treats the first row as the timeline, rows with a name in column A and no price values as category headings, and rows with a name plus price values as products. Rows with a blank column A are ignored, which excludes the unlabeled archive area beneath the active list.

## Run locally

Use Node.js 20.19+ or 22.12+, then install dependencies and start Vite:

```bash
npm install
npm run dev
```

Use the local URL shown in the terminal.

## Deploy to GitHub Pages

1. Create a GitHub repository and add these files at its root.
2. Push the work through your normal feature branch and pull request flow.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, select **GitHub Actions** as the source.
5. Merge to `main` or `master`, or run **Deploy React site to GitHub Pages** manually from the Actions tab.

The included workflow installs dependencies, builds the Vite app, uploads `dist`, and deploys it. Vite uses a relative asset base, so the site works under a repository subpath such as `https://username.github.io/repository/`.

## Configuration

The spreadsheet ID and tab ID are constants at the top of `src/App.jsx`:

```js
const SHEET_ID = "1xrVw1CVMB9cK0v9qSZCasGQviQo1G_sYIpVrVccah20";
const SHEET_GID = "2041302730";
```

No secrets should be added: all values and source code published through GitHub Pages are public.

## Limitations

- The source sheet is the source of truth; this site does not edit or cache it.
- Google Sheets or network outages show a retryable error state.
- If the sheet is made private, direct loading will stop working.
- This parser intentionally ignores unlabeled archived rows below the active catalog.
