(() => {
  window.__brownieReady = true;
  const root = document.documentElement;
  const reduced = root.classList.contains('reduced');
  const thread = document.getElementById('thread');
  const statusTime = document.getElementById('statusTime');
  const outro = document.getElementById('outro');
  const items = [...thread.children].filter(el => !el.hasAttribute('data-manual') && !el.classList.contains('mic-hint'));
  const isOpen = el => (!el.hasAttribute('data-gate') || thread.classList.contains('unlocked'))
    && (!el.hasAttribute('data-recall-gate') || thread.classList.contains('recall-ready'))
    && (!el.hasAttribute('data-sos-gate') || thread.classList.contains('sent'));
  const clockRows = [...document.querySelectorAll('[data-clock]')];
  const quizzes = [...document.querySelectorAll('.quiz')];
  const canAnim = !!(window.gsap && window.ScrollTrigger) && !reduced;
  const visible = el => el.offsetParent !== null;

  const show = (el) => {
    if (!el || !el.hidden) return;
    el.hidden = false;
    if (canAnim) gsap.fromTo(el, { autoAlpha: 0, y: 24, scale: .97 }, { autoAlpha: 1, y: 0, scale: 1, duration: .85, ease: 'power2.out' });
  };

  // ── the conversation plays itself: think, then the message lands ──
  let playing = false;
  const arrive = (row) => {
    row.classList.remove('waiting');
    row.classList.add('arrived');
    row.dataset.arrived = '1';
    if (row.id === 'contactingRow') setTimeout(ring, 4500);
  };
  const playNext = () => {
    const row = items.find(r => !r.dataset.arrived && isOpen(r) && !r.classList.contains('pending'));
    if (!row) { playing = false; return; }
    playing = true;
    row.classList.add('waiting');
    row.scrollIntoView({ behavior: 'smooth', block: 'end' });
    const delay = row.hasAttribute('data-think') ? 3600 : 2100;
    setTimeout(() => {
      arrive(row);
      setTimeout(playNext, 1000);
    }, delay);
  };
  const startPlayer = () => { if (!playing) playNext(); };

  // rows above the gate are already on screen
  items.forEach(r => {
    if (r.hasAttribute('data-gate')) return;
    r.classList.add('arrived');
    r.dataset.arrived = '1';
  });

  // ── Got it! sends the reply, then unlocks the rest ──
  const gotitRow = document.getElementById('gotitRow');
  document.querySelectorAll('[data-gotit]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.row').classList.add('done');
      if (thread.classList.contains('unlocked')) return;
      if (gotitRow) {
        gotitRow.classList.remove('pending');
        const b = gotitRow.querySelector('.msg');
        if (canAnim) gsap.fromTo(b, { autoAlpha: 0, y: 26, scale: .94 }, { autoAlpha: 1, y: 0, scale: 1, duration: .5, ease: 'back.out(1.6)' });
      }
      setTimeout(() => {
        thread.classList.add('unlocked');
        if (canAnim) ScrollTrigger.refresh();
        startPlayer();
      }, 1300);
    });
  });

  const recallLesson = document.getElementById('recallLesson');
  const recallContinue = document.querySelector('[data-recall-continue]');
  if (recallContinue) recallContinue.addEventListener('click', () => {
    if (thread.classList.contains('recall-ready')) return;
    recallContinue.disabled = true;
    if (recallLesson) recallLesson.classList.add('done');
    thread.classList.add('recall-ready');
    if (canAnim) ScrollTrigger.refresh();
    setTimeout(startPlayer, 700);
  });

  // ── tap Brownie and send the scripted help message ──
  const mic = document.getElementById('mic');
  const sosBrownie = document.getElementById('sosBrownie');
  const audioReceivingRow = document.getElementById('audioReceivingRow');
  const youSaidRow = document.getElementById('youSaidRow');
  let helpPending = false;
  const releaseAfterMessage = () => {
    helpPending = false;
    if (mic) mic.disabled = false;
    if (sosBrownie) sosBrownie.disabled = false;
    thread.classList.add('sent');
    if (canAnim) ScrollTrigger.refresh();
    startPlayer();
  };
  const sendHelp = () => {
    if (helpPending || !thread.classList.contains('unlocked') || !thread.classList.contains('mic-ready') || thread.classList.contains('sent')) return;
    helpPending = true;
    if (mic) { mic.disabled = true; mic.classList.remove('recording'); }
    if (sosBrownie) sosBrownie.disabled = true;
    if (audioReceivingRow) {
      audioReceivingRow.hidden = false;
      audioReceivingRow.classList.add('arrived');
      audioReceivingRow.dataset.arrived = '1';
      audioReceivingRow.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    setTimeout(() => {
      if (audioReceivingRow) audioReceivingRow.hidden = true;
      if (youSaidRow) {
        const message = youSaidRow.querySelector('.msg');
        youSaidRow.classList.add('arrived');
        youSaidRow.dataset.arrived = '1';
        youSaidRow.hidden = false;
        if (canAnim) gsap.fromTo(message, { autoAlpha: 0, y: 28, scale: .94 }, { autoAlpha: 1, y: 0, scale: 1, duration: .7, ease: 'power2.out' });
        youSaidRow.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
      setTimeout(releaseAfterMessage, 700);
    }, 3000);
  };
  if (mic) mic.addEventListener('click', sendHelp);
  if (sosBrownie) sosBrownie.addEventListener('click', sendHelp);

  // ── the daily quiz ──
  quizzes.forEach((quiz) => {
    const answer = (quiz.dataset.answer || '').trim().toLowerCase();
    const opts = [...quiz.querySelectorAll('[data-opt]')];
    const ansRow = quiz.querySelector('[data-ans]');
    const good = quiz.querySelector('[data-good]');
    const bad = quiz.querySelector('[data-bad]');
    const ptsGood = quiz.querySelector('[data-ptsgood]');
    const ptsBad = quiz.querySelector('[data-ptsbad]');
    let done = false;

    opts.forEach(btn => btn.addEventListener('click', () => {
      if (done) return;
      done = true;
      const picked = btn.textContent.trim();
      const right = picked.toLowerCase() === answer;

      opts.forEach(b => {
        b.disabled = true;
        const isAnswer = b.textContent.trim().toLowerCase() === answer;
        if (isAnswer) b.classList.add('correct');
        else if (b === btn) b.classList.add('wrong');
        else b.classList.add('dim');
      });

      if (ansRow) {
        const p = document.createElement('p');
        p.textContent = picked;
        ansRow.querySelector('.msg').insertBefore(p, ansRow.querySelector('.meta'));
        ansRow.hidden = false;
        if (canAnim) gsap.fromTo(ansRow.querySelector('.msg'), { autoAlpha: 0, y: 20, scale: .96 }, { autoAlpha: 1, y: 0, scale: 1, duration: .6, ease: 'power2.out' });
      }
      setTimeout(() => show(right ? good : bad), 700);
      setTimeout(() => show(right ? ptsGood : ptsBad), 1400);
      // the quiz comes first — only then is the microphone offered
      setTimeout(() => {
        thread.classList.add('mic-ready');
        const hint = document.querySelector('.mic-hint');
        if (hint) hint.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 2300);
    }));
  });

  // ── scroll frame: clock ──
  let ticking = false;
  const frame = () => {
    ticking = false;
    const line = innerHeight * 0.55;
    let clock = null;
    for (const r of clockRows) if (visible(r) && r.getBoundingClientRect().top <= line) clock = r.dataset.clock;
    if (clock && statusTime.textContent !== clock) statusTime.textContent = clock;
    if (outro) document.body.classList.toggle('chat-over', outro.getBoundingClientRect().top < innerHeight * 0.5);
  };
  const request = () => { if (ticking) return; ticking = true; requestAnimationFrame(frame); };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  frame();

  // ── incoming call from the caretaker ──
  const callEl = document.getElementById('call');
  const callSub = document.getElementById('callSub');
  const callTimer = document.getElementById('callTimer');
  const contactingRow = document.getElementById('contactingRow');
  let callTick = null;
  let callSecs = 0;
  let callAnchor = null;
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const anchor = () => callAnchor || contactingRow || thread;
  const pop = (el) => {
    if (canAnim) gsap.fromTo(el, { autoAlpha: 0, y: 22, scale: .96 }, { autoAlpha: 1, y: 0, scale: 1, duration: .7, ease: 'power2.out' });
  };
  const insertMsg = (html) => {
    const row = document.createElement('div');
    row.className = 'row in arrived';
    row.innerHTML = `<div class="msg in">${html}</div>`;
    anchor().insertAdjacentElement('afterend', row);
    callAnchor = row;
    pop(row.querySelector('.msg'));
  };
  const insertLog = (text) => {
    const chip = document.createElement('p');
    chip.className = 'call-log';
    chip.textContent = text;
    anchor().insertAdjacentElement('afterend', chip);
    callAnchor = chip;
    pop(chip);
  };

  const endCall = (answered) => {
    if (callTick) { clearInterval(callTick); callTick = null; }
    if (!callEl) return;
    callEl.dataset.handled = '1';
    callEl.hidden = true;
    callEl.setAttribute('aria-hidden', 'true');
    callEl.classList.remove('ringing', 'connected');
    root.classList.remove('in-call');
    document.body.classList.remove('in-call');
    insertLog(answered ? `📞 Voice call · ${mmss(callSecs)}` : '📞 Declined voice call');

  };

  const answerCall = () => {
    if (!callEl) return;
    callEl.dataset.handled = '1';
    callEl.classList.remove('ringing');
    callEl.classList.add('connected');
    callSub.textContent = 'Simulated call · connected';
    callTimer.hidden = false;
    callSecs = 0;
    callTimer.textContent = mmss(0);
    insertMsg('<p><strong>Joey has been contacted.</strong> Stay on the line.</p>');
    callTick = setInterval(() => {
      callSecs++;
      callTimer.textContent = mmss(callSecs);
      if (callSecs >= 6) endCall(true);
    }, 1000);
  };

  const ring = () => {
    if (!callEl || callEl.dataset.done || callEl.dataset.handled) return;
    callEl.dataset.done = '1';
    items.forEach(r => r.classList.remove('waiting'));
    callEl.hidden = false;
    callEl.setAttribute('aria-hidden', 'false');
    callEl.classList.add('ringing');
    root.classList.add('in-call');
    document.body.classList.add('in-call');
  };

  if (callEl) {
    const acc = document.querySelector('[data-call-accept]');
    const dec = document.querySelector('[data-call-decline]');
    const end = document.querySelector('[data-call-end]');
    if (acc) acc.addEventListener('click', answerCall);
    if (dec) dec.addEventListener('click', () => endCall(false));
    if (end) end.addEventListener('click', () => endCall(true));
  }

  if (canAnim) {
    root.classList.add('fx');
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }
})();
