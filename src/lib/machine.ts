// Builds the machine-readable copies of the profile (profile.json, llms.txt, llms-full.txt).
// Everything comes from src/data/profile.ts. Nothing is added here.
import { profile, type ArchiveItem, type EducationItem } from '../data/profile';
import { absoluteUrl } from './url';

const { stack } = profile;

const itemName = (item: (typeof stack.items)[number]) => (item.detail ? `${item.name} (${item.detail})` : item.name);
const links = profile.socials.filter((s) => s.href.startsWith('http'));
const education: EducationItem[] = profile.education.items;
const archive: ArchiveItem[] = profile.archive.items;
const credential = ({ title, org, date, detail }: EducationItem) => ({ title, org, date, ...(detail ? { detail } : {}) });

export function profileJson(site: URL | undefined) {
  return {
    name: profile.name,
    alternateName: profile.alternateName,
    headline: profile.headline.join(' '),
    jobTitle: profile.jobTitle,
    location: { city: profile.city, country: profile.country, timeZone: profile.localTime.timeZone },
    availability: { status: profile.availability, detail: profile.contact.subline },
    about: profile.about.paragraphs,
    now: { updated: profile.now.updated, items: profile.now.items },
    stack: {
      tiers: stack.tiers.map((tier) => ({
        name: tier.label,
        items: stack.items.filter((i) => i.tier === tier.id).map(itemName),
      })),
      categories: stack.categories.map((category) => ({
        name: category,
        items: stack.items.filter((i) => i.category === category).map(itemName),
      })),
      usedFor: stack.items.filter((i) => i.note).map((i) => ({ name: i.name, note: i.note })),
    },
    experience: profile.experience.jobs.map(({ role, company, type, location, period, current, bullets }) => ({
      role,
      company,
      type,
      location,
      period,
      current: Boolean(current),
      bullets,
    })),
    education: education.filter((e) => e.label === 'Education').map(credential),
    certifications: education.filter((e) => e.label === 'Certification').map(credential),
    courses: profile.education.courses,
    highlights: profile.highlights.items.map((h) => h.text),
    domains: profile.domains.items.map(({ title, text }) => ({ title, text })),
    projects: profile.projects.items.map((p) => ({
      name: p.name,
      status: p.statuses.map((s) => s.label),
      description: p.description,
      ...(p.details ? { details: p.details } : {}),
      ...(p.features ? { features: p.features } : {}),
      ...(p.stack ? { stack: p.stack } : {}),
      ...(p.link ? { url: p.link.href } : {}),
    })),
    frappe: {
      title: profile.openSource.frappe.title,
      text: profile.openSource.frappe.text,
      links: profile.openSource.frappe.links.map((l) => ({ label: l.label, url: l.href })),
    },
    archive: archive.map(({ name, description, tags, stack, status, visibility, link }) => ({
      name,
      description,
      tags,
      ...(stack.length ? { stack } : {}),
      ...(status ? { status: status.label } : {}),
      visibility,
      // url is the repo and only exists for public items. Private items may still have a public site.
      ...(link && visibility === 'public' ? { url: link.href } : {}),
      ...(link && visibility === 'private' ? { site: link.href } : {}),
    })),
    openSource: profile.openSource.plugins.map(({ name, href, description }) => ({
      name,
      url: href,
      description,
    })),
    contact: {
      email: profile.email,
      links: links.map((s) => ({ label: s.label, url: s.href })),
    },
    url: absoluteUrl('/', site),
    notice: profile.agents.notice,
    updated: profile.updated,
  };
}

type Data = ReturnType<typeof profileJson>;

const job = (j: Data['experience'][number]) => `${j.role}, ${j.company}, ${j.location} (${j.type}, ${j.period})`;

const credentialLine = (e: Data['education'][number]) => `${e.org}, ${e.date}${e.detail ? `, ${e.detail}` : ''}`;

const archiveLink = (a: Data['archive'][number]) => a.url ?? a.site;

const archiveLine = (a: Data['archive'][number]) => {
  const facts = [a.tags.join(', '), ...(a.stack ?? []), ...(a.status ? [a.status] : []), a.visibility];
  const link = archiveLink(a);
  return `- ${link ? `[${a.name}](${link})` : a.name}: ${a.description} (${facts.join(' | ')})`;
};

const header = (data: Data) => [
  `# ${data.name}`,
  '',
  `> ${profile.agents.summary}`,
  '',
  `Also known as ${data.alternateName}. ${profile.agents.notice} Last updated ${data.updated}.`,
];

const frappeLine = (data: Data) =>
  `- ${data.frappe.title}: ${data.frappe.text} ${data.frappe.links.map((l) => `[${l.label}](${l.url})`).join(', ')}`;

const contactLines = (data: Data) => [
  `- [Email](mailto:${data.contact.email}): ${data.contact.email}`,
  ...data.contact.links.map((l) => `- [${l.label}](${l.url})`),
];

