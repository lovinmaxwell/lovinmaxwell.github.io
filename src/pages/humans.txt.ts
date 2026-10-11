import type { APIRoute } from 'astro';
import { profile } from '../data/profile';
import { absoluteUrl } from '../lib/url';

// humanstxt.org. Facts from src/data/profile.ts only.
export const GET: APIRoute = ({ site }) => {
  const links = profile.socials.filter((s) => s.href.startsWith('http'));
  return new Response(
    [
      '/* TEAM */',
      `  Name: ${profile.name}`,
      `  Role: ${profile.jobTitle}`,
      `  Location: ${profile.city}, ${profile.country}`,
      `  Contact: ${profile.email}`,
      ...links.map((s) => `  ${s.label}: ${s.href}`),
      `  Status: ${profile.availability}`,
      '',
      '/* SITE */',
      `  Last update: ${profile.updated}`,
      '  Language: English',
      '  Standards: HTML, CSS, TypeScript',
      '  Components: Astro, Tailwind CSS',
      `  For AI agents: ${absoluteUrl('llms.txt', site)}`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
};
