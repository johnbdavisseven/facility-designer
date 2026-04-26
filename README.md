# Facility Designer

A browser-based facility plot-plan builder for oil & gas sites — tanks, separators, meters,
flare equipment, wellheads, containment. Drag-and-drop canvas with a BLM-style Export
Preview and a one-click Print / PDF button.

## For reviewers (Jayson)

Just open the hosted link. No install needed.

- **Load Demo** — loads the Buckskin / Clydesdale sample pad so you can see a full layout
- **Library (left)** — click any item to drop it on the canvas
- **Canvas** — drag items to move · scroll to zoom · Shift+drag to pan
- **Right panel** — edit the selected item's identifier, size, rotation
- **Project Info** — operator, wells, legal description, beneficial-use equipment
- **Export Preview** — switch tabs (top bar) to see the BLM-style sheet
- **Print / PDF** — the green button (top right). It flips to Export Preview and opens
  your browser's print dialog, pre-set for 17"×11" landscape. Choose "Save as PDF" to
  send the finished design back.

Saves stay in your browser (localStorage) on the machine you used — they don't sync.

## For the maintainer (JD)

### Run locally

```bash
npm install
npm run dev
```

Opens at http://localhost:5173.

### Deploy (GitHub + Vercel)

1. Push this folder to a new GitHub repo:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: Facility Designer"
   git branch -M main
   git remote add origin https://github.com/<you>/facility-designer.git
   git push -u origin main
   ```

2. Go to https://vercel.com/new, import the repo, accept defaults, click Deploy.
   Vercel auto-detects Vite and builds with `npm run build`.

3. Share the Vercel URL with Jayson.

### Tech

- Vite + React 18
- Tailwind CSS (utility classes)
- lucide-react (icons)
- `window.storage` is shimmed to localStorage in `src/storage.js`
