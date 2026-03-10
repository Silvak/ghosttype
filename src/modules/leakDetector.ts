import type { LeakEntity, LeakCategory, RiskLevel } from '@/types';

interface PatternRule {
  pattern: RegExp;
  category: LeakCategory;
  risk: RiskLevel;
  suggestion?: string;
}

const RULES: PatternRule[] = [
  {
    pattern: /\b(ayer|hoy|mañana|la semana pasada|el mes pasado|hace \d+ años?)\b/gi,
    category: 'temporal',
    risk: 'medium',
    suggestion: 'Usa referencias temporales relativas o vagas.',
  },
  {
    pattern: /\b(desarrollador|ingeniero|médico|abogado|diseñador|programador|arquitecto)\b/gi,
    category: 'profession',
    risk: 'medium',
    suggestion: 'Generaliza tu profesión o elimínala.',
  },
  {
    pattern: /\b(React|Vue|Angular|Python|Rust|TypeScript|JavaScript|Node\.js|Django|Laravel)\b/g,
    category: 'technology',
    risk: 'low',
    suggestion: 'Evita mencionar tecnologías específicas que uses habitualmente.',
  },
  {
    pattern: /\b(pana|chamo|chama|vaina|coño|marico|verga|bro|tío|tía|wey|güey|mano)\b/gi,
    category: 'dialect',
    risk: 'high',
    suggestion: 'Este modismo puede revelar tu región geográfica.',
  },
];

export function detectLeaks(text: string): LeakEntity[] {
  const entities: LeakEntity[] = [];

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = rule.pattern.exec(text)) !== null) {
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

  return entities;
}

export function getRiskColor(risk: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: '#6ee7b7',
    medium: '#fcd34d',
    high: '#f97316',
    critical: '#ef4444',
  };
  return colors[risk];
}