/** Lean index in the llmstxt.org format. */
export function llmsTxt(site: URL | undefined): string {
  const data = profileJson(site);
  const home = data.url;
  const lines = [
    ...header(data),
    '',
    '## About',
    '',
    `- [About](${home}#about): ${data.about[0]}`,
    `- [Full profile as text](${absoluteUrl('llms-full.txt', site)}): Everything on the site in plain text.`,
    `- [Full profile as JSON](${absoluteUrl('profile.json', site)}): The same facts, structured.`,
    '',
    '## Availability',
    '',
    `- [Contact](${home}#contact): ${data.availability.status}. ${data.availability.detail}`,
    '',
    '## Stack',
    '',
    ...data.stack.tiers.map((t) => `- [${t.name}](${home}#stack): ${t.items.join(', ')}`),
    '',
    '## Experience',
    '',
    ...data.experience.map((j) => `- [${j.company}](${home}#experience): ${j.role}, ${j.location} (${j.type}, ${j.period})`),
    '',
    '## Highlights',
    '',
    ...data.highlights.map((h) => `- [Highlight](${home}#highlights): ${h}`),
    '',
    `## ${profile.domains.title}`,
    '',
    ...data.domains.map((d) => `- [${d.title}](${home}#domains): ${d.text}`),
    '',
    '## Projects',
    '',
    ...data.projects.map((p) => `- [${p.name}](${p.url ?? `${home}#projects`}): ${p.description} Status: ${p.status.join(', ')}.`),
    '',
    `## ${profile.archive.title}`,
    '',
    ...data.archive.map((a) => `- [${a.name}](${archiveLink(a) ?? `${home}#archive`}):${a.description} (${a.tags.join(', ')}; ${a.visibility})`),
    '',
    '## Open source',
    '',
    ...data.openSource.map((r) => `- [${r.name}](${r.url}): ${r.description}`),
    `- [${data.frappe.title}](${data.frappe.links[0].url}): ${data.frappe.text}`,
    '',
    '## Education and certification',
    '',
    ...[...data.education, ...data.certifications].map((e) => `- [${e.title}](${home}#education): ${credentialLine(e)}`),
    `- [${profile.education.coursesLabel}](${home}#education): ${data.courses.map((c) => `${c.title} (${c.org}, ${c.date})`).join('; ')}`,
    '',
    '## Contact',
    '',
    ...contactLines(data),
  ];
  return `${lines.join('\n')}\n`;
}

/** Fuller plain-text version of the whole profile. */
export function llmsFullTxt(site: URL | undefined): string {
  const data = profileJson(site);
  const list = (items: string[]) => items.map((i) => `- ${i}`);
  const lines = [
    ...header(data),
    '',
    `${data.headline} ${profile.location}. ${data.availability.status}.`,
    '',
    '## About',
    '',
    ...data.about,
    '',
    '## Availability',
    '',
    `${data.availability.status}. ${data.availability.detail}`,
    '',
    `## Now (${data.now.updated})`,
    '',
    ...list(data.now.items),
    '',
    '## Stack',
    '',
    ...data.stack.tiers.flatMap((t) => [`### ${t.name}`, '', t.items.join(', '), '']),
    '### Used for',
    '',
    ...data.stack.usedFor.map((u) => `- ${u.name}: ${u.note}`),
    '',
    '## Experience',
    '',
    ...data.experience.flatMap((j) => [`### ${job(j)}`, '', ...list(j.bullets), '']),
    '## Highlights',
    '',
    ...list(data.highlights),
    '',
    `## ${profile.domains.title}`,
    '',
    ...list(data.domains.map((d) => `${d.title}: ${d.text}`)),
    '',
    '## Projects',
    '',
    ...data.projects.flatMap((p) => [
      `### ${p.name}`,
      '',
      `Status: ${p.status.join(', ')}.`,
      '',
      p.description,
      ...(p.details ? ['', p.details] : []),
      ...(p.features ? ['', ...list(p.features)] : []),
      ...(p.stack ? ['', `Built with: ${p.stack.join(', ')}.`] : []),
      ...(p.url ? ['', `Link: ${p.url}`] : []),
      '',
    ]),
    `## ${profile.archive.title}`,
    '',
    ...data.archive.map(archiveLine),
    '',
    '## Open source',
    '',
    ...data.openSource.map((r) => `- [${r.name}](${r.url}): ${r.description}`),
    frappeLine(data),
    '',
    '## Education and certification',
    '',
    ...list([...data.education, ...data.certifications].map((e) => `${e.title}, ${credentialLine(e)}`)),
    '',
    `### ${profile.education.coursesLabel}`,
    '',
    ...list(data.courses.map((c) => `${c.title} (${c.org}, ${c.date})`)),
    '',
    '## Contact',
    '',
    ...contactLines(data),
    '',
    `Site: ${data.url}`,
  ];
  return `${lines.join('\n')}\n`;
}
