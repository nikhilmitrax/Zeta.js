import { SceneNode, type NodeType } from '../core/node';
import { Signal } from '../core/signal';
import { Vec2, BBox, type ShapeGeometry } from '../math';
import type { AnchorName } from '../core/anchor';
import {
    type UnitPoint,
    type UnitSpec,
    type UnitValue,
    hasRelativeUnits,
    parseUnitPoint,
} from '../core/units';

export type LineRouteMode = 'straight' | 'step' | 'orthogonal';

export interface LineRouteOptions {
    radius?: number;
    avoidObstacles?: boolean;
}

export type LineAnchorRef =
    | AnchorName
    | number
    | 'auto'
    | ((node: SceneNode, other: SceneNode) => [number, number]);

export interface LineConnectOptions {
    from?: LineAnchorRef;
    to?: LineAnchorRef;
    fromOffset?: UnitPoint;
    toOffset?: UnitPoint;
}

export class Line extends SceneNode {
    readonly type: NodeType = 'line';
    readonly _from: Signal<Vec2>;
    readonly _to: Signal<Vec2>;
    readonly _routeMode: Signal<LineRouteMode>;
    readonly _routeRadius: Signal<number>;
    readonly _avoidObstacles: Signal<boolean>;
    private _fromSpec: [UnitSpec, UnitSpec];
    private _toSpec: [UnitSpec, UnitSpec];
    private _disconnectBinding: (() => void) | null = null;
    private _connectedFromNode: SceneNode | null = null;
    private _connectedToNode: SceneNode | null = null;

    constructor(from: Vec2, to: Vec2) {
        super(Vec2.zero());
        this._from = new Signal(from);
        this._to = new Signal(to);
        this._fromSpec = parseUnitPoint([from.x, from.y], 'line from.x', 'line from.y');
        this._toSpec = parseUnitPoint([to.x, to.y], 'line to.x', 'line to.y');
        this._routeMode = new Signal<LineRouteMode>('straight');
        this._routeRadius = new Signal(0);
        this._avoidObstacles = new Signal(false);

        this._from.subscribe(() => this._markRenderDirty(true));
        this._to.subscribe(() => this._markRenderDirty(true));
        this._routeMode.subscribe(() => this._markRenderDirty(true));
        this._routeRadius.subscribe(() => this._markRenderDirty(true));
        this._avoidObstacles.subscribe(() => this._markRenderDirty(true));

        // Default: stroke-only
        this.stroke('#000', 1);
    }

    /** Set the start point. */
    from(point: UnitPoint): this;
    from(x: UnitValue, y: UnitValue): this;
    from(xOrPoint: UnitValue | UnitPoint, y?: UnitValue): this {
        this._fromSpec = Array.isArray(xOrPoint)
            ? parseUnitPoint([xOrPoint[0], xOrPoint[1]], 'line from.x', 'line from.y')
            : parseUnitPoint([xOrPoint, y!], 'line from.x', 'line from.y');
        this._resolveFromSpec();
        this._refreshRelativeUnitTracking();
        return this;
    }

    /** Set the end point. */
    to(point: UnitPoint): this;
    to(x: UnitValue, y: UnitValue): this;
    to(xOrPoint: UnitValue | UnitPoint, y?: UnitValue): this {
        this._toSpec = Array.isArray(xOrPoint)
            ? parseUnitPoint([xOrPoint[0], xOrPoint[1]], 'line to.x', 'line to.y')
            : parseUnitPoint([xOrPoint, y!], 'line to.x', 'line to.y');
        this._resolveToSpec();
        this._refreshRelativeUnitTracking();
        return this;
    }

    protected override _hasRelativeUnitSpecs(): boolean {
        return super._hasRelativeUnitSpecs()
            || hasRelativeUnits(this._fromSpec)
            || hasRelativeUnits(this._toSpec);
    }

    protected override _resolveRelativeUnits(): void {
        super._resolveRelativeUnits();
        this._resolveFromSpec();
        this._resolveToSpec();
    }

