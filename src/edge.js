// Keep existing links working while the archive and live star rendering run on Infomaniak.
import archive from './worker.js';
import { ISSUES } from './issues.index.js';

const ORIGIN = 'https://plusdefun.ch/api/hot-repos-origin';
const DATE_PATH = /^\/\d{4}-\d{2}-\d{2}$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if ((request.method === 'GET' || request.method === 'HEAD') &&
        (['/', '/latest', '/stars.json'].includes(path) || DATE_PATH.test(path))) {
      try {
        const target = new URL(ORIGIN + path);
        const issue = url.searchParams.get('issue');
        if (path === '/stars.json' && issue && DATE_PATH.test('/' + issue)) target.searchParams.set('issue', issue);
        const result = await fetch(target, {
          method: request.method, redirect: 'manual', signal: AbortSignal.timeout(5000)
        });
        if (result.headers.get('X-Hot-Repos-Latest') === ISSUES[0].date) {
          if (result.status === 302 && path === '/latest') {
            const date = new URL(result.headers.get('location'), target).pathname;
            if (date === '/' + ISSUES[0].date) {
              return new Response(null, { status: 302, headers: {
                location: new URL(date, url).href, 'X-Hot-Repos-Origin': 'infomaniak'
              }});
            }
          }
          if (result.status === 200 || result.status === 404) {
            return new Response(result.body, { status: result.status, headers: {
              'content-type': path === '/stars.json' ? 'application/json; charset=utf-8' : 'text/html; charset=utf-8',
              'cache-control': result.headers.get('cache-control') || 'no-cache',
              'X-Hot-Repos-Origin': 'infomaniak'
            }});
          }
        }
        await result.body?.cancel();
      } catch {
        // A network failure or a release still being synchronized should not break a reader's link.
      }
    }
    const fallback = await archive.fetch(request, env);
    const response = new Response(fallback.body, fallback);
    response.headers.set('X-Hot-Repos-Origin', 'edge-fallback');
    return response;
  }
};
