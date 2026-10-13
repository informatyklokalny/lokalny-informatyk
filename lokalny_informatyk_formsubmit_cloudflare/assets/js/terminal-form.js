/* Interaktywna konsola kontaktowa. Wysyłkę FormSubmit realizuje obecny main.js. */
(() => {
  'use strict';
  const form = document.querySelector('[data-console-form]');
  if (!form) return;

  const stages = Array.from(form.querySelectorAll('[data-console-stage]'));
  const fields = stages.map(stage => stage.querySelector('input, select, textarea'));
  const questions = ['Jak masz na imię?', 'Podaj swoje nazwisko.', 'Na jaki numer mogę oddzwonić?', 'W jakiej miejscowości potrzebujesz pomocy?', 'Czego dotyczy problem?', 'Opisz, co się dzieje ze sprzętem.'];
  const summaryLabels = ['Imię', 'Nazwisko', 'Telefon', 'Miejscowość', 'Kategoria', 'Problem'];
  const progress = form.querySelector('[data-progress-track]');
  const progressFill = form.querySelector('[data-progress-fill]');
  const progressText = form.querySelector('[data-progress-label]');
  const progressPercent = form.querySelector('[data-progress-percent]');
  const history = form.querySelector('[data-console-history]');
  const nextBtn = form.querySelector('[data-console-next]');
  const backBtn = form.querySelector('[data-console-back]');
  const controls = form.querySelector('[data-console-controls]');
  const review = form.querySelector('[data-console-review]');
  const summary = form.querySelector('[data-console-summary]');
  const submitArea = form.querySelector('[data-console-submit-area]');
  const privacyAck = form.querySelector('[data-privacy-ack]');
  const privacyError = form.querySelector('[data-privacy-error]');
  const fullName = form.querySelector('#contact-name');
  let step = 0;

  const tidy = text => String(text || '').trim().replace(/\s+/g, ' ');
  // Polskie litery i nazwiska z łącznikiem lub apostrofem (np. Anna-Maria, O'Connor).
  const personalName = /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;
  const cityName = /^[\p{L}\p{M}]+(?:[ '\u2019.-][\p{L}\p{M}]+)*$/u;

  const errorFor = index => stages[index].querySelector('[data-console-error]');
  function setError(index, message = '') {
    const error = errorFor(index);
    error.textContent = message;
    error.hidden = !message;
    fields[index].setAttribute('aria-invalid', message ? 'true' : 'false');
  }
  function validate(index) {
    const value = tidy(fields[index].value);
    switch (index) {
      case 0:
      case 1:
        if (value.length < 2 || value.length > 70 || !personalName.test(value)) return 'Wpisz co najmniej 2 litery; bez cyfr i znaków specjalnych.';
        return '';
      case 2: {
        const compact = value.replace(/[\s().-]/g, '');
        const number = compact.startsWith('+48') ? compact.slice(3) : compact.startsWith('0048') ? compact.slice(4) : compact;
        if (!/^[1-9][0-9]{8}$/.test(number)) return 'Podaj polski 9-cyfrowy numer telefonu (możesz dodać +48).';
        return '';
      }
      case 3:
        if (value.length < 2 || value.length > 90 || !cityName.test(value)) return 'Wpisz poprawną nazwę miejscowości, bez cyfr.';
        return '';
      case 4:
        if (!value) return 'Wybierz kategorię problemu z listy.';
        return '';
      case 5:
        if (value.length < 10) return 'Opisz problem w co najmniej 10 znakach.';
        if (value.length > 2000) return 'Opis może mieć maksymalnie 2000 znaków.';
        return '';
      default: return '';
    }
  }
  function drawHistory() {
    history.querySelectorAll('[data-past-answer]').forEach(el => el.remove());
    for (let i = 0; i < Math.min(step, stages.length); i++) {
      const row = document.createElement('div');
      row.className = 'console-answer';
      row.dataset.pastAnswer = '';
      const prompt = document.createElement('span');
      prompt.className = 'console-prompt';
      prompt.textContent = '✓';
      prompt.setAttribute('aria-hidden', 'true');
      const copy = document.createElement('div');
      const label = document.createElement('span');
      label.className = 'console-answer-label';
      label.textContent = questions[i];
      const value = document.createElement('div');
      value.className = 'console-answer-value';
      value.textContent = tidy(fields[i].value);
      if (i === 5 && value.textContent.length > 180) value.textContent = value.textContent.slice(0, 180) + '…';
      copy.append(label, value);
      row.append(prompt, copy);
      history.append(row);
    }
    history.scrollTop = history.scrollHeight;
  }
  function drawSummary() {
    summary.replaceChildren();
    fields.forEach((field, i) => {
      const item = document.createElement('div');
      item.className = 'console-review-item';
      const dt = document.createElement('dt');
      dt.textContent = summaryLabels[i];
      const dd = document.createElement('dd');
      dd.textContent = tidy(field.value);
      item.append(dt, dd);
      summary.append(item);
    });
    fullName.value = tidy(fields[0].value) + ' ' + tidy(fields[1].value);
  }
  function render({focus = false} = {}) {
    const finished = step >= stages.length;
    stages.forEach((stage, index) => { stage.hidden = finished || index !== step; });
    review.hidden = !finished;
    submitArea.hidden = !finished;
    controls.hidden = finished;
    backBtn.hidden = step === 0;
    const percent = Math.round((step / stages.length) * 100);
    progress.setAttribute('aria-valuenow', String(percent));
    progressFill.style.width = percent + '%';
    progressPercent.textContent = percent + '%';
    progressText.textContent = finished ? 'Wszystkie kroki ukończone' : `Krok ${step + 1} z ${stages.length}`;
    drawHistory();
    if (finished) drawSummary();
    if (focus) {
      if (finished) privacyAck.focus({preventScroll: true});
      else fields[step].focus({preventScroll: true});
    }
  }
  function forward() {
    const message = validate(step);
    setError(step, message);
    if (message) { fields[step].focus({preventScroll: true}); return; }
    fields[step].value = tidy(fields[step].value);
    step = Math.min(stages.length, step + 1);
    render({focus: true});
  }
  nextBtn.addEventListener('click', forward);
  backBtn.addEventListener('click', () => { step = Math.max(0, step - 1); render({focus: true}); });
  fields.forEach((field, i) => {
    field.addEventListener('input', () => setError(i));
    field.addEventListener('change', () => setError(i));
    field.addEventListener('keydown', event => {
      if (event.key !== 'Enter' || event.isComposing) return;
      if (field.tagName === 'TEXTAREA' && !event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      if (step === i) forward();
    });
  });
  privacyAck.addEventListener('change', () => { privacyError.hidden = true; });

  // Capture is required: it runs before the existing FormSubmit listener in main.js.
  form.addEventListener('submit', event => {
    if (step !== stages.length) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (step < stages.length) forward();
      return;
    }
    for (let i = 0; i < stages.length; i++) {
      const message = validate(i);
      if (message) {
        event.preventDefault();
        event.stopImmediatePropagation();
        step = i;
        setError(i, message);
        render({focus:true});
        return;
      }
    }
    if (!privacyAck.checked) {
      event.preventDefault();
      event.stopImmediatePropagation();
      privacyError.textContent = 'Przed wysłaniem zaznacz, że zapoznałeś/aś się z informacją o danych.';
      privacyError.hidden = false;
      privacyAck.focus({preventScroll:true});
      return;
    }
    drawSummary();
  }, true);

  // main.js obsługuje przycisk „Wyślij kolejne zgłoszenie”.
  form.parentElement.querySelector('[data-new-inquiry]')?.addEventListener('click', () => {
    step = 0;
    privacyError.hidden = true;
    stages.forEach((_, i) => setError(i));
    render({focus:true});
  });
  render();
})();
