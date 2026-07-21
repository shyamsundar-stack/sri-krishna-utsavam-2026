/* ============================================================
   Sri Krishna Utsavam 2026

   The schedule lives in index.html only. Every session is an
   .event with data-start / data-end in IST (+05:30), and those
   two attributes drive the countdown, the live highlight, the
   player state and the calendar downloads.
   ============================================================ */
(function () {
  'use strict';

  /* ── 1. CONFIG ──────────────────────────────────────────────
     Paste the embed URL here to go live, for example
     'https://www.youtube.com/embed/live_stream?channel=UCxxxxxxxx'
     While this is null the player shows the "opens soon" card.
  ------------------------------------------------------------ */
  var STREAM_URL = null;

  var VENUE = 'Bharatiya Vidya Bhavan (Main Hall), New No. 18, 20 and 22, ' +
              'East Mada Street, Mylapore, Chennai 600004';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var hasIO = 'IntersectionObserver' in window;
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ── 2. SCHEDULE MODEL ───────────────────────────────────── */
  var events = $$('.event').map(function (el) {
    return {
      el: el,
      start: new Date(el.dataset.start),
      end: new Date(el.dataset.end),
      billed: el.classList.contains('event--star'),
      title: text($('.event__who', el)) || 'Sri Krishna Utsavam',
      kind: text($('.event__kind', el)),
      day: text($('.day__n', el.closest('.day')))
    };
  }).filter(function (e) {
    return !isNaN(e.start) && !isNaN(e.end);
  }).sort(function (a, b) { return a.start - b.start; });

  function text(node) { return node ? node.textContent.trim() : ''; }

  if (!events.length) return;

  var FIRST = events[0].start;
  /* the latest END, not the end of the last item by start time: the two are
     the same today but diverge the moment a session is re-ordered */
  var LAST = events.reduce(function (max, e) { return e.end > max ? e.end : max; }, events[0].end);

  var IST = { timeZone: 'Asia/Kolkata' };
  function fmtDate(d) {
    return d.toLocaleDateString('en-GB', Object.assign({ weekday: 'long', day: 'numeric', month: 'long' }, IST));
  }
  function fmtTime(d) {
    return d.toLocaleTimeString('en-GB', Object.assign({ hour: 'numeric', minute: '2-digit', hour12: true }, IST))
      .replace(/\s*(am|pm)/i, function (m) { return ' ' + m.trim().toLowerCase(); });
  }

  /* ── 3. COUNTDOWN, LIVE STATE, PLAYER ────────────────────── */
  var countEl = $('#countdown'), labelEl = $('#countLabel'), nextEl = $('#countNext');
  var grid = $('#countGrid');
  var units = { d: $('[data-unit="d"]'), h: $('[data-unit="h"]'), m: $('[data-unit="m"]'), s: $('[data-unit="s"]') };
  var player = $('#player'), pBadge = $('#playerBadge'), pHead = $('#playerHead'), pSub = $('#playerSub');
  var watchCta = $('#watchCta');

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function set(node, prop, value) {           // never rewrite an unchanged live region
    if (node && node[prop] !== value) node[prop] = value;
  }

  function currentEvent(now) {
    for (var i = 0; i < events.length; i++) {
      if (now >= events[i].start && now < events[i].end) return events[i];
    }
    return null;
  }
  function nextEvent(now, billedOnly) {
    for (var i = 0; i < events.length; i++) {
      if (events[i].start > now && (!billedOnly || events[i].billed)) return events[i];
    }
    return null;
  }

  var streamMounted = false;
  function mountStream() {
    if (streamMounted || !player) return;
    var frame = $('.player__frame', player);

    if (STREAM_URL) {
      var iframe = document.createElement('iframe');
      iframe.src = STREAM_URL;
      iframe.title = 'Sri Krishna Utsavam live stream';
      iframe.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      frame.innerHTML = '';
      frame.appendChild(iframe);
      streamMounted = true;
      return;
    }

    /* No embed configured. Rather than show a dead player while a session is
       genuinely on stage, hand the viewer the two rooms that do exist. */
    var box = $('.player__soon', frame);
    if (!box || $('.player__ways', box)) return;
    var ways = document.createElement('div');
    ways.className = 'player__ways';
    ways.innerHTML =
      '<a class="btn btn--gold" target="_blank" rel="noopener" ' +
      'href="https://us02web.zoom.us/j/87692135267?pwd=UmNlTGhVVkhBdHpMM05aWkNSUXRwZz09">Open the Zoom room</a>' +
      '<a class="btn btn--ghost" target="_blank" rel="noopener" ' +
      'href="https://www.youtube.com/results?search_query=Sri+Vishnu+Mohan+Foundation+live">Find it on YouTube</a>';
    box.appendChild(ways);
    /* lets the CSS drop the fixed 16/9 box so the buttons cannot be clipped */
    player.classList.add('has-ways');
  }

  var lastNow = null;
  function tick() {
    var now = new Date();
    var live = currentEvent(now);

    if (live !== lastNow) {
      events.forEach(function (e) { e.el.classList.toggle('is-now', e === live); });
      if (watchCta) watchCta.classList.toggle('is-live', !!live);
      /* if the on-stage item is inside the collapsed inauguration block, open it */
      if (live) {
        var box = live.el.closest('details');
        if (box) box.open = true;
      }
      lastNow = live;
    }

    /* ── a session is on stage ── */
    if (live) {
      countEl.classList.add('is-live');
      grid.hidden = true;
      set(labelEl, 'textContent', 'Live now, ' + live.day);
      set(nextEl, 'innerHTML', '<b>' + live.title + '</b> is on stage. <a href="#watch">Watch the stream</a>');
      if (player) {
        player.dataset.state = 'live';
        set(pBadge, 'textContent', 'Live now');
        set(pHead, 'textContent', live.title);
        set(pSub, 'textContent', live.kind || fmtDate(live.start));
        mountStream();
      }
      return;
    }

    /* ── the festival is over ── */
    if (now >= LAST) {
      countEl.classList.remove('is-live');
      grid.hidden = true;
      set(labelEl, 'textContent', 'Until we meet again');
      set(nextEl, 'innerHTML', 'The 16<sup>th</sup> Sri Krishna Utsavam has concluded. ' +
        'Recordings will be shared on the SVMF channel.');
      if (player) {
        player.dataset.state = 'ended';
        set(pBadge, 'textContent', 'Stream ended');
        set(pHead, 'textContent', 'Thank you for joining us');
        set(pSub, 'textContent', 'Recordings will be posted on the SVMF YouTube channel.');
      }
      return;
    }

    /* ── counting down ── */
    var next = nextEvent(now, false);
    var diff = Math.max(0, (next ? next.start : FIRST) - now);
    var s = Math.floor(diff / 1000);

    countEl.classList.remove('is-live');
    grid.hidden = false;
    set(units.d, 'textContent', String(Math.floor(s / 86400)));
    set(units.h, 'textContent', pad(Math.floor(s / 3600) % 24));
    set(units.m, 'textContent', pad(Math.floor(s / 60) % 60));
    set(units.s, 'textContent', pad(s % 60));

    if (now < FIRST || !next) {
      set(labelEl, 'textContent', 'The utsavam begins in');
      set(nextEl, 'innerHTML', 'Opening on <b>' + fmtDate(FIRST) + '</b> at <b>' + fmtTime(FIRST) + ' IST</b>');
    } else {
      set(labelEl, 'textContent', 'Next session in');
      set(nextEl, 'innerHTML', '<b>' + next.title + '</b>, ' + fmtDate(next.start) + ' at ' + fmtTime(next.start) + ' IST');
    }

    if (player) {
      player.dataset.state = 'soon';
      var billed = nextEvent(now, true) || next;
      if (billed) {
        set(pBadge, 'textContent', 'Streaming opens soon');
        set(pHead, 'textContent', billed.title);
        set(pSub, 'textContent', billed.day + ', ' + fmtDate(billed.start) + ' at ' + fmtTime(billed.start) + ' IST');
      }
    }
  }

  tick();
  setInterval(tick, 1000);

  /* ── 4. ADD TO CALENDAR (.ics built in the browser) ──────── */
  function stamp(d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  function esc(t) {
    return String(t).replace(/[\\;,]/g, function (c) { return '\\' + c; }).replace(/\n/g, '\\n');
  }
  /* RFC 5545 3.1 folds at 75 OCTETS, not characters. Artist names carry
     accented and Devanagari characters, so measure real UTF-8 length. */
  var enc = window.TextEncoder ? new TextEncoder() : null;
  function octets(str) { return enc ? enc.encode(str).length : str.length; }

  function fold(line) {
    if (octets(line) <= 75) return line;
    var out = '', run = '', limit = 75;    /* first line: 75 octets */
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      /* never split a surrogate pair across a fold */
      if (/[\uD800-\uDBFF]/.test(ch) && i + 1 < line.length) ch += line[++i];
      if (octets(run + ch) > limit) {
        out += (out ? '\r\n ' : '') + run;
        run = ch;
        limit = 74;                        /* leading space eats one of the 75 */
      } else {
        run += ch;
      }
    }
    return out + (out ? '\r\n ' : '') + run;
  }

  $$('[data-ics]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var row = btn.closest('.event');
      var ev = events.filter(function (e) { return e.el === row; })[0];
      if (!ev) return;

      var body = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'CALSCALE:GREGORIAN',
        'PRODID:-//SVMF//Sri Krishna Utsavam 2026//EN',
        'BEGIN:VEVENT',
        'UID:' + stamp(ev.start) + '-svmf@svmf.in',
        'DTSTAMP:' + stamp(new Date()),
        'DTSTART:' + stamp(ev.start),
        'DTEND:' + stamp(ev.end),
        /* keep the session type in the title: "Odissi dance recital, Dr. Sujata
           Mohapatra" is far more use in a calendar than the name alone */
        'SUMMARY:' + esc((ev.kind ? ev.kind + ', ' : '') + ev.title + ' (Sri Krishna Utsavam)'),
        'DESCRIPTION:' + esc((ev.kind ? ev.kind + '. ' : '') +
          '16th Sri Krishna Utsavam, presented by Sri Vishnu Mohan Foundation and ' +
          'Sri Gnana Advaitha Peetam. Entry free.'),
        'LOCATION:' + esc(VENUE),
        'END:VEVENT', 'END:VCALENDAR'
      ].map(fold).join('\r\n');

      var url = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }));
      var a = document.createElement('a');
      a.href = url;
      a.download = ev.title.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() + '-utsavam-2026.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);

      var was = btn.textContent;
      btn.textContent = 'Saved';
      btn.classList.add('is-done');
      setTimeout(function () { btn.textContent = was; btn.classList.remove('is-done'); }, 2400);
    });
  });

  /* ── 5. NAV ──────────────────────────────────────────────── */
  var nav = $('#nav'), toggle = $('#navToggle'), links = $('#navLinks');

  /* a sentinel at the top of the page rather than a scroll listener.
     Old Android WebViews have no IntersectionObserver, so fall back to
     leaving the nav in its solid state rather than throwing. */
  if (hasIO) {
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:60px;pointer-events:none';
    document.body.insertBefore(sentinel, document.body.firstChild);
    new IntersectionObserver(function (entries) {
      nav.classList.toggle('is-stuck', !entries[0].isIntersecting);
    }, { threshold: 0 }).observe(sentinel);
  } else {
    nav.classList.add('is-stuck');
  }

  if (toggle && links) {
    var setMenu = function (open) {
      links.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', links).forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  /* ── 6. REVEAL ON SCROLL ─────────────────────────────────── */
  if (hasIO && !reduceMotion) {
    var targets = $$('.about__text, .about__art, .day, .card, .watch__copy, .player, .visit__card, .sec-head');
    targets.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: .05 });
    targets.forEach(function (el) { io.observe(el); });
  }
})();
