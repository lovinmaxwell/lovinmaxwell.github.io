// All site content lives here. Components only render what this file exports.

export type SocialIcon = 'mail' | 'linkedin' | 'github' | 'youtube' | 'instagram';

export interface Social {
  label: string;
  href: string;
  icon: SocialIcon;
}

export interface Highlight {
  /** Big number, when the highlight has one. */
  metric?: string;
  /** Small qualifier shown above the number, e.g. "Up to". */
  qualifier?: string;
  /** Short label used when there is no number. */
  tag?: string;
  text: string;
}

export type StackCategory =
  | 'Architecture'
  | 'Backend'
  | 'Azure'
  | 'Frontend'
  | 'Mobile'
  | 'AI & Automation'
  | 'Data'
  | 'ERP / Integration'
  | 'Delivery';

export type StackTier = 'ai' | 'core' | 'production';

/** Keys of the brand marks bundled in src/lib/logos.ts. */
export type LogoKey =
  | 'csharp'
  | 'dotnet'
  | 'azure'
  | 'sqlserver'
  | 'ef'
  | 'angular'
  | 'react'
  | 'typescript'
  | 'flutter'
  | 'dart'
  | 'fastapi'
  | 'postgresql'
  | 'mysql'
  | 'firebase'
  | 'git'
  | 'jira'
  | 'sap'
  | 'erpnext'
  | 'frappe'
  | 'n8n'
  | 'mcp'
  | 'cursor'
  | 'qwen'
  | 'paddle'
  | 'onnx'
  | 'claude'
  | 'ollama';

export interface StackItem {
  name: string;
  /** Short qualifier shown after the name, e.g. "BLoC, Riverpod". */
  detail?: string;
  category: StackCategory;
  tier: StackTier;
  /** Brand mark. Items without one get a monogram tile. */
  logo?: LogoKey;
  /** Two letters for the monogram tile. */
  mono?: string;
  /** One-line "Used for" note. Only set when a highlight or project backs it. */
  note?: string;
  /** Show in the logo marquee. */
  marquee?: boolean;
}

export interface Faq {
  id: string;
  question: string;
  /** Show as a suggestion chip. */
  suggested?: boolean;
  keywords: string[];
  answer: string;
}

export type DomainIcon =
  | 'layers'
  | 'cart'
  | 'package'
  | 'truck'
  | 'bag'
  | 'music'
  | 'globe'
  | 'home'
  | 'building';

export interface Domain {
  title: string;
  /** One short plain line. */
  text: string;
  icon: DomainIcon;
  /** Larger tile in the bento grid. */
  wide?: boolean;
}

export interface Job {
  role: string;
  company: string;
  type: 'Contract' | 'Full-time';
  location: string;
  period: string;
  current?: boolean;
  /** Three to five short lines. The first three show, the rest sit behind "More". */
  bullets: string[];
}

export interface EducationItem {
  label: 'Education' | 'Certification';
  title: string;
  org: string;
  date: string;
  /** Small extra line, e.g. the class of degree. */
  detail?: string;
}

export interface Course {
  title: string;
  org: string;
  date: string;
}

export type StatusTone = 'live' | 'progress' | 'soon';

