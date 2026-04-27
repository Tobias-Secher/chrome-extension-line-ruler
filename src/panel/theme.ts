export type Theme = 'beach-boy' | 'cave-man' | 'auto';

const KEY = 'uiTheme';
const DEFAULT: Theme = 'auto';

function isTheme(v: string | null): v is Theme {
  return v === 'beach-boy' || v === 'cave-man' || v === 'auto';
}

export function loadTheme(): Theme {
  const v = localStorage.getItem(KEY);
  return isTheme(v) ? v : DEFAULT;
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll<HTMLElement>('#theme-group button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.themeValue === theme);
  });
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);
}

export function initTheme(): void {
  applyTheme(loadTheme());
  document.querySelectorAll<HTMLButtonElement>('#theme-group button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.themeValue;
      if (isTheme(v ?? null)) setTheme(v as Theme);
    });
  });
}
