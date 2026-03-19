export type Route =
  | { kind: 'static-css' }
  | { kind: 'static-js' }
  | { kind: 'upload' }
  | { kind: 'download'; slug: string; download: boolean }
  | { kind: 'root' }
  | { kind: 'not-found' };

export function routeRequest(
  method: string,
  pathname: string,
  searchParams: URLSearchParams,
): Route {
  if (pathname === '/_/common.css' && method === 'GET') {
    return { kind: 'static-css' };
  }

  if (pathname === '/_/countdown.js' && method === 'GET') {
    return { kind: 'static-js' };
  }

  if (pathname === '/_/upload' && method === 'POST') {
    return { kind: 'upload' };
  }

  if (method !== 'GET') {
    return { kind: 'not-found' };
  }

  const slug = pathname.slice(1);
  if (!slug) {
    return { kind: 'root' };
  }

  return {
    kind: 'download',
    slug,
    download: searchParams.get('download') === '1',
  };
}