    private _resolveFromSpec(): void {
        if (!this.parent && hasRelativeUnits(this._fromSpec)) {
            // Defer until attached to a parent that can provide reference size.
            return;
        }

        const next = new Vec2(
            this._resolveUnitSpec(this._fromSpec[0], 'x', 'line from.x'),
            this._resolveUnitSpec(this._fromSpec[1], 'y', 'line from.y'),
        );
        if (!this._from.get().equals(next)) {
            this._from.set(next);
        }
    }

    private _resolveToSpec(): void {
        if (!this.parent && hasRelativeUnits(this._toSpec)) {
            // Defer until attached to a parent that can provide reference size.
            return;
        }

        const next = new Vec2(
            this._resolveUnitSpec(this._toSpec[0], 'x', 'line to.x'),
            this._resolveUnitSpec(this._toSpec[1], 'y', 'line to.y'),
        );
        if (!this._to.get().equals(next)) {
            this._to.set(next);
        }
    }

    route(mode: LineRouteMode, opts: LineRouteOptions = {}): this {
        this._routeMode.set(mode);
        if (opts.radius !== undefined) {
            this._routeRadius.set(Math.max(0, opts.radius));
        }
        if (opts.avoidObstacles !== undefined) {
            this._avoidObstacles.set(opts.avoidObstacles);
        }
        return this;
    }

    /**
     * Bind this line reactively between two nodes and anchors.
     * Endpoints update automatically when either node's layout changes.
     */
    connect(fromNode: SceneNode, toNode: SceneNode, opts: LineConnectOptions = {}): this {
        this.disconnect();
        this._connectedFromNode = fromNode;
        this._connectedToNode = toNode;

        const fromRef = opts.from ?? 'auto';
        const toRef = opts.to ?? 'auto';
        const fromOffset = parseUnitPoint(opts.fromOffset ?? [0, 0], 'line fromOffset.x', 'line fromOffset.y');
        const toOffset = parseUnitPoint(opts.toOffset ?? [0, 0], 'line toOffset.x', 'line toOffset.y');

        const resolve = (node: SceneNode, other: SceneNode, ref: LineAnchorRef): Vec2 => {
            if (typeof ref === 'function') {
                return Vec2.from(ref(node, other));
            }
            if (typeof ref === 'number') {
                return Vec2.from(node.anchor.atAngle(ref));
            }
            if (ref === 'auto') {
                const [sx, sy] = node.anchor.center;
                const [ox, oy] = other.anchor.center;
                const deg = (Math.atan2(oy - sy, ox - sx) * 180) / Math.PI;
                return Vec2.from(node.anchor.atAngle(deg));
            }
            return Vec2.from(node.anchor.get(ref));
        };

        const update = () => {
            const worldFrom = resolve(fromNode, toNode, fromRef).add(
                new Vec2(
                    this._resolveUnitSpec(fromOffset[0], 'x', 'line fromOffset.x'),
                    this._resolveUnitSpec(fromOffset[1], 'y', 'line fromOffset.y'),
                ),
            );
            const worldTo = resolve(toNode, fromNode, toRef).add(
                new Vec2(
                    this._resolveUnitSpec(toOffset[0], 'x', 'line toOffset.x'),
                    this._resolveUnitSpec(toOffset[1], 'y', 'line toOffset.y'),
                ),
            );
            const inv = this.getWorldTransform().invert();
            const localFrom = inv.transformPoint(worldFrom);
            const localTo = inv.transformPoint(worldTo);
            this.from(localFrom.x, localFrom.y).to(localTo.x, localTo.y);
        };

        const unsubFrom = fromNode.watchLayout(update);
        const unsubTo = toNode.watchLayout(update);
        const unsubParent = (hasRelativeUnits(fromOffset) || hasRelativeUnits(toOffset))
            ? this.parent?.watchLayout(update) ?? null
            : null;
        this._disconnectBinding = () => {
            unsubFrom();
            unsubTo();
            unsubParent?.();
        };

        update();
        return this;
    }

    disconnect(): this {
        this._disconnectBinding?.();
        this._disconnectBinding = null;
        this._connectedFromNode = null;
        this._connectedToNode = null;
        return this;
    }

    getFrom(): Vec2 {
        return this._from.get();
    }

    getTo(): Vec2 {
        return this._to.get();
    }

