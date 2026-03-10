import type { LeakEntity, LeakCategory, RiskLevel } from '@/types';

interface PatternRule {
  pattern: RegExp;
  category: LeakCategory;
  risk: RiskLevel;
  suggestion: string;
}

const RULES: PatternRule[] = [
  // ── Emails ────────────────────────────────────────────────────────────────
  {
    pattern: /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g,
    category: 'email',
    risk: 'critical',
    suggestion: 'Never share your email address in public text — it directly identifies you.',
  },

  // ── Phone numbers ─────────────────────────────────────────────────────────
  {
    pattern: /(\+\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}\b/g,
    category: 'phone',
    risk: 'critical',
    suggestion: 'Phone numbers are direct identifiers. Remove them entirely.',
  },

  // ── Social handles ────────────────────────────────────────────────────────
  {
    pattern: /\b(u\/[a-zA-Z0-9_\-]{3,}|@[a-zA-Z0-9_\.]{3,})\b/g,
    category: 'handle',
    risk: 'high',
    suggestion: 'Social handles directly link to your other accounts. Omit them.',
  },

  // ── Government / national IDs ─────────────────────────────────────────────
  {
    // SSN: 123-45-6789 | Cedula VE: V-12345678 | Pasaporte: AB1234567
    pattern: /\b(\d{3}-\d{2}-\d{4}|[VEve]-\d{6,8}|[A-Z]{1,2}\d{6,9})\b/g,
    category: 'identifier',
    risk: 'critical',
    suggestion: 'Government ID numbers are the strongest possible identifier. Never share them.',
  },

  // ── Exact dates ───────────────────────────────────────────────────────────
  {
    // MM/DD/YYYY, DD-MM-YYYY, YYYY-MM-DD
    pattern: /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/g,
    category: 'temporal',
    risk: 'medium',
    suggestion: 'Exact dates can correlate with public events and narrow down your identity.',
  },
  {
    // "March 15", "15 de marzo", "el 3 de abril"
    pattern: /\b(\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?)\b/gi,
    category: 'temporal',
    risk: 'medium',
    suggestion: 'Specific dates can correlate with events and narrow down your identity.',
  },

  // ── Temporal — Spanish ────────────────────────────────────────────────────
  {
    pattern: /\b(ayer|hoy|mañana|la semana pasada|el mes pasado|el año pasado|hace \d+ años?|hace \d+ meses?|hace \d+ días?|esta mañana|esta tarde|esta noche)\b/gi,
    category: 'temporal',
    risk: 'medium',
    suggestion: 'Use vague temporal references like "recently" or "a while ago".',
  },
  // ── Temporal — English ────────────────────────────────────────────────────
  {
    pattern: /\b(yesterday|today|tomorrow|last week|last month|last year|this morning|this afternoon|tonight|a few days ago|a few weeks ago|back in \d{4}|\d+ years? ago|\d+ months? ago|\d+ days? ago|just now|earlier today)\b/gi,
    category: 'temporal',
    risk: 'medium',
    suggestion: 'Use vague temporal references like "recently" or "a while ago".',
  },

  // ── Health conditions ─────────────────────────────────────────────────────
  {
    pattern: /\b(diabetes|cancer|hiv|aids|depression|anxiety|autism|adhd|bipolar|schizophrenia|epilepsy|alzheimer|parkinson|asthma|hypertension|lupus|fibromyalgia|multiple sclerosis|crohn|celiac|arthritis|psoriasis|endometriosis|pcos)\b/gi,
    category: 'health',
    risk: 'high',
    suggestion: 'Health conditions are sensitive identifiers. Use general terms like "a chronic condition".',
  },
  {
    pattern: /\b(diabético|diabética|cáncer|depresión|ansiedad|autismo|epilepsia|hipertensión|artritis|psoriasis|endometriosis)\b/gi,
    category: 'health',
    risk: 'high',
    suggestion: 'Las condiciones de salud son identificadores sensibles. Usa términos generales.',
  },

  // ── Universities / institutions ───────────────────────────────────────────
  {
    pattern: /\b(MIT|Stanford|Harvard|Yale|Princeton|Oxford|Cambridge|Columbia|Cornell|Caltech|UCLA|Berkeley|NYU|Georgetown|Duke|Vanderbilt|Emory|Tufts|Dartmouth|Brown|UPenn|UNAM|USB|UCV|ULA|UCAB|UNEXPO|Simón Bolívar|Tec de Monterrey|ITESM|UBA|PUC|PUCP|USP|UFRJ)\b/g,
    category: 'organization',
    risk: 'high',
    suggestion: 'Specific institutions narrow down your identity significantly. Use "a university" instead.',
  },

  // ── Organizations / companies — English ──────────────────────────────────
  {
    pattern: /\b(I (work|worked) (at|for|with)|I('m| am) (employed|hired) (at|by))\s+[A-Z][a-zA-Z0-9\s&,\.]{2,30}/g,
    category: 'organization',
    risk: 'medium',
    suggestion: 'Mentioning your employer narrows down your identity. Use "my company" instead.',
  },
  {
    pattern: /\b(trabajo|trabajé|trabajo en|trabajé en|soy empleado de|trabajo para)\s+[A-Z][a-zA-Z0-9\s&,\.]{2,30}/gi,
    category: 'organization',
    risk: 'medium',
    suggestion: 'Mencionar tu empleador reduce tu anonimato. Usa "mi empresa" en su lugar.',
  },

  // ── Proper names heuristic — English ─────────────────────────────────────
  {
    // "my friend Carlos", "my colleague Sarah", "my boss John"
    pattern: /\b(my (friend|colleague|coworker|boss|partner|girlfriend|boyfriend|wife|husband|brother|sister|son|daughter|mom|dad|neighbor|roommate|classmate|professor|teacher|mentor))\s+[A-Z][a-z]{2,}/g,
    category: 'personal',
    risk: 'high',
    suggestion: 'Naming people in your life creates a social graph that identifies you. Use "someone I know".',
  },
  {
    // "mi amigo Carlos", "mi jefe Juan"
    pattern: /\b(mi (amigo|amiga|colega|jefe|jefa|pareja|novia|novio|esposa|esposo|hermano|hermana|hijo|hija|mamá|papá|vecino|vecina|compañero|compañera|profesor|profesora|mentor))\s+[A-Z][a-z]{2,}/gi,
    category: 'personal',
    risk: 'high',
    suggestion: 'Nombrar personas crea un grafo social que te identifica. Usa "alguien que conozco".',
  },

  // ── Professions — Spanish ─────────────────────────────────────────────────
  {
    pattern: /\b(desarrollador|ingeniero|médico|abogado|diseñador|programador|arquitecto|contador|enfermero|enfermera|maestro|maestra|profesor|profesora|periodista|psicólogo|psicóloga|analista|consultor|consultora|gerente|director|directora)\b/gi,
    category: 'profession',
    risk: 'medium',
    suggestion: 'Generalize your profession or omit it entirely.',
  },
  // ── Professions — English ─────────────────────────────────────────────────
  {
    pattern: /\b(developer|engineer|doctor|lawyer|designer|programmer|architect|accountant|nurse|teacher|professor|journalist|psychologist|analyst|consultant|manager|director|ceo|cto|cfo|devops|sysadmin|data scientist|product manager)\b/gi,
    category: 'profession',
    risk: 'medium',
    suggestion: 'Generalize your profession or omit it entirely.',
  },

  // ── Technologies ──────────────────────────────────────────────────────────
  {
    pattern: /\b(React|Vue|Angular|Svelte|Next\.js|Nuxt|Remix|Astro|Python|Rust|TypeScript|JavaScript|Node\.js|Deno|Bun|Django|Laravel|Rails|Spring|\.NET|Golang|Go|Kotlin|Swift|Flutter|Dart|PostgreSQL|MySQL|MongoDB|Redis|Kubernetes|Docker|AWS|GCP|Azure|Terraform|GraphQL|tRPC|Prisma|Supabase|Firebase)\b/g,
    category: 'technology',
    risk: 'low',
    suggestion: 'Avoid mentioning specific technologies you use regularly — they narrow down your profile.',
  },

  // ── Personal patterns — English ───────────────────────────────────────────
  {
    pattern: /\b(my (dog|cat|pet|wife|husband|partner|girlfriend|boyfriend|kid|son|daughter|brother|sister|mom|dad|parents|boss|coworker|colleague))\b/gi,
    category: 'personal',
    risk: 'medium',
    suggestion: 'Avoid personal relationship references that can triangulate your identity.',
  },
  {
    pattern: /\b(I (live|work|study|grew up|was born|moved) (in|at|near|to))\b/gi,
    category: 'location',
    risk: 'high',
    suggestion: 'Avoid mentioning where you live, work, or study.',
  },
  {
    pattern: /\b(I (went to|graduated from|studied at|attended))\b/gi,
    category: 'personal',
    risk: 'medium',
    suggestion: 'Specific institutions narrow down your identity significantly.',
  },

  // ── Personal patterns — Spanish ───────────────────────────────────────────
  {
    pattern: /\b(mi (perro|gato|mascota|esposa|esposo|pareja|novia|novio|hijo|hija|hermano|hermana|mamá|papá|jefe|compañero|compañera))\b/gi,
    category: 'personal',
    risk: 'medium',
    suggestion: 'Avoid personal relationship references that can triangulate your identity.',
  },
  {
    pattern: /\b(vivo en|trabajo en|estudio en|nací en|crecí en|me mudé a)\b/gi,
    category: 'location',
    risk: 'high',
    suggestion: 'Avoid mentioning where you live, work, or study.',
  },

  // ── Dialects — Spanish/Latin American ────────────────────────────────────
  {
    pattern: /\b(pana|chamo|chama|vaina|coño|marico|bro|tío|tía|wey|güey|mano|chido|chida|órale|chévere|bacano|parcero|parcera|chimba|berraco|gonorrea|marica|llave|causa|pata|cuate|carnal|compa)\b/gi,
    category: 'dialect',
    risk: 'high',
    suggestion: 'This idiom can reveal your geographic region or country of origin.',
  },

  // ── Age / generation markers ──────────────────────────────────────────────
  {
    pattern: /\b(I('m| am) \d+ years? old|I turn \d+|born in (19|20)\d{2}|class of \d{4}|graduated in \d{4}|tengo \d+ años|nací en (19|20)\d{2})\b/gi,
    category: 'personal',
    risk: 'high',
    suggestion: 'Your exact age or birth year is a strong identifier.',
  },

  // ── Specific locations — English ──────────────────────────────────────────
  {
    pattern: /\b(in (New York|Los Angeles|Chicago|Houston|Miami|San Francisco|Seattle|Boston|Austin|Denver|London|Paris|Berlin|Madrid|Barcelona|Mexico City|Buenos Aires|Bogotá|Lima|Santiago|Caracas|Bogota|Medellin|Guadalajara|Monterrey|São Paulo|Rio de Janeiro))\b/gi,
    category: 'location',
    risk: 'high',
    suggestion: 'Replace specific city names with vague references like "a large city" or "where I live".',
  },
  // ── Specific locations — Spanish ──────────────────────────────────────────
  {
    pattern: /\b(en (Nueva York|Los Ángeles|Miami|Ciudad de México|Buenos Aires|Bogotá|Lima|Santiago|Caracas|Medellín|Guadalajara|Monterrey|São Paulo|Madrid|Barcelona|Mérida|Maracaibo|Valencia|Caracas|Barquisimeto))\b/gi,
    category: 'location',
    risk: 'high',
    suggestion: 'Replace specific city names with vague references like "a large city" or "where I live".',
  },
];

export function detectLeaks(text: string): LeakEntity[] {
  const entities: LeakEntity[] = [];

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = rule.pattern.exec(text)) !== null) {
      // Avoid duplicate overlapping matches
      const isDuplicate = entities.some(
        (e) => e.startIndex <= match!.index && e.endIndex >= match!.index + match![0].length
      );
      if (!isDuplicate) {
        entities.push({
          text: match[0],
          category: rule.category,
          risk: rule.risk,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          suggestion: rule.suggestion,
        });
      }
    }
  }

  // Sort by position in text
  return entities.sort((a, b) => a.startIndex - b.startIndex);
}

export function getRiskColor(risk: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: '#4ade80',
    medium: '#facc15',
    high: '#f97316',
    critical: '#ef4444',
  };
  return colors[risk];
}
