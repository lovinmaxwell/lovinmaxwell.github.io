// Eight architecture blueprints for the Systems chapter. Facts come from Lovin's brief (2026-10-24).
// Topologies are schematic (640x380 space): responsibilities, never internal deployment diagrams.
// The walk-throughs for 01 and 04 are inferred hop orders, still to be confirmed.
export type Kind = 'app' | 'integrate' | 'cloud' | 'ai';
/** id, label, sub label, x, y, width, height */
export type BlueprintNode = [string, string, string, number, number, number, number];
export type BlueprintEdge = [string, string, { dash?: boolean; straight?: boolean }?];
export type BlueprintGroup = [string, number, number, number, number, { dash?: boolean; device?: boolean }?];
export interface Blueprint {
  n: number; kind: Kind; name: string; shape: string; source: string; status: string; proof: string;
  pieces: string[]; walk: string;
  /** Blender loop slug: public/architecture/NN-slug.{webm,mp4} and NN-slug-poster.webp (Design Studio, 2026-10-24) */
  loop: string; hops: [string, string][];
  nodes: BlueprintNode[]; edges: BlueprintEdge[]; groups: BlueprintGroup[];
}

export const kinds: Record<Kind, { label: string; color: string }> = {
  app: { label: 'App', color: '#ff6a2f' },
  integrate: { label: 'Integrate', color: '#d7f65a' },
  cloud: { label: 'Cloud', color: '#8ec5ff' },
  ai: { label: 'AI', color: '#ff8cc6' },
};

