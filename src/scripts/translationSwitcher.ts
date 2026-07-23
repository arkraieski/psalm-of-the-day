// Wires the translation <select> and makes the switcher float when its
// original position scrolls out of view: into the right gutter on desktop,
// as a sticky top bar on mobile. Safe to call more than once.

// Verse numbers are consistent across translations, so switching mid-read
// remembers the verse at the top of the viewport and restores it on the new
// page (pixel offsets would drift, since languages differ in length).
const SCROLL_KEY = 'translation-scroll-verse';
// Reading line: how far below the top the anchored verse sits. Leaves room
// for the mobile sticky bar so the verse isn't hidden underneath it.
const READING_OFFSET = 72;

function verseMarks(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.psalm-body sup.verse-num'));
}

// The last verse whose top has scrolled to or above the reading line, i.e. the
// verse the user is currently reading. 0 means still at the very top.
function topVerse(): number {
  let current = 0;
  for (const mark of verseMarks()) {
    if (mark.getBoundingClientRect().top <= READING_OFFSET) {
      current = Number(mark.textContent) || current;
    } else {
      break;
    }
  }
  return current;
}

function restoreScroll() {
  const raw = sessionStorage.getItem(SCROLL_KEY);
  if (!raw) return;
  sessionStorage.removeItem(SCROLL_KEY);
  const verse = Number(raw);
  if (!verse) return;
  const target = verseMarks().find(m => Number(m.textContent) === verse);
  if (!target) return;

  let done = false;
  const scrollToVerse = () => {
    if (done) return;
    const y = target.getBoundingClientRect().top + window.scrollY - READING_OFFSET;
    window.scrollTo(0, Math.max(0, y));
  };
  scrollToVerse();

  // Web fonts load with `swap` and reflow the text after this runs, drifting
  // the verse. Keep re-anchoring through those late layout shifts, then stop —
  // and bail the moment the user scrolls, so we never fight them.
  const body = document.querySelector('.psalm-body');
  const observer = body ? new ResizeObserver(scrollToVerse) : null;
  observer?.observe(body!);
  document.fonts?.ready.then(scrollToVerse);

  const stop = () => {
    done = true;
    observer?.disconnect();
    for (const ev of ['wheel', 'touchmove', 'keydown'] as const) {
      window.removeEventListener(ev, stop);
    }
  };
  for (const ev of ['wheel', 'touchmove', 'keydown'] as const) {
    window.addEventListener(ev, stop, { passive: true });
  }
  setTimeout(stop, 1500);
}

export function setupTranslationSwitcher() {
  const switcher = document.querySelector<HTMLElement>('.translation-switcher');
  const select = document.querySelector<HTMLSelectElement>('.translation-select');
  if (!switcher || !select || switcher.dataset.enhanced === 'true') return;
  switcher.dataset.enhanced = 'true';

  restoreScroll();

  select.addEventListener('change', () => {
    const opt = select.options[select.selectedIndex] as HTMLOptionElement;
    localStorage.setItem('favored-translation', opt.dataset.id ?? 'web');
    const verse = topVerse();
    if (verse) sessionStorage.setItem(SCROLL_KEY, String(verse));
    else sessionStorage.removeItem(SCROLL_KEY);
    window.location.href = select.value;
  });

  // Observe the title row (which holds the select). Once it has scrolled
  // fully above the viewport, pin the switcher; unpin when it returns.
  const anchor = switcher.closest('.psalm-title-row') ?? switcher;
  const observer = new IntersectionObserver(
    ([entry]) => switcher.classList.toggle('is-floating', !entry.isIntersecting),
    { threshold: 0 },
  );
  observer.observe(anchor);
}
