/* ============================================================
   Sri Krishna Utsavam 2026 — post-festival page

   The utsavam concluded on 5 August 2026. The countdown, the
   live player and the calendar downloads have retired with it;
   what remains is the recordings grid, the nav, the poster
   share sheet and the scroll reveals.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var hasIO = 'IntersectionObserver' in window;
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ── 1. RECORDINGS ───────────────────────────────────────────
     One card per festival day. The YouTube embed mounts only when
     a card is tapped: six iframes on page load would cost far more
     than this audience's phones should pay. enablejsapi is on so
     GTM's video trigger can report watch progress. */
  $$('.rec__play').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.dataset.video;
      if (!id) return;

      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube.com/embed/' + encodeURIComponent(id) +
        '?autoplay=1&playsinline=1&rel=0&enablejsapi=1';
      iframe.title = btn.getAttribute('aria-label') || 'Sri Krishna Utsavam recording';
      iframe.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;

      var frame = btn.closest('.rec__frame');
      frame.innerHTML = '';
      frame.appendChild(iframe);

      if (window.dataLayer) {
        window.dataLayer.push({ event: 'recording_play', festival_day: btn.dataset.day || '', video_id: id });
      }
    });
  });

  /* ── 2. NAV ──────────────────────────────────────────────── */
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

    /* The nav wordmark only appears once the big one has scrolled away,
       so the logo is never on screen twice. */
    var heroMark = $('.hero__mark');
    if (heroMark) {
      new IntersectionObserver(function (entries) {
        nav.classList.toggle('has-brand', !entries[0].isIntersecting);
      }, { threshold: 0 }).observe(heroMark);
    } else {
      nav.classList.add('has-brand');
    }
  } else {
    nav.classList.add('is-stuck', 'has-brand');
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

  /* ── 3. SHARE A POSTER ───────────────────────────────────────
     The cards are keepsakes now. Tapping one opens a sheet with a
     past-tense note that points at the recordings. Where the browser
     has a real share sheet (nearly all phones) we hand it the poster
     image itself, so WhatsApp sends the picture and not just a link. */
  var dlg = $('#shareDlg');

  if (dlg) {
    var picEl = $('#sharePic'), msgEl = $('#shareMsg'), noteEl = $('#shareNote');
    var btnNative = $('#shareNative'), aWa = $('#shareWa'), aMail = $('#shareMail');
    var btnCopy = $('#shareCopy'), aDl = $('#shareDl');
    var current = null;
    /* The branded link people actually see and forward. Switchy redirects it
       to the live site and tracks the click. The #day-N fragment is kept by
       the browser across the redirect, so deep links still land on the right
       day. Change this one line if the public address changes. */
    var SITE = 'https://live.svmf.in/krishna-utsavam';

    var TAIL = 'Bharatiya Vidya Bhavan, Mylapore, Chennai.';
    var ASK = 'Watch the recordings here:';

    function say(t) { noteEl.textContent = t || ''; }

    /* The poster is fetched when the sheet opens, not when Share is tapped.
       navigator.share needs transient user activation, and awaiting a fetch
       inside the click handler can spend it: Safari then rejects the call. */
    var readyFile = null;
    function prefetchPoster() {
      readyFile = null;
      if (!navigator.canShare || !current) return;
      var want = current.jpg;
      fetch(want)
        .then(function (r) { return r.ok ? r.blob() : Promise.reject(); })
        .then(function (blob) {
          if (!current || current.jpg !== want) return;      // sheet moved on
          var file = new File([blob], 'sri-krishna-utsavam-' + current.img + '.jpg',
                              { type: 'image/jpeg' });
          if (navigator.canShare({ files: [file] })) readyFile = file;
        })
        .catch(function () {
          /* only clear if this is still the poster on screen, or a failed
             fetch for an old poster wipes the file we just got for a new one */
          if (current && current.jpg === want) readyFile = null;
        });
    }

    /* One way out, so every path releases the scroll lock and returns focus,
       including on browsers with no <dialog> support where close() is absent. */
    var lastPoster = null;
    function closeShare() {
      if (typeof dlg.close === 'function' && dlg.open) dlg.close();
      else dlg.removeAttribute('open');
      say('');
      document.documentElement.style.overflow = '';
      if (lastPoster && lastPoster.isConnected) lastPoster.focus({ preventScroll: true });
    }

    function openShare(btn) {
      if (dlg.open) closeShare();         // never call showModal on an open dialog
      lastPoster = btn;
      var img = btn.dataset.img;
      /* the recordings are the point now, so every note lands on #watch */
      var url = SITE + '#watch';
      current = {
        img: img,
        who: btn.dataset.who,
        url: url,
        jpg: 'assets/img/posters/' + img + '.jpg'
      };

      picEl.src = 'assets/img/posters/' + img + '.webp';
      picEl.alt = $('img', btn).alt;
      msgEl.value = btn.dataset.msg + '\n' + TAIL + '\n' + ASK + ' ' + url;
      aDl.href = current.jpg;
      aDl.setAttribute('download', 'sri-krishna-utsavam-' + img + '.jpg');
      say('');
      sync();
      prefetchPoster();

      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
      document.documentElement.style.overflow = 'hidden';
      /* focus the heading, not the textarea: opening a phone keyboard over
         the sheet the moment it appears is hostile */
      $('.share__h', dlg).setAttribute('tabindex', '-1');
      $('.share__h', dlg).focus({ preventScroll: true });
    }

    /* keep the WhatsApp and mail links in step with any edit to the note */
    function sync() {
      var text = msgEl.value;
      aWa.href = 'https://wa.me/?text=' + encodeURIComponent(text);
      aMail.href = 'mailto:?subject=' +
        encodeURIComponent('Sri Krishna Utsavam 2026, watch the recordings') +
        '&body=' + encodeURIComponent(text);
    }
    msgEl.addEventListener('input', sync);

    /* the OS sheet, with the poster attached when the browser allows files */
    if (navigator.share) {
      btnNative.hidden = false;
      btnNative.addEventListener('click', function () {
        var text = msgEl.value;
        /* called synchronously so the tap's user activation still counts */
        var payload = readyFile
          ? { files: [readyFile], text: text }
          : { text: text, url: current.url };

        var p;
        try { p = navigator.share(payload); } catch (e) { p = Promise.reject(e); }

        p.then(function () { say('Thank you for passing it on.'); })
         .catch(function (err) {
           if (err && err.name === 'AbortError') { say(''); return; }
           say('Your browser could not open the share menu. Use WhatsApp or email instead.');
         });
      });
    }

    btnCopy.addEventListener('click', function () {
      var text = msgEl.value;
      var done = function () { say('Note copied. Paste it wherever you like.'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { say('Copy did not work. Select the note and copy it by hand.'); });
      } else {
        msgEl.select();
        try { document.execCommand('copy'); done(); } catch (e) { say('Copy did not work. Select the note and copy it by hand.'); }
      }
    });

    $$('.poster').forEach(function (btn) {
      btn.addEventListener('click', function () { openShare(btn); });
    });

    $('#shareClose').addEventListener('click', closeShare);
    /* clicking the backdrop closes it, same as Esc */
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeShare(); });
    /* native dialogs handle Esc themselves; the fallback path does not */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && dlg.hasAttribute('open')) closeShare();
    });
    /* covers Esc on the native dialog, which closes without touching us */
    dlg.addEventListener('close', function () {
      say('');
      document.documentElement.style.overflow = '';
    });
  }

  /* ── 4. REVEAL ON SCROLL ─────────────────────────────────── */
  if (hasIO && !reduceMotion) {
    var targets = $$('.about__text, .about__art, .day, .card, .rec, .clip, .sec-head');
    targets.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: .05 });
    targets.forEach(function (el) { io.observe(el); });

    /* Failsafe. A reveal must never be the reason content is missing:
       observers do not fire in background tabs, in headless renderers, or
       in print. After a few seconds everything is shown regardless. */
    var reveal = function () {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      io.disconnect();
    };
    setTimeout(reveal, 4000);
    window.addEventListener('beforeprint', reveal);
  }
})();
