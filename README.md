# Personal CV Website

**Live site: [ismailguderer.github.io](https://ismailguderer.github.io)**

An Astro site deployed to GitHub Pages. All content lives in one file, `src/data/cv.yaml`.

## Edit Content

1. Open `src/data/cv.yaml` and edit the entries.
2. Commit and push to `main`. GitHub Actions rebuilds and publishes the site in about a minute.

A missing or mistyped field fails the build with a message that names the field, so nothing disappears silently.

## Header Trace

The header shows a synthetic nanopore current trace that spells a hidden word. A script reverse-translates the word (one-letter amino acid codes) into DNA, then looks up the expected current of every 9-mer in ONT's R10.4.1 level table ([nanoporetech/kmer_models](https://github.com/nanoporetech/kmer_models)). It picks the synonymous codons and flanking bases that give the most clearly separated steps.

To change the word:

```bash
node scripts/squiggle-model.mjs WORD
```

The script downloads the table, writes `src/data/squiggle.json`, and prints the chosen DNA. Commit that file with the change. Words of six letters or fewer stay readable on phones.

## Run Locally

Requires Node 22.22 or newer.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # production build into dist/
```

## First Deploy

1. Create a public repo named `<username>.github.io`.
2. In `astro.config.mjs`, set `site: 'https://<username>.github.io'`.
3. Push this folder to the repo, including `package-lock.json`.
4. Under repo Settings > Pages > Source, select **GitHub Actions**.
5. The workflow in `.github/workflows/deploy.yml` then builds and deploys on every push to `main`.

For a project repo (`github.com/<username>/cv`), also add `base: '/cv'` in `astro.config.mjs`.

## Structure

| Path | Contents |
|---|---|
| `src/data/cv.yaml` | All content |
| `src/data/squiggle.json` | Hidden word, its DNA, and the current level of each event |
| `scripts/squiggle-model.mjs` | Generates `squiggle.json` from a word |
| `src/lib/cv.ts` | Schema (validation) and date helpers |
| `src/lib/squiggle.ts` | Draws the header trace from `squiggle.json` |
| `src/components/` | Nav, Hero (trace, name, news), Tracks (timeline), Publications |
| `src/styles/global.css` | Color, font, and spacing tokens; light, dark, and print styles |

## Customize

- Colors: edit the tokens at the top of `src/styles/global.css` (`--accent` and others).
- PDF CV: put `cv.pdf` in `public/` and set `cvPdf: /cv.pdf` in `cv.yaml`. Without it, the sidebar offers "Print or save as PDF", which uses the print stylesheet.
