type ScriptMap = Record<string, string>;

const COMMAND_SYMBOLS: Record<string, string> = {
    alpha: 'α',
    beta: 'β',
    gamma: 'γ',
    delta: 'δ',
    epsilon: 'ε',
    zeta: 'ζ',
    eta: 'η',
    theta: 'θ',
    iota: 'ι',
    kappa: 'κ',
    lambda: 'λ',
    mu: 'μ',
    nu: 'ν',
    xi: 'ξ',
    pi: 'π',
    rho: 'ρ',
    sigma: 'σ',
    tau: 'τ',
    upsilon: 'υ',
    phi: 'φ',
    chi: 'χ',
    psi: 'ψ',
    omega: 'ω',
    Gamma: 'Γ',
    Delta: 'Δ',
    Theta: 'Θ',
    Lambda: 'Λ',
    Xi: 'Ξ',
    Pi: 'Π',
    Sigma: 'Σ',
    Upsilon: 'Υ',
    Phi: 'Φ',
    Psi: 'Ψ',
    Omega: 'Ω',
    cdot: '·',
    times: '×',
    div: '÷',
    pm: '±',
    mp: '∓',
    neq: '≠',
    leq: '≤',
    geq: '≥',
    approx: '≈',
    infty: '∞',
    sum: '∑',
    prod: '∏',
    int: '∫',
    partial: '∂',
    nabla: '∇',
    to: '→',
    leftarrow: '←',
    rightarrow: '→',
    leftrightarrow: '↔',
    mapsto: '↦',
    degree: '°',
};

const SUPERSCRIPT_MAP: ScriptMap = {
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
    '+': '⁺',
    '-': '⁻',
    '=': '⁼',
    '(': '⁽',
    ')': '⁾',
    n: 'ⁿ',
    i: 'ⁱ',
};

const SUBSCRIPT_MAP: ScriptMap = {
    '0': '₀',
    '1': '₁',
    '2': '₂',
    '3': '₃',
    '4': '₄',
    '5': '₅',
    '6': '₆',
    '7': '₇',
    '8': '₈',
    '9': '₉',
    '+': '₊',
    '-': '₋',
    '=': '₌',
    '(': '₍',
    ')': '₎',
    a: 'ₐ',
    e: 'ₑ',
    h: 'ₕ',
    i: 'ᵢ',
    j: 'ⱼ',
    k: 'ₖ',
    l: 'ₗ',
    m: 'ₘ',
    n: 'ₙ',
    o: 'ₒ',
    p: 'ₚ',
    r: 'ᵣ',
    s: 'ₛ',
    t: 'ₜ',
    u: 'ᵤ',
    v: 'ᵥ',
    x: 'ₓ',
};

const TEXT_GROUP_COMMANDS = new Set(['text', 'mathrm', 'mathit', 'mathbf', 'operatorname']);
const SKIPPED_COMMANDS = new Set(['left', 'right', 'displaystyle', 'textstyle', 'scriptstyle', 'scriptscriptstyle']);

export function normalizeLatex(input: string): string {
    if (!input) return '';
    const parser = new LatexParser(input);
    const normalized = parser.parse();
    return normalized.replace(/\s+/g, ' ').trim();
}

class LatexParser {
    private index = 0;

    constructor(private readonly source: string) {}

    parse(): string {
        return this.parseExpression();
    }

    private parseExpression(until?: string): string {
        let out = '';

        while (this.index < this.source.length) {
            const ch = this.source[this.index];

            if (until && ch === until) {
                this.index += 1;
                break;
            }

            if (ch === '{') {
                this.index += 1;
                out += this.parseExpression('}');
                continue;
            }

            if (ch === '}') {
                this.index += 1;
                break;
            }

            if (ch === '\\') {
                out += this.parseCommand();
                continue;
            }

            if (ch === '^') {
                this.index += 1;
                out += mapScript(this.parseScriptOperand(), SUPERSCRIPT_MAP, '^');
                continue;
            }

            if (ch === '_') {
                this.index += 1;
                out += mapScript(this.parseScriptOperand(), SUBSCRIPT_MAP, '_');
                continue;
            }

            if (ch === '~') {
                this.index += 1;
                out += ' ';
                continue;
            }

            // Allow users to pass "$...$" / "$$...$$" directly.
            if (ch === '$') {
                this.index += 1;
                continue;
            }

            out += ch;
            this.index += 1;
        }

        return out;
    }

