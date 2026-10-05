# lovinmaxwell.github.io

Live at https://lovinmaxwell.github.io/

Personal portfolio site. Astro 5, Tailwind CSS v4, TypeScript. Fully static.

## Run

```bash
npm install
npm run dev      # http://localhost:4321/
npm run build    # outputs to dist/
npm run preview  # serve the build locally
```

## Edit

All content lives in one file: `src/data/profile.ts`. Change text, links, stack chips, jobs and projects there. Components only render that data.

- Images go in `public/` and are referenced relative to the site base, via `withBase()`, without a leading slash (for example `images/holywhisper/home.webp`).
- Colors and theme tokens are in `src/styles/global.css`.
- Sections are in `src/components/`, ordered in `src/pages/index.astro`.
- Head tags, SEO and the small inline scripts (theme toggle, reveals) are in `src/layouts/Base.astro`.
- The social preview image is `public/og.png`, rendered from `public/og.svg`. To regenerate it after editing the SVG: `npm run og`.

## Deploy

`.github/workflows/deploy.yml` builds the site and publishes `dist/` to GitHub Pages on every push to `main` (Pages source: GitHub Actions).

The site is served from the domain root (no `base` in `astro.config.mjs`). Keep using `withBase()` from `src/lib/url.ts` for internal assets and links so a base path can be added later without breaking anything.
