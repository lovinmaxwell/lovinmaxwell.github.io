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

The default homepage is a cinematic noir portfolio with dark framing and gunmetal content panels. The top-right
**New / Original** links switch between `/` and `/classic/`; both work without
JavaScript. The original layout keeps its light/dark preference. The new
homepage is intentionally dark and does not change that saved preference.
`/classic/` shares the homepage canonical URL and is excluded from the sitemap.

The homepage is one rounded stage with six scroll-scrubbed chapters, a consistent
midnight background, cold-silver typography, signal-yellow accents, and an original silver orbital-ribbon
sculpture. The hero contains no project screenshots. GSAP controls the scene
transitions and horizontal career gallery; there is no WebGL renderer or 3D-model
download. Use the chapter ruler to jump, or drag/use arrow keys through the
career journey. Detail viewers support Escape and return focus to their opener.

The career chapter follows the recorded journey from Anna University
(2012–2016), through Bangalore, Al Wakrah, Doha and Lusail, to the current role
at Hamad Medical Corporation. Every role opens its full responsibilities and
technologies without leaving the new design. Education, certifications and
courses have their own viewer. Dates describe education/employment records,
not assumed relocation dates.

Systems offers three selectable walkthroughs grounded in recorded work:
enterprise mobility, SAP integration, and AccessFlow's local-first AI concept.
Public role schematics are not presented as internal deployment diagrams.
The stack chapter organizes tools around four engineering capabilities, with
the complete categorized catalog in a secondary viewer. Work is hidden from
the new view, including its navigation and archive viewer; projects and the
full archive remain available in **Original** at `/classic/`.
The final Doha chapter uses original stadium and skyline artwork presented in
grayscale against a night-sky spotlight, with a small Qatar flag accent, inspired by the country's football
atmosphere rather than official tournament branding.

The **Motion on/off** control remembers the visitor's choice. Reduced-motion
preferences, short viewports, and no JavaScript use ordinary document flow;
project links still reach real details. All workflow walkthroughs remain visible
without JavaScript. Concept artwork and mock-demo results are explicitly
labeled rather than presented as live product evidence.

## Edit

Shared profile content lives in `src/data/profile.ts`: links, stack chips,
jobs and projects. The new homepage's introductory and showcase copy lives
in `src/pages/index.astro` and the scene components; project statuses and images
still come from the shared profile.

- Images go in `public/` and are referenced relative to the site base, via `withBase()`, without a leading slash (for example `images/holywhisper/home.webp`).
- Cinematic styling is in `src/styles/story.css`; shared theme tokens remain in `src/styles/global.css`.
- Scroll, motion preferences, gallery interaction, and dialogs are in `src/lib/story.ts`.
- Shared chapter positions and gallery timing are in `src/data/story.ts`.
- Career, stack and Doha scenes are in `CareerJourney.astro`, `StoryStack.astro`, and `QatarFinale.astro`; their responsive styling is in `src/styles/journey.css`.
- The hero sculpture and Systems walkthroughs are in `OrbitalSculpture.astro` and `SystemsShowcase.astro`. The unmounted `WorkShowcase.astro` retains the previous Work presentation.
- `StackCatalog.astro` preserves every shared technology entry and its category filters inside the stack viewer.
- Dialog content is in `src/components/ProjectViewer.astro`; original sections are composed in `src/pages/classic.astro`.
- Head tags, SEO and the small inline scripts (theme toggle, reveals) are in `src/layouts/Base.astro`.
- The social preview image is `public/og.png`, rendered from `public/og.svg`. To regenerate it after editing the SVG: `npm run og`.

Run `npm test` to build and check the version routes, canonical URLs,
navigation targets, scene/fallback markup, orbital hero asset and
machine-readable profile outputs, plus complete career/education/stack/archive
content. Without JavaScript, career, education, and catalog dossiers
render in ordinary document flow and their anchor links remain usable.

## Original artwork

The retired Blender sculpture and its source are archived locally under ignored
`.design-refs/`; neither the model nor its fallback image ships with the site.
The current hero uses a new, continuous silver ribbon rather than the old atom.
`scripts/create-orbital-ribbon.py` builds and renders it in an isolated Blender
scene. Its transparent render is saved under `.design-refs/`; the optimized
`public/images/orbital-ribbon.webp` ships with the site. Regenerate with:

```bash
blender --background --factory-startup --python scripts/create-orbital-ribbon.py
node --input-type=module -e "import sharp from 'sharp'; await sharp('.design-refs/orbital-ribbon.png').webp({quality:90,alphaQuality:100}).toFile('public/images/orbital-ribbon.webp')"
```

Gentle CSS motion and scroll choreography animate the sculpture. Motion-off and
reduced-motion preferences keep it still; offscreen animation is paused.

The hero now sits above an original city silhouette in an angular, steel-lit field with pointer-responsive depth
on fine-pointer devices when motion is enabled. **Explore**, **Cmd/Ctrl K**, or
**/** opens a searchable visual chapter atlas. Enter opens the first search
result; Arrow Down moves to it, and Escape closes the atlas and restores focus.
Chapter selection moves focus to the destination heading. The chapter ruler
also tracks the current section in the motion-off document layout.
System reduced-motion preferences always take priority over the motion toggle.
Viewports at most 700px tall (800px on narrow screens) use document scrolling
so the interactive diagrams never compete with the fixed chapter ruler.
The atlas and spatial styling live in `ChapterAtlas.astro` and
`src/styles/experience.css`; neither requires extra runtime dependencies.
The Dark Knight-inspired noir direction uses midnight framing, raised gunmetal
panels, cold silver, and restrained signal-yellow controls. A condensed local
Impact/Arial Narrow display stack gives the opening a cinematic title treatment;
body text retains the existing sans-serif. Artwork, lighting and city silhouettes
are original, not film assets or franchise logos. Shared color tokens live at
the top of `story.css`; brighter panels separate content from the dark shell.
Chapter background colors in `src/data/story.ts` match the static scene
backgrounds, so scroll transitions and motion-off views share the same palette.
Dialogs and the chapter atlas use the same gunmetal surfaces;
the Original route retains its independent light/dark theme.
Systems diagrams are inspectable: select a node to read its responsibility,
use Left/Right or Home/End to move between nodes, and **Reset to overview** to
return to the full explanation. These are explanatory diagrams, not live demos.

`public/images/story-grain.png` was generated using PhotoCraft's headless MCP
noise filter; its editable `.pcraft` document lives under `.design-refs/`.
Neither design tool is required to run or build the website. MCP registrations
are local user configuration, not repository secrets or deployment dependencies.

## Deploy

`.github/workflows/deploy.yml` builds the site and publishes `dist/` to GitHub Pages on every push to `main` (Pages source: GitHub Actions).

The site is served from the domain root (no `base` in `astro.config.mjs`). Keep using `withBase()` from `src/lib/url.ts` for internal assets and links so a base path can be added later without breaking anything.
