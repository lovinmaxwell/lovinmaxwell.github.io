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

export interface StackCategory {
  name: string;
  chips: string[];
}

export interface Job {
  role: string;
  company: string;
  location?: string;
  period: string;
  current?: boolean;
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

const email = 'lovinmaxwell@gmail.com';

export const profile = {
  name: 'Lovin Maxwell',
  firstName: 'Lovin',
  lastName: 'Maxwell',
  monogram: 'LM',
  headline: ['Senior .NET & Azure Engineer.', 'Enterprise Integration.', 'Document AI Automation.'],
  jobTitle: 'Senior .NET & Azure Engineer',
  location: 'Based in Doha, Qatar',
  city: 'Doha',
  country: 'Qatar',
  // DRAFT: pending Lovin's approval. Alt: "Shipping real AI: tools, agents, products."
  tagline: 'I build with AI and show you what actually works.',
  availability: 'Available for freelance & hire',
  email,

  seo: {
    title: 'Lovin Maxwell | Senior .NET & Azure Engineer',
    description:
      'Lovin Maxwell is a Senior .NET & Azure Engineer based in Doha, Qatar. Enterprise integration, document AI automation and shipped apps. Available for freelance and hire.',
    ogImage: 'og.png',
    ogImageAlt: 'Lovin Maxwell. Senior .NET & Azure Engineer. Enterprise Integration. Document AI Automation.',
    themeColorDark: '#0a0a0b',
    themeColorLight: '#fafafa',
  },

  nav: [
    { label: 'About', href: '#about' },
    { label: 'Highlights', href: '#highlights' },
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
    nowLabel: 'Now',
    yearsValue: '10+',
    yearsLabel: 'years building enterprise applications, APIs and integrations',
    latestLabel: 'Latest build',
  },

  about: {
    kicker: 'About',
    title: 'Enterprise systems, integrations and practical AI.',
    paragraphs: [
      'I have spent 10+ years building enterprise applications, APIs and integrations in healthcare and large organizations.',
      'I connect business platforms, automate manual processes, and improve how data moves across web, mobile and backend.',
      'I also build practical AI: agents, developer tools and shipped apps.',
    ],
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
    categories: [
      {
        name: 'Backend',
        chips: [
          'C#',
          'ASP.NET Core',
          '.NET',
          'Web API',
          'REST',
          'WCF',
          'Microservices',
          'Middleware',
          'System integration (SAP RFC, Oracle stored procedures)',
        ],
      },
      {
        name: 'Azure',
        chips: [
          'App Services',
          'API Management',
          'Service Bus',
          'Logic Apps',
          'WebJobs',
          'Storage',
          'Entra ID',
        ],
      },
      {
        name: 'Frontend',
        chips: ['Angular', 'ASP.NET MVC', 'React', 'TypeScript'],
      },
      {
        name: 'Mobile',
        chips: ['Flutter (BLoC, Riverpod)', 'Dart'],
      },
      {
        name: 'AI',
        chips: [
          'Azure Document Intelligence',
          'Local vision-language models and OCR (Qwen2.5-VL, PaddleOCR/RapidOCR, ONNX Runtime)',
          'Python FastAPI',
          'Claude/Cursor agent tooling and MCP',
        ],
      },
      {
        name: 'Data',
        chips: [
          'SQL Server (T-SQL, stored procedures, tuning)',
          'Entity Framework',
          'PostgreSQL',
          'MySQL',
          'Power BI',
          'Firebase',
          'ObjectBox',
        ],
      },
      {
        name: 'ERP / Integration',
        chips: ['SAP RFC', 'PMWeb', 'ERPNext/Frappe', 'Microsoft Graph'],
      },
      {
        name: 'Delivery',
        chips: ['Git', 'Agile/Scrum', 'Jira', 'Code review', 'Production support'],
      },
    ] satisfies StackCategory[],
  },

  experience: {
    kicker: 'Experience',
    title: 'Where I have worked.',
    presentLabel: 'Current',
    jobs: [
      {
        role: 'Senior Software Engineer, Enterprise Applications',
        company: 'Hamad Medical Corporation',
        location: 'Doha',
        period: 'Dec 2024 to present',
        current: true,
      },
      {
        role: 'Senior Software Engineer (.NET & Azure)',
        company: 'Al Shareef Holding',
        period: '2022 to 2024',
      },
      {
        role: 'Full Stack Developer',
        company: 'Energy Technical Service',
        period: '2021',
      },
      {
        role: 'Software Engineer',
        company: 'Zearo Consulting',
        period: '2018 to 2021',
      },
      {
        role: 'Software Engineer',
        company: 'Ellipsonic',
        location: 'Bangalore',
        period: '2016 to 2018',
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
        description: 'A desktop disk management app.',
        link: { label: 'diskmanager.pro', href: 'https://diskmanager.pro' },
      },
    ] satisfies Project[],
  },

  openSource: {
    kicker: 'Open source',
    title: 'Plugins for agent workflows.',
    pluginsLabel: 'Cursor plugins',
    olderLabel: 'Older open source',
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
    older: [
      {
        name: 'frappe_azure_storage',
        href: 'https://github.com/lovinmaxwell/frappe_azure_storage',
        description: 'Azure Storage for Frappe.',
      },
      {
        name: 'obarcode',
        href: 'https://github.com/lovinmaxwell/obarcode',
        description: 'Barcode for retail applications.',
      },
      {
        name: 'win_flutter_pos',
        href: 'https://github.com/lovinmaxwell/win_flutter_pos',
        description: 'Flutter POS for Windows.',
      },
    ] satisfies Repo[],
  },

  education: {
    kicker: 'Education & Certification',
    title: 'Paper trail.',
    items: [
      {
        label: 'Education',
        title: 'B.E. Electrical and Electronic Engineering',
        org: 'Anna University',
        date: '2016',
      },
      {
        label: 'Certification',
        title: 'Microsoft Azure Fundamentals (AZ-900)',
        org: 'Microsoft',
        date: 'Mar 2022',
      },
    ],
    school: 'Anna University',
  },

  contact: {
    kicker: 'Contact',
    title: 'Available for freelance & hire',
    subline: 'Contracts, consulting and full-time roles.',
    emailLabel: 'Email me',
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
    home: 'Lovin Maxwell, back to top',
    newTab: '(opens in a new tab)',
  },
};

export type Profile = typeof profile;