    private parseCommand(): string {
        this.index += 1;
        if (this.index >= this.source.length) return '';

        const first = this.source[this.index];
        if (!isLetter(first)) {
            this.index += 1;
            return mapSingleSymbolCommand(first);
        }

        const start = this.index;
        while (this.index < this.source.length && isLetter(this.source[this.index])) {
            this.index += 1;
        }
        const command = this.source.slice(start, this.index);

        if (SKIPPED_COMMANDS.has(command)) {
            return '';
        }
        if (command === 'frac') {
            const numerator = this.parseGroupOrAtom();
            const denominator = this.parseGroupOrAtom();
            return `(${numerator})/(${denominator})`;
        }
        if (command === 'sqrt') {
            this.skipWhitespace();
            if (this.peek() === '[') {
                this.consumeBracketGroup('[', ']');
            }
            const body = this.parseGroupOrAtom();
            return `√(${body})`;
        }
        if (command === 'begin' || command === 'end') {
            this.parseGroupOrAtom();
            return '';
        }
        if (TEXT_GROUP_COMMANDS.has(command)) {
            return this.parseGroupOrAtom();
        }
        const mapped = COMMAND_SYMBOLS[command];
        if (mapped) {
            return mapped;
        }
        return command;
    }

    private parseScriptOperand(): string {
        this.skipWhitespace();
        if (this.index >= this.source.length) return '';

        const ch = this.source[this.index];
        if (ch === '{') {
            this.index += 1;
            return this.parseExpression('}');
        }
        if (ch === '\\') {
            return this.parseCommand();
        }

        this.index += 1;
        return ch;
    }

    private parseGroupOrAtom(): string {
        this.skipWhitespace();
        if (this.index >= this.source.length) return '';

        const ch = this.source[this.index];
        if (ch === '{') {
            this.index += 1;
            return this.parseExpression('}');
        }
        if (ch === '\\') {
            return this.parseCommand();
        }

        this.index += 1;
        return ch;
    }

    private consumeBracketGroup(open: string, close: string): string {
        if (this.peek() !== open) return '';
        this.index += 1;

        let depth = 1;
        let out = '';
        while (this.index < this.source.length && depth > 0) {
            const ch = this.source[this.index];
            this.index += 1;

            if (ch === open) {
                depth += 1;
                out += ch;
                continue;
            }
            if (ch === close) {
                depth -= 1;
                if (depth === 0) break;
                out += ch;
                continue;
            }
            out += ch;
        }
        return out;
    }

    private skipWhitespace(): void {
        while (this.index < this.source.length) {
            const ch = this.source[this.index];
            if (ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r') {
                this.index += 1;
                continue;
            }
            break;
        }
    }

    private peek(): string | null {
        if (this.index >= this.source.length) return null;
        return this.source[this.index];
    }
}

function isLetter(ch: string): boolean {
    const code = ch.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function mapSingleSymbolCommand(ch: string): string {
    switch (ch) {
        case '\\':
            return ' ';
        case ',':
        case ';':
        case ':':
        case '!':
            return ' ';
        case '{':
        case '}':
        case '$':
        case '_':
        case '^':
        case '%':
        case '&':
        case '#':
            return ch;
        default:
            return ch;
    }
}

function mapScript(input: string, table: ScriptMap, fallbackPrefix: '^' | '_'): string {
    if (!input) return '';
    let mapped = '';
    for (const ch of input) {
        const next = table[ch];
        if (!next) {
            return `${fallbackPrefix}(${input})`;
        }
        mapped += next;
    }
    return mapped;
}
