export function ThemeScript() {
  // Inline script: set theme early to avoid flash.
  const code = `(() => {
    try {
      const t = localStorage.getItem('theme');
      const theme = (t === 'dark' || t === 'light') ? t : 'light';
      document.documentElement.dataset.theme = theme;
      if (theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } catch {}
  })();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
