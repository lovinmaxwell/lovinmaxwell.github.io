// Structured data and the quotable summary. Every value comes from src/data/profile.ts.
import { profile } from '../data/profile';
import { absoluteUrl } from './url';

const current = profile.experience.jobs.find((j) => j.current) ?? profile.experience.jobs[0];
const sameAs = profile.socials.filter((s) => s.href.startsWith('http')).map((s) => s.href);
const lower = (s: string) => s.toLowerCase();

/** One short, factual paragraph that answer engines can quote as is. */
export const aboutSummary = [
  `${profile.name} is a ${lower(profile.jobTitle)} based in ${profile.city}, ${profile.country}.`,
  `${profile.firstName} is currently ${current.role} at ${current.company}${current.location ? `, ${current.location.split(',')[0]}` : ''} (since ${current.period.replace(/ to present$/, '')}).`,
  `${profile.firstName} has ${profile.hero.yearsValue} ${profile.hero.yearsLabel}, and works across .NET and Azure, ERP and SAP integration, and AI systems such as LLM workflows and agent pipelines.`,
  `${profile.availability}.`,
].join(' ');

export const ids = (site: URL | undefined) => {
  const home = absoluteUrl('/', site);
  return { home, person: `${home}#person`, website: `${home}#website`, page: `${home}#profilepage`, faq: `${home}#faq` };
};

export function personLd(site: URL | undefined) {
  const id = ids(site);
  return {
    '@type': 'Person',
    '@id': id.person,
    name: profile.name,
    alternateName: profile.alternateName,
    givenName: profile.firstName,
    additionalName: profile.middleName,
    familyName: profile.lastName,
    url: id.home,
    image: absoluteUrl(profile.seo.ogImage, site),
    jobTitle: profile.jobTitle,
    description: aboutSummary,
    email: `mailto:${profile.email}`,
    address: { '@type': 'PostalAddress', addressLocality: profile.city, addressCountry: profile.country },
    worksFor: {
      '@type': 'Organization',
      name: current.company,
      ...(current.location ? { address: { '@type': 'PostalAddress', addressLocality: current.location.split(',')[0], addressCountry: profile.country } } : {}),
    },
    hasOccupation: { '@type': 'Occupation', name: current.role },
    alumniOf: { '@type': 'CollegeOrUniversity', name: profile.education.school },
    knowsAbout: profile.seo.knowsAbout,
    sameAs,
  };
}

/** Home page graph: Person, WebSite, ProfilePage and the Ask-about-me FAQ. */
export function homeLd(site: URL | undefined) {
  const id = ids(site);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      personLd(site),
      {
        '@type': 'WebSite',
        '@id': id.website,
        url: id.home,
        name: profile.name,
        description: profile.seo.description,
        inLanguage: 'en',
        publisher: { '@id': id.person },
      },
      {
        '@type': 'ProfilePage',
        '@id': id.page,
        url: id.home,
        name: profile.seo.title,
        description: profile.seo.description,
        inLanguage: 'en',
        isPartOf: { '@id': id.website },
        mainEntity: { '@id': id.person },
        dateModified: profile.updated,
        primaryImageOfPage: { '@type': 'ImageObject', url: absoluteUrl(profile.seo.ogImage, site), width: 1200, height: 630 },
      },
      {
        '@type': 'FAQPage',
        '@id': id.faq,
        url: `${id.home}#ask`,
        name: profile.ask.title,
        inLanguage: 'en',
        isPartOf: { '@id': id.website },
        about: { '@id': id.person },
        mainEntity: profile.ask.faq.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
    ],
  };
}