export interface ProjectImage {
  /** Path relative to the site base, no leading slash. */
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface Project {
  name: string;
  featured?: boolean;
  statuses: { label: string; tone: StatusTone }[];
  description: string;
  details?: string;
  features?: string[];
  stack?: string[];
  link?: { label: string; href: string };
  images?: ProjectImage[];
}

export interface Repo {
  name: string;
  href: string;
  description: string;
}

export type ArchiveTag = 'AI' | 'Mobile' | 'Web' | 'ERP' | 'Desktop' | 'Dev tools' | 'Open source';

export interface ArchiveItem {
  name: string;
  /** One line. */
  description: string;
  tags: ArchiveTag[];
  /** Language or stack chips. */
  stack: string[];
  status?: { label: string; tone: StatusTone };
  /** Whether the source is public. Private items never link to a repo. */
  visibility: 'public' | 'private';
  /** Repo link for public items, or a site link. */
  link?: { label: string; href: string };
  /** Cursor plugins get their own heading inside the archive. */
  group?: 'plugins';
}

const email = 'lovinmaxwell@gmail.com';

export const profile = {
  name: 'Lovin Johnson Maxwell',
  alternateName: 'Lovin Maxwell',
  firstName: 'Lovin',
  middleName: 'Johnson',
  lastName: 'Maxwell',
  monogram: 'LM',
  headline: ['Solution architect and full-stack engineer.', '.NET and Azure by day, AI systems by obsession.'],
  jobTitle: 'Solution Architect and Full-Stack Engineer',
  location: 'Based in Doha, Qatar',
  city: 'Doha',
  country: 'Qatar',
  // DRAFT: pending Lovin's approval. Alt: "Shipping real AI: tools, agents, products."
  tagline: 'I build with AI and show you what actually works.',
  availability: 'Available for freelance & hire',
  email,
  /** Date this file was last reviewed. Shown in profile.json and llms.txt. */
  updated: '2026-10-05',

  seo: {
    title: 'Lovin Johnson Maxwell | Solution Architect & Full-Stack Engineer',
    description:
      'Lovin Johnson Maxwell is a solution architect and full-stack engineer based in Doha, Qatar. .NET and Azure by day, AI systems by obsession. Available for freelance and hire.',
    ogImage: 'og.png',
    ogImageAlt:
      'Lovin Johnson Maxwell. Solution architect and full-stack engineer. .NET and Azure by day, AI systems by obsession.',
    /** JSON-LD Person knowsAbout. */
    knowsAbout: [
      'Solution architecture',
      'Enterprise architecture',
      'Full-stack engineering',
      '.NET',
      'Microsoft Azure',
      'AI systems',
      'LLM workflows',
      'Agent pipelines',
      'n8n workflow automation',
      'Custom OCR model research',
      'Vision-language models',
      'SAP ABAP',
      'SAP RFC integration',
      'ERPNext',
      'Frappe Framework',
      'ADempiere',
      'iDempiere',
      'Retail POS applications',
      'Warehouse applications',
      'Delivery applications',
      'E-commerce applications',
      'Music streaming applications',
      'IoT applications for smart home appliances',
    ],
    themeColorDark: '#0a0a0b',
    themeColorLight: '#fafafa',
  },

  nav: [
    { label: 'About', href: '#about' },
    { label: 'Highlights', href: '#highlights' },
    { label: 'Domains', href: '#domains' },
    { label: 'Stack', href: '#stack' },
    { label: 'Experience', href: '#experience' },
    { label: 'Projects', href: '#projects' },
    { label: 'Open source', href: '#open-source' },
    { label: 'Contact', href: '#contact' },
  ],

  cta: {
    hire: { label: 'Hire me', href: `mailto:${email}` },
    work: { label: 'View work', href: '#projects' },
  },

  hero: {
    nowLabel: 'Current role',
    yearsValue: '10+',
    yearsLabel: 'years building enterprise applications, APIs and integrations',
    latestLabel: 'Latest build',
  },

  about: {
    kicker: 'About',
    title: 'End-to-end solutions, integrations and practical AI.',
    paragraphs: [
      'I design and build end-to-end solutions across web, mobile and backend. .NET and Azure are my everyday tools, not my whole range.',
      'For 10+ years I have built enterprise applications, APIs and integrations in healthcare and large organizations.',
      'My ERP work covers ERPNext/Frappe, ADempiere and iDempiere. On SAP, I write the ABAP RFC function modules and the .NET side that calls them.',
      'I see AI as the future, so that is where I go deepest: LLM workflows, agent pipelines, n8n automation and custom OCR model research.',
    ],
  },

  domains: {
    kicker: 'Domains',
    title: "What I've built",
    items: [
      { title: 'Solution architecture', text: 'I design and architect end-to-end solutions.', icon: 'layers', wide: true },
      { title: 'Retail & POS', text: 'Point-of-sale applications for retail.', icon: 'cart' },
      { title: 'Warehouse', text: 'Warehouse applications.', icon: 'package' },
      { title: 'Delivery', text: 'Delivery applications.', icon: 'truck' },
      { title: 'E-commerce', text: 'E-commerce applications.', icon: 'bag' },
      { title: 'Music streaming', text: 'A Spotify-style streaming app.', icon: 'music' },
      { title: 'Websites', text: 'Including the HolyWhisper landing site.', icon: 'globe' },
      { title: 'IoT & smart home', text: 'Apps for smart home appliances.', icon: 'home', wide: true },
      {
        title: 'Healthcare & enterprise',
        text: 'Enterprise applications in healthcare and large organizations.',
        icon: 'building',
        wide: true,
      },
    ] satisfies Domain[],
  },

  highlights: {
    kicker: 'Highlights',
    title: 'Work that moved a number, or shipped.',
    items: [
      {
        metric: '60%',
        qualifier: 'Up to',
        text: 'Cut manual document processing by up to 60% with Azure Document Intelligence and ASP.NET APIs.',
      },
      {
        metric: '90%',
        qualifier: 'About',
        text: 'Cut SAP RE-FX leasing data upload effort by about 90% with custom middleware over RFC.',
      },
      {
        tag: 'CRM',
        text: 'Led CRM delivery end to end (.NET Core, Angular, Flutter, SQL Server), owning sprints and code reviews.',
      },
      {
        tag: 'PMWeb',
        text: 'Extended PMWeb with .NET portals, dashboards and REST APIs so Flutter apps could handle asset management and approvals in real time.',
      },
      {
        tag: 'Flutter',
        text: 'Built tenant-facing Flutter apps with secure API integration.',
      },
      {
        tag: 'Retail POS',
        text: 'Primary developer on a retail POS (MVVM, DI, layered BL/DAL, .NET Core, WCF).',
      },
    ] satisfies Highlight[],
  },

  stack: {
    kicker: 'Stack',
    title: 'Tools I use to ship.',
    marqueeLabel: 'Tools in my stack. Hover or focus to pause.',
    filterLabel: 'Filter the stack',
    allLabel: 'All',
    countLabel: 'Showing {n} of {total}',
    // Tiering is a draft for Lovin to confirm.
    tiers: [
      { id: 'ai', label: 'AI & Automation' },
      { id: 'core', label: 'Core' },
      { id: 'production', label: 'Production experience' },
    ] satisfies { id: StackTier; label: string }[],
    categories: [
      'AI & Automation',
      'Architecture',
      'Backend',
      'Azure',
      'Frontend',
      'Mobile',
      'Data',
      'ERP / Integration',
      'Delivery',
    ] satisfies StackCategory[],
    features: [
      {
        tier: 'ai',
        title: 'AI systems and automation.',
        text: 'LLM workflows, agent pipelines, n8n automation and custom OCR model research.',
        logos: ['n8n', 'claude', 'cursor', 'mcp', 'qwen', 'ollama'],
      },
      {
        tier: 'core',
        title: 'C#, .NET, Azure and SQL Server.',
        text: '10+ years building enterprise applications, APIs and integrations.',
        logos: ['csharp', 'dotnet', 'azure', 'sqlserver'],
      },
    ] satisfies { tier: StackTier; title: string; text: string; logos: LogoKey[] }[],
    items: [
      // AI & Automation
      { name: 'n8n', detail: 'workflow automation', category: 'AI & Automation', tier: 'ai', logo: 'n8n', marquee: true },
      { name: 'LLM workflows', category: 'AI & Automation', tier: 'ai', mono: 'LW' },
      { name: 'Agent pipelines', category: 'AI & Automation', tier: 'ai', mono: 'PL' },
      {
        name: 'Agents & MCP',
        category: 'AI & Automation',
        tier: 'ai',
        logo: 'mcp',
        note: 'Open-source Cursor plugins',
        marquee: true,
      },
      {
        name: 'Claude / Cursor agent tooling',
        category: 'AI & Automation',
        tier: 'ai',
        logo: 'claude',
        note: 'Open-source Cursor plugins',
        marquee: true,
      },
      {
        name: 'Custom OCR model research',
        detail: 'fine-tuning open-source OCR and VLMs',
        category: 'AI & Automation',
        tier: 'ai',
        mono: 'OC',
        note: 'Local ID OCR in AccessFlow',
      },
      {
        name: 'Qwen2.5-VL',
        detail: 'local vision-language model',
        category: 'AI & Automation',
        tier: 'ai',
        logo: 'qwen',
        note: 'Local ID OCR in AccessFlow',
        marquee: true,
      },
      {
        name: 'PaddleOCR / RapidOCR',
        category: 'AI & Automation',
        tier: 'ai',
        logo: 'paddle',
        note: 'Local ID OCR in AccessFlow',
        marquee: true,
      },
      {
        name: 'ONNX Runtime',
        category: 'AI & Automation',
        tier: 'ai',
        logo: 'onnx',
        note: 'Runs the OCR models in AccessFlow',
        marquee: true,
      },
      {
        name: 'Ollama / vLLM',
        category: 'AI & Automation',
        tier: 'ai',
        logo: 'ollama',
        note: 'Used in AccessFlow',
        marquee: true,
      },
      {
        name: 'Azure Document Intelligence',
        category: 'AI & Automation',
        tier: 'ai',
        logo: 'azure',
        note: 'Cut manual document processing by up to 60%',
      },
      {
        name: 'Python FastAPI',
        category: 'AI & Automation',
        tier: 'ai',
        logo: 'fastapi',
        note: 'Used in AccessFlow',
        marquee: true,
      },
      // Architecture
      { name: 'Solution architecture', category: 'Architecture', tier: 'core', mono: 'SA' },
      { name: 'Enterprise architecture', category: 'Architecture', tier: 'core', mono: 'EA' },
      // Backend
      { name: 'C#', category: 'Backend', tier: 'core', logo: 'csharp', marquee: true },
      { name: 'ASP.NET Core', category: 'Backend', tier: 'core', logo: 'dotnet', note: 'Qatar SME Compliance OS' },
      { name: '.NET', category: 'Backend', tier: 'core', logo: 'dotnet', note: 'CRM and retail POS', marquee: true },
      { name: 'Web API', category: 'Backend', tier: 'core', mono: 'AP' },
      { name: 'REST', category: 'Backend', tier: 'core', mono: 'RE', note: 'PMWeb APIs for Flutter apps' },
      { name: 'WCF', category: 'Backend', tier: 'core', mono: 'WC', note: 'Retail POS services' },
      { name: 'Microservices', category: 'Backend', tier: 'core', mono: 'MS' },
      { name: 'Middleware', category: 'Backend', tier: 'core', mono: 'MW', note: 'SAP RE-FX leasing uploads over RFC' },
      {
        name: 'System integration',
        detail: 'SAP RFC, Oracle stored procedures',
        category: 'Backend',
        tier: 'core',
        mono: 'SI',
      },
      { name: 'MVVM', category: 'Backend', tier: 'core', mono: 'MV', note: 'Retail POS' },
      { name: 'Dependency injection', category: 'Backend', tier: 'core', mono: 'DI', note: 'Retail POS' },
      { name: 'Data structures', category: 'Backend', tier: 'core', mono: 'DS' },
      // Azure
      { name: 'App Services', category: 'Azure', tier: 'core', logo: 'azure', marquee: true },
      { name: 'API Management', category: 'Azure', tier: 'core', logo: 'azure' },
      { name: 'Service Bus', category: 'Azure', tier: 'core', logo: 'azure' },
      { name: 'Logic Apps', category: 'Azure', tier: 'core', logo: 'azure' },
      { name: 'WebJobs', category: 'Azure', tier: 'core', logo: 'azure' },
      { name: 'Storage', category: 'Azure', tier: 'core', logo: 'azure' },
      { name: 'Entra ID', category: 'Azure', tier: 'core', logo: 'azure' },
      // Frontend
      { name: 'Angular', category: 'Frontend', tier: 'production', logo: 'angular', note: 'CRM delivery', marquee: true },
      { name: 'ASP.NET MVC', category: 'Frontend', tier: 'production', logo: 'dotnet' },
      { name: 'WPF', category: 'Frontend', tier: 'production', mono: 'WP' },
      { name: 'React', category: 'Frontend', tier: 'production', logo: 'react', note: 'Used in AccessFlow', marquee: true },
      {
        name: 'TypeScript',
        category: 'Frontend',
        tier: 'production',
        logo: 'typescript',
        note: 'Used in AccessFlow',
        marquee: true,
      },
      // Mobile
      {
        name: 'Flutter',
        detail: 'BLoC, Riverpod',
        category: 'Mobile',
        tier: 'production',
        logo: 'flutter',
        note: 'Tenant apps, CRM and PMWeb mobile apps',
        marquee: true,
      },
      { name: 'Dart', category: 'Mobile', tier: 'production', logo: 'dart', note: 'HolyWhisper', marquee: true },
      // Data
      {
        name: 'SQL Server',
        detail: 'T-SQL, stored procedures, tuning',
        category: 'Data',
        tier: 'core',
        logo: 'sqlserver',
        note: 'CRM delivery',
        marquee: true,
      },
      { name: 'Entity Framework', category: 'Data', tier: 'core', logo: 'ef', marquee: true },
      { name: 'LINQ', category: 'Data', tier: 'core', mono: 'LQ' },
      { name: 'PostgreSQL', category: 'Data', tier: 'production', logo: 'postgresql', marquee: true },
      { name: 'MySQL', category: 'Data', tier: 'production', logo: 'mysql', marquee: true },
      { name: 'Power BI', category: 'Data', tier: 'production', mono: 'BI' },
      {
        name: 'Firebase',
        category: 'Data',
        tier: 'production',
        logo: 'firebase',
        note: 'Optional in HolyWhisper',
        marquee: true,
      },
      { name: 'ObjectBox', category: 'Data', tier: 'production', mono: 'OB', note: 'Offline storage in HolyWhisper' },
      // ERP / Integration
      {
        name: 'ERP',
        detail: 'ERPNext/Frappe, ADempiere, iDempiere',
        category: 'ERP / Integration',
        tier: 'production',
        mono: 'ER',
      },
      {
        name: 'SAP RFC',
        category: 'ERP / Integration',
        tier: 'production',
        logo: 'sap',
        note: 'ABAP RFC function modules and the .NET middleware that cut RE-FX upload effort by about 90%',
        marquee: true,
      },
      {
        name: 'SAP ABAP',
        detail: 'RFC function modules',
        category: 'ERP / Integration',
        tier: 'production',
        logo: 'sap',
      },
      {
        name: 'PMWeb',
        category: 'ERP / Integration',
        tier: 'production',
        mono: 'PM',
        note: '.NET portals, dashboards and REST APIs',
      },
      {
        name: 'ERPNext/Frappe',
        category: 'ERP / Integration',
        tier: 'production',
        logo: 'erpnext',
        note: 'Open-source contributor and builder',
        marquee: true,
      },
      { name: 'ADempiere', category: 'ERP / Integration', tier: 'production', mono: 'AD' },
      { name: 'iDempiere', category: 'ERP / Integration', tier: 'production', mono: 'iD' },
      { name: 'Microsoft Graph', category: 'ERP / Integration', tier: 'production', mono: 'MG' },
      // Delivery
      { name: 'Git', category: 'Delivery', tier: 'production', logo: 'git', marquee: true },
      { name: 'Agile/Scrum', category: 'Delivery', tier: 'production', mono: 'AG' },
      { name: 'Jira', category: 'Delivery', tier: 'production', logo: 'jira', marquee: true },
      {
        name: 'Code review',
        category: 'Delivery',
        tier: 'production',
        mono: 'CR',
        note: 'Owned sprints and code reviews on CRM delivery',
      },
      { name: 'Debugging', category: 'Delivery', tier: 'production', mono: 'DB' },
      { name: 'Production support', category: 'Delivery', tier: 'production', mono: 'PS' },
    ] satisfies StackItem[],
  },

  experience: {
    kicker: 'Experience',
    title: 'Where I have worked.',
    presentLabel: 'Current',
    moreLabel: 'More',
    jobs: [
      {
        role: 'Senior Software Engineer, Enterprise Applications',
        company: 'Hamad Medical Corporation',
        type: 'Contract',
        location: 'Doha, Qatar',
        period: 'Dec 2024 to present',
        current: true,
        bullets: [
          'Design and build custom .NET Core MVC applications and extensions on PMWeb for enterprise project workflows, including portals and interactive dashboards.',
          'Build REST APIs that connect PMWeb to Flutter mobile apps for real-time asset management and workflow approvals.',
          'Build reporting and data visibility features for project, asset and operational information.',
          'Build SQL-based integration that consumes Oracle stored procedures and maps the results into PMWeb workflows. Design and tune SQL Server queries, stored procedures, triggers and sync logic.',
          'Work with stakeholders to turn operational needs into application and integration solutions in a large healthcare environment.',
        ],
      },
      {
        role: 'Senior Software Engineer, .NET & Azure',
        company: 'Al Shareef Holding',
        type: 'Full-time',
        location: 'Lusail, Qatar',
        period: 'Jan 2022 to Nov 2024',
        bullets: [
          'Led CRM delivery end to end with ASP.NET Core Web APIs, Angular, Flutter, SQL Server and Entity Framework. Owned sprint milestones, code reviews and delivery quality.',
          'Built Azure Document Intelligence models and ASP.NET APIs for document upload and structured extraction. Cut manual document processing by up to 60%.',
          'Built custom middleware that migrates leasing data into SAP RE-FX over RFC. Wrote the ABAP RFC function modules and the .NET side. Cut manual upload effort by about 90%.',
          'Built backend apps and microservices with ASP.NET Core Web APIs, C# and WCF, and tenant-facing Flutter apps with BLoC, responsive UI and secure API integration.',
          'Used Azure App Services, API Management, Storage, Logic Apps, WebJobs, Service Bus and Entra ID, with Microsoft Graph integration and Power BI reporting inside business apps.',
        ],
      },
      {
        role: 'Full Stack Developer',
        company: 'Energy Technical Service',
        type: 'Full-time',
        location: 'Doha, Qatar',
        period: 'Mar 2021 to Dec 2021',
        bullets: [
          'Built business modules and workflows for procurement, budgeting and operations.',
          'Built interactive dashboards for profitability and operational analysis across web and mobile.',
          'Wrote business logic focused on process control and reliability.',
          'Worked in C#, .NET Core, APIs and SQL through the full delivery cycle, from requirements to handover.',
        ],
      },
      {
        role: 'Software Engineer',
        company: 'Zearo Consulting',
        type: 'Full-time',
        location: 'Al Wakrah, Qatar',
        period: 'Sep 2018 to Mar 2021',
        bullets: [
          'Primary developer on a retail POS, owning core modules under tight timelines.',
          'Used MVVM, dependency injection and separate BL and DAL layers.',
          'Built backend services with C#, .NET Core, WCF and REST/JSON.',
          'Built modules across inventory, accounting, HR, projects, procurement and sales.',
          'Tuned PostgreSQL and MySQL with indexing, query analysis and partitioning.',
        ],
      },
      {
        role: 'Software Engineer',
        company: 'Ellipsonic',
        type: 'Full-time',
        location: 'Bangalore, India',
        period: 'Aug 2016 to Aug 2018',
        bullets: [
          'Backend lead on production modules with ASP.NET, Web API and SQL Server.',
          'Built data access with Entity Framework, LINQ, stored procedures, triggers and views.',
          'Built secure web and API features, including authentication flows and endpoints for web and mobile.',
          'Worked on a customer dashboard and REST APIs.',
          'Built prototypes in IoT and location tracking, and chatbot integrations.',
        ],
      },
    ] satisfies Job[],
  },

  projects: {
    kicker: 'Projects',
    title: 'Things I build.',
    featuredLabel: 'Featured',
    featuresLabel: 'What it does',
    stackLabel: 'Built with',
    items: [
      {
        name: 'HolyWhisper',
        featured: true,
        statuses: [
          { label: 'Coming soon to Google Play', tone: 'soon' },
          { label: 'In App Store review', tone: 'soon' },
        ],
        description:
          'An offline-first Catholic companion. Pick how you feel and get a fitting verse, then pray, read and keep a gentle daily rhythm.',
        features: [
          'Mood-to-verse across 7 moods, scored on device',
          'Bible reader with search, bookmarks, notes, highlights and audio (Douay-Rheims (public domain) and Latin)',
          'Full Rosary with a swipe bead ring and haptics',
          'Stations of the Cross',
          'Saints calendar',
          'Offline daily Mass readings',
          'Journey streaks and badges',
          'Works without internet',
          'Interface in 26 languages',
        ],
        stack: [
          'Flutter/Dart',
          'Riverpod',
          'go_router',
          'ObjectBox',
          'Firebase (optional)',
          'flutter_tts / just_audio',
          'Landing: Next.js + Cloudflare Workers',
        ],
        link: { label: 'Visit site', href: 'https://holywhisper.1726io.work' },
        images: [
          {
            src: 'images/holywhisper/home.webp',
            alt: 'HolyWhisper home screen with a morning greeting, the verse of the day and a daily walk of short steps.',
            width: 600,
            height: 1300,
          },
          {
            src: 'images/holywhisper/bible_reader.webp',
            alt: 'HolyWhisper Bible reader screen open at Genesis chapter 1.',
            width: 600,
            height: 1300,
          },
          {
            src: 'images/holywhisper/prayer.webp',
            alt: 'HolyWhisper prayer screen with mood choices and a short prayer to say.',
            width: 600,
            height: 1300,
          },
        ],
      },
      {
        name: 'AccessFlow',
        statuses: [{ label: 'In development', tone: 'progress' }],
        description:
          "A privacy-first smart front desk for Gulf offices and residential compounds. Scan a visitor's ID with a camera and the check-in form fills itself, on the device.",
        details:
          'Local-first OCR pipeline: OpenCV crop and deskew, passport MRZ parsing with check digits, GCC ID OCR plus a small vision-language model, and a human confirm step for low-confidence fields. Bilingual Arabic/English. Runs on ordinary 16GB machines.',
        stack: [
          'Python FastAPI',
          'React + Vite + TypeScript',
          'Electron',
          'Qwen2.5-VL',
          'PaddleOCR/RapidOCR on ONNX Runtime',
          'Ollama/vLLM',
        ],
      },
      {
        name: 'Qatar SME Compliance OS',
        statuses: [{ label: 'Building', tone: 'progress' }],
        description:
          'A compliance workspace for Qatar SMEs, starting with WPS and Labour Law payroll compliance.',
        stack: ['ASP.NET Core', 'EF Core', 'Azure SQL', 'Blob Storage'],
      },
      {
        name: 'DiskManager Pro',
        statuses: [{ label: 'Live', tone: 'live' }],
        description:
          'Local-first macOS disk cleanup, duplicate finder, uninstaller and storage visualizer. Every scan runs on your Mac.',
        link: { label: 'diskmanager.pro', href: 'https://diskmanager.pro' },
      },
    ] satisfies Project[],
  },

  archive: {
    kicker: 'Archive',
    title: 'All work',
    filterLabel: 'Filter all work',
    allLabel: 'All',
    countLabel: 'Showing {n} of {total}',
    privateLabel: 'Private',
    pluginsLabel: 'Dev tools: Cursor plugins',
    restLabel: 'Apps and repos',
    tags: ['AI', 'Mobile', 'Web', 'ERP', 'Desktop', 'Dev tools', 'Open source'] satisfies ArchiveTag[],
    items: [
      {
        name: 'HolyWhisper',
        description: 'Offline-first Catholic companion app.',
        tags: ['Mobile'],
        stack: ['Flutter'],
        visibility: 'private',
        link: { label: 'Site', href: 'https://holywhisper.1726io.work' },
      },
      {
        name: 'AccessFlow',
        description: 'Privacy-first smart front desk with local ID OCR.',
        tags: ['AI', 'Desktop', 'Web'],
        stack: ['Python', 'React', 'Electron'],
        status: { label: 'In development', tone: 'progress' },
        visibility: 'private',
      },
      {
        name: 'Qatar SME Compliance OS',
        description: 'Compliance workspace for Qatar SMEs, starting with WPS.',
        tags: ['Web'],
        stack: ['ASP.NET Core'],
        status: { label: 'Building', tone: 'progress' },
        visibility: 'private',
      },
      {
        name: 'DiskManager Pro',
        description: 'Local-first macOS disk cleanup, duplicate finder, uninstaller and storage visualizer.',
        tags: ['Desktop'],
        stack: ['macOS'],
        status: { label: 'Live', tone: 'live' },
        visibility: 'private',
        link: { label: 'Site', href: 'https://diskmanager.pro' },
      },
      {
        name: 'antigravity-code',
        description:
          'Cursor plugin to drive Google Antigravity CLI (agy) headless, with model selection and continue/resume.',
        tags: ['Dev tools', 'AI', 'Open source'],
        stack: [],
        visibility: 'public',
        link: { label: 'GitHub', href: 'https://github.com/lovinmaxwell/antigravity-code' },
        group: 'plugins',
      },
      {
        name: 'claude-code-cloud',
        description: 'Cursor plugin to drive Claude Code locally (claude -p) and Claude Cloud from agents.',
        tags: ['Dev tools', 'AI', 'Open source'],
        stack: [],
        visibility: 'public',
        link: { label: 'GitHub', href: 'https://github.com/lovinmaxwell/claude-code-cloud' },
        group: 'plugins',
      },
      {
        name: 'notebooklm-code',
        description:
          'Cursor plugin for Google NotebookLM: MCP setup, sources and grounded Q&A. Submitted to the Cursor marketplace.',
        tags: ['Dev tools', 'AI', 'Open source'],
        stack: [],
        visibility: 'public',
        link: { label: 'GitHub', href: 'https://github.com/lovinmaxwell/notebooklm-code' },
        group: 'plugins',
      },
      {
        name: 'dodo-payments-code',
        description: 'Cursor plugin for the Dodo Payments MCP: API Code Mode plus knowledge docs search.',
        tags: ['Dev tools', 'AI', 'Open source'],
        stack: [],
        visibility: 'public',
        link: { label: 'GitHub', href: 'https://github.com/lovinmaxwell/dodo-payments-code' },
        group: 'plugins',
      },
      {
        name: 'omp-worker-code',
        description: 'Cursor / Claude plugin to delegate coding tasks to local Oh My Pi workers.',
        tags: ['Dev tools', 'AI', 'Open source'],
        stack: [],
        visibility: 'public',
        link: { label: 'GitHub', href: 'https://github.com/lovinmaxwell/omp-worker-code' },
        group: 'plugins',
      },
      {
        name: 'Nexus',
        description: 'Project Nexus: a native macOS internet download manager.',
        tags: ['Desktop', 'Open source'],
        stack: ['Swift'],
        status: { label: 'In progress', tone: 'progress' },
        visibility: 'public',
        link: { label: 'GitHub', href: 'https://github.com/lovinmaxwell/Nexus' },
      },
      {
        name: 'frappe_azure_storage',
        description: 'Azure Storage for Frappe.',
        tags: ['ERP', 'Open source'],
        stack: ['Python', 'Frappe'],
        visibility: 'public',
        link: { label: 'GitHub', href: 'https://github.com/lovinmaxwell/frappe_azure_storage' },
      },
      {
        name: 'obarcode',
        description: 'Ox Barcode: barcode support for retail apps on ERPNext.',
        tags: ['ERP', 'Open source'],
        stack: ['Python', 'Frappe'],
        visibility: 'public',
        link: { label: 'GitHub', href: 'https://github.com/lovinmaxwell/obarcode' },
      },
      {
        name: 'win_flutter_pos',
        description: 'Flutter POS for Windows.',
        tags: ['Mobile', 'Desktop', 'Open source'],
        stack: ['Flutter'],
        visibility: 'public',
        link: { label: 'GitHub', href: 'https://github.com/lovinmaxwell/win_flutter_pos' },
      },
      {
        name: 'lovinmaxwell.github.io',
        description: 'This site. Astro, Tailwind, a command palette and an AI-readable profile.',
        tags: ['Web', 'Open source'],
        stack: ['Astro'],
        visibility: 'public',
        link: { label: 'GitHub', href: 'https://github.com/lovinmaxwell/lovinmaxwell.github.io' },
      },
      {
        name: 'SpeedTest',
        description: 'Network speed test and diagnostics app prototype.',
        tags: ['Mobile', 'Web'],
        stack: ['Flutter'],
        visibility: 'private',
      },
    ] satisfies ArchiveItem[],
  },

  openSource: {
    kicker: 'Open source',
    title: 'Plugins for agent workflows.',
    pluginsLabel: 'Cursor plugins',
    frappe: {
      title: 'Frappe & ERPNext',
      text: 'I am an open-source contributor and builder on Frappe Framework and ERPNext.',
      logos: ['frappe', 'erpnext'] satisfies LogoKey[],
      links: [
        { label: 'frappe_azure_storage', href: 'https://github.com/lovinmaxwell/frappe_azure_storage' },
        { label: 'Frappe Framework', href: 'https://github.com/frappe/frappe' },
        { label: 'ERPNext', href: 'https://github.com/frappe/erpnext' },
      ],
    },
    repoLabel: 'Repo',
    plugins: [
      {
        name: 'antigravity-code',
        href: 'https://github.com/lovinmaxwell/antigravity-code',
        description:
          'Cursor plugin to drive Google Antigravity CLI (agy) headless, with model selection and continue/resume.',
      },
      {
        name: 'claude-code-cloud',
        href: 'https://github.com/lovinmaxwell/claude-code-cloud',
        description:
          'Cursor plugin to drive Claude Code locally (claude -p) and Claude Cloud from agents.',
      },
      {
        name: 'notebooklm-code',
        href: 'https://github.com/lovinmaxwell/notebooklm-code',
        description:
          'Cursor plugin for Google NotebookLM: MCP setup, sources and grounded Q&A. Submitted to the Cursor marketplace.',
      },
      {
        name: 'dodo-payments-code',
        href: 'https://github.com/lovinmaxwell/dodo-payments-code',
        description:
          'Cursor plugin for the Dodo Payments MCP: API Code Mode plus knowledge docs search.',
      },
      {
        name: 'omp-worker-code',
        href: 'https://github.com/lovinmaxwell/omp-worker-code',
        description:
          'MCP worker plugin to delegate coding tasks from Claude/Cursor to local Oh My Pi workers on a Mac.',
      },
    ] satisfies Repo[],
  },

  education: {
    kicker: 'Education & Certification',
    title: 'Paper trail.',
    items: [
      {
        label: 'Education',
        title: 'B.E. Electrical and Electronics Engineering',
        org: 'Anna University',
        date: '2012 to 2016',
        detail: 'First Class',
      },
      {
        label: 'Certification',
        title: 'Microsoft Certified: Azure Fundamentals (AZ-900)',
        org: 'Microsoft',
        date: 'Mar 2022',
      },
    ] satisfies EducationItem[],
    coursesLabel: 'Courses',
    courses: [
      { title: 'Flutter & Dart: The Complete Guide', org: 'Udemy', date: 'Feb 2022' },
      { title: 'ASP.NET Core and Angular', org: 'Udemy', date: 'Feb 2021' },
      { title: 'Complete SQL Bootcamp using PostgreSQL', org: 'Udemy', date: 'Jul 2019' },
    ] satisfies Course[],
    school: 'Anna University',
  },

  contact: {
    kicker: 'Contact',
    title: 'Available for freelance & hire',
    subline:
      'Open to solutions architect, integration architect and cloud architect roles, plus contracts and consulting. Based in Doha, open to roles in Qatar and the GCC.',
    emailLabel: 'Email me',
  },

  now: {
    title: 'Now',
    updated: 'Oct 2026',
    updatedLabel: 'Updated',
    items: [
      'Building AccessFlow, a local-first ID check-in',
      'HolyWhisper is in App Store review',
      'Qatar SME Compliance OS is in progress',
    ],
  },

  localTime: {
    city: 'Doha',
    timeZone: 'Asia/Qatar',
    offset: 'UTC+3',
    label: 'Local time',
    reply: 'Usually replies within a day or two.',
  },

  // Answers for the "ask" terminal. Nothing here goes beyond the facts above.
  ask: {
    title: 'Ask about me',
    windowTitle: 'ask-lovin',
    prompt: 'ask lovin>',
    intro: 'Pick a question or type your own. Type help for commands.',
    inputLabel: 'Ask a question about Lovin',
    placeholder: 'Type a question',
    submitLabel: 'Ask',
    suggestionsLabel: 'Suggested questions',
    help: 'Ask about my work, experience, AI, what I have built, architecture, ERP and SAP, availability, stack, projects, education, certifications, location or contact. Commands: help, clear.',
    fallback: `I don't have an answer for that here. Email me at ${email}.`,
    faq: [
      {
        id: 'work',
        question: 'What do you work on?',
        suggested: true,
        keywords: ['work on', 'what do you do', 'do you do', 'do you work', 'build', 'job', 'role', 'who are you'],
        answer:
          'I design and build end-to-end solutions as a solution architect and full-stack engineer. By day I am a Senior Software Engineer, Enterprise Applications at Hamad Medical Corporation in Doha, on contract since Dec 2024, building .NET applications, REST APIs and integrations on PMWeb. Beyond that I go deep on AI: LLM workflows, agent pipelines and custom OCR model research.',
      },
      {
        id: 'experience',
        question: 'Where have you worked?',
        keywords: ['experience', 'worked', 'where did you work', 'work history', 'career', 'employer', 'company', 'companies', 'history', 'background', 'previous', 'hamad', 'al shareef', 'zearo', 'ellipsonic', 'energy technical'],
        answer:
          'Hamad Medical Corporation, Doha: Senior Software Engineer, Enterprise Applications, on contract, Dec 2024 to present. Al Shareef Holding, Lusail: Senior Software Engineer, .NET & Azure, Jan 2022 to Nov 2024. Energy Technical Service, Doha: Full Stack Developer, Mar 2021 to Dec 2021. Zearo Consulting, Al Wakrah: Software Engineer, Sep 2018 to Mar 2021. Ellipsonic, Bangalore: Software Engineer, Aug 2016 to Aug 2018. The Experience section has the details for each role.',
      },
      {
        id: 'ai',
        question: 'What do you do with AI?',
        suggested: true,
        keywords: ['ai', 'artificial', 'llm', 'agent', 'n8n', 'automation', 'workflow', 'machine learning', 'model', 'fine-tun', 'vision', 'ocr research'],
        answer:
          'AI is where I go deepest. I build LLM workflows and agent pipelines, and automate with n8n. I also research custom OCR models: fine-tuning and modifying open-source OCR and vision-language models, which ties into AccessFlow. And I publish open-source Cursor plugins for agent workflows.',
      },
      {
        id: 'domains',
        question: 'What have you built?',
        suggested: true,
        keywords: ['built', 'domain', 'what have you', 'do you build', 'apps', 'retail', 'pos ', 'point of sale', 'warehouse', 'delivery', 'e-commerce', 'ecommerce', 'music', 'spotify', 'streaming', 'iot', 'smart home', 'website', 'industr'],
        answer:
          'Retail POS, warehouse, delivery and e-commerce applications. A Spotify-style music streaming app. Websites. IoT apps for smart home appliances. And enterprise applications in healthcare and large organizations.',
      },
      {
        id: 'architecture',
        question: 'Do you do solution architecture?',
        keywords: ['architect', 'design', 'end-to-end', 'end to end', 'solution'],
        answer: 'Yes. I design and architect end-to-end solutions, across web, mobile, backend and integrations.',
      },
      {
        id: 'erp',
        question: 'What ERP systems have you worked with?',
        keywords: ['erp', 'erpnext', 'frappe', 'adempiere', 'idempiere'],
        answer:
          'ERPNext/Frappe, ADempiere and iDempiere. I am an open-source contributor and builder on Frappe Framework and ERPNext, and frappe_azure_storage is one of my public repos. I also integrate with SAP over RFC.',
      },
      {
        id: 'sap',
        question: 'Do you work with SAP and ABAP?',
        keywords: ['sap', 'abap', 'rfc', 're-fx'],
        answer:
          'Yes. I write SAP ABAP code for RFC function modules, and the .NET side of the RFC integration. That middleware cut SAP RE-FX leasing data upload effort by about 90%.',
      },
      {
        id: 'available',
        question: 'Are you available?',
        suggested: true,
        keywords: ['available', 'availability', 'hire', 'freelance', 'contract', 'consulting', 'full-time', 'open to'],
        answer: `Yes. I am open to solutions architect, integration architect and cloud architect roles, plus contracts and consulting. I am based in Doha and open to roles in Qatar and the GCC. Email ${email}.`,
      },
      {
        id: 'stack',
        question: "What's your stack?",
        suggested: true,
        keywords: ['stack', 'tech', 'tools', 'language', 'skills', '.net', 'dotnet', 'c#', 'azure', 'sql', 'flutter'],
        answer:
          'AI and automation: n8n, LLM workflows, agent pipelines and local OCR models. Core: C#, ASP.NET Core, .NET, SQL Server and Azure. In production I have also used Angular, React, TypeScript, Flutter and SAP ABAP. The Stack section has the full list.',
      },
      {
        id: 'holywhisper',
        question: 'Tell me about HolyWhisper',
        suggested: true,
        keywords: ['holywhisper', 'holy whisper', 'catholic', 'bible', 'rosary'],
        answer:
          'HolyWhisper is an offline-first Catholic companion built with Flutter. Pick how you feel and get a fitting verse, then pray, read and keep a gentle daily rhythm. It is in App Store review and coming soon to Google Play.',
      },
      {
        id: 'location',
        question: 'Where are you based?',
        suggested: true,
        keywords: ['where', 'based', 'location', 'live', 'city', 'country', 'doha', 'qatar', 'timezone', 'time zone'],
        answer: 'Doha, Qatar. Local time is UTC+3.',
      },
      {
        id: 'contact',
        question: 'How do I contact you?',
        suggested: true,
        keywords: ['contact', 'email', 'reach', 'message', 'linkedin', 'github', 'talk'],
        answer: `Email ${email}. I usually reply within a day or two. I am also on LinkedIn and GitHub.`,
      },
      {
        id: 'accessflow',
        question: 'What is AccessFlow?',
        keywords: ['accessflow', 'access flow', 'front desk', 'visitor', 'ocr', 'check-in'],
        answer:
          "AccessFlow is a privacy-first smart front desk for Gulf offices and residential compounds. Scan a visitor's ID with a camera and the check-in form fills itself, on the device. It is in development.",
      },
      {
        id: 'compliance',
        question: 'What is Qatar SME Compliance OS?',
        keywords: ['compliance', 'sme', 'wps', 'payroll', 'labour'],
        answer:
          'A compliance workspace for Qatar SMEs, starting with WPS and Labour Law payroll compliance. I am building it now.',
      },
      {
        id: 'opensource',
        question: 'Do you have open source work?',
        keywords: ['open source', 'opensource', 'plugin', 'cursor', 'mcp', 'repo', 'claude'],
        answer:
          'Yes. I publish Cursor plugins for agent workflows, like claude-code-cloud and notebooklm-code. They are on GitHub at github.com/lovinmaxwell.',
      },
      {
        id: 'education',
        question: 'What did you study?',
        keywords: ['study', 'studied', 'education', 'degree', 'university', 'college', 'graduat'],
        answer:
          'B.E. Electrical and Electronics Engineering, Anna University, 2012 to 2016, First Class. I also hold Microsoft Certified: Azure Fundamentals (AZ-900).',
      },
      {
        id: 'certifications',
        question: 'What certifications do you have?',
        keywords: ['certif', 'certification', 'certified', 'certificate', 'az-900', 'fundamentals', 'course', 'udemy'],
        answer:
          'Microsoft Certified: Azure Fundamentals (AZ-900), Mar 2022. Courses on Udemy: Flutter & Dart: The Complete Guide (Feb 2022), ASP.NET Core and Angular (Feb 2021) and Complete SQL Bootcamp using PostgreSQL (Jul 2019).',
      },
    ] satisfies Faq[],
  },

  palette: {
    title: 'Command palette',
    button: 'Search',
    placeholder: 'Type a command or search',
    empty: 'No results.',
    groups: {
      navigate: 'Navigate',
      actions: 'Actions',
      socials: 'Socials',
      projects: 'Projects',
    },
    actions: {
      copyEmail: 'Copy email',
      toggleTheme: 'Toggle theme',
      openProfile: 'Open profile.json',
      openLlms: 'Open llms.txt',
    },
    topLabel: 'Top',
    hints: { move: 'Move', select: 'Select', close: 'Close' },
    toastCopied: 'Email copied',
    toastCopyFailed: `Copy failed. Email is ${email}`,
  },

  // Plain-text and JSON copies of this profile for AI agents and recruiting tools.
  agents: {
    footerLabel: 'For AI agents:',
    summary:
      'Solution architect and full-stack engineer based in Doha, Qatar. .NET and Azure by day, AI systems by obsession. LLM workflows, agent pipelines, enterprise integration and shipped apps. Available for freelance and hire.',
    notice: 'Please do not infer skills, metrics or employers that are not listed here.',
    files: [
      { label: 'llms.txt', path: 'llms.txt' },
      { label: 'profile.json', path: 'profile.json' },
    ],
  },

  socials: [
    { label: 'Email', href: `mailto:${email}`, icon: 'mail' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/lovinmaxwell', icon: 'linkedin' },
    { label: 'GitHub', href: 'https://github.com/lovinmaxwell', icon: 'github' },
    { label: 'YouTube (BuildWithLovin)', href: 'https://www.youtube.com/@buildwithlovin', icon: 'youtube' },
    { label: 'Instagram', href: 'https://www.instagram.com/lovin.maxwell', icon: 'instagram' },
  ] satisfies Social[],

  footer: {
    builtWith: 'Built with Astro.',
  },

  a11y: {
    skipLink: 'Skip to content',
    themeToggle: 'Toggle dark and light theme',
    menu: 'Menu',
    mainNav: 'Main',
    socialNav: 'Social links',
    home: 'Lovin Johnson Maxwell, back to top',
    palette: 'Open command palette',
    close: 'Close',
    newTab: '(opens in a new tab)',
  },
};

export type Profile = typeof profile;
