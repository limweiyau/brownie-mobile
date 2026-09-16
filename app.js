(() => {
  const experience = document.querySelector('.experience');
  const experienceFrame = document.querySelector('.experience-frame');
  const chatWindow = document.querySelector('.chat-window');
  const titles = [...document.querySelectorAll('.story-title')];
  const meters = [...document.querySelectorAll('.step-meter i')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canAnim = !!window.gsap && !reduced;
  const visible = (el) => el.offsetParent !== null;
  const toEnd = () => requestAnimationFrame(() => { thread.scrollTop = thread.scrollHeight; });

  chatWindow.classList.toggle('reduced', reduced);
  setTimeout(() => { if (!window.__brownieReady) chatWindow.classList.add('fallback'); }, 2500);

  /* ══ the transition: the box lifts and becomes the full WhatsApp ══ */
  let step = -1;
  const setStep = (n) => {
    if (n === step) return;
    step = n;
    titles.forEach((t, i) => t.classList.toggle('active', i === n));
    meters.forEach((m, i) => m.classList.toggle('active', i === n));
  };
  const range = () => Math.max(1, experience.offsetHeight - innerHeight);
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const p = Math.max(0, Math.min(1, (scrollY - experience.offsetTop) / range()));
    chatWindow.style.setProperty('--expand', Math.min(1, p / .18).toFixed(3));
    experienceFrame.classList.toggle('chat-full', p >= .24);
  };
  const requestScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScroll);
  };
  addEventListener('scroll', requestScroll, { passive: true });
  addEventListener('resize', requestScroll);
  onScroll();
  setStep(0);

  /* ══ the conversation plays itself: think, then the message lands ══ */
  const thread = document.getElementById('thread');
  const statusTime = document.getElementById('statusTime');
  // every child of the thread lands one at a time, in order —
  // messages, day pills and the quiz card alike. the mic hint is not in the
  // queue: the quiz reveals it, once the visitor has earned the microphone
  const items = [...thread.children].filter((el) => !el.hasAttribute('data-manual') && !el.classList.contains('mic-hint'));
  const isOpen = (el) => (!el.hasAttribute('data-gate') || thread.classList.contains('unlocked'))
    && (!el.hasAttribute('data-recall-gate') || thread.classList.contains('recall-ready'))
    && (!el.hasAttribute('data-sos-gate') || thread.classList.contains('sent'));
  const clockRows = [...document.querySelectorAll('[data-clock]')];
  const quizzes = [...document.querySelectorAll('.quiz')];

  const show = (el) => {
    if (!el || !el.hidden) return;
    el.hidden = false;
    if (canAnim) gsap.fromTo(el, { autoAlpha: 0, y: 24, scale: .97 }, { autoAlpha: 1, y: 0, scale: 1, duration: .85, ease: 'power2.out' });
  };

  let playing = false;
  const arrive = (row) => {
    row.classList.remove('waiting');
    row.classList.add('arrived');
    row.dataset.arrived = '1';
    toEnd();
    if (row.id === 'contactingRow') setTimeout(ring, 4500);
  };
  const playNext = () => {
    const row = items.find((r) => !r.dataset.arrived && isOpen(r) && !r.classList.contains('pending'));
    if (!row) { playing = false; return; }
    playing = true;
    row.classList.add('waiting');
    toEnd();
    const delay = row.hasAttribute('data-think') ? 3600 : 2100;
    setTimeout(() => {
      arrive(row);
      setTimeout(playNext, 1000);
    }, delay);
  };
  const startPlayer = () => { if (!playing) playNext(); };

  items.forEach((r) => {
    if (r.closest('[data-gate]')) return;
    r.classList.add('arrived');
    r.dataset.arrived = '1';
  });

  /* ══ Got it! sends the reply, then unlocks the rest ══ */
  const gotitRow = document.getElementById('gotitRow');
  document.querySelectorAll('[data-gotit]').forEach((btn) => {
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
        setStep(1);
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
    setTimeout(startPlayer, 700);
  });

  /* ══ tap Brownie and send the scripted help message ══ */
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
    setStep(3);
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
      toEnd();
    }
    setTimeout(() => {
      if (audioReceivingRow) audioReceivingRow.hidden = true;
      if (youSaidRow) {
        const message = youSaidRow.querySelector('.msg');
        youSaidRow.classList.add('arrived');
        youSaidRow.dataset.arrived = '1';
        youSaidRow.hidden = false;
        if (canAnim) gsap.fromTo(message, { autoAlpha: 0, y: 28, scale: .94 }, { autoAlpha: 1, y: 0, scale: 1, duration: .7, ease: 'power2.out' });
        toEnd();
      }
      setTimeout(releaseAfterMessage, 700);
    }, 3000);
  };
  if (mic) mic.addEventListener('click', sendHelp);
  if (sosBrownie) sosBrownie.addEventListener('click', sendHelp);

  /* ══ the daily quiz ══ */
  quizzes.forEach((quiz) => {
    const answer = (quiz.dataset.answer || '').trim().toLowerCase();
    const opts = [...quiz.querySelectorAll('[data-opt]')];
    const ansRow = quiz.querySelector('[data-ans]');
    const good = quiz.querySelector('[data-good]');
    const bad = quiz.querySelector('[data-bad]');
    const ptsGood = quiz.querySelector('[data-ptsgood]');
    const ptsBad = quiz.querySelector('[data-ptsbad]');
    let done = false;

    opts.forEach((btn) => btn.addEventListener('click', () => {
      if (done) return;
      done = true;
      const picked = btn.textContent.trim();
      const right = picked.toLowerCase() === answer;

      opts.forEach((b) => {
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
      setTimeout(() => {
        thread.classList.add('mic-ready');
        const hint = document.querySelector('.mic-hint');
        if (hint) { hint.classList.add('arrived'); hint.dataset.arrived = '1'; }
        setStep(2);
        toEnd();
      }, 2300);
    }));
  });

  /* ══ the clock in the status bar ══ */
  let clockTicking = false;
  const frame = () => {
    clockTicking = false;
    const tr = thread.getBoundingClientRect();
    const line = tr.top + tr.height * .55;
    let clock = null;
    for (const r of clockRows) if (visible(r) && r.getBoundingClientRect().top <= line) clock = r.dataset.clock;
    if (clock && statusTime.textContent !== clock) statusTime.textContent = clock;
  };
  const requestClock = () => {
    if (clockTicking) return;
    clockTicking = true;
    requestAnimationFrame(frame);
  };
  thread.addEventListener('scroll', requestClock, { passive: true });
  addEventListener('resize', requestClock);
  frame();

  /* ══ incoming call from the caretaker ══ */
  const callEl = document.getElementById('call');
  const callSub = document.getElementById('callSub');
  const callTimer = document.getElementById('callTimer');
  const contactingRow = document.getElementById('contactingRow');
  let callPortal = null;
  let callTick = null;
  let callSecs = 0;
  let callAnchor = null;
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const anchor = () => callAnchor || contactingRow || thread;
  const mountCall = () => {
    if (!callEl) return;
    if (!callPortal) {
      callPortal = document.createElement('div');
      callPortal.className = 'chat-window call-portal';
      document.body.appendChild(callPortal);
    }
    callPortal.appendChild(callEl);
    callPortal.classList.add('in-call');
  };
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
    toEnd();
  };
  const insertLog = (text) => {
    const chip = document.createElement('p');
    chip.className = 'call-log';
    chip.textContent = text;
    anchor().insertAdjacentElement('afterend', chip);
    callAnchor = chip;
    pop(chip);
    toEnd();
  };

  const endCall = (answered) => {
    if (callTick) { clearInterval(callTick); callTick = null; }
    if (!callEl) return;
    callEl.dataset.handled = '1';
    callEl.hidden = true;
    callEl.setAttribute('aria-hidden', 'true');
    callEl.classList.remove('ringing', 'connected');
    chatWindow.classList.remove('in-call');
    experienceFrame.classList.remove('call-active');
    document.documentElement.classList.remove('in-call');
    document.body.classList.remove('in-call');
    if (callPortal) callPortal.classList.remove('in-call');
    insertLog(answered ? `📞 Voice call · ${mmss(callSecs)}` : '📞 Declined voice call');
    outro();
  };

  // the demo closes in the thread, then hands the visitor on to the next panel
  let outroed = false;
  const completeExperience = () => {
    const visibleEnd = window.scrollY + window.innerHeight - experience.offsetTop;
    const height = Math.max(window.innerHeight, Math.min(experience.offsetHeight, visibleEnd));
    experience.style.setProperty('--complete-height', `${Math.ceil(height)}px`);
    experience.classList.add('complete');
  };
  const outro = () => {
    if (outroed) return;
    outroed = true;
    setTimeout(() => {
      insertMsg('<p>🎉 <strong>That&rsquo;s the end of the demo.</strong> Thanks for spending the day with Brownie.</p>');
      setTimeout(completeExperience, 900);
    }, 1400);
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
    items.forEach((r) => r.classList.remove('waiting'));
    mountCall();
    callEl.hidden = false;
    callEl.setAttribute('aria-hidden', 'false');
    callEl.classList.add('ringing');
    chatWindow.classList.add('in-call');
    experienceFrame.classList.add('call-active');
    document.documentElement.classList.add('in-call');
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

  if (canAnim) chatWindow.classList.add('fx');
  window.__brownieReady = true;

  /* ══ the rest of the page ══ */
  const quizAnswer = document.querySelector('.quiz-answer');
  document.querySelectorAll('.quiz-options button').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('.quiz-options button').forEach((item) => item.classList.remove('correct', 'wrong'));
    const correct = button.dataset.correct === 'true';
    button.classList.add(correct ? 'correct' : 'wrong');
    if (quizAnswer) quizAnswer.innerHTML = correct ? '<strong>Correct!</strong> Visit us at the SMU booth and meet Brownie.' : '<strong>Try again.</strong> Brownie is waiting at the SMU booth.';
  }));

})();
