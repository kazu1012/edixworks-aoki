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

if (worksTrack && worksPagination && worksStatus) {
  const cards = Array.from(worksTrack.querySelectorAll('.work-card'));
  const mobile = window.matchMedia('(max-width: 767px)');
  let currentIndex = 0;
  let scrollFrame = 0;

  const dots = cards.map((card, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'works-dot';
    button.setAttribute('aria-label', `${index + 1}件目：${card.querySelector('h3').textContent}`);
    button.setAttribute('aria-controls', 'works-track');
    worksPagination.append(button);
    return button;
  });

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

  dots.forEach((dot, index) => dot.addEventListener('click', () => goTo(index)));

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
  });

  function syncLayout() {
    worksPagination.hidden = !mobile.matches;
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
    }
  }

  mobile.addEventListener('change', syncLayout);
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => goTo(currentIndex, false)).observe(worksTrack);
  } else {
    window.addEventListener('resize', () => goTo(currentIndex, false));
  }
  syncLayout();
}
