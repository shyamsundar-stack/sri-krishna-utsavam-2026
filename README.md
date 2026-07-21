# Sri Krishna Utsavam 2026

Landing page for the 16th Sri Krishna Utsavam, 31 July to 5 August 2026, at Bharatiya
Vidya Bhavan, Mylapore, Chennai. Presented by the Sri Vishnu Mohan Foundation and Sri
Gnana Advaitha Peetam.

**Live: https://shyamsundar-stack.github.io/sri-krishna-utsavam-2026/**

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

## Turning the live stream on

Open `assets/js/main.js` and set the embed URL on line 17:

```js
var STREAM_URL = 'https://www.youtube.com/embed/live_stream?channel=UCxxxxxxxx';
```

That is the only change needed. Until it is set, the page still works: during a live
session it shows "Live now" and offers Zoom and YouTube buttons instead of an embed, so
nothing is broken if nobody gets to this before Day 1. Once it is set, the real player
mounts itself the moment a scheduled session starts.

The player has three clock-driven states:

| State | When | Shown |
|---|---|---|
| soon | before and between sessions | countdown, next billed artist |
| live | during a scheduled session | red "Live now" badge, the embed, and that row lit up in the schedule |
| ended | after 5 August | closing message |

## Editing the schedule

The schedule lives **only** in `index.html`. Each session is one `<article class="event">`
carrying two attributes:

```html
<article class="event event--star"
         data-start="2026-08-01T16:30:00+05:30"
         data-end="2026-08-01T17:45:00+05:30">
```

Those timestamps drive the countdown, the "next session" line, the live highlight and
the *Add to calendar* download. There is no second copy of the schedule in the
JavaScript, so changing them here changes everything.

- `event--star` marks a billed performance: gold dot, portrait, calendar button.
- `event--rite` marks a short formality such as the lamp lighting.
- Day 1's six formalities sit inside a `<details class="rites">` so the opening concert
  is what you see first. It opens itself if one of those items is on stage.
- The visible `<time>` is only a label. Edit it to match `data-start`.
- Keep the `+05:30`. It is what makes the countdown correct for viewers abroad.

## Sharing a poster

Tapping any card in the "Send the invitation" strip opens a share sheet holding that
card, a note already written for that artist, and the ways to send it.

Where the browser has a real share sheet (almost every phone) it hands the operating
system the **poster image itself**, so WhatsApp sends the picture rather than a bare
link. Everywhere else there are explicit WhatsApp, email, copy and download actions.

The note lives on the button, so the client can reword any of them without touching
JavaScript:

```html
<button class="poster" type="button"
        data-img="day4-sujata"          <!-- basename in assets/img/posters/ -->
        data-anchor="#day-4"            <!-- deep link added to the note      -->
        data-who="Dr. Sujata Mohapatra"
        data-msg="Dr. Sujata Mohapatra dances at the 16th Sri Krishna Utsavam. ...">
```

The venue line and the closing invitation are shared by every card and live in
`main.js` as `TAIL` and `ASK`.

Each poster exists twice: `.webp` for the page, `.jpg` for sharing, because WhatsApp and
mail clients handle JPEG most reliably. The JPEG is only fetched when someone actually
opens the share sheet, so it costs nothing on page load.

## Before the client shares it

1. **YouTube link.** The invitation only gives the channel name "SVMF". The Watch
   section currently says a direct link will follow. Replace it in `index.html` once you
   have the channel URL, and set `STREAM_URL` in `main.js`.
2. **Saketaraman's start time.** The invitation contradicts itself: the Schedule of
   Events page says the Day 1 concert begins at **6:00 pm**, his own artist card says
   **5:30 pm**. The site uses 6:00 pm. Change `data-start` on that row if the card is
   right.
3. **Session end times** are estimates used for the live-state logic and the calendar
   files. Adjust `data-end` if the organisers have firmer timings.
4. **Custom domain.** If you point a domain at this, update the four absolute URLs in
   the `<head>` and the ones in the JSON-LD block at the foot of `index.html`.

## Notes on the build

- Fonts are self-hosted rather than loaded from Google, so there is no render-blocking
  third-party request on a patchy mobile connection.
- Body text is set at weight 400 with contrast raised across the board. Every text and
  background pair on the page passes WCAG AA, most reach AAA. The lowest ratio is 6.4:1.
- Calendar files are folded at 75 octets per RFC 5545, measured in UTF-8 bytes, so they
  import cleanly into Outlook as well as Google and Apple Calendar.
- Motion is limited to scroll reveals, the countdown and one slow float on the Krishna
  artwork, and all of it collapses under `prefers-reduced-motion`.
- A JSON-LD `Festival` block describes the event for search engines.

## Credits

Artwork, photography and the printed invitation are the property of the Sri Vishnu Mohan
Foundation. Map data from OpenStreetMap contributors. Typefaces are Jost and Cormorant
Garamond, both SIL Open Font License.
