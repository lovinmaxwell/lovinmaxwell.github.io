import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/url';

// Search and AI crawlers named here are welcome. Everything on the site is public.
const bots = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
  'CCBot',
];

export const GET: APIRoute = ({ site }) =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      '',
      '# Search and AI crawlers are explicitly allowed.',
      ...bots.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', '']),
      '# Machine-readable profile for AI agents',
      `# ${absoluteUrl('llms.txt', site)}`,
      `# ${absoluteUrl('llms-full.txt', site)}`,
      `# ${absoluteUrl('profile.json', site)}`,
      '',
      `Sitemap: ${absoluteUrl('sitemap-index.xml', site)}`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
