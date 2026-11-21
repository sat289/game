// ST Virtual World — 4 ST GAMES Themes Controller

export const THEMES = {
  classic: { label: 'Classic Blue', themeColor: '#071827' },
  gold:    { label: 'Royal Gold',   themeColor: '#120d04' },
  black:   { label: 'Deep Black',   themeColor: '#050608' },
  neon:    { label: 'Neon Cyber',   themeColor: '#120726' }
};

const STORAGE_KEY = 'stv-theme';

export function getSavedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && THEMES[saved]) return saved;
  } catch {}
  return 'classic';
}

export function applyTheme(themeId) {
  const id = THEMES[themeId] ? themeId : 'classic';
  document.body.dataset.theme = id;
  try { localStorage.setItem(STORAGE_KEY, id); } catch {}
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEMES[id].themeColor);
  document.querySelectorAll('[data-theme-select]').forEach((sel) => {
    if (sel.value !== id) sel.value = id;
  });
  return id;
}

export function initThemeSwitcher(selectEl) {
  const initial = applyTheme(getSavedTheme());
  if (selectEl && !selectEl.dataset.themeBound) {
    selectEl.setAttribute('data-theme-select', 'true');
    selectEl.value = initial;
    selectEl.dataset.themeBound = '1';
    selectEl.addEventListener('change', (e) => applyTheme(e.target.value));
  }
  if (!window.__stvThemeStorageBound) {
    window.__stvThemeStorageBound = true;
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) applyTheme(e.newValue);
    });
  }
  return initial;
}
