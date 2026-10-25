import type { APIRoute } from 'astro';
import { TOOLS } from '@bio-assist/tools.js';
import worker from '../../lib/bio-assist-sw.js?raw';

/** Service worker with this build's page list; a new cache name per build replaces old copies. */
export const GET: APIRoute = () => {
  const pages = ['/bio-assist/', ...TOOLS.map((t) => `/bio-assist/${t.id}/`)];
  const body = `const CACHE = 'bio-assist-${Date.now()}';\nconst PAGES = ${JSON.stringify(pages)};\n\n${worker}`;
  return new Response(body, { headers: { 'Content-Type': 'text/javascript; charset=utf-8' } });
};
