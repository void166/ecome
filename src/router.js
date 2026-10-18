// History API router: `/` (3D drop), `/shop`, `/shop/<category>`, `/p/<slug>`.
// Every view has its own URL so ads and shared links land on the right page.
const ROUTES = [
  { name: 'home', pattern: /^\/$/ },
  { name: 'shop', pattern: /^\/shop(?:\/([a-z]+))?\/?$/, keys: ['category'] },
  { name: 'product', pattern: /^\/p\/([a-z0-9-]+)\/?$/, keys: ['slug'] },
];

let handler = () => {};
let current = null;

export function match(pathname) {
  for (const route of ROUTES) {
    const found = pathname.match(route.pattern);
    if (found) {
      const params = Object.fromEntries((route.keys || []).map((key, index) => [key, found[index + 1] || '']));
      return { name: route.name, params, path: pathname };
    }
  }
  return { name: 'notfound', params: {}, path: pathname };
}

function render(scrollY = 0) {
  current = match(window.location.pathname);
  document.body.dataset.route = current.name;
  document.body.classList.toggle('route-home', current.name === 'home');
  document.body.classList.toggle('route-page', current.name !== 'home');
  document.documentElement.classList.toggle('route-page', current.name !== 'home');
  handler(current);
  window.scrollTo(0, scrollY);
}

export function currentRoute() {
  return current;
}

export function navigate(path, { replace = false } = {}) {
  if (path === window.location.pathname) {
    window.scrollTo(0, 0);
    return;
  }
  history.replaceState({ ...history.state, scrollY: window.scrollY }, '');
  if (replace) history.replaceState({ scrollY: 0 }, '', path);
  else history.pushState({ scrollY: 0 }, '', path);
  render(0);
}

export function startRouter(onRoute) {
  handler = onRoute;
  history.scrollRestoration = 'manual';
  window.addEventListener('popstate', (event) => render(event.state?.scrollY || 0));
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || link.target || link.hasAttribute('download')) return;
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname.startsWith('/api/')) return;
    if (match(url.pathname).name === 'notfound') return;
    event.preventDefault();
    navigate(url.pathname);
  });
  render(history.state?.scrollY || 0);
}
