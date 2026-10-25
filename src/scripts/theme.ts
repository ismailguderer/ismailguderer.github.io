/** Theme button cycling auto -> light -> dark; the choice is kept in localStorage. */
export function bindThemeToggle() {
  const root = document.documentElement;
  const label = document.querySelector('[data-theme-label]');
  const order = ['auto', 'light', 'dark'] as const;
  const current = () => (root.dataset.theme as 'light' | 'dark' | undefined) ?? 'auto';
  const names = { auto: 'Auto', light: 'Light', dark: 'Dark' } as const;
  const render = () => { if (label) label.textContent = `Theme: ${names[current()]}`; };
  render();
  document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
    const next = order[(order.indexOf(current()) + 1) % order.length];
    if (next === 'auto') delete root.dataset.theme; else root.dataset.theme = next;
    try { next === 'auto' ? localStorage.removeItem('theme') : localStorage.setItem('theme', next); } catch {}
    render();
  });
}
