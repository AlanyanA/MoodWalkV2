# MoodWalk

A phone-first web app that suggests walking routes in Gwanak-gu, Seoul, based on how you want to feel. Built for a Human Factors & Engineering Psychology group project.

## Run locally

```
npm install
npm run dev
```

## Publish on GitHub Pages

1. Create a GitHub repository and push this folder to its `main` branch.
2. In the repository go to **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.
3. Every push to `main` builds and deploys the app (see `.github/workflows/deploy.yml`). The site appears at `https://<your-user>.github.io/<repo-name>/`.

## Where the data is saved

All user data (settings, plan in progress, walk in progress, journal, reviews, hazard reports, music choices) is saved in the browser's `localStorage` on each phone. GitHub Pages has no server, so data is not shared between people or devices. **Settings → Your data** can export a backup file and import it on another device.

To share reviews between users you would need a backend such as Firebase or Supabase.

## Data sources

- Map tiles and walking paths: © OpenStreetMap contributors. Route geometry and turn steps were calculated with the OSRM foot router and are stored in `src/data/geo.json`.
- Atmosphere scores, sample reviews and hazard reports are made up for the prototype and are labelled "Sample" in the app.
- Music is generated in the browser with the Web Audio API (`src/lib/music.js`).
