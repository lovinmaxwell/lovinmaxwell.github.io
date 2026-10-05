import type { APIRoute } from 'astro';
import { profileJson } from '../lib/machine';

export const GET: APIRoute = ({ site }) =>
  new Response(`${JSON.stringify(profileJson(site), null, 2)}\n`, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
