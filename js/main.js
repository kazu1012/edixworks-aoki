// スクロールして画面に入った要素をふわっと表示する
const revealTargets = document.querySelectorAll('.section-heading, .service-card, .work-card, .works-note, .about-image, .about-description, .footer-top');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if ('IntersectionObserver' in window && !reduceMotion) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealTargets.forEach((el) => {
    // 横に並ぶカードは少しずつずらして表示する
    const index = Array.from(el.parentElement.children).indexOf(el);
    el.style.transitionDelay = `${(index % 3) * 0.1}s`;
    el.classList.add('reveal');
    observer.observe(el);
  });
}

// スマホではネイティブの横スクロールとスナップを使う。
const worksTrack = document.querySelector('#works-track');
const worksPagination = document.querySelector('.works-pagination');
const worksStatus = document.querySelector('.works-status');
let worksControls = document.querySelector('.works-controls');
let worksAutoplay = document.querySelector('.works-autoplay');

if (worksTrack && worksPagination && worksStatus) {
  // Live Previewに古いHTMLが残っていても、操作部分を補って初期化する。
  if (!worksControls) {
    worksControls = document.createElement('div');
    worksControls.className = 'works-controls';
    worksPagination.before(worksControls);
    worksControls.append(worksPagination);
  }
  if (!worksAutoplay) {
    worksAutoplay = document.createElement('button');
    worksAutoplay.type = 'button';
    worksAutoplay.className = 'works-autoplay';
    worksAutoplay.hidden = true;
    worksAutoplay.setAttribute('aria-controls', 'works-track');
    const symbol = document.createElement('span');
    symbol.setAttribute('aria-hidden', 'true');
    worksAutoplay.append(symbol);
    worksControls.append(worksAutoplay);
  }
  // 表示・非表示はCSSの画面幅条件で決める。hidden属性を残さない。
  worksControls.removeAttribute('hidden');
  worksPagination.removeAttribute('hidden');
  const cards = Array.from(worksTrack.querySelectorAll('.work-card'));
  const mobile = window.matchMedia('(max-width: 767px)');
  let currentIndex = 0;
  let scrollFrame = 0;
  let autoplayTimer = 0;
  let autoplayEnabled = !reduceMotion;
  let pointerDown = false;
  let hovered = false;
  let focusPaused = false;
  let inView = !('IntersectionObserver' in window);

  function restartAutoplay() {
    window.clearTimeout(autoplayTimer);
    if (!mobile.matches || !autoplayEnabled || document.hidden || !inView
      || pointerDown || hovered || focusPaused || cards.length < 2) return;
    autoplayTimer = window.setTimeout(() => {
      const next = (currentIndex + 1) % cards.length;
      goTo(next, next !== 0);
      restartAutoplay();
    }, 2000);
  }

  function syncAutoplayButton() {
    const label = autoplayEnabled ? '自動再生を停止' : '自動再生を開始';
    worksAutoplay.setAttribute('aria-label', label);
    worksAutoplay.title = label;
    worksAutoplay.querySelector('span').textContent = autoplayEnabled ? 'Ⅱ' : '▶';
    // 自動切り替え中はスクリーンリーダーの読み上げを繰り返さない。
    worksStatus.setAttribute('aria-live', autoplayEnabled ? 'off' : 'polite');
  }

  const existingDots = Array.from(worksPagination.querySelectorAll('.works-dot'));
  const dots = cards.map((card, index) => {
    const button = existingDots[index] || document.createElement('button');
    button.type = 'button';
    button.className = 'works-dot';
    button.setAttribute('aria-label', `${index + 1}件目：${card.querySelector('h3').textContent}`);
    button.setAttribute('aria-controls', 'works-track');
    if (!button.querySelector('.works-dot-indicator')) {
      const indicator = document.createElement('span');
      indicator.className = 'works-dot-indicator';
      indicator.setAttribute('aria-hidden', 'true');
      button.append(indicator);
    }
    return button;
  });
  worksPagination.replaceChildren(...dots);

  function updateCurrent(index) {
    currentIndex = index;
    dots.forEach((dot, dotIndex) => {
      if (dotIndex === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    const message = `制作実績 ${index + 1} / ${cards.length}：${cards[index].querySelector('h3').textContent}`;
    if (worksStatus.textContent !== message) worksStatus.textContent = message;
  }

  function goTo(index, animate = true) {
    if (!mobile.matches) return;
    const target = Math.max(0, Math.min(cards.length - 1, index));
    const inset = parseFloat(window.getComputedStyle(worksTrack).paddingLeft) || 0;
    const left = worksTrack.scrollLeft + cards[target].getBoundingClientRect().left
      - worksTrack.getBoundingClientRect().left - inset;
    worksTrack.scrollTo({ left, behavior: animate && !reduceMotion ? 'smooth' : 'auto' });
  }

  dots.forEach((dot, index) => dot.addEventListener('click', () => {
    goTo(index);
    restartAutoplay();
  }));

  worksAutoplay.addEventListener('click', () => {
    autoplayEnabled = !autoplayEnabled;
    focusPaused = false;
    syncAutoplayButton();
    restartAutoplay();
  });

  [worksTrack, worksPagination].forEach(element => element.addEventListener('pointerdown', () => {
    pointerDown = true;
    focusPaused = false;
    restartAutoplay();
  }, { passive: true }));
  ['pointerup', 'pointercancel'].forEach(type => window.addEventListener(type, () => {
    if (!pointerDown) return;
    pointerDown = false;
    restartAutoplay();
  }, { passive: true }));
  worksTrack.addEventListener('wheel', restartAutoplay, { passive: true });
  worksTrack.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'mouse') return;
    hovered = true;
    restartAutoplay();
  });
  worksTrack.addEventListener('pointerleave', () => {
    hovered = false;
    restartAutoplay();
  });
  [worksTrack, worksPagination].forEach(element => {
    element.addEventListener('focusin', () => {
      if (pointerDown) return;
      focusPaused = true;
      restartAutoplay();
    });
    element.addEventListener('focusout', (event) => {
      focusPaused = worksTrack.contains(event.relatedTarget) || worksPagination.contains(event.relatedTarget);
      restartAutoplay();
    });
  });
  document.addEventListener('visibilitychange', restartAutoplay);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      restartAutoplay();
    }, { threshold: 0.1 }).observe(worksTrack);
  }

  worksTrack.addEventListener('scroll', () => {
    if (!mobile.matches || scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      if (!mobile.matches) return;
      const inset = parseFloat(window.getComputedStyle(worksTrack).paddingLeft) || 0;
      const start = worksTrack.getBoundingClientRect().left + inset;
      const distances = cards.map(card => Math.abs(card.getBoundingClientRect().left - start));
      updateCurrent(distances.indexOf(Math.min(...distances)));
    });
  }, { passive: true });

  worksTrack.addEventListener('keydown', (event) => {
    if (!mobile.matches || event.target !== worksTrack) return;
    let target;
    if (event.key === 'ArrowRight') target = currentIndex + 1;
    else if (event.key === 'ArrowLeft') target = currentIndex - 1;
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = cards.length - 1;
    else return;
    event.preventDefault();
    goTo(target);
    restartAutoplay();
  });

  function syncLayout() {
    worksAutoplay.hidden = !mobile.matches;
    worksStatus.hidden = !mobile.matches;
    if (mobile.matches) {
      worksTrack.setAttribute('tabindex', '0');
      worksTrack.setAttribute('role', 'region');
      worksTrack.setAttribute('aria-roledescription', 'カルーセル');
      worksTrack.setAttribute('aria-labelledby', 'works-heading');
      cards.forEach((card, index) => {
        card.setAttribute('role', 'group');
        card.setAttribute('aria-roledescription', 'スライド');
        card.setAttribute('aria-label', `${index + 1} / ${cards.length}`);
      });
      updateCurrent(currentIndex);
      goTo(currentIndex, false);
    } else {
      ['tabindex', 'role', 'aria-roledescription', 'aria-labelledby'].forEach(name => worksTrack.removeAttribute(name));
      cards.forEach(card => {
        ['role', 'aria-roledescription', 'aria-label'].forEach(name => card.removeAttribute(name));
      });
      pointerDown = false;
      hovered = false;
      focusPaused = false;
    }
    restartAutoplay();
  }

  mobile.addEventListener('change', syncLayout);
  function syncPosition() {
    if (mobile.matches) goTo(currentIndex, false);
  }
  if ('ResizeObserver' in window) {
    new ResizeObserver(syncPosition).observe(worksTrack);
  } else {
    window.addEventListener('resize', syncPosition);
  }
  syncAutoplayButton();
  syncLayout();
}
