(() => {
  const thread = document.getElementById('thread');
  const host = document.querySelector('.wa');
  const recallLesson = document.getElementById('recallLesson');
  const quiz = document.querySelector('.quiz');
  if (!thread || !host) return;

  const coach = document.createElement('aside');
  coach.className = 'tutorial-coach';
  coach.setAttribute('aria-live', 'polite');
  host.appendChild(coach);

  const content = (step, title, detail) => {
    coach.hidden = false;
    coach.dataset.step = step;
    thread.classList.toggle('coach-bottom', step === 1);
    coach.innerHTML = `<span>Guided demo · ${step} of 4</span><strong>${title}</strong><p>${detail}</p>`;
  };

  let scheduled = false;
  const render = () => {
    scheduled = false;
    if (thread.classList.contains('sent')) {
      coach.hidden = true;
      thread.classList.remove('coach-bottom');
      return;
    }
    if (thread.classList.contains('mic-ready')) {
      content(4, 'Try emergency support', 'Tap Brownie and say “I need help”.');
      return;
    }
    if (thread.classList.contains('recall-ready')) {
      if (quiz && quiz.dataset.arrived) content(3, 'Choose the safest response', 'Pick an answer to complete the safety check.');
      else content(3, 'Safety practice', 'Brownie is preparing a quick scenario.');
      return;
    }
    if (thread.classList.contains('unlocked')) {
      if (recallLesson && recallLesson.dataset.arrived) content(2, 'Brownie remembered', 'Review the saved address, then continue.');
      else content(2, 'Recall saved information', "Watch Brownie retrieve Tiong Guan's work address.");
      return;
    }
    content(1, 'Acknowledge the reminder', 'Tap “Got it!” when Tiong Guan is ready.');
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(render);
  };
  new MutationObserver(schedule).observe(thread, { attributes: true, childList: true, subtree: true });
  render();
})();
