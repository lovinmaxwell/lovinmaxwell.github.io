// Brand marks for the Stack section, bundled at build time and rendered as one inline sprite.
// simple-icons covers most; Microsoft marks come from devicon files in src/assets/logos.
import {
  siAngular,
  siClaude,
  siCursor,
  siDart,
  siDotnet,
  siErpnext,
  siFastapi,
  siFirebase,
  siFlutter,
  siFrappe,
  siGit,
  siJira,
  siModelcontextprotocol,
  siMysql,
  siN8n,
  siOllama,
  siOnnx,
  siPaddlepaddle,
  siPostgresql,
  siQwen,
  siReact,
  siSap,
  siShopify,
  siAndroid,
  siIos,
  siElectron,
  siTypescript,
} from 'simple-icons';
import azure from '../assets/logos/azure-plain.svg?raw';
import csharp from '../assets/logos/csharp-plain.svg?raw';
import ef from '../assets/logos/entityframeworkcore-plain.svg?raw';
import sqlserver from '../assets/logos/microsoftsqlserver-plain.svg?raw';
import type { LogoKey } from '../data/profile';

export interface Logo {
  viewBox: string;
  /** Inner SVG markup. Monochrome, painted with currentColor. */
  body: string;
}

const fromSimple = (icon: { path: string }): Logo => ({
  viewBox: '0 0 24 24',
  body: `<path d="${icon.path}"/>`,
});

/** Take the inside of a devicon "plain" file and drop its fixed fills. */
const fromDevicon = (svg: string): Logo => ({
  viewBox: svg.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 128 128',
  body: svg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/\sfill="[^"]*"/g, ''),
});

export const logos: Record<LogoKey, Logo> = {
  csharp: fromDevicon(csharp),
  dotnet: fromSimple(siDotnet),
  azure: fromDevicon(azure),
  sqlserver: fromDevicon(sqlserver),
  ef: fromDevicon(ef),
  angular: fromSimple(siAngular),
  react: fromSimple(siReact),
  typescript: fromSimple(siTypescript),
  flutter: fromSimple(siFlutter),
  dart: fromSimple(siDart),
  fastapi: fromSimple(siFastapi),
  postgresql: fromSimple(siPostgresql),
  mysql: fromSimple(siMysql),
  firebase: fromSimple(siFirebase),
  git: fromSimple(siGit),
  jira: fromSimple(siJira),
  sap: fromSimple(siSap),
  erpnext: fromSimple(siErpnext),
  frappe: fromSimple(siFrappe),
  n8n: fromSimple(siN8n),
  mcp: fromSimple(siModelcontextprotocol),
  cursor: fromSimple(siCursor),
  qwen: fromSimple(siQwen),
  paddle: fromSimple(siPaddlepaddle),
  onnx: fromSimple(siOnnx),
  claude: fromSimple(siClaude),
  ollama: fromSimple(siOllama),
  shopify: fromSimple(siShopify),
  android: fromSimple(siAndroid),
  ios: fromSimple(siIos),
  electron: fromSimple(siElectron),
};
