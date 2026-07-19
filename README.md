# Coastal Vista

Marketing site for **Coastal Vista**, an FAA Part 107 licensed and insured drone
photography and videography business based in Corpus Christi, Texas, serving the
Texas coast. Services include aerial imagery for real estate listings,
commercial projects (inspections, progress documentation, marketing footage),
cinematic showreels, and event coverage.

Built with Vite, React, TypeScript, Tailwind CSS, and GSAP scroll animations.

**Live site:** <https://anthonyhinojosa77.github.io/coastal-vista-redesign/>

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

Other commands: `npm run lint`.

## Contact form configuration

The contact form works with zero backend out of the box:

- **Formspree (optional):** copy `.env.example` to `.env` and set
  `VITE_FORMSPREE_ENDPOINT` to a real Formspree endpoint
  (`https://formspree.io/f/<your_form_id>`). The form then submits through
  Formspree with inline success/error feedback. In CI, the deploy workflow
  reads the same value from the `VITE_FORMSPREE_ENDPOINT` repository variable.
- **Mailto fallback (default):** when the variable is unset, empty, or still a
  placeholder, submitting the form opens the visitor's email client with the
  subject and body pre-filled from the form fields (name, email, project type,
  timeline, message), addressed to the business contact email. Both paths
  share the same client-side validation.

`.env` is gitignored; never commit real endpoints or other secrets.

## Deployment

GitHub Pages deployment is configured in `.github/workflows/deploy.yml`. On
every push to `main` (or via manual dispatch), the workflow installs
dependencies, builds the site, and publishes `dist/` to GitHub Pages. The site
is served under the `/coastal-vista-redesign/` base path (see `base` in
`vite.config.ts`).
