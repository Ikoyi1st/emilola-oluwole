# Emilola & Oluwole — Wedding Programme (Flipbook)

A React + Vite recreation of the wedding programme as an interactive,
page-turning flipbook.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Build for production

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  App.jsx                 top-level layout, title, background
  App.css                 theme tokens, fonts, ambient background
  components/
    FlipBook.jsx           the interactive book: drag/fling physics, nav
    FlipBook.css           book, page and control styling
    Pages.jsx               page content (cover, ministers, order of
                             service, hymns, closing) built from data/content.js
  data/
    content.js             all programme text (ministers, order of
                             service, hymn lyrics) — edit this to
                             change the programme's content
  assets/
    couple-photo.jpg
```

## How the page-turn works

Each page is an absolutely-positioned `<div>` with a front and back face
(`backface-visibility: hidden`) inside a `perspective`-ed book container.
Rather than a fixed CSS transition, `FlipBook.jsx` drives the rotation by
hand with `requestAnimationFrame`:

- **Drag** an edge and the page rotates 1:1 with your pointer.
- **Release** past the halfway point, or with enough velocity (a fling),
  and the page eases the rest of the way open with `easeOutCubic`.
  Release before that and it eases back shut.
- **Tap** an edge (no real drag) and the page flips fully, so click/tap
  navigation still feels natural.
- A subtle `.shine` overlay darkens each page as it turns edge-on, to
  suggest the way light catches real paper mid-turn.

Drag/tap targets are separate invisible strips along the left and right
edges of the book (`.edge-grab`), rather than the whole page — so
scrolling inside a long hymn never gets mistaken for a page-turn gesture.
