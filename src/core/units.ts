export type UnitValue = number | `${number}%` | `${number}px`;
export type UnitPoint = [UnitValue, UnitValue];
export type UnitSize = [UnitValue, UnitValue];

export type UnitAxis = 'x' | 'y' | 'radius';

export interface UnitReferenceSize {
    width: number;
    height: number;
}

export interface UnitSpec {
    readonly unit: 'px' | 'percent';
    readonly value: number;
    readonly raw: UnitValue;
}

type UnitPairSpec = [UnitSpec, UnitSpec];

const UNIT_PATTERN = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(px|%)$/;

export function parseUnitValue(value: UnitValue, context: string): UnitSpec {
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
            throw new Error(`Zeta: ${context} must be a finite number`);
        }
        return {
            unit: 'px',
            value,
            raw: value,
        };
    }

    const trimmed = value.trim();
    const match = UNIT_PATTERN.exec(trimmed);
    if (!match) {
        throw new Error(`Zeta: Invalid ${context} "${value}". Use number, "<n>px", or "<n>%"`);
    }

    const num = Number.parseFloat(match[1]);
    if (!Number.isFinite(num)) {
        throw new Error(`Zeta: Invalid ${context} "${value}". Numeric part is not finite`);
    }

    const unit = match[2] === '%' ? 'percent' : 'px';
    return {
        unit,
        value: num,
        raw: value,
    };
}

export function parseUnitPoint(
    value: UnitPoint,
    contextX: string,
    contextY: string = contextX,
): UnitPairSpec {
    return [
        parseUnitValue(value[0], contextX),
        parseUnitValue(value[1], contextY),
    ];
}

export function parseUnitSize(
    value: UnitSize,
    contextX: string,
    contextY: string = contextX,
): UnitPairSpec {
    return parseUnitPoint(value, contextX, contextY);
}

export function isRelativeUnit(spec: UnitSpec): boolean {
    return spec.unit === 'percent';
}

export function hasRelativeUnits(specs: UnitPairSpec): boolean {
    return isRelativeUnit(specs[0]) || isRelativeUnit(specs[1]);
}

export function resolveUnitSpec(
    spec: UnitSpec,
    axis: UnitAxis,
    reference: UnitReferenceSize | null,
    context: string,
): number {
    if (spec.unit === 'px') {
        return spec.value;
    }

    if (!reference) {
        throw new Error(
            `Zeta: Cannot resolve ${context} "${spec.raw}" because parent container size is not defined. ` +
            'Set parent.size(...) or use pixel units.',
        );
    }

    const base = axis === 'x'
        ? reference.width
        : (axis === 'y' ? reference.height : Math.min(reference.width, reference.height));

    return (spec.value / 100) * base;
}
