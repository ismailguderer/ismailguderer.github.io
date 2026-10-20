# Personal CV website

Astro site, deployed to GitHub Pages. All content is in one file: `src/data/cv.yaml`.

## Edit content

1. Open `src/data/cv.yaml` and edit the entries.
2. Commit and push to `main`. GitHub Actions rebuilds and publishes the site in about a minute.

A missing or wrongly typed field fails the build with a message naming the field, so nothing disappears silently.

## Run locally

Requires Node 22.22 or newer.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # production build into dist/
```

## First deploy

1. Create a public repo named `<username>.github.io`.
2. In `astro.config.mjs`, set `site: 'https://<username>.github.io'`.
3. Push this folder to the repo (`package-lock.json` included).
4. Repo Settings > Pages > Source: **GitHub Actions**.
5. The workflow in `.github/workflows/deploy.yml` builds and deploys on every push to `main`.

Using a project repo instead (`github.com/<username>/cv`)? Also add `base: '/cv'` in `astro.config.mjs`.

## Structure

| Path | What it is |
|---|---|
| `src/data/cv.yaml` | All content |
| `src/lib/cv.ts` | Schema (validation) and date helpers |
| `src/lib/squiggle.ts` | Generates the nanopore-style trace in the header |
| `src/components/` | Nav, Hero (name + news), Tracks (timeline), Publications |
| `src/styles/global.css` | Colors, fonts, spacing tokens; light, dark and print styles |

## Customize

- Colors: edit the tokens at the top of `src/styles/global.css` (`--accent` etc.).
- PDF CV: put `cv.pdf` in `public/` and set `cvPdf: /cv.pdf` in `cv.yaml`. Without it, the sidebar offers "Print or save as PDF", which uses a print stylesheet.
- Blog: not set up yet. Add an Astro content collection under `src/content/blog/` when needed.