export const blueprints: Blueprint[] = [
  {
    n: 1, loop: 'layered-desktop', kind: 'app', name: 'Layered desktop', shape: 'Stack of layers',
    source: 'Retail POS · Zearo Consulting · 2018–2021', status: 'Delivered',
    proof: 'Primary developer; indexing, query analysis and partitioning',
    pieces: ['WPF UI', 'MVVM', 'DI', 'Business logic layer', 'Data access layer', 'WCF / REST services', 'PostgreSQL / MySQL'],
    walk: 'Save a sale at the till',
    hops: [
      ['ui', 'WPF screen captures the sale'],
      ['mvvm', 'View model validates input'],
      ['bll', 'Business logic applies the rules'],
      ['dal', 'Data access layer prepares the write'],
      ['svc', 'WCF / REST service carries it'],
      ['db', 'PostgreSQL / MySQL stores it'],
    ],
    nodes: [
      ['ui', 'WPF UI', 'presentation', 40, 22, 470, 42],
      ['mvvm', 'MVVM', 'view models', 40, 80, 470, 42],
      ['bll', 'Business logic layer', '', 40, 138, 470, 42],
      ['dal', 'Data access layer', '', 40, 196, 470, 42],
      ['svc', 'WCF / REST services', '', 40, 254, 470, 42],
      ['db', 'PostgreSQL / MySQL', 'indexing · partitioning', 40, 312, 470, 46],
      ['di', 'DI', 'all layers', 530, 22, 80, 336],
    ],
    edges: [['ui', 'mvvm'], ['mvvm', 'bll'], ['bll', 'dal'], ['dal', 'svc'], ['svc', 'db']],
    groups: [],
  },
  {
    n: 2, loop: 'mobile-to-enterprise', kind: 'app', name: 'Mobile to enterprise', shape: 'Fan-out',
    source: 'Hamad Medical Corporation · 2024–now', status: 'Delivered',
    proof: 'Real-time asset management and workflow approvals',
    pieces: ['Flutter apps', 'REST APIs', 'PMWeb + ASP.NET Core MVC extensions', 'SQL Server', 'Oracle stored procedures', 'Entra ID'],
    walk: 'Approve an asset on mobile',
    hops: [
      ['app', 'Flutter app sends the approval'],
      ['api', 'REST API receives it, Entra ID signs the user in'],
      ['pm', 'PMWeb workflow records the approval'],
      ['sql', 'SQL Server stores the change'],
      ['ora', 'Oracle stored procedure results join the workflow'],
    ],
    nodes: [
      ['app', 'Flutter apps', 'mobile', 20, 160, 120, 60],
      ['id', 'Entra ID', 'sign-in', 196, 34, 128, 48],
      ['api', 'REST APIs', '', 196, 160, 128, 60],
      ['pm', 'PMWeb + ASP.NET', 'Core MVC extensions', 400, 50, 220, 54],
      ['sql', 'SQL Server', '', 400, 163, 220, 54],
      ['ora', 'Oracle', 'stored procedures', 400, 276, 220, 54],
    ],
    edges: [['app', 'api'], ['id', 'api', { dash: true }], ['api', 'pm'], ['api', 'sql'], ['api', 'ora']],
    groups: [],
  },
  {
    n: 3, loop: 'erp-integration', kind: 'integrate', name: 'ERP integration middleware', shape: 'Bridge',
    source: 'Al Shareef Holding · 2022–2024', status: 'Delivered',
    proof: 'About 90% less manual upload effort',
    pieces: ['Leasing data', '.NET middleware', 'ABAP RFC function modules', 'SAP RE-FX'],
    walk: 'Move leasing data to SAP',
    hops: [
      ['lease', 'Leasing records are picked up'],
      ['net', '.NET middleware maps the records'],
      ['rfc', 'ABAP RFC function module is called'],
      ['sap', 'SAP RE-FX receives the leasing data'],
    ],
    nodes: [
      ['lease', 'Leasing data', 'records', 28, 160, 116, 60],
      ['net', '.NET', 'middleware', 172, 160, 116, 60],
      ['rfc', 'ABAP RFC', 'function modules', 352, 160, 124, 60],
      ['sap', 'SAP RE-FX', 'real estate', 500, 160, 116, 60],
    ],
    edges: [['lease', 'net'], ['net', 'rfc'], ['rfc', 'sap']],
    groups: [['.NET side', 12, 110, 296, 160], ['SAP side', 332, 110, 296, 160]],
  },
  {
    n: 4, loop: 'azure-cloud', kind: 'cloud', name: 'Azure cloud services', shape: 'Hub and spokes',
    source: 'Al Shareef Holding', status: 'Delivered',
    proof: 'CRM delivered end to end',
    pieces: ['App Services', 'API Management', 'Service Bus', 'Logic Apps', 'WebJobs', 'Storage', 'Entra ID', 'Microsoft Graph', 'Power BI', 'ASP.NET Core Web APIs', 'Angular', 'Flutter CRM'],
    walk: 'Update a CRM record',
    hops: [
      ['ng', 'Angular CRM sends the update'],
      ['web', 'ASP.NET Core Web API handles it'],
      ['apim', 'API Management routes it'],
      ['sb', 'Service Bus queues the work'],
      ['wj', 'WebJobs processes it'],
    ],
    nodes: [
      ['ng', 'Angular', 'web', 14, 96, 92, 46],
      ['fl', 'Flutter CRM', 'mobile', 14, 238, 92, 46],
      ['web', 'ASP.NET Core', 'Web APIs', 128, 167, 104, 46],
      ['apim', 'API Management', 'hub', 418, 165, 120, 50],
      ['as', 'App Services', '', 304, 46, 96, 42],
      ['sb', 'Service Bus', '', 430, 46, 96, 42],
      ['la', 'Logic Apps', '', 540, 46, 90, 42],
      ['wj', 'WebJobs', '', 304, 169, 96, 42],
      ['st', 'Storage', '', 548, 169, 82, 42],
      ['eid', 'Entra ID', '', 304, 292, 96, 42],
      ['gr', 'Microsoft Graph', '', 420, 292, 116, 42],
      ['bi', 'Power BI', '', 548, 292, 82, 42],
    ],
    edges: [['ng', 'web'], ['fl', 'web'], ['web', 'apim', { straight: true }], ['apim', 'as', { straight: true }], ['apim', 'sb', { straight: true }], ['apim', 'la', { straight: true }], ['apim', 'wj', { straight: true }], ['apim', 'st', { straight: true }], ['apim', 'eid', { straight: true }], ['apim', 'gr', { straight: true }], ['apim', 'bi', { straight: true }]],
    groups: [['Azure', 290, 22, 346, 336, { dash: true }]],
  },
  {
    n: 5, loop: 'document-ai', kind: 'cloud', name: 'Document AI (cloud)', shape: 'Pipeline',
    source: 'Al Shareef Holding', status: 'Delivered',
    proof: 'Up to 60% less manual document processing',
    pieces: ['Upload', 'ASP.NET APIs', 'Azure Document Intelligence models', 'Structured data'],
    walk: 'Read a document',
    hops: [
      ['up', 'Document is uploaded'],
      ['api', 'ASP.NET API accepts it'],
      ['di', 'Document Intelligence model extracts fields'],
      ['out', 'Structured data comes back'],
    ],
    nodes: [
      ['up', 'Upload', 'document', 16, 160, 108, 60],
      ['api', 'ASP.NET APIs', '', 166, 160, 120, 60],
      ['di', 'Document', 'Intelligence models', 328, 160, 138, 60],
      ['out', 'Structured', 'data', 512, 160, 112, 60],
    ],
    edges: [['up', 'api'], ['api', 'di'], ['di', 'out']],
    groups: [['Azure', 150, 120, 332, 140, { dash: true }]],
  },
  {
    n: 6, loop: 'local-first-ai', kind: 'ai', name: 'Local-first AI', shape: 'Edge device',
    source: 'AccessFlow · in development', status: 'Concept',
    proof: 'Runs on ordinary 16 GB machines, nothing leaves the device',
    pieces: ['Camera', 'OpenCV crop / deskew', 'MRZ with check digits', 'GCC ID OCR (PaddleOCR / RapidOCR on ONNX)', 'Small VLM (Qwen2.5-VL) for hard fields', 'Human confirm', 'Check-in form', 'FastAPI + React + Electron'],
    walk: 'Scan a visitor ID',
    hops: [
      ['cam', 'Camera captures the ID'],
      ['cv', 'OpenCV crops and deskews'],
      ['mrz', 'MRZ read, check digits verified'],
      ['ocr', 'GCC ID OCR runs on ONNX'],
      ['vlm', 'Small VLM reads the hard fields only'],
      ['ok', 'A person confirms uncertain fields'],
      ['form', 'Check-in form is filled'],
    ],
    nodes: [
      ['cam', 'Camera', '', 24, 170, 84, 52],
      ['cv', 'OpenCV', 'crop · deskew', 126, 170, 104, 52],
      ['mrz', 'MRZ', 'check digits', 254, 96, 120, 52],
      ['ocr', 'GCC ID OCR', 'ONNX', 254, 244, 120, 52],
      ['vlm', 'Qwen2.5-VL', 'hard fields only', 398, 244, 112, 52],
      ['ok', 'Human', 'confirm', 398, 96, 112, 52],
      ['form', 'Check-in', 'form', 532, 170, 90, 52],
    ],
    edges: [['cam', 'cv'], ['cv', 'mrz'], ['cv', 'ocr'], ['ocr', 'vlm'], ['mrz', 'ok'], ['vlm', 'ok'], ['ok', 'form']],
    groups: [['One 16 GB machine · nothing leaves', 10, 40, 620, 300, { dash: true, device: true }]],
  },
  {
    n: 7, loop: 'offline-first-mobile', kind: 'app', name: 'Offline-first mobile', shape: 'On-device, optional sync',
    source: 'HolyWhisper · in store review', status: 'In store review',
    proof: 'Works without internet, 26 languages',
    pieces: ['Flutter', 'Riverpod', 'ObjectBox on device', 'On-device mood-to-verse scoring', 'Optional Firebase', 'Landing on Next.js + Cloudflare Workers'],
    walk: 'Pray offline',
    hops: [
      ['ui', 'Flutter UI takes the mood'],
      ['rp', 'Riverpod passes it on'],
      ['sc', 'Mood-to-verse scoring runs on device'],
      ['ob', 'ObjectBox returns the verse'],
      ['fb', 'Firebase skipped: optional, no connection needed'],
    ],
    nodes: [
      ['ui', 'Flutter', 'UI', 176, 56, 268, 48],
      ['rp', 'Riverpod', 'state', 176, 136, 268, 48],
      ['ob', 'ObjectBox', 'on device', 176, 216, 124, 56],
      ['sc', 'Mood-to-verse', 'scoring', 320, 216, 124, 56],
      ['fb', 'Firebase', 'optional', 520, 136, 106, 48],
      ['web', 'Landing', 'Next.js + Workers', 14, 136, 120, 48],
    ],
    edges: [['ui', 'rp'], ['rp', 'ob'], ['rp', 'sc'], ['rp', 'fb', { dash: true }]],
    groups: [['On the phone', 160, 20, 300, 272, { device: true }], ['Web', 4, 112, 140, 96, { dash: true }]],
  },
  {
    n: 8, loop: 'agent-tooling', kind: 'ai', name: 'Agent tooling', shape: 'Plugin hub',
    source: 'Cursor plugins', status: 'Open source',
    proof: 'Open source',
    pieces: ['Cursor plugin', 'MCP config', 'Agent skills', 'External CLIs / services run headlessly'],
    walk: 'Run an agent skill',
    hops: [
      ['cp', 'Cursor plugin starts the task'],
      ['mcp', 'MCP config exposes the tools'],
      ['sk', 'Agent skill picks the steps'],
      ['ext', 'External CLI runs headlessly'],
    ],
    nodes: [
      ['cp', 'Cursor plugin', '', 40, 160, 136, 60],
      ['mcp', 'MCP config', '', 250, 76, 132, 54],
      ['sk', 'Agent skills', '', 250, 250, 132, 54],
      ['ext', 'External CLIs', '/ services, headless', 456, 160, 160, 60],
    ],
    edges: [['cp', 'mcp'], ['cp', 'sk'], ['mcp', 'ext'], ['sk', 'ext']],
    groups: [],
  },
];
