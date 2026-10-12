(() => {
  'use strict';
  const cfg = window.LOCALNY_IT || {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];

  // One edit in config.js updates contact / location data across all pages.
  $$('[data-locality]').forEach(el => { el.textContent = cfg.locality || 'Twoja miejscowość i okolice'; });
  $$('[data-contact-email]').forEach(el => {
    if (cfg.email) { el.href = `mailto:${cfg.email}`; el.textContent = cfg.email; el.hidden = false; }
  });
  $$('[data-contact-phone]').forEach(el => {
    if (cfg.phone) { el.href = `tel:${cfg.phone.replace(/\s+/g,'')}`; el.textContent = cfg.phone; el.hidden = false; }
  });
  $$('[data-messenger-link]').forEach(el => {
    if (cfg.messengerUrl && /^https:\/\//.test(cfg.messengerUrl)) {
      el.href = cfg.messengerUrl;
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  });
  $$('[data-messenger-pending]').forEach(el => { el.hidden = !!cfg.messengerUrl; });
  $$('[data-contact-optional]').forEach(el => { el.hidden = !cfg.email && !cfg.phone; });

  // Sticky header + slim reading progress.
  const header = $('.site-header');
  const progress = $('.scroll-progress');
  let scheduled = false;
  function onScroll() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      header?.classList.toggle('scrolled', y > 22);
      if (progress) {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${total > 0 ? y / total : 0})`;
      }
      scheduled = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile navigation with keyboard escape and sensible focus handling.
  const toggle = $('[data-menu-toggle]');
  const nav = $('[data-mobile-nav]');
  function setMenu(open) {
    nav?.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    toggle?.setAttribute('aria-expanded', String(open));
    toggle?.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
    const symbol = $('use', toggle);
    if (symbol) symbol.setAttribute('href', open ? '/assets/icons.svg#close' : '/assets/icons.svg#menu');
  }
  toggle?.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('a', nav || document.createElement('nav')).forEach(el => el.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 800) setMenu(false); });

  // Reveal transitions: independent from user input / accessible without JS.
  if ('IntersectionObserver' in window && !reduced) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -20px 0px' });
    $$('[data-reveal]').forEach(el => { el.classList.add('reveal-ready'); observer.observe(el); });
  }

  // Ambient cursor spotlight, capped to hero and only for fine pointing devices.
  if (!reduced && window.matchMedia('(pointer:fine)').matches) {
    $$('.spotlight-area').forEach(area => {
      area.addEventListener('pointermove', event => {
        const rect = area.getBoundingClientRect();
        area.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
        area.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
      }, { passive: true });
    });
    const panel = $('.diagnostic-console');
    if (panel) {
      panel.addEventListener('pointermove', event => {
        const rect = panel.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        panel.style.transform = `perspective(900px) rotateY(${x * 3}deg) rotateX(${-y * 3}deg)`;
      }, { passive: true });
      panel.addEventListener('pointerleave', () => { panel.style.transform = ''; });
    }
  }

  // Fun but useful mini problem router: immediate, tailored next steps.
  const issues = {
    slow: { icon: 'laptop', status:'DIAGNOSTYKA WYDAJNOŚCI', title: 'Komputer działa wolno?', text:'Sprawdzę, co go spowalnia: uruchamiane programy, stan dysku, pamięć i konfigurację systemu.', checks:['Stan systemu i dysku', 'Programy w tle', 'Możliwości modernizacji'], href:'/uslugi/#komputery' },
    setup: { icon:'monitor', status:'KONFIGURACJA SYSTEMU', title:'Nowy komputer lub Windows?', text:'Pomogę uruchomić sprzęt od zera, skonfigurować system, sterowniki, aktualizacje i potrzebne programy.', checks:['Instalacja i aktualizacje', 'Sterowniki i programy', 'Podstawowe zabezpieczenia'], href:'/uslugi/#systemy' },
    printer: { icon:'printer', status:'URZĄDZENIA I SIEĆ', title:'Drukarka lub Wi-Fi nie działa?', text:'Zajmę się połączeniem urządzeń, konfiguracją sieci oraz typowymi problemami z drukowaniem.', checks:['Sprawdzenie połączenia', 'Konfiguracja sterowników', 'Test działania'], href:'/uslugi/#sieci' },
    website: { icon:'globe', status:'TWORZENIE STRON WWW', title:'Potrzebujesz strony internetowej?', text:'Przygotuję przejrzystą stronę wizytówkę lub pomogę przy istniejącej witrynie WordPress.', checks:['Omówienie potrzeb', 'Projekt i wdrożenie', 'Pomoc po publikacji'], href:'/uslugi/#www' }
  };
  const diag = $('[data-diagnostic]');
  if (diag) {
    const buttons = $$('[data-issue]', diag);
    let switching;
    function selectIssue(key) {
      const data = issues[key];
      if (!data) return;
      buttons.forEach(btn => {
        const selected = btn.dataset.issue === key;
        btn.classList.toggle('selected', selected);
        btn.setAttribute('aria-pressed', String(selected));
      });
      const result = $('[data-diag-result]', diag);
      if (!result) return;
      clearTimeout(switching);
      result.classList.add('switching');
      switching = setTimeout(() => {
        $('[data-diag-status]', diag).textContent = data.status;
        $('[data-diag-title]', diag).textContent = data.title;
        $('[data-diag-desc]', diag).textContent = data.text;
        const checklist = $('[data-diag-checks]', diag);
        checklist.replaceChildren(...data.checks.map(t => {
          const li = document.createElement('li');
          li.textContent = t;
          return li;
        }));
        const link = $('[data-diag-link]', diag);
        link.href = data.href;
        result.classList.remove('switching');
      }, reduced ? 0 : 130);
    }
    buttons.forEach(btn => btn.addEventListener('click', () => selectIssue(btn.dataset.issue)));
  }

  // Scroll-followed process timeline. This keeps steps meaningful rather than gimmicky.
  const journey = $('[data-journey]');
  if (journey && 'IntersectionObserver' in window) {
    const cards = $$('[data-step]', journey);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = Number(entry.target.dataset.step);
          cards.forEach((card, i) => card.classList.toggle('active', i <= idx));
          journey.style.setProperty('--journey-progress', `${(idx / Math.max(1, cards.length - 1)) * 100}%`);
          const count = $('[data-journey-number]', journey);
          if (count) count.textContent = `0${idx + 1}`;
        }
      });
    }, { rootMargin: '-25% 0px -50% 0px', threshold: 0 });
    cards.forEach(card => observer.observe(card));
  }

  // Service categories: accessible button chips + live count.
  const filterBar = $('[data-service-filters]');
  if (filterBar) {
    const cards = $$('[data-service-category]');
    const buttons = $$('[data-filter]', filterBar);
    const label = $('[data-filter-count]');
    buttons.forEach(btn => btn.addEventListener('click', () => {
      const value = btn.dataset.filter;
      buttons.forEach(other => {
        other.classList.toggle('active', other === btn);
        other.setAttribute('aria-pressed', String(other === btn));
      });
      let visible = 0;
      cards.forEach(card => {
        const show = value === 'all' || card.dataset.serviceCategory.split(' ').includes(value);
        card.hidden = !show;
        if (show) visible++;
      });
      if (label) label.textContent = `${visible} ${visible === 1 ? 'obszar' : 'obszarów'} pomocy`;
    }));
  }

  // Zgloszenia trafiaja do FormSubmit bez klucza API i bez otwierania poczty klienta.
  // FormSubmit zwraca success jako tekst "true" / "false": nie wolno sprawdzac truthiness!
  const inquiryForm = $('[data-inquiry-form]');
  if (inquiryForm) {
    const sendButton = $('[data-submit-inquiry]', inquiryForm);
    const buttonText = $('[data-submit-text]', inquiryForm);
    const status = $('[data-form-status]', inquiryForm);
    const confirmation = $('[data-form-success]');
    function showFormStatus(message, kind) {
      status.textContent = message;
      status.className = 'form-status ' + (kind || '');
      status.hidden = false;
    }
    inquiryForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!inquiryForm.reportValidity() || sendButton.disabled) return;
      const raw = new FormData(inquiryForm);
      const honeypot = String(raw.get('_honey') || '');
      // Czytelne polskie etykiety pol w wiadomosci e-mail.
      const payload = {
        'Imię i nazwisko': String(raw.get('name') || '').trim(),
        'Numer telefonu': String(raw.get('phone') || '').trim(),
        'Miejscowość': String(raw.get('city') || '').trim(),
        'Rodzaj problemu': String(raw.get('topic') || '').trim(),
        'Opis problemu': String(raw.get('description') || '').trim(),
        '_subject': 'Nowe zgłoszenie | Lokalny Informatyk',
        '_template': 'table',
        '_captcha': 'false',
        '_url': 'https://lokalny-informatyk.pages.dev/kontakt/',
        '_honey': honeypot
      };
      status.hidden = true;
      sendButton.disabled = true;
      sendButton.setAttribute('aria-busy', 'true');
      buttonText.textContent = 'Wysyłanie zgłoszenia…';
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        let response;
        try {
          response = await fetch('https://formsubmit.co/ajax/informatyk.lokalny@gmail.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
          });
        } finally { clearTimeout(timeout); }
        const result = await response.json().catch(() => ({}));
        const successful = result.success === true || result.success === 'true';
        if (!response.ok || !successful) {
          // Na pierwszy test FormSubmit wysyla wlascicielowi wiadomosc aktywacyjna.
          const needsActivation = /activat|confirm|aktywac|potwierdz/i.test(String(result.message || ''));
          if (needsActivation) throw new Error('Formularz oczekuje na aktywację przez właściciela strony. Na razie skontaktuj się przez Facebooka.');
          throw new Error('Nie udało się wysłać zgłoszenia. Spróbuj ponownie lub napisz przez Facebooka.');
        }
        inquiryForm.hidden = true;
        const intro = $('.form-heading', inquiryForm.parentElement);
        if (intro) intro.hidden = true;
        if (confirmation) { confirmation.hidden = false; confirmation.focus(); }
      } catch (error) {
        const message = error.name === 'AbortError'
          ? 'Wysyłanie trwało zbyt długo. Sprawdź połączenie i spróbuj ponownie.'
          : error.message || 'Nie udało się wysłać zgłoszenia. Spróbuj ponownie.';
        showFormStatus(message, 'error');
      } finally {
        sendButton.disabled = false;
        sendButton.removeAttribute('aria-busy');
        buttonText.textContent = 'Wyślij zgłoszenie';
      }
    });
    $('[data-new-inquiry]')?.addEventListener('click', () => {
      inquiryForm.reset();
      inquiryForm.hidden = false;
      status.hidden = true;
      const intro = $('.form-heading', inquiryForm.parentElement);
      if (intro) intro.hidden = false;
      if (confirmation) confirmation.hidden = true;
      $('#contact-name', inquiryForm)?.focus();
    });
  }
  let toastTimeout;
  function showToast(message) {
    const toast = $('[data-toast]');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3800);
  }
})();
