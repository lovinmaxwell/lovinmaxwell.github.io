import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/url';

export const GET: APIRoute = ({ site }) =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      '',
      '# Machine-readable profile for AI agents',
      `# ${absoluteUrl('llms.txt', site)}`,
      `# ${absoluteUrl('profile.json', site)}`,
      '',
      `Sitemap: ${absoluteUrl('sitemap-index.xml', site)}`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
