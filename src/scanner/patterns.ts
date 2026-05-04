/**
 * Pre-compiled RegExp patterns and O(1) lookup Sets for the Scanner.
 * All patterns are compiled once at import time, never inside hot call paths.
 */

// ────────────────────────────────────────────────────────────────
// Soft — direct identifiers
// ────────────────────────────────────────────────────────────────

export const EMAIL_RE = /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g;

export const PHONE_RE =
  /(?:\+?(\d{1,3})[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,5}\b/g;

export const URL_RE =
  /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b[-a-zA-Z0-9@:%_+.~#?&/=]*/g;

/**
 * Simple proper-name heuristic: two or more capitalized words in a row.
 * Avoid triggering at sentence starts by requiring the previous char not to be
 * a sentence boundary — handled in rules.ts at scoring time, not here.
 */
export const PROPER_NAME_RE = /\b[A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20}){1,3}\b/g;

// ────────────────────────────────────────────────────────────────
// Medium — location, profession, technology, time
// ────────────────────────────────────────────────────────────────

export const CITIES = new Set([
  'madrid', 'barcelona', 'sevilla', 'valencia', 'bilbao', 'zaragoza', 'malaga',
  'london', 'paris', 'berlin', 'rome', 'amsterdam', 'vienna', 'brussels',
  'new york', 'los angeles', 'chicago', 'houston', 'san francisco', 'boston', 'seattle',
  'toronto', 'montreal', 'sydney', 'melbourne', 'tokyo', 'beijing', 'shanghai',
  'dubai', 'istanbul', 'moscow', 'cairo', 'nairobi', 'buenos aires', 'sao paulo',
  'mexico city', 'bogota', 'lima', 'santiago', 'miami', 'atlanta', 'denver',
]);

export const COUNTRIES = new Set([
  'spain', 'france', 'germany', 'italy', 'portugal', 'netherlands', 'belgium',
  'united states', 'usa', 'canada', 'mexico', 'argentina', 'brazil', 'colombia',
  'chile', 'peru', 'venezuela', 'ecuador', 'uruguay', 'paraguay', 'bolivia',
  'united kingdom', 'uk', 'ireland', 'australia', 'new zealand', 'japan', 'china',
  'india', 'russia', 'turkey', 'egypt', 'nigeria', 'south africa', 'kenya',
  'españa', 'francia', 'alemania', 'italia', 'reino unido', 'estados unidos',
  'brasil', 'colombia', 'argentina', 'chile', 'perú', 'mexico', 'méxico',
]);

export const LOCATION_WORD_RE = /\b(?:live(?:s)?\s+in|based\s+in|from|born\s+in|grew\s+up\s+in|ubicado\s+en|vivo\s+en|soy\s+de|nac[ií]\s+en)\b/gi;

export const PROFESSION_TITLES = new Set([
  'engineer', 'developer', 'designer', 'architect', 'manager', 'director',
  'ceo', 'cto', 'cfo', 'vp', 'president', 'founder', 'co-founder',
  'doctor', 'physician', 'nurse', 'lawyer', 'attorney', 'judge', 'professor',
  'teacher', 'researcher', 'scientist', 'analyst', 'consultant', 'advisor',
  'accountant', 'auditor', 'journalist', 'writer', 'editor', 'photographer',
  'ingeniero', 'desarrollador', 'diseñador', 'arquitecto', 'gerente', 'director',
  'médico', 'enfermero', 'abogado', 'juez', 'profesor', 'investigador',
  'analista', 'consultor', 'periodista', 'escritor',
]);

export const TECHNOLOGIES = new Set([
  'react', 'vue', 'angular', 'svelte', 'nextjs', 'next.js', 'nuxt', 'remix',
  'typescript', 'javascript', 'python', 'rust', 'go', 'java', 'kotlin', 'swift',
  'node', 'nodejs', 'node.js', 'deno', 'bun',
  'postgresql', 'mysql', 'sqlite', 'mongodb', 'redis', 'cassandra', 'dynamodb',
  'aws', 'azure', 'gcp', 'vercel', 'netlify', 'heroku', 'cloudflare',
  'docker', 'kubernetes', 'terraform', 'ansible',
  'graphql', 'rest', 'grpc', 'websocket',
  'tensorflow', 'pytorch', 'langchain', 'openai', 'anthropic',
]);

// Matches expressions like "yesterday", "last week", "back in 2019", "hace 3 años"
export const TEMPORAL_RE =
  /\b(?:yesterday|last\s+(?:week|month|year|monday|tuesday|wednesday|thursday|friday)|back\s+in\s+\d{4}|in\s+(?:19|20)\d{2}|since\s+(?:19|20)\d{2}|(?:hace|desde)\s+\d+\s+(?:año|mes|semana|día)s?|el\s+(?:lunes|martes|miércoles|jueves|viernes)\s+pasado)\b/gi;

// ────────────────────────────────────────────────────────────────
// Strong — regional dialects and idiomatic markers
// ────────────────────────────────────────────────────────────────

export const DIALECT_MARKERS = new Set([
  // Rioplatense Spanish
  'vos', 'che', 'boludo', 'pibе', 'piba', 'laburo', 'guita',
  // Mexican Spanish
  'órale', 'cuate', 'chido', 'chela', 'mande', 'güey', 'wey',
  // Spain Spanish
  'tío', 'tía', 'macho', 'joder', 'hostia', 'venga', 'chaval',
  // English dialects / slang
  'mate', 'bloke', 'bloody', 'innit', 'cheers', 'reckon', 'gonna', 'wanna',
  'y\'all', 'fixin\'', 'bless your heart', 'wicked', 'pissa', 'ayuh',
]);

export const DIALECT_RE =
  /\b(?:y'all|fixin'|bless\s+your\s+heart|wicked\s+good|innit|gonna|wanna|bloke|bloody\s+hell)\b/gi;