    getRouteMode(): LineRouteMode {
        return this._routeMode.get();
    }

    getRouteRadius(): number {
        return this._routeRadius.get();
    }

    getRoutePoints(): Vec2[] {
        const from = this._from.get();
        const to = this._to.get();
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const mode = this._routeMode.get();
        const avoidObstacles = this._avoidObstacles.get();

        if (mode === 'straight') {
            return [from, to];
        }

        if ((dx === 0 || dy === 0) && !(mode === 'orthogonal' && avoidObstacles)) {
            return [from, to];
        }

        if (mode === 'step') {
            const elbow = Math.abs(dx) >= Math.abs(dy)
                ? new Vec2(to.x, from.y)
                : new Vec2(from.x, to.y);
            return this._dedupeRoute([from, elbow, to]);
        }

        if (avoidObstacles) {
            const world = this.getWorldTransform();
            const worldFrom = world.transformPoint(from);
            const worldTo = world.transformPoint(to);
            const routedWorld = this._routeOrthogonalAvoidingObstacles(worldFrom, worldTo);
            if (routedWorld && routedWorld.length >= 2) {
                const inv = world.invert();
                return this._dedupeRoute(routedWorld.map((p) => inv.transformPoint(p)));
            }
        }

        return this._simpleOrthogonalRoute(from, to);
    }

    computeLocalBBox(): BBox {
        this._settleForMeasurement();
        return BBox.fromPoints(this.getRoutePoints());
    }

    getShapeGeometry(): ShapeGeometry {
        return { type: 'rect', bbox: this.computeLocalBBox() };
    }

    private _dedupeRoute(points: Vec2[]): Vec2[] {
        const out: Vec2[] = [];
        for (const p of points) {
            if (out.length === 0 || !out[out.length - 1].equals(p)) {
                out.push(p);
            }
        }
        return out;
    }

