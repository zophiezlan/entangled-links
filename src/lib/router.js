/**
 * Simple router for Cloudflare Workers
 */

export class Router {
  constructor() {
    this.routes = [];
  }

  addRoute(method, path, handler) {
    // Convert path params to regex
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:(\w+)/g, '(?<$1>[^/]+)');

    this.routes.push({
      method,
      pattern: new RegExp(`^${pattern}$`),
      handler
    });
  }

  get(path, handler) {
    this.addRoute('GET', path, handler);
  }

  post(path, handler) {
    this.addRoute('POST', path, handler);
  }

  put(path, handler) {
    this.addRoute('PUT', path, handler);
  }

  delete(path, handler) {
    this.addRoute('DELETE', path, handler);
  }

  async handle(request) {
    const url = new URL(request.url);
    const method = request.method;

    for (const route of this.routes) {
      if (route.method !== method) continue;

      const match = url.pathname.match(route.pattern);
      if (match) {
        const params = match.groups || {};
        return await route.handler(request, params);
      }
    }

    return new Response('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
