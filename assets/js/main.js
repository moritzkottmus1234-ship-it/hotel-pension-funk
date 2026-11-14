/* Hotel-Pension Funk · site script (no frameworks, no build step) */
(() => {
  'use strict';

  const doc = document.documentElement;
  doc.classList.add('js');
  const LANG = (doc.lang || 'de').toLowerCase().startsWith('en') ? 'en' : 'de';

  const TEXT = {
    de: {
      bookDates: 'Bitte wählen Sie eine Abreise, die nach der Anreise liegt.',
      bookPast: 'Die Anreise darf nicht in der Vergangenheit liegen.',
      bookBoth: 'Bitte wählen Sie Anreise und Abreise, oder lassen Sie beide Felder leer.',
      lampDone: 'Das Licht brennt',
      lampLive: 'Das Licht ist an. Willkommen in der Beletage.',
      menuOpen: 'Menü öffnen',
      menuClose: 'Menü schließen',
      sending: 'Wird gesendet …',
      formInvalid: 'Bitte prüfen Sie die markierten Felder.',
      formOk: 'Vielen Dank! Ihre Anfrage ist bei uns angekommen. Wir melden uns per E-Mail bei Ihnen.',
      formErr: 'Das hat leider nicht geklappt. Bitte rufen Sie uns an (+49 30 8827193) oder schreiben Sie an berlin@hotel-pensionfunk.de.',
      formMail: 'Ihr E-Mail-Programm öffnet sich mit Ihrer fertigen Anfrage. Bitte dort nur noch auf Senden klicken.',
      mailSubject: 'Zimmeranfrage über die Website',
      labels: { name: 'Name', email: 'E-Mail', telefon: 'Telefon', gaeste: 'Gäste', anreise: 'Anreise', abreise: 'Abreise', zimmerwunsch: 'Zimmerwunsch', nachricht: 'Nachricht' }
    },
    en: {
      bookDates: 'Please choose a check-out date after your check-in date.',
      bookPast: 'Check-in cannot be in the past.',
      bookBoth: 'Please choose both dates, or leave both fields empty.',
      lampDone: 'The light is on',
      lampLive: 'The light is on. Welcome to the Beletage.',
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
      sending: 'Sending …',
      formInvalid: 'Please check the highlighted fields.',
      formOk: 'Thank you! Your request has reached us. We will reply by email.',
      formErr: 'Sorry, that did not work. Please call us (+49 30 8827193) or write to berlin@hotel-pensionfunk.de.',
      formMail: 'Your email app is opening with your request ready to go. Just press send there.',
      mailSubject: 'Room request from the website',
      labels: { name: 'Name', email: 'Email', telefon: 'Phone', gaeste: 'Guests', anreise: 'Arrival', abreise: 'Departure', zimmerwunsch: 'Room preference', nachricht: 'Message' }
    }
  }[LANG];

  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* =========================================================
     1. Booking.com: the most important job of this page
     ========================================================= */
  const BOOKING_BASE = 'https://www.booking.com/hotel/de/pension-funk.html';
  const bookForm = $('#booking-form');
  const bkIn = $('#bk-in');
  const bkOut = $('#bk-out');
  const bkAdults = $('#bk-adults');
  const bkRooms = $('#bk-rooms');
  const bookMsg = $('#book-msg');

  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = fromIso(s); d.setDate(d.getDate() + n); return iso(d); };
  const todayIso = () => iso(new Date());

  function bookingUrl() {
    const p = new URLSearchParams();
    const ci = bkIn ? bkIn.value : '';
    const co = bkOut ? bkOut.value : '';
    if (ci && co && co > ci) { p.set('checkin', ci); p.set('checkout', co); }
    p.set('group_adults', (bkAdults && bkAdults.value) || '2');
    p.set('group_children', '0');
    p.set('no_rooms', (bkRooms && bkRooms.value) || '1');
    p.set('lang', LANG === 'en' ? 'en-gb' : 'de');
    p.set('selected_currency', 'EUR');
    return `${BOOKING_BASE}?${p.toString()}`;
  }

  let lastUrl = '';
  function syncBookingLinks() {
    const url = bookingUrl();
    if (url === lastUrl) return;
    lastUrl = url;
    $$('a.js-book').forEach(a => { a.href = url; });
  }

  function setBookMsg(text) {
    if (bookMsg && bookMsg.textContent !== text) bookMsg.textContent = text;
  }

  if (bookForm && bkIn && bkOut) {
    const t = todayIso();
    bkIn.min = t;
    bkOut.min = addDays(t, 1);

    bkIn.addEventListener('change', () => {
      if (bkIn.value) {
        const next = addDays(bkIn.value, 1);
        bkOut.min = next;
        if (!bkOut.value || bkOut.value <= bkIn.value) bkOut.value = next;
      }
      setBookMsg('');
      syncBookingLinks();
      prefillInquiry();
    });
    bkOut.addEventListener('change', () => { setBookMsg(''); syncBookingLinks(); prefillInquiry(); });
    [bkAdults, bkRooms].forEach(el => el && el.addEventListener('change', () => { syncBookingLinks(); prefillInquiry(); }));

    bookForm.addEventListener('submit', e => {
      e.preventDefault();
      const ci = bkIn.value, co = bkOut.value;
      if ((ci && !co) || (!ci && co)) { setBookMsg(TEXT.bookBoth); (ci ? bkOut : bkIn).focus(); return; }
      if (ci && ci < todayIso()) { setBookMsg(TEXT.bookPast); bkIn.focus(); return; }
      if (ci && co && co <= ci) { setBookMsg(TEXT.bookDates); bkOut.focus(); return; }
      setBookMsg('');
      window.location.assign(bookingUrl());
    });
  }
  syncBookingLinks();

  /* carry the booking dates into the inquiry form when it is still empty */
  function prefillInquiry() {
    const fin = $('#f-in'), fout = $('#f-out'), fg = $('#f-guests');
    if (fin && !fin.dataset.touched && bkIn && bkIn.value) fin.value = bkIn.value;
    if (fout && !fout.dataset.touched && bkOut && bkOut.value) fout.value = bkOut.value;
    if (fg && !fg.dataset.touched && bkAdults) fg.value = bkAdults.value;
  }

  /* =========================================================
     2. Header state, mobile navigation
     ========================================================= */
  const header = $('.site-header');
  const navToggle = $('.nav-toggle');
  const nav = $('#site-nav');
  const alwaysSolid = header && header.classList.contains('solid');
  let headerSolid = null;

  function updateHeader() {
    if (!header || alwaysSolid) return;
    const solid = window.scrollY > 40;
    if (solid !== headerSolid) { headerSolid = solid; header.classList.toggle('solid', solid); }
  }

  function setNav(open) {
    if (!navToggle) return;
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? TEXT.menuClose : TEXT.menuOpen);
    document.body.classList.toggle('nav-open', open);
    if (open) { const first = nav && nav.querySelector('a'); if (first) first.focus(); }
  }
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => setNav(navToggle.getAttribute('aria-expanded') !== 'true'));
    $$('a', nav).forEach(a => a.addEventListener('click', () => setNav(false)));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { setNav(false); navToggle.focus(); }
    });
    matchMedia('(min-width: 981px)').addEventListener('change', e => { if (e.matches) setNav(false); });
  }

  /* =========================================================
     3. Scroll-linked timeline (one rAF per scroll burst, rests when idle)
     ========================================================= */
  const timeline = $('.timeline');
  const tlItems = timeline ? $$('li', timeline) : [];
  let tlStops = [];
  let tlLast = -1;
  let tlPinned = false;

  function measureTimeline() {
    if (!timeline) return;
    const h = timeline.offsetHeight || 1;
    tlStops = tlItems.map(li => (li.offsetTop + 10) / h);
  }
  function updateTimeline() {
    if (!timeline || tlPinned) return;
    const r = timeline.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.bottom < -200 || r.top > vh + 200) return;
    let p = (vh * 0.72 - r.top) / r.height;
    p = Math.min(1, Math.max(0, p));
    const q = Math.round(p * 400) / 400;
    if (q === tlLast) return;
    tlLast = q;
    timeline.style.setProperty('--tl', q);
    tlItems.forEach((li, i) => {
      const on = q >= tlStops[i] - 0.001;
      if (li.classList.contains('on') !== on) li.classList.toggle('on', on);
    });
  }

  let ticking = false;
  function frame() { ticking = false; updateHeader(); updateTimeline(); }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measureTimeline(); tlLast = -1; onScroll(); }, { passive: true });
  measureTimeline();
  frame();

  /* =========================================================
     4. Entrances, living elements, paused when not visible
     ========================================================= */
  const revealEls = $$('.reveal, .stagger, .ornament');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add('in');
        io.unobserve(el);
        if (el.classList.contains('stagger')) setTimeout(() => el.classList.add('done'), 1800);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));

    const liveIO = new IntersectionObserver(entries => {
      entries.forEach(e => e.target.classList.toggle('offscreen', !e.isIntersecting));
    }, { rootMargin: '120px 0px' });
    $$('[data-live]').forEach(s => liveIO.observe(s));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }
  document.addEventListener('visibilitychange', () => document.body.classList.toggle('paused', document.hidden));

  /* =========================================================
     5. The one interactive moment: hold to light the chandelier
     ========================================================= */
  const lamp = $('[data-lamp]');
  let lampApi = null;
  if (lamp) {
    const btn = $('.hold-btn', lamp);
    const label = $('.hold-label', lamp);
    const status = $('.lamp-status', lamp);
    const startLabel = label ? label.textContent : '';
    const HOLD_MS = 1400;
    const RELEASE_MS = 900;
    let p = 0, shown = -1, holding = false, raf = null, last = 0, lit = false, keyHold = false, userLit = false;

    const setP = v => {
      const q = Math.round(v * 100) / 100;
      if (q !== shown) { shown = q; lamp.style.setProperty('--p', q); }
    };
    function loop(now) {
      const dt = Math.min(64, now - (last || now));
      last = now;
      p = holding ? Math.min(1, p + dt / HOLD_MS) : Math.max(0, p - dt / RELEASE_MS);
      setP(p);
      if (holding && p >= 1) { complete(true); }
      if (!lit && ((holding && p < 1) || (!holding && p > 0))) raf = requestAnimationFrame(loop);
      else { raf = null; last = 0; }
    }
    function start() {
      if (lit) return;
      holding = true;
      btn.classList.add('holding');
      if (!raf) raf = requestAnimationFrame(loop);
    }
    function stop() {
      holding = false;
      btn.classList.remove('holding');
      if (!raf && !lit && p > 0) raf = requestAnimationFrame(loop);
    }
    function complete(byUser) {
      lit = true;
      if (byUser) userLit = true;
      holding = false;
      p = 1;
      setP(1);
      btn.classList.remove('holding');
      lamp.classList.add('lit');
      btn.setAttribute('aria-pressed', 'true');
      if (label) label.textContent = TEXT.lampDone;
      if (status) status.textContent = TEXT.lampLive;
    }
    function reset() {
      if (userLit) return;
      lit = false; p = 0; setP(0);
      lamp.classList.remove('lit');
      btn.removeAttribute('aria-pressed');
      if (label) label.textContent = startLabel;
      if (status) status.textContent = '';
    }

    btn.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      e.preventDefault();
      try { btn.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      start();
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => btn.addEventListener(ev, stop));
    btn.addEventListener('keydown', e => {
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); keyHold = true; start(); }
    });
    btn.addEventListener('keyup', e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); keyHold = false; stop(); }
    });
    btn.addEventListener('contextmenu', e => e.preventDefault());
    /* screen readers activate buttons with a synthetic click and no hold: light it straight away */
    btn.addEventListener('click', e => { if (e.detail === 0 && !keyHold && !lit) complete(true); });

    lampApi = { pin: () => { if (!lit) complete(false); }, unpin: reset };
  }

  /* =========================================================
     6. Reduced motion, live in both directions
     ========================================================= */
  function pinToFinalStates() {
    revealEls.forEach(el => el.classList.add('in'));
    tlPinned = true;
    doc.classList.add('pinned');
    if (timeline) { timeline.style.setProperty('--tl', 1); tlItems.forEach(li => li.classList.add('on')); }
    if (lampApi) lampApi.pin();
  }
  function unpinFinalStates() {
    tlPinned = false;
    doc.classList.remove('pinned');
    tlLast = -1;
    measureTimeline();
    updateTimeline();
    if (lampApi) lampApi.unpin();
  }
  if (reduceMQ.matches) pinToFinalStates();
  reduceMQ.addEventListener('change', e => { if (e.matches) pinToFinalStates(); else unpinFinalStates(); });

  /* =========================================================
     7. Gallery lightbox
     ========================================================= */
  const dlg = $('#lightbox');
  const links = $$('.gallery a');
  if (dlg && links.length && typeof dlg.showModal === 'function') {
    const img = $('#lb-img'), cap = $('#lb-cap'), count = $('#lb-count');
    let idx = 0, opener = null;
    const show = i => {
      idx = (i + links.length) % links.length;
      const a = links[idx];
      const thumb = a.querySelector('img');
      img.src = a.getAttribute('href');
      img.alt = thumb ? thumb.alt : '';
      cap.textContent = thumb ? thumb.alt : '';
      count.textContent = `${idx + 1} / ${links.length}`;
    };
    links.forEach((a, i) => a.addEventListener('click', e => {
      e.preventDefault();
      opener = a;
      show(i);
      dlg.showModal();
    }));
    $('.lb-prev', dlg).addEventListener('click', () => show(idx - 1));
    $('.lb-next', dlg).addEventListener('click', () => show(idx + 1));
    $('.lb-close', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    dlg.addEventListener('close', () => { if (opener) opener.focus(); });
    let tx = null;
    dlg.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', e => {
      if (tx === null) return;
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      tx = null;
    });
  }

  /* =========================================================
     8. Map: loads only after the visitor's click (privacy)
     ========================================================= */
  $$('[data-map]').forEach(box => {
    const b = $('button', box);
    if (!b) return;
    b.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = box.dataset.map;
      f.title = box.dataset.title || 'Map';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      box.replaceChildren(f);
      box.classList.add('loaded');
    });
  });

  /* =========================================================
     9. Inquiry form (Formspree, PHP script, or mailto fallback)
     ========================================================= */
  const form = $('#anfrage-form');
  if (form) {
    const status = $('#form-status');
    const submit = $('button[type="submit"]', form);
    const submitLabel = submit ? $('.btn-label', submit) : null;
    const labelText = submitLabel ? submitLabel.textContent : '';
    const fin = $('#f-in'), fout = $('#f-out');
    const MAIL_TO = 'berlin@hotel-pensionfunk.de';

    ['#f-in', '#f-out', '#f-guests'].forEach(s => {
      const el = $(s);
      if (el) el.addEventListener('input', () => { el.dataset.touched = '1'; });
    });
    if (fin && fout) {
      fin.min = todayIso();
      fin.addEventListener('change', () => {
        if (fin.value) {
          fout.min = addDays(fin.value, 1);
          if (!fout.value || fout.value <= fin.value) fout.value = addDays(fin.value, 1);
        }
      });
    }

    const setStatus = (cls, text) => {
      status.className = `form-status ${cls}`;
      status.textContent = text;
    };
    const markField = (el, ok) => {
      const wrap = el.closest('.ff');
      if (wrap) wrap.classList.toggle('invalid', !ok);
      el.setAttribute('aria-invalid', String(!ok));
    };
    $$('[required]', form).forEach(el => el.addEventListener('change', () => {
      if (el.closest('.ff') && el.closest('.ff').classList.contains('invalid')) markField(el, el.type === 'checkbox' ? el.checked : el.checkValidity() && el.value.trim() !== '');
    }));

    function validate() {
      let first = null;
      $$('[required]', form).forEach(el => {
        const ok = el.type === 'checkbox' ? el.checked : (el.value.trim() !== '' && el.checkValidity());
        markField(el, ok);
        if (!ok && !first) first = el;
      });
      if (fin && fout) {
        const bad = fin.value && fout.value && fout.value <= fin.value;
        markField(fout, !bad);
        if (bad && !first) first = fout;
      }
      return first;
    }

    function mailtoFallback() {
      const fd = new FormData(form);
      const lines = Object.keys(TEXT.labels)
        .filter(k => (fd.get(k) || '').toString().trim() !== '')
        .map(k => `${TEXT.labels[k]}: ${fd.get(k)}`);
      const href = `mailto:${MAIL_TO}?subject=${encodeURIComponent(TEXT.mailSubject)}&body=${encodeURIComponent(lines.join('\n'))}`;
      setStatus('info', TEXT.formMail);
      window.location.href = href;
    }

    /* coming back from the PHP script without JavaScript fetch (?anfrage=danke / fehler) */
    const back = new URLSearchParams(location.search).get('anfrage');
    if (back === 'danke') setStatus('ok', TEXT.formOk);
    if (back === 'fehler') setStatus('err', TEXT.formErr);

    form.addEventListener('submit', async e => {
      e.preventDefault();
      setStatus('', '');
      const bad = validate();
      if (bad) { setStatus('err', TEXT.formInvalid); bad.focus(); return; }
      if (form.elements._gotcha && form.elements._gotcha.value) { setStatus('ok', TEXT.formOk); form.reset(); return; }

      const action = form.getAttribute('action') || '';
      if (!action || action.includes('DEIN-FORMULAR-ID')) { mailtoFallback(); return; }

      submit.disabled = true;
      if (submitLabel) submitLabel.textContent = TEXT.sending;
      try {
        const res = await fetch(action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        let data = null;
        try { data = await res.json(); } catch (_) { /* non-JSON answer */ }
        if (!res.ok || (data && data.ok === false)) throw new Error(`HTTP ${res.status}`);
        setStatus('ok', TEXT.formOk);
        form.reset();
        $$('.ff.invalid', form).forEach(w => w.classList.remove('invalid'));
      } catch (err) {
        setStatus('err', TEXT.formErr);
      } finally {
        submit.disabled = false;
        if (submitLabel) submitLabel.textContent = labelText;
        status.focus();
      }
    });
  }

  /* =========================================================
     10. Small things
     ========================================================= */
  $$('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
})();
