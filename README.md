# Sri Krishna Utsavam 2026

Landing page for the 16th Sri Krishna Utsavam, held 31 July to 5 August 2026 at
Bharatiya Vidya Bhavan, Mylapore, Chennai. Presented by the Sri Vishnu Mohan Foundation
and Sri Gnana Advaitha Peetam. The festival has concluded; the page is now its archive,
with the recordings of all six days.

**Public link: https://live.svmf.in/krishna-utsavam** (a Switchy redirect to the GitHub Pages
site below, with click tracking; this is the link to share).

Plain HTML, CSS and JavaScript. No build step, no dependencies, no framework. Colours,
artwork, photography and schedule all come from the printed invitation.

```
index.html
assets/css/fonts.css      self-hosted @font-face rules
assets/css/styles.css
assets/js/main.js
assets/fonts/             Jost and Cormorant Garamond, woff2, 174 KB
assets/img/               cut-outs, logos, wordmark, share card
assets/img/posters/       the 12 invitation pages
```

## Running it locally

Open `index.html` directly, or serve the folder:

```
python -m http.server 4321
```

## The recordings

Each festival day is one card in the "Watch the recordings" grid in `index.html`,
carrying its YouTube video id on the button (`data-video`). The embed mounts only when
a card is tapped, so the page never loads six iframes up front. Embeds carry
`enablejsapi=1`, and each play pushes a `recording_play` event (day + video id) to the
GTM dataLayer.

The live-stream machinery from the festival week (the `STREAMS` map, countdown, player
states, `Add to calendar` downloads) was removed after the event; it is in the git
history should the 17th edition want it back.

## The schedule

Removed after the festival: post-event it duplicated the "Nine artists, six days"
cards, which carry the same dates and times with the photographs. The full
session-by-session markup (with `data-start`/`data-end` timestamps, the inauguration
programme and the `<details class="rites">` block) is in the git history should the
17th edition want it back.

## In the news

The `#press` section (and its `#pressLink` nav item) ship with the `hidden` attribute.
To publish coverage: drop clipping scans into `assets/img/press/`, copy the commented
`<li>` template in the section once per clipping, and remove both `hidden` attributes.

## Sharing a poster

Tapping any card in the "Send the invitation" strip opens a share sheet holding that
card, a note already written for that artist, and the ways to send it.

Where the browser has a real share sheet (almost every phone) it hands the operating
system the **poster image itself**, so WhatsApp sends the picture rather than a bare
link. Everywhere else there are explicit WhatsApp, email, copy and download actions.

The note lives on the button, so the client can reword any of them without touching
JavaScript (the notes are past tense now, and every one points at the recordings):

```html
<button class="poster" type="button"
        data-img="day4-sujata"          <!-- basename in assets/img/posters/ -->
        data-anchor="#day-4"
        data-who="Dr. Sujata Mohapatra"
        data-msg="Dr. Sujata Mohapatra danced at the 16th Sri Krishna Utsavam. ...">
```

The venue line and the closing invitation are shared by every card and live in
`main.js` as `TAIL` and `ASK`.

Each poster exists twice: `.webp` for the page, `.jpg` for sharing, because WhatsApp and
mail clients handle JPEG most reliably. The JPEG is only fetched when someone actually
opens the share sheet, so it costs nothing on page load.

## Notes on the build

- Fonts are self-hosted rather than loaded from Google, so there is no render-blocking
  third-party request on a patchy mobile connection.
- Body text is set at weight 400 with contrast raised across the board. Every text and
  background pair on the page passes WCAG AA, most reach AAA. The lowest ratio is 6.4:1.
- Motion is limited to scroll reveals and one slow float on the Krishna artwork, and
  all of it collapses under `prefers-reduced-motion`.
- A JSON-LD `Festival` block describes the event for search engines.
- **Custom domain.** If you point a domain at this, update the four absolute URLs in
  the `<head>` and the ones in the JSON-LD block at the foot of `index.html`.

## Credits

Artwork, photography and the printed invitation are the property of the Sri Vishnu Mohan
Foundation. Map data from OpenStreetMap contributors. Typefaces are Jost and Cormorant
Garamond, both SIL Open Font License.
