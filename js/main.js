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