    private _routeOrthogonalAvoidingObstacles(from: Vec2, to: Vec2): Vec2[] | null {
        const obstacles = this._collectObstacleBBoxesWorld(from, to).map((bb) => bb.expand(6));
        if (obstacles.length === 0) return null;

        const direct = this._simpleOrthogonalRoute(from, to);
        if (!this._routeIntersectsObstacles(direct, obstacles)) {
            return direct;
        }

        const bounds = this._computeRoutingBounds(from, to, obstacles);
        const cell = this._computeGridCellSize(from, to);

        const cols = Math.max(3, Math.ceil(bounds.width / cell) + 1);
        const rows = Math.max(3, Math.ceil(bounds.height / cell) + 1);
        if (cols * rows > 40000) return null;

        const blocked = new Uint8Array(cols * rows);
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const p = this._gridPoint(bounds, cell, x, y);
                const idx = y * cols + x;
                if (obstacles.some((bb) => bb.containsPoint(p))) {
                    blocked[idx] = 1;
                }
            }
        }

        const start = this._pointToCell(from, bounds, cell, cols, rows);
        const goal = this._pointToCell(to, bounds, cell, cols, rows);
        this._clearCellNeighborhood(blocked, cols, rows, start.x, start.y, 1);
        this._clearCellNeighborhood(blocked, cols, rows, goal.x, goal.y, 1);

        const pathCells = this._aStar(start, goal, cols, rows, blocked);
        if (!pathCells || pathCells.length < 2) return null;

        const cellPoints = pathCells.map((c) => this._gridPoint(bounds, cell, c.x, c.y));
        const points = [
            from,
            ...cellPoints.slice(1, -1),
            to,
        ];
        return this._simplifyOrthogonalPoints(this._orthogonalize(points));
    }

    private _simpleOrthogonalRoute(from: Vec2, to: Vec2): Vec2[] {
        const dx = to.x - from.x;
        const dy = to.y - from.y;

        if (dx === 0 || dy === 0) {
            return [from, to];
        }

        if (Math.abs(dx) >= Math.abs(dy)) {
            const midX = from.x + dx / 2;
            return this._dedupeRoute([
                from,
                new Vec2(midX, from.y),
                new Vec2(midX, to.y),
                to,
            ]);
        }

        const midY = from.y + dy / 2;
        return this._dedupeRoute([
            from,
            new Vec2(from.x, midY),
            new Vec2(to.x, midY),
            to,
        ]);
    }

    private _routeIntersectsObstacles(points: Vec2[], obstacles: BBox[]): boolean {
        for (let i = 0; i < points.length - 1; i++) {
            if (obstacles.some((bb) => this._orthogonalSegmentIntersectsBBox(points[i], points[i + 1], bb))) {
                return true;
            }
        }
        return false;
    }

    private _orthogonalSegmentIntersectsBBox(a: Vec2, b: Vec2, bbox: BBox): boolean {
        const minX = Math.min(a.x, b.x);
        const maxX = Math.max(a.x, b.x);
        const minY = Math.min(a.y, b.y);
        const maxY = Math.max(a.y, b.y);

        if (a.x === b.x) {
            return (
                a.x >= bbox.minX &&
                a.x <= bbox.maxX &&
                maxY >= bbox.minY &&
                minY <= bbox.maxY
            );
        }

        if (a.y === b.y) {
            return (
                a.y >= bbox.minY &&
                a.y <= bbox.maxY &&
                maxX >= bbox.minX &&
                minX <= bbox.maxX
            );
        }

        return (
            maxX >= bbox.minX &&
            minX <= bbox.maxX &&
            maxY >= bbox.minY &&
            minY <= bbox.maxY
        );
    }

    private _aStar(
        start: { x: number; y: number },
        goal: { x: number; y: number },
        cols: number,
        rows: number,
        blocked: Uint8Array,
    ): Array<{ x: number; y: number }> | null {
        if (start.x === goal.x && start.y === goal.y) {
            return [start, goal];
        }

        const total = cols * rows;
        const gScore = new Float64Array(total);
        const fScore = new Float64Array(total);
        const cameFrom = new Int32Array(total);
        gScore.fill(Infinity);
        fScore.fill(Infinity);
        cameFrom.fill(-1);

        const startIdx = start.y * cols + start.x;
        const goalIdx = goal.y * cols + goal.x;
        gScore[startIdx] = 0;
        fScore[startIdx] = this._manhattan(start.x, start.y, goal.x, goal.y);

        const open = new Set<number>();
        open.add(startIdx);

        while (open.size > 0) {
            let current = -1;
            let bestF = Infinity;
            for (const idx of open) {
                if (fScore[idx] < bestF) {
                    bestF = fScore[idx];
                    current = idx;
                }
            }
            if (current === -1) return null;
            if (current === goalIdx) {
                return this._reconstructPath(cameFrom, current, cols);
            }

            open.delete(current);
            const cx = current % cols;
            const cy = Math.floor(current / cols);

            const neighbors = [
                { x: cx + 1, y: cy },
                { x: cx - 1, y: cy },
                { x: cx, y: cy + 1 },
                { x: cx, y: cy - 1 },
            ];

            for (const n of neighbors) {
                if (n.x < 0 || n.x >= cols || n.y < 0 || n.y >= rows) continue;
                const nIdx = n.y * cols + n.x;
                if (blocked[nIdx]) continue;

                const tentative = gScore[current] + 1;
                if (tentative >= gScore[nIdx]) continue;

                cameFrom[nIdx] = current;
                gScore[nIdx] = tentative;
                fScore[nIdx] = tentative + this._manhattan(n.x, n.y, goal.x, goal.y);
                open.add(nIdx);
            }
        }

        return null;
    }

    private _reconstructPath(
        cameFrom: Int32Array,
        current: number,
        cols: number,
    ): Array<{ x: number; y: number }> {
        const out: Array<{ x: number; y: number }> = [];
        let c = current;
        while (c !== -1) {
            out.push({ x: c % cols, y: Math.floor(c / cols) });
            c = cameFrom[c];
        }
        out.reverse();
        return out;
    }

    private _manhattan(ax: number, ay: number, bx: number, by: number): number {
        return Math.abs(ax - bx) + Math.abs(ay - by);
    }

    private _pointToCell(
        p: Vec2,
        bounds: BBox,
        cell: number,
        cols: number,
        rows: number,
    ): { x: number; y: number } {
        const x = Math.round((p.x - bounds.minX) / cell);
        const y = Math.round((p.y - bounds.minY) / cell);
        return {
            x: Math.max(0, Math.min(cols - 1, x)),
            y: Math.max(0, Math.min(rows - 1, y)),
        };
    }

    private _gridPoint(bounds: BBox, cell: number, x: number, y: number): Vec2 {
        return new Vec2(bounds.minX + x * cell, bounds.minY + y * cell);
    }

    private _clearCellNeighborhood(
        blocked: Uint8Array,
        cols: number,
        rows: number,
        cx: number,
        cy: number,
        radius: number,
    ): void {
        for (let y = cy - radius; y <= cy + radius; y++) {
            if (y < 0 || y >= rows) continue;
            for (let x = cx - radius; x <= cx + radius; x++) {
                if (x < 0 || x >= cols) continue;
                blocked[y * cols + x] = 0;
            }
        }
    }

    private _computeRoutingBounds(from: Vec2, to: Vec2, obstacles: BBox[]): BBox {
        let bounds = BBox.fromPoints([from, to]);
        for (const bb of obstacles) {
            bounds = bounds.union(bb);
        }
        return bounds.expand(40);
    }

    private _computeGridCellSize(from: Vec2, to: Vec2): number {
        const span = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
        if (span > 600) return 24;
        if (span > 300) return 20;
        return 16;
    }

    private _orthogonalize(points: Vec2[]): Vec2[] {
        if (points.length < 2) return points;

        const out: Vec2[] = [points[0]];
        for (let i = 1; i < points.length; i++) {
            const prev = out[out.length - 1];
            const cur = points[i];
            if (prev.x !== cur.x && prev.y !== cur.y) {
                out.push(new Vec2(cur.x, prev.y));
            }
            out.push(cur);
        }
        return out;
    }

    private _simplifyOrthogonalPoints(points: Vec2[]): Vec2[] {
        const deduped = this._dedupeRoute(points);
        if (deduped.length <= 2) return deduped;

        const out: Vec2[] = [deduped[0]];
        for (let i = 1; i < deduped.length - 1; i++) {
            const a = out[out.length - 1];
            const b = deduped[i];
            const c = deduped[i + 1];

            const abx = Math.sign(b.x - a.x);
            const aby = Math.sign(b.y - a.y);
            const bcx = Math.sign(c.x - b.x);
            const bcy = Math.sign(c.y - b.y);

            if (abx === bcx && aby === bcy) continue;
            out.push(b);
        }
        out.push(deduped[deduped.length - 1]);
        return out;
    }

    private _collectObstacleBBoxesWorld(from: Vec2, to: Vec2): BBox[] {
        const root = this._getRoot();
        const skip = new Set<SceneNode>();
        let p: SceneNode | null = this;
        while (p) {
            skip.add(p);
            p = p.parent;
        }

        const obstacles: BBox[] = [];
        const walk = (node: SceneNode): void => {
            if (this._isConnectedEndpointSubtree(node)) {
                return;
            }

            if (
                !skip.has(node) &&
                node._visible.get() &&
                node.type !== 'group' &&
                node.type !== 'scene' &&
                node.type !== 'line' &&
                node.type !== 'text'
            ) {
                const bb = node.computeWorldBBox();
                if (!bb.isEmpty()) {
                    // Ignore containers/backgrounds and endpoint hosts so routed
                    // lines can leave source nodes and enter target nodes.
                    if (bb.containsPoint(from) || bb.containsPoint(to)) {
                        return;
                    }
                    obstacles.push(bb);
                }
            }
            for (const child of node.children) {
                walk(child);
            }
        };

        walk(root);
        return obstacles;
    }

    private _isConnectedEndpointSubtree(node: SceneNode): boolean {
        let current: SceneNode | null = node;
        while (current) {
            if (current === this._connectedFromNode || current === this._connectedToNode) {
                return true;
            }
            current = current.parent;
        }
        return false;
    }

    private _getRoot(): SceneNode {
        let node: SceneNode = this;
        while (node.parent) {
            node = node.parent;
        }
        return node;
    }
}
