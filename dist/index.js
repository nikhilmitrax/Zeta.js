// src/core/signal.ts
var currentComputed = null;
var batchDepth = 0;
var batchQueue = /* @__PURE__ */ new Set();
var Signal = class {
  constructor(value) {
    this._listeners = /* @__PURE__ */ new Set();
    this._dependents = /* @__PURE__ */ new Set();
    this._value = value;
  }
  /** Read the current value. If called inside a `computed()`, auto-tracks. */
  get() {
    if (currentComputed) {
      this._dependents.add(currentComputed);
      currentComputed.addSource(this);
    }
    return this._value;
  }
  /** Set a new value. Notifies subscribers if changed (shallow equality). */
  set(value) {
    if (Object.is(this._value, value)) return;
    this._value = value;
    if (batchDepth > 0) {
      batchQueue.add(this);
    } else {
      this._notify();
    }
  }
  /** Subscribe to value changes. Returns an unsubscribe function. */
  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }
  /** @internal */
  _notify() {
    const value = this._value;
    const listeners = [...this._listeners];
    const dependents = [...this._dependents];
    for (const listener of listeners) {
      listener(value);
    }
    for (const dep of dependents) {
      dep._recompute();
    }
  }
  /** @internal Remove a dependent Computed (cleanup). */
  _removeDependent(c) {
    this._dependents.delete(c);
  }
};
var Computed = class {
  constructor(fn) {
    this._sources = /* @__PURE__ */ new Set();
    this._listeners = /* @__PURE__ */ new Set();
    this._dirty = true;
    this._fn = fn;
    this._recompute();
  }
  get() {
    if (this._dirty) this._recompute();
    return this._value;
  }
  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }
  /** @internal */
  addSource(s) {
    this._sources.add(s);
  }
  /** @internal */
  _recompute() {
    for (const s of this._sources) {
      s._removeDependent(this);
    }
    this._sources.clear();
    const prev = currentComputed;
    currentComputed = this;
    try {
      const newValue = this._fn();
      if (!Object.is(this._value, newValue)) {
        this._value = newValue;
        for (const listener of this._listeners) {
          listener(newValue);
        }
      }
    } finally {
      currentComputed = prev;
    }
    this._dirty = false;
  }
  dispose() {
    for (const s of this._sources) {
      s._removeDependent(this);
    }
    this._sources.clear();
    this._listeners.clear();
  }
};
function signal(value) {
  return new Signal(value);
}
function computed(fn) {
  return new Computed(fn);
}
function batch(fn) {
  batchDepth++;
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      const queued = [...batchQueue];
      batchQueue.clear();
      for (const s of queued) {
        s._notify();
      }
    }
  }
}

// src/core/style.ts
var DEFAULT_STYLE = {
  fill: null,
  stroke: null,
  dashPattern: null,
  opacity: 1,
  cursor: "default"
};
var Style = class _Style {
  constructor(props = {}) {
    this._props = props;
  }
  static create() {
    return new _Style();
  }
  static fill(color) {
    return _Style.create().fill(color);
  }
  static stroke(color, width = 1) {
    return _Style.create().stroke(color, width);
  }
  static dashed(pattern) {
    return _Style.create().dashed(pattern);
  }
  static opacity(value) {
    return _Style.create().opacity(value);
  }
  static cursor(type) {
    return _Style.create().cursor(type);
  }
  static fontSize(size) {
    return _Style.create().fontSize(size);
  }
  static fontFamily(family) {
    return _Style.create().fontFamily(family);
  }
  static textAlign(align) {
    return _Style.create().textAlign(align);
  }
  static textBaseline(baseline) {
    return _Style.create().textBaseline(baseline);
  }
  fill(color) {
    return this._next({ fill: color });
  }
  stroke(color, width = 1) {
    return this._next({ stroke: { color, width } });
  }
  dashed(pattern) {
    return this._next({ dashPattern: [...pattern] });
  }
  opacity(value) {
    return this._next({ opacity: value });
  }
  cursor(type) {
    return this._next({ cursor: type });
  }
  fontSize(size) {
    return this._next({ fontSize: size });
  }
  fontFamily(family) {
    return this._next({ fontFamily: family });
  }
  textAlign(align) {
    return this._next({ textAlign: align });
  }
  textBaseline(baseline) {
    return this._next({ textBaseline: baseline });
  }
  merge(other) {
    return this._next(other._props);
  }
  apply(target) {
    const props = this._props;
    if (props.fill !== void 0) target.fill?.(props.fill);
    if (props.stroke !== void 0) target.stroke?.(props.stroke.color, props.stroke.width);
    if (props.dashPattern !== void 0) target.dashed?.([...props.dashPattern]);
    if (props.opacity !== void 0) target.opacity?.(props.opacity);
    if (props.cursor !== void 0) target.cursor?.(props.cursor);
    if (props.fontSize !== void 0) target.fontSize?.(props.fontSize);
    if (props.fontFamily !== void 0) target.fontFamily?.(props.fontFamily);
    if (props.textAlign !== void 0) target.textAlign?.(props.textAlign);
    if (props.textBaseline !== void 0) target.textBaseline?.(props.textBaseline);
    return target;
  }
  getProps() {
    return {
      ...this._props,
      stroke: this._props.stroke ? { ...this._props.stroke } : void 0,
      dashPattern: this._props.dashPattern ? [...this._props.dashPattern] : void 0
    };
  }
  _next(patch) {
    return new _Style({
      ...this._props,
      ...patch
    });
  }
};
var StyleManager = class {
  constructor() {
    this._fill = new Signal(DEFAULT_STYLE.fill);
    this._stroke = new Signal(DEFAULT_STYLE.stroke);
    this._dashPattern = new Signal(DEFAULT_STYLE.dashPattern);
    this._opacity = new Signal(DEFAULT_STYLE.opacity);
    this._cursor = new Signal(DEFAULT_STYLE.cursor);
  }
  getStyleProps() {
    return {
      fill: this._fill.get(),
      stroke: this._stroke.get(),
      dashPattern: this._dashPattern.get(),
      opacity: this._opacity.get(),
      cursor: this._cursor.get()
    };
  }
};

// src/math/vec2.ts
var Vec2 = class _Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  static zero() {
    return new _Vec2(0, 0);
  }
  static from(arr) {
    return new _Vec2(arr[0], arr[1]);
  }
  toArray() {
    return [this.x, this.y];
  }
  add(v) {
    return new _Vec2(this.x + v.x, this.y + v.y);
  }
  sub(v) {
    return new _Vec2(this.x - v.x, this.y - v.y);
  }
  scale(s) {
    return new _Vec2(this.x * s, this.y * s);
  }
  negate() {
    return new _Vec2(-this.x, -this.y);
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  lengthSq() {
    return this.x * this.x + this.y * this.y;
  }
  normalize() {
    const len = this.length();
    if (len === 0) return _Vec2.zero();
    return this.scale(1 / len);
  }
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }
  /** Returns the z-component of the 3D cross product (useful for winding). */
  cross(v) {
    return this.x * v.y - this.y * v.x;
  }
  /** Linear interpolation toward `v` by factor `t`. */
  lerp(v, t) {
    return new _Vec2(this.x + (v.x - this.x) * t, this.y + (v.y - this.y) * t);
  }
  /** Angle in radians from positive x-axis. */
  angle() {
    return Math.atan2(this.y, this.x);
  }
  /** Rotate this vector around the origin by `radians`. */
  rotate(radians) {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return new _Vec2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
  }
  distance(v) {
    return this.sub(v).length();
  }
  equals(v, epsilon = 1e-10) {
    return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon;
  }
  /** Return a new Vec2 with each component clamped. */
  clamp(min, max) {
    return new _Vec2(
      Math.max(min.x, Math.min(max.x, this.x)),
      Math.max(min.y, Math.min(max.y, this.y))
    );
  }
  toString() {
    return `Vec2(${this.x}, ${this.y})`;
  }
};

// src/math/bbox.ts
var BBox = class _BBox {
  constructor(minX, minY, maxX, maxY) {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }
  static empty() {
    return new _BBox(Infinity, Infinity, -Infinity, -Infinity);
  }
  static fromPosSize(x, y, w, h) {
    return new _BBox(x, y, x + w, y + h);
  }
  static fromCenter(cx, cy, w, h) {
    const hw = w / 2;
    const hh = h / 2;
    return new _BBox(cx - hw, cy - hh, cx + hw, cy + hh);
  }
  static fromPoints(points) {
    if (points.length === 0) return _BBox.empty();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return new _BBox(minX, minY, maxX, maxY);
  }
  get width() {
    return this.maxX - this.minX;
  }
  get height() {
    return this.maxY - this.minY;
  }
  get center() {
    return new Vec2((this.minX + this.maxX) / 2, (this.minY + this.maxY) / 2);
  }
  get size() {
    return new Vec2(this.width, this.height);
  }
  get topLeft() {
    return new Vec2(this.minX, this.minY);
  }
  get topRight() {
    return new Vec2(this.maxX, this.minY);
  }
  get bottomLeft() {
    return new Vec2(this.minX, this.maxY);
  }
  get bottomRight() {
    return new Vec2(this.maxX, this.maxY);
  }
  isEmpty() {
    return this.minX > this.maxX || this.minY > this.maxY;
  }
  containsPoint(p) {
    return p.x >= this.minX && p.x <= this.maxX && p.y >= this.minY && p.y <= this.maxY;
  }
  containsBBox(other) {
    return other.minX >= this.minX && other.maxX <= this.maxX && other.minY >= this.minY && other.maxY <= this.maxY;
  }
  intersects(other) {
    return this.minX <= other.maxX && this.maxX >= other.minX && this.minY <= other.maxY && this.maxY >= other.minY;
  }
  union(other) {
    if (this.isEmpty()) return other;
    if (other.isEmpty()) return this;
    return new _BBox(
      Math.min(this.minX, other.minX),
      Math.min(this.minY, other.minY),
      Math.max(this.maxX, other.maxX),
      Math.max(this.maxY, other.maxY)
    );
  }
  intersection(other) {
    const minX = Math.max(this.minX, other.minX);
    const minY = Math.max(this.minY, other.minY);
    const maxX = Math.min(this.maxX, other.maxX);
    const maxY = Math.min(this.maxY, other.maxY);
    if (minX > maxX || minY > maxY) return _BBox.empty();
    return new _BBox(minX, minY, maxX, maxY);
  }
  expand(amount) {
    return new _BBox(
      this.minX - amount,
      this.minY - amount,
      this.maxX + amount,
      this.maxY + amount
    );
  }
  equals(other, epsilon = 1e-10) {
    return Math.abs(this.minX - other.minX) < epsilon && Math.abs(this.minY - other.minY) < epsilon && Math.abs(this.maxX - other.maxX) < epsilon && Math.abs(this.maxY - other.maxY) < epsilon;
  }
  toString() {
    return `BBox(${this.minX}, ${this.minY}, ${this.maxX}, ${this.maxY})`;
  }
};

// src/math/matrix3.ts
var Matrix3 = class _Matrix3 {
  constructor(m) {
    this.m = new Float64Array(9);
    if (m) {
      for (let i = 0; i < 9; i++) this.m[i] = m[i];
    } else {
      this.m[0] = 1;
      this.m[4] = 1;
      this.m[8] = 1;
    }
  }
  static identity() {
    return new _Matrix3();
  }
  static translate(tx, ty) {
    const m = new _Matrix3();
    m.m[6] = tx;
    m.m[7] = ty;
    return m;
  }
  static rotate(radians) {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const m = new _Matrix3();
    m.m[0] = cos;
    m.m[1] = sin;
    m.m[3] = -sin;
    m.m[4] = cos;
    return m;
  }
  static scale(sx, sy) {
    const m = new _Matrix3();
    m.m[0] = sx;
    m.m[4] = sy ?? sx;
    return m;
  }
  /** Multiply this × other (apply this transform first, then other). */
  multiply(other) {
    const a = this.m;
    const b = other.m;
    return new _Matrix3([
      a[0] * b[0] + a[3] * b[1],
      a[1] * b[0] + a[4] * b[1],
      0,
      a[0] * b[3] + a[3] * b[4],
      a[1] * b[3] + a[4] * b[4],
      0,
      a[0] * b[6] + a[3] * b[7] + a[6],
      a[1] * b[6] + a[4] * b[7] + a[7],
      1
    ]);
  }
  /** Return the inverse, or identity if singular. */
  invert() {
    const m = this.m;
    const a = m[0], b = m[1], c = m[3], d = m[4], tx = m[6], ty = m[7];
    const det = a * d - b * c;
    if (Math.abs(det) < 1e-14) return _Matrix3.identity();
    const invDet = 1 / det;
    return new _Matrix3([
      d * invDet,
      -b * invDet,
      0,
      -c * invDet,
      a * invDet,
      0,
      (c * ty - d * tx) * invDet,
      (b * tx - a * ty) * invDet,
      1
    ]);
  }
  /** Transform a 2D point (applies translation). */
  transformPoint(p) {
    const m = this.m;
    return new Vec2(m[0] * p.x + m[3] * p.y + m[6], m[1] * p.x + m[4] * p.y + m[7]);
  }
  /** Transform a 2D direction vector (ignores translation). */
  transformVec(v) {
    const m = this.m;
    return new Vec2(m[0] * v.x + m[3] * v.y, m[1] * v.x + m[4] * v.y);
  }
  /** Extract the translation component. */
  getTranslation() {
    return new Vec2(this.m[6], this.m[7]);
  }
  /** Extract the X scale factor. */
  getScaleX() {
    return Math.sqrt(this.m[0] * this.m[0] + this.m[1] * this.m[1]);
  }
  /** Extract the Y scale factor. */
  getScaleY() {
    return Math.sqrt(this.m[3] * this.m[3] + this.m[4] * this.m[4]);
  }
  /** Extract the rotation angle in radians. */
  getRotation() {
    return Math.atan2(this.m[1], this.m[0]);
  }
  equals(other, epsilon = 1e-10) {
    for (let i = 0; i < 9; i++) {
      if (Math.abs(this.m[i] - other.m[i]) > epsilon) return false;
    }
    return true;
  }
  clone() {
    return new _Matrix3(this.m);
  }
  toString() {
    const m = this.m;
    return `Matrix3(${m[0].toFixed(3)}, ${m[3].toFixed(3)}, ${m[6].toFixed(3)} | ${m[1].toFixed(3)}, ${m[4].toFixed(3)}, ${m[7].toFixed(3)})`;
  }
};

// src/math/intersect.ts
function rayRectIntersection(origin, direction, bbox) {
  const dir = direction.normalize();
  if (dir.lengthSq() === 0) return null;
  let tMin = -Infinity;
  let tMax = Infinity;
  const invDx = dir.x !== 0 ? 1 / dir.x : dir.x >= 0 ? Infinity : -Infinity;
  const invDy = dir.y !== 0 ? 1 / dir.y : dir.y >= 0 ? Infinity : -Infinity;
  let t1 = (bbox.minX - origin.x) * invDx;
  let t2 = (bbox.maxX - origin.x) * invDx;
  if (t1 > t2) [t1, t2] = [t2, t1];
  tMin = Math.max(tMin, t1);
  tMax = Math.min(tMax, t2);
  let t3 = (bbox.minY - origin.y) * invDy;
  let t4 = (bbox.maxY - origin.y) * invDy;
  if (t3 > t4) [t3, t4] = [t4, t3];
  tMin = Math.max(tMin, t3);
  tMax = Math.min(tMax, t4);
  if (tMin > tMax) return null;
  const t = tMin > 0 ? tMin : tMax;
  if (t < 0) return null;
  return new Vec2(origin.x + dir.x * t, origin.y + dir.y * t);
}
function rayCircleIntersection(center, radius, direction) {
  const dir = direction.normalize();
  if (dir.lengthSq() === 0) return null;
  return new Vec2(center.x + dir.x * radius, center.y + dir.y * radius);
}
function raySegmentIntersection(origin, direction, p1, p2) {
  const dx = direction.x;
  const dy = direction.y;
  const ex = p2.x - p1.x;
  const ey = p2.y - p1.y;
  const denom = dx * ey - dy * ex;
  if (Math.abs(denom) < 1e-12) return null;
  const fx = p1.x - origin.x;
  const fy = p1.y - origin.y;
  const t = (fx * ey - fy * ex) / denom;
  const u = (fx * dy - fy * dx) / denom;
  if (t >= 0 && u >= 0 && u <= 1) return t;
  return null;
}
function rayPathIntersection(origin, direction, segments) {
  const dir = direction.normalize();
  if (dir.lengthSq() === 0) return null;
  let bestT = Infinity;
  let cursor = Vec2.zero();
  let subpathStart = null;
  for (const seg of segments) {
    switch (seg.cmd) {
      case "M":
        cursor = seg.to;
        subpathStart = seg.to;
        break;
      case "L": {
        const t = raySegmentIntersection(origin, dir, cursor, seg.to);
        if (t !== null && t < bestT) bestT = t;
        cursor = seg.to;
        break;
      }
      case "Q": {
        const N = 16;
        let prev = cursor;
        for (let i = 1; i <= N; i++) {
          const s = i / N;
          const p = quadraticBezierPoint(cursor, seg.cp, seg.to, s);
          const t = raySegmentIntersection(origin, dir, prev, p);
          if (t !== null && t < bestT) bestT = t;
          prev = p;
        }
        cursor = seg.to;
        break;
      }
      case "C": {
        const N = 16;
        let prev = cursor;
        for (let i = 1; i <= N; i++) {
          const s = i / N;
          const p = cubicBezierPoint(cursor, seg.cp1, seg.cp2, seg.to, s);
          const t = raySegmentIntersection(origin, dir, prev, p);
          if (t !== null && t < bestT) bestT = t;
          prev = p;
        }
        cursor = seg.to;
        break;
      }
      case "A": {
        const t = raySegmentIntersection(origin, dir, cursor, seg.to);
        if (t !== null && t < bestT) bestT = t;
        cursor = seg.to;
        break;
      }
      case "Z":
        if (subpathStart && !cursor.equals(subpathStart)) {
          const t = raySegmentIntersection(origin, dir, cursor, subpathStart);
          if (t !== null && t < bestT) bestT = t;
          cursor = subpathStart;
        }
        break;
    }
  }
  if (bestT === Infinity) return null;
  return new Vec2(origin.x + dir.x * bestT, origin.y + dir.y * bestT);
}
function quadraticBezierPoint(p0, p1, p2, t) {
  const u = 1 - t;
  return new Vec2(
    u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
  );
}
function cubicBezierPoint(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  return new Vec2(
    uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
    uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y
  );
}
function rayShapeIntersection(origin, direction, shape) {
  switch (shape.type) {
    case "rect":
      return rayRectIntersection(origin, direction, shape.bbox);
    case "circle":
      return rayCircleIntersection(shape.center, shape.radius, direction);
    case "path":
      return rayPathIntersection(origin, direction, shape.segments) ?? rayRectIntersection(origin, direction, shape.fallbackBBox);
  }
}
function perimeterPoint(center, angleDeg, shape) {
  const rad = angleDeg * Math.PI / 180;
  const direction = new Vec2(Math.cos(rad), Math.sin(rad));
  return rayShapeIntersection(center, direction, shape) ?? center;
}

// src/core/anchor.ts
var AnchorNamespace = class {
  constructor(_map, _semantic) {
    this._map = _map;
    this._semantic = _semantic;
  }
  get top() {
    return this._map._resolve("top", this._semantic);
  }
  get bottom() {
    return this._map._resolve("bottom", this._semantic);
  }
  get left() {
    return this._map._resolve("left", this._semantic);
  }
  get right() {
    return this._map._resolve("right", this._semantic);
  }
  get center() {
    return this._map._resolve("center", this._semantic);
  }
  get topLeft() {
    return this._map._resolve("topLeft", this._semantic);
  }
  get topRight() {
    return this._map._resolve("topRight", this._semantic);
  }
  get bottomLeft() {
    return this._map._resolve("bottomLeft", this._semantic);
  }
  get bottomRight() {
    return this._map._resolve("bottomRight", this._semantic);
  }
  get(name) {
    return this._map._resolve(name, this._semantic);
  }
};
var AnchorMap = class {
  constructor(_node) {
    this._node = _node;
    this.box = new AnchorNamespace(this, "box");
    this.shape = new AnchorNamespace(this, "shape");
  }
  /** Top center of the node's world bounding box. */
  get top() {
    return this._resolve("top", "box");
  }
  /** Bottom center of the node's world bounding box. */
  get bottom() {
    return this._resolve("bottom", "box");
  }
  /** Left center of the node's world bounding box. */
  get left() {
    return this._resolve("left", "box");
  }
  /** Right center of the node's world bounding box. */
  get right() {
    return this._resolve("right", "box");
  }
  /** Center of the node's world bounding box. */
  get center() {
    return this._resolve("center", "box");
  }
  /** Top-left corner of the world bounding box. */
  get topLeft() {
    return this._resolve("topLeft", "box");
  }
  /** Top-right corner of the world bounding box. */
  get topRight() {
    return this._resolve("topRight", "box");
  }
  /** Bottom-left corner of the world bounding box. */
  get bottomLeft() {
    return this._resolve("bottomLeft", "box");
  }
  /** Bottom-right corner of the world bounding box. */
  get bottomRight() {
    return this._resolve("bottomRight", "box");
  }
  _resolve(name, semantic) {
    if (semantic === "box") {
      return this._resolveBox(name);
    }
    return this._resolveShape(name);
  }
  _resolveBox(name) {
    const bb = this._node.computeWorldBBox();
    switch (name) {
      case "top":
        return [(bb.minX + bb.maxX) / 2, bb.minY];
      case "bottom":
        return [(bb.minX + bb.maxX) / 2, bb.maxY];
      case "left":
        return [bb.minX, (bb.minY + bb.maxY) / 2];
      case "right":
        return [bb.maxX, (bb.minY + bb.maxY) / 2];
      case "center": {
        const c = bb.center;
        return [c.x, c.y];
      }
      case "topLeft":
        return [bb.minX, bb.minY];
      case "topRight":
        return [bb.maxX, bb.minY];
      case "bottomLeft":
        return [bb.minX, bb.maxY];
      case "bottomRight":
        return [bb.maxX, bb.maxY];
    }
  }
  _resolveShape(name) {
    switch (name) {
      case "center":
        return this._resolveBox("center");
      case "right":
        return this.atAngle(0);
      case "bottom":
        return this.atAngle(90);
      case "left":
        return this.atAngle(180);
      case "top":
        return this.atAngle(270);
      case "bottomRight":
        return this.atAngle(45);
      case "bottomLeft":
        return this.atAngle(135);
      case "topLeft":
        return this.atAngle(225);
      case "topRight":
        return this.atAngle(315);
    }
  }
  /**
   * Get a named anchor by string key.
   */
  get(name) {
    return this._resolve(name, "box");
  }
  /**
   * Fire a ray from the shape's center at the given angle (in degrees) and
   * return the exact perimeter intersection point.
   * Angles: 0° = right, 90° = down, 180° = left, 270° = up.
   */
  atAngle(angleDeg) {
    const wt = this._node.getWorldTransform();
    const localBBox = this._node.computeLocalBBox();
    const localCenter = localBBox.center;
    const geom = this._node.getShapeGeometry();
    const p = perimeterPoint(localCenter, angleDeg, geom);
    const worldP = wt.transformPoint(p);
    return [worldP.x, worldP.y];
  }
};

// src/core/units.ts
var UNIT_PATTERN = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(px|%)$/;
function parseUnitValue(value, context) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`Zeta: ${context} must be a finite number`);
    }
    return {
      unit: "px",
      value,
      raw: value
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
  const unit = match[2] === "%" ? "percent" : "px";
  return {
    unit,
    value: num,
    raw: value
  };
}
function parseUnitPoint(value, contextX, contextY = contextX) {
  return [
    parseUnitValue(value[0], contextX),
    parseUnitValue(value[1], contextY)
  ];
}
function parseUnitSize(value, contextX, contextY = contextX) {
  return parseUnitPoint(value, contextX, contextY);
}
function isRelativeUnit(spec) {
  return spec.unit === "percent";
}
function hasRelativeUnits(specs) {
  return isRelativeUnit(specs[0]) || isRelativeUnit(specs[1]);
}
function resolveUnitSpec(spec, axis, reference, context) {
  if (spec.unit === "px") {
    return spec.value;
  }
  if (!reference) {
    throw new Error(
      `Zeta: Cannot resolve ${context} "${spec.raw}" because parent container size is not defined. Set parent.size(...) or use pixel units.`
    );
  }
  const base = axis === "x" ? reference.width : axis === "y" ? reference.height : Math.min(reference.width, reference.height);
  return spec.value / 100 * base;
}

// src/core/mutation.ts
var pendingHighPriorityEffects = /* @__PURE__ */ new Set();
var pendingNormalPriorityEffects = /* @__PURE__ */ new Set();
var mutationBatchDepth = 0;
var isFlushingMutationEffects = false;
var MAX_SETTLE_PASSES = 1e3;
function queueForPriority(priority) {
  return priority === "high" ? pendingHighPriorityEffects : pendingNormalPriorityEffects;
}
function runQueuedEffects(queue) {
  if (queue.size === 0) return;
  const effects = [...queue];
  queue.clear();
  batch(() => {
    for (const effect of effects) {
      effect();
    }
  });
}
function queueMutationEffect(effect, priority = "normal") {
  queueForPriority(priority).add(effect);
}
function flushMutationEffects() {
  if (isFlushingMutationEffects) return;
  isFlushingMutationEffects = true;
  try {
    for (let pass = 0; pass < MAX_SETTLE_PASSES; pass++) {
      if (pendingHighPriorityEffects.size === 0 && pendingNormalPriorityEffects.size === 0) {
        return;
      }
      while (pendingHighPriorityEffects.size > 0) {
        runQueuedEffects(pendingHighPriorityEffects);
      }
      if (pendingNormalPriorityEffects.size > 0) {
        runQueuedEffects(pendingNormalPriorityEffects);
      }
    }
    throw new Error("Zeta: batched layout/constraint updates did not settle.");
  } finally {
    isFlushingMutationEffects = false;
  }
}
function isBatchingSceneMutations() {
  return mutationBatchDepth > 0 || isFlushingMutationEffects;
}
function batchSceneMutations(fn) {
  mutationBatchDepth++;
  try {
    let result;
    batch(() => {
      result = fn();
    });
    return result;
  } finally {
    mutationBatchDepth--;
    if (mutationBatchDepth === 0) {
      flushMutationEffects();
    }
  }
}

// src/core/constraints.ts
var constraintTraceHook = null;
function setConstraintTraceHook(hook) {
  constraintTraceHook = hook;
}
function emitConstraintTrace(event) {
  if (!constraintTraceHook) return;
  try {
    constraintTraceHook(event);
  } catch {
  }
}
function describeNodeForTrace(node) {
  return `${node.type}#${node.id}`;
}
function describeTriggerForTrace(trigger) {
  switch (trigger) {
    case "init":
      return "after initialization";
    case "target-layout":
      return "after the target layout changed";
    case "self-layout":
      return "after its own layout changed";
    case "parent-layout":
      return "after its parent layout changed";
  }
}
function describeConstraintForTrace(event) {
  if (event.kind === "position") {
    const direction = event.detail?.direction;
    switch (direction) {
      case "rightOf":
        return "to stay right of";
      case "leftOf":
        return "to stay left of";
      case "above":
        return "to stay above";
      case "below":
        return "to stay below";
      default:
        return "to preserve relative placement with";
    }
  }
  if (event.kind === "pin") {
    return "to stay pinned to";
  }
  return "to stay aligned with";
}
function explainConstraintTrace(event) {
  const subject = describeNodeForTrace(event.node);
  const target = describeNodeForTrace(event.target);
  const relation = describeConstraintForTrace(event);
  const trigger = describeTriggerForTrace(event.trigger);
  if (event.applied) {
    return `${subject} moved ${relation} ${target} ${trigger}.`;
  }
  return `${subject} stayed in place while checking ${relation} ${target} ${trigger}.`;
}
function toParentLocal(node, world) {
  if (!node.parent) return world;
  return node.parent.getWorldTransform().invert().transformPoint(world);
}
function bboxInParentSpace(node, worldBBox) {
  if (!node.parent) return worldBBox;
  const parentInv = node.parent.getWorldTransform().invert();
  return BBox.fromPoints([
    parentInv.transformPoint(worldBBox.topLeft),
    parentInv.transformPoint(worldBBox.topRight),
    parentInv.transformPoint(worldBBox.bottomLeft),
    parentInv.transformPoint(worldBBox.bottomRight)
  ]);
}
var PositionConstraint = class {
  constructor(_node, _target, _direction, gap, _align) {
    this._node = _node;
    this._target = _target;
    this._direction = _direction;
    this._align = _align;
    this._unsubscribe = null;
    this._parentUnsub = null;
    this._watchedParent = null;
    this._applyQueued = false;
    this._gapSpec = parseUnitValue(gap, "constraint gap");
    this._syncParentSubscription();
    this._requestApply("init");
    const unsubTarget = this._target._subscribeLayout(() => {
      this._requestApply("target-layout");
    });
    const unsubSelf = this._node._subscribeLayout(() => {
      this._syncParentSubscription();
      this._requestApply("self-layout");
    });
    this._unsubscribe = () => {
      unsubTarget();
      unsubSelf();
      this._parentUnsub?.();
      this._parentUnsub = null;
      this._watchedParent = null;
    };
  }
  _syncParentSubscription() {
    const parent = this._node.parent;
    if (parent === this._watchedParent) return;
    this._parentUnsub?.();
    this._parentUnsub = null;
    this._watchedParent = parent;
    if (!parent) return;
    this._parentUnsub = parent.watchLayout(() => {
      this._requestApply("parent-layout");
    });
  }
  _requestApply(trigger) {
    if (this._applyQueued) return;
    this._applyQueued = true;
    queueMutationEffect(() => {
      this._applyQueued = false;
      this._apply(trigger);
    }, "high");
    if (!isBatchingSceneMutations()) {
      flushMutationEffects();
    }
  }
  /** Recalculate and apply the constrained position. */
  _apply(trigger) {
    const targetBBox = bboxInParentSpace(this._node, this._target.computeWorldBBox());
    const selfBBox = bboxInParentSpace(this._node, this._node.computeWorldBBox());
    let x;
    let y;
    const gap = this._node._resolveUnitSpec(
      this._gapSpec,
      this._direction === "leftOf" || this._direction === "rightOf" ? "x" : "y",
      "constraint gap"
    );
    switch (this._direction) {
      case "rightOf": {
        x = targetBBox.maxX + gap;
        y = this._computeAlignment(
          targetBBox.minY,
          targetBBox.maxY,
          selfBBox.height
        );
        break;
      }
      case "leftOf": {
        x = targetBBox.minX - gap - selfBBox.width;
        y = this._computeAlignment(
          targetBBox.minY,
          targetBBox.maxY,
          selfBBox.height
        );
        break;
      }
      case "above": {
        x = this._computeAlignment(
          targetBBox.minX,
          targetBBox.maxX,
          selfBBox.width
        );
        y = targetBBox.minY - gap - selfBBox.height;
        break;
      }
      case "below": {
        x = this._computeAlignment(
          targetBBox.minX,
          targetBBox.maxX,
          selfBBox.width
        );
        y = targetBBox.maxY + gap;
        break;
      }
    }
    const previous = this._node._position.get();
    const next = new Vec2(x, y);
    const applied = !previous.equals(next);
    if (applied) {
      this._node.pos(next.x, next.y);
    }
    emitConstraintTrace({
      kind: "position",
      trigger,
      node: this._node,
      target: this._target,
      applied,
      previousPosition: previous,
      nextPosition: next,
      detail: {
        direction: this._direction,
        align: this._align
      }
    });
  }
  /**
   * Compute the perpendicular-axis position based on alignment.
   * @param minEdge Target's min on the perpendicular axis
   * @param maxEdge Target's max on the perpendicular axis
   * @param selfSize This node's size on the perpendicular axis
   */
  _computeAlignment(minEdge, maxEdge, selfSize) {
    switch (this._align) {
      case "start":
        return minEdge;
      case "center":
        return (minEdge + maxEdge) / 2 - selfSize / 2;
      case "end":
        return maxEdge - selfSize;
    }
  }
  /** Detach the reactive subscription. */
  dispose() {
    this._unsubscribe?.();
    this._unsubscribe = null;
  }
};
var PinConstraint = class {
  constructor(_node, _target, _anchorFn, offset) {
    this._node = _node;
    this._target = _target;
    this._anchorFn = _anchorFn;
    this._unsubscribe = null;
    this._parentUnsub = null;
    this._watchedParent = null;
    this._applyQueued = false;
    this._offsetSpec = parseUnitPoint(offset ?? [0, 0], "pin offset.x", "pin offset.y");
    this._syncParentSubscription();
    this._requestApply("init");
    const unsubTarget = this._target._subscribeLayout(() => {
      this._requestApply("target-layout");
    });
    const unsubSelf = this._node._subscribeLayout(() => {
      this._syncParentSubscription();
      this._requestApply("self-layout");
    });
    this._unsubscribe = () => {
      unsubTarget();
      unsubSelf?.();
      this._parentUnsub?.();
      this._parentUnsub = null;
      this._watchedParent = null;
    };
  }
  _syncParentSubscription() {
    const parent = this._node.parent;
    if (parent === this._watchedParent) return;
    this._parentUnsub?.();
    this._parentUnsub = null;
    this._watchedParent = parent;
    if (!parent) return;
    this._parentUnsub = parent.watchLayout(() => {
      this._requestApply("parent-layout");
    });
  }
  _requestApply(trigger) {
    if (this._applyQueued) return;
    this._applyQueued = true;
    queueMutationEffect(() => {
      this._applyQueued = false;
      this._apply(trigger);
    }, "high");
    if (!isBatchingSceneMutations()) {
      flushMutationEffects();
    }
  }
  _apply(trigger) {
    const [ax, ay] = this._anchorFn();
    const localAnchor = toParentLocal(this._node, new Vec2(ax, ay));
    const previous = this._node._position.get();
    const next = new Vec2(
      localAnchor.x + this._node._resolveUnitSpec(this._offsetSpec[0], "x", "pin offset.x"),
      localAnchor.y + this._node._resolveUnitSpec(this._offsetSpec[1], "y", "pin offset.y")
    );
    const applied = !previous.equals(next);
    if (applied) {
      this._node.pos(next.x, next.y);
    }
    emitConstraintTrace({
      kind: "pin",
      trigger,
      node: this._node,
      target: this._target,
      applied,
      previousPosition: previous,
      nextPosition: next
    });
  }
  dispose() {
    this._unsubscribe?.();
    this._unsubscribe = null;
  }
};
var AlignmentConstraint = class {
  constructor(_node, _target, _selfAnchorFn, _targetAnchorFn, offset) {
    this._node = _node;
    this._target = _target;
    this._selfAnchorFn = _selfAnchorFn;
    this._targetAnchorFn = _targetAnchorFn;
    this._unsubscribe = null;
    this._parentUnsub = null;
    this._watchedParent = null;
    this._applyQueued = false;
    this._offsetSpec = parseUnitPoint(offset ?? [0, 0], "align offset.x", "align offset.y");
    this._syncParentSubscription();
    this._requestApply("init");
    const unsubTarget = this._target._subscribeLayout(() => {
      this._requestApply("target-layout");
    });
    const unsubSelf = this._node._subscribeLayout(() => {
      this._syncParentSubscription();
      this._requestApply("self-layout");
    });
    this._unsubscribe = () => {
      unsubTarget();
      unsubSelf?.();
      this._parentUnsub?.();
      this._parentUnsub = null;
      this._watchedParent = null;
    };
  }
  _syncParentSubscription() {
    const parent = this._node.parent;
    if (parent === this._watchedParent) return;
    this._parentUnsub?.();
    this._parentUnsub = null;
    this._watchedParent = parent;
    if (!parent) return;
    this._parentUnsub = parent.watchLayout(() => {
      this._requestApply("parent-layout");
    });
  }
  _requestApply(trigger) {
    if (this._applyQueued) return;
    this._applyQueued = true;
    queueMutationEffect(() => {
      this._applyQueued = false;
      this._apply(trigger);
    }, "high");
    if (!isBatchingSceneMutations()) {
      flushMutationEffects();
    }
  }
  _apply(trigger) {
    const [targetX, targetY] = this._targetAnchorFn();
    const [selfX, selfY] = this._selfAnchorFn();
    const previous = this._node._position.get();
    const dx = targetX - selfX;
    const dy = targetY - selfY;
    if (Math.abs(dx) < 1e-3 && Math.abs(dy) < 1e-3) {
      emitConstraintTrace({
        kind: "alignment",
        trigger,
        node: this._node,
        target: this._target,
        applied: false,
        previousPosition: previous,
        nextPosition: previous
      });
      return;
    }
    const currentPos = this._node._position.get();
    const currentWorldPos = this._node.parent ? this._node.parent.getWorldTransform().transformPoint(currentPos) : currentPos;
    const nextWorldPos = new Vec2(currentWorldPos.x + dx, currentWorldPos.y + dy);
    const nextLocalPos = toParentLocal(this._node, nextWorldPos);
    const next = new Vec2(
      nextLocalPos.x + this._node._resolveUnitSpec(this._offsetSpec[0], "x", "align offset.x"),
      nextLocalPos.y + this._node._resolveUnitSpec(this._offsetSpec[1], "y", "align offset.y")
    );
    const applied = !previous.equals(next);
    if (applied) {
      this._node.pos(next.x, next.y);
    }
    emitConstraintTrace({
      kind: "alignment",
      trigger,
      node: this._node,
      target: this._target,
      applied,
      previousPosition: previous,
      nextPosition: next
    });
  }
  dispose() {
    this._unsubscribe?.();
    this._unsubscribe = null;
  }
};

// src/core/node.ts
function easeAt(t, ease) {
  switch (ease) {
    case "linear":
      return t;
    case "quadIn":
      return t * t;
    case "quadOut":
      return t * (2 - t);
    case "quadInOut":
      return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    case "cubicIn":
      return t * t * t;
    case "cubicOut":
      return 1 - (1 - t) ** 3;
    case "cubicInOut":
      return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  }
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function parseColor(input) {
  const s = input.trim();
  if (s.startsWith("#")) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      const r = Number.parseInt(hex[0] + hex[0], 16);
      const g = Number.parseInt(hex[1] + hex[1], 16);
      const b = Number.parseInt(hex[2] + hex[2], 16);
      return { r, g, b, a: 1 };
    }
    if (hex.length === 4) {
      const r = Number.parseInt(hex[0] + hex[0], 16);
      const g = Number.parseInt(hex[1] + hex[1], 16);
      const b = Number.parseInt(hex[2] + hex[2], 16);
      const a = Number.parseInt(hex[3] + hex[3], 16) / 255;
      return { r, g, b, a };
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      const a = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1;
      return { r, g, b, a };
    }
    return null;
  }
  const rgb = s.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const parts = rgb[1].split(",").map((p) => p.trim());
    if (parts.length < 3) return null;
    const r = Number(parts[0]);
    const g = Number(parts[1]);
    const b = Number(parts[2]);
    const a = parts.length >= 4 ? Number(parts[3]) : 1;
    if ([r, g, b, a].some((v) => !Number.isFinite(v))) return null;
    return {
      r: Math.max(0, Math.min(255, r)),
      g: Math.max(0, Math.min(255, g)),
      b: Math.max(0, Math.min(255, b)),
      a: Math.max(0, Math.min(1, a))
    };
  }
  return null;
}
function formatColor(c) {
  return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${c.a.toFixed(3)})`;
}
function distancePointToSegment(p, a, b) {
  const ab = b.sub(a);
  const abLenSq = ab.lengthSq();
  if (abLenSq === 0) return p.distance(a);
  const t = Math.max(0, Math.min(1, p.sub(a).dot(ab) / abLenSq));
  const closest = a.add(ab.scale(t));
  return p.distance(closest);
}
function pointInPolygon(point, polygon) {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersects = yi > point.y !== yj > point.y && point.x < (xj - xi) * (point.y - yi) / (yj - yi || 1e-12) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}
function flattenPath(shape, subdivisions = 16) {
  const out = [];
  let cursor = Vec2.zero();
  let current = [];
  let subpathStart = null;
  const flush = (closed = false) => {
    if (current.length >= 2) {
      out.push({ points: [...current], closed });
    }
    current = [];
    subpathStart = null;
  };
  for (const seg of shape.segments) {
    switch (seg.cmd) {
      case "M":
        flush(false);
        cursor = seg.to;
        subpathStart = seg.to;
        current.push(seg.to);
        break;
      case "L":
        cursor = seg.to;
        current.push(seg.to);
        break;
      case "Q": {
        const p0 = cursor;
        for (let i = 1; i <= subdivisions; i++) {
          const t = i / subdivisions;
          const u = 1 - t;
          const p = new Vec2(
            u * u * p0.x + 2 * u * t * seg.cp.x + t * t * seg.to.x,
            u * u * p0.y + 2 * u * t * seg.cp.y + t * t * seg.to.y
          );
          current.push(p);
        }
        cursor = seg.to;
        break;
      }
      case "C": {
        const p0 = cursor;
        for (let i = 1; i <= subdivisions; i++) {
          const t = i / subdivisions;
          const u = 1 - t;
          const uu = u * u;
          const tt = t * t;
          const p = new Vec2(
            uu * u * p0.x + 3 * uu * t * seg.cp1.x + 3 * u * tt * seg.cp2.x + tt * t * seg.to.x,
            uu * u * p0.y + 3 * uu * t * seg.cp1.y + 3 * u * tt * seg.cp2.y + tt * t * seg.to.y
          );
          current.push(p);
        }
        cursor = seg.to;
        break;
      }
      case "A":
        cursor = seg.to;
        current.push(seg.to);
        break;
      case "Z":
        if (subpathStart && current.length > 0 && !current[current.length - 1].equals(subpathStart)) {
          current.push(subpathStart);
        }
        flush(true);
        break;
    }
  }
  flush(false);
  return out;
}
var nextId = 0;
var HIT_BOUNDS_PADDING = 2;
var SceneNode = class {
  constructor(position = Vec2.zero()) {
    // ── Tree structure ──
    this.parent = null;
    this.children = [];
    // ── Anchors ──
    this._anchor = null;
    // ── Constraints ──
    this._constraint = null;
    this._constraintTarget = null;
    this._layoutListeners = /* @__PURE__ */ new Set();
    this._eventHandlers = /* @__PURE__ */ new Map();
    this._draggable = null;
    this._stopAnimationFn = null;
    this._parentLayoutUnsub = null;
    this._resolvingRelativeUnits = false;
    this._relativeUnitsQueued = false;
    // ── Cached world transform ──
    this._worldTransformDirty = true;
    this._worldTransform = Matrix3.identity();
    this._localTransform = Matrix3.identity();
    this._localTransformDirty = true;
    // ── Cached world BBox ──
    this._worldBBoxDirty = true;
    this._cachedWorldBBox = BBox.empty();
    // ── Dirty tracking for render ──
    this._renderDirty = true;
    this._onDirty = null;
    this._shownBoundsKinds = /* @__PURE__ */ new Set();
    this.id = nextId++;
    this._positionSpec = parseUnitPoint(
      [position.x, position.y],
      "position.x",
      "position.y"
    );
    this._position = new Signal(position);
    this._rotation = new Signal(0);
    this._scale = new Signal(new Vec2(1, 1));
    this._visible = new Signal(true);
    this._layoutOnly = new Signal(false);
    this._minHitSize = new Signal(null);
    this.style = new StyleManager();
    const markDirty = () => this._markTransformDirty();
    this._position.subscribe(markDirty);
    this._rotation.subscribe(markDirty);
    this._scale.subscribe(markDirty);
    const markRenderDirty = () => this._markRenderDirty();
    this.style._fill.subscribe(markRenderDirty);
    this.style._stroke.subscribe(markRenderDirty);
    this.style._dashPattern.subscribe(markRenderDirty);
    this.style._opacity.subscribe(markRenderDirty);
    this._visible.subscribe(markRenderDirty);
    this._layoutOnly.subscribe(() => this._markRenderDirty(true));
    this._minHitSize.subscribe(markRenderDirty);
  }
  /**
   * Reference size for descendants resolving percentage-based units.
   * Container-like nodes override this.
   */
  _getUnitReferenceSizeForChildren() {
    return null;
  }
  /**
   * Parent reference size used for this node's own percentage-based units.
   */
  _getParentUnitReferenceSize() {
    if (!this.parent) return null;
    return this.parent._getUnitReferenceSizeForChildren();
  }
  /**
   * Resolve a unit spec against this node's parent reference size.
   * Throws with a clear error if a percentage cannot be resolved.
   */
  _resolveUnitSpec(spec, axis, context) {
    return resolveUnitSpec(spec, axis, this._getParentUnitReferenceSize(), context);
  }
  /**
   * Resolve a unit value against this node's parent reference size.
   * Throws with a clear error if a percentage cannot be resolved.
   */
  _resolveUnitValue(value, axis, context) {
    return this._resolveUnitSpec(parseUnitValue(value, context), axis, context);
  }
  _hasRelativeUnitSpecs() {
    return hasRelativeUnits(this._positionSpec);
  }
  _resolveRelativeUnits() {
    this._resolvePositionFromSpec();
  }
  _resolvePositionFromSpec() {
    if (!this.parent && hasRelativeUnits(this._positionSpec)) {
      return;
    }
    const next = new Vec2(
      this._resolveUnitSpec(this._positionSpec[0], "x", "position.x"),
      this._resolveUnitSpec(this._positionSpec[1], "y", "position.y")
    );
    if (!this._position.get().equals(next)) {
      this._position.set(next);
    }
  }
  _syncParentLayoutSubscription() {
    const needsParentLayout = this._hasRelativeUnitSpecs();
    if (!this.parent || !needsParentLayout) {
      this._parentLayoutUnsub?.();
      this._parentLayoutUnsub = null;
      return;
    }
    if (this._parentLayoutUnsub) return;
    this._parentLayoutUnsub = this.parent.watchLayout(() => {
      this._onParentLayoutChanged();
    });
  }
  _onParentLayoutChanged() {
    if (this._relativeUnitsQueued) return;
    this._relativeUnitsQueued = true;
    queueMutationEffect(() => {
      this._relativeUnitsQueued = false;
      if (this._resolvingRelativeUnits) return;
      this._resolvingRelativeUnits = true;
      try {
        this._resolveRelativeUnits();
      } finally {
        this._resolvingRelativeUnits = false;
      }
    }, "high");
    if (!isBatchingSceneMutations()) {
      flushMutationEffects();
    }
  }
  _onParentChanged() {
    this._syncParentLayoutSubscription();
    this._onParentLayoutChanged();
  }
  _refreshRelativeUnitTracking() {
    this._syncParentLayoutSubscription();
    this._onParentLayoutChanged();
  }
  _settleForMeasurement() {
    flushMutationEffects();
  }
  /**
   * Batch multiple structural/layout mutations into one settlement pass.
   * Use this when constructing larger scenes to avoid repeated synchronous
   * auto-layout and constraint recomputation.
   */
  batch(fn) {
    return batchSceneMutations(fn);
  }
  pos(xOrPosition, y) {
    const specs = Array.isArray(xOrPosition) ? parseUnitPoint([xOrPosition[0], xOrPosition[1]], "position.x", "position.y") : parseUnitPoint([xOrPosition, y], "position.x", "position.y");
    this._positionSpec = specs;
    this._syncParentLayoutSubscription();
    this._resolvePositionFromSpec();
    return this;
  }
  move(dx, dy) {
    const p = this._position.get();
    const next = new Vec2(p.x + dx, p.y + dy);
    this._positionSpec = parseUnitPoint([next.x, next.y], "position.x", "position.y");
    this._syncParentLayoutSubscription();
    this._position.set(next);
    return this;
  }
  rotateTo(radians) {
    this._rotation.set(radians);
    return this;
  }
  scaleTo(sx, sy) {
    this._scale.set(new Vec2(sx, sy ?? sx));
    return this;
  }
  visible(v) {
    this._visible.set(v);
    return this;
  }
  /**
   * Mark this node as layout-only: it still affects layout bounds/constraints
   * but is excluded from visual and hit-test bounds.
   */
  layoutOnly(enabled = true) {
    this._layoutOnly.set(enabled);
    return this;
  }
  isLayoutOnly() {
    return this._layoutOnly.get();
  }
  /**
   * Guarantee a minimum hit-target size (local-space) for easier selection.
   * Set `null` to restore default hit bounds behavior.
   */
  minHitSize(size) {
    if (size === null) {
      this._minHitSize.set(null);
      return this;
    }
    const vec = typeof size === "number" ? new Vec2(size, size) : new Vec2(size[0], size[1]);
    const next = new Vec2(Math.max(0, vec.x), Math.max(0, vec.y));
    this._minHitSize.set(next);
    return this;
  }
  getMinHitSize() {
    return this._minHitSize.get();
  }
  /**
   * Show one or more bounds overlays for this node while composing/debugging.
   * Overlays are renderer-level visuals and do not affect hit-testing/layout.
   */
  showBounds(kind = "layout", enabled = true) {
    const kinds = Array.isArray(kind) ? kind : [kind];
    let changed = false;
    for (const item of kinds) {
      if (enabled) {
        if (!this._shownBoundsKinds.has(item)) {
          this._shownBoundsKinds.add(item);
          changed = true;
        }
      } else if (this._shownBoundsKinds.delete(item)) {
        changed = true;
      }
    }
    if (changed) {
      this._markRenderDirty();
    }
    return this;
  }
  hideBounds(kind) {
    if (!kind) {
      if (this._shownBoundsKinds.size > 0) {
        this._shownBoundsKinds.clear();
        this._markRenderDirty();
      }
      return this;
    }
    return this.showBounds(kind, false);
  }
  isShowingBounds(kind) {
    if (!kind) {
      return this._shownBoundsKinds.size > 0;
    }
    return this._shownBoundsKinds.has(kind);
  }
  /** @internal */
  _getShownBoundsKinds() {
    return [...this._shownBoundsKinds];
  }
  // ── Chainable style API ──
  fill(color) {
    this.style._fill.set(color);
    return this;
  }
  stroke(color, width = 1) {
    this.style._stroke.set({ color, width });
    return this;
  }
  dashed(pattern) {
    this.style._dashPattern.set(pattern);
    return this;
  }
  opacity(value) {
    this.style._opacity.set(value);
    return this;
  }
  cursor(type) {
    this.style._cursor.set(type);
    return this;
  }
  /**
   * Apply a reusable immutable Style preset to this node.
   * Useful for sharing style recipes across many elements.
   */
  useStyle(preset) {
    preset.apply(this);
    return this;
  }
  // ── Interactivity API ──
  on(type, handler) {
    let bucket = this._eventHandlers.get(type);
    if (!bucket) {
      bucket = /* @__PURE__ */ new Set();
      this._eventHandlers.set(type, bucket);
    }
    bucket.add(handler);
    return this;
  }
  off(type, handler) {
    const bucket = this._eventHandlers.get(type);
    if (!bucket) return this;
    if (!handler) {
      this._eventHandlers.delete(type);
      return this;
    }
    bucket.delete(handler);
    if (bucket.size === 0) {
      this._eventHandlers.delete(type);
    }
    return this;
  }
  draggable(opts = {}) {
    this._draggable = {
      axis: opts.axis ?? "both",
      bounds: opts.bounds
    };
    return this;
  }
  hover(enter, leave) {
    this.on("pointerenter", enter);
    if (leave) this.on("pointerleave", leave);
    return this;
  }
  click(handler) {
    return this.on("click", handler);
  }
  dragX(bounds = "parent") {
    return this.draggable({ axis: "x", bounds });
  }
  dragY(bounds = "parent") {
    return this.draggable({ axis: "y", bounds });
  }
  dragWithin(bounds = "parent") {
    return this.draggable({ axis: "both", bounds });
  }
  undraggable() {
    this._draggable = null;
    return this;
  }
  /** @internal */
  _isDraggable() {
    return this._draggable !== null;
  }
  /** @internal */
  _getDraggableOptions() {
    return this._draggable ? { ...this._draggable } : null;
  }
  /** @internal */
  _hasPointerHandlers(type) {
    if (type) {
      const bucket = this._eventHandlers.get(type);
      return !!bucket && bucket.size > 0;
    }
    for (const bucket of this._eventHandlers.values()) {
      if (bucket.size > 0) return true;
    }
    return false;
  }
  /** @internal */
  _emitPointerEvent(type, event) {
    const handlers = this._eventHandlers.get(type);
    if (!handlers || handlers.size === 0) return;
    const snapshot = [...handlers];
    for (const handler of snapshot) {
      handler(event, this);
    }
  }
  /**
   * Hit-test a world-space point against this node's rendered geometry.
   */
  containsWorldPoint(x, y, tolerance = 2) {
    if (!this._visible.get()) return false;
    if (this.isLayoutOnly()) return false;
    const world = new Vec2(x, y);
    const hit = this.getBounds({ space: "world", kind: "hit" });
    if (!hit.containsPoint(world)) return false;
    const local = this.getWorldTransform().invert().transformPoint(world);
    if (this._containsLocalPoint(local, tolerance)) return true;
    if (!this._minHitSize.get()) return false;
    return this._computeLocalBounds("hit").containsPoint(local);
  }
  animate(props, opts = {}) {
    this.stopAnimation();
    const duration = Math.max(0, opts.duration ?? 300);
    const delay = Math.max(0, opts.delay ?? 0);
    const ease = opts.ease ?? "cubicInOut";
    const startPos = this._position.get();
    const endPos = props.pos ? Vec2.from(props.pos) : startPos;
    const startRotation = this._rotation.get();
    const endRotation = props.rotation ?? startRotation;
    const startScale = this._scale.get();
    const endScale = props.scale === void 0 ? startScale : typeof props.scale === "number" ? new Vec2(props.scale, props.scale) : Vec2.from(props.scale);
    const startOpacity = this.style._opacity.get();
    const endOpacity = props.opacity ?? startOpacity;
    const startFill = this.style._fill.get();
    const endFill = props.fill ?? startFill ?? null;
    const fillFrom = startFill ? parseColor(startFill) : null;
    const fillTo = endFill ? parseColor(endFill) : null;
    const startStroke = this.style._stroke.get();
    const targetStrokeColor = props.stroke?.color ?? startStroke?.color ?? null;
    const targetStrokeWidth = props.stroke?.width ?? startStroke?.width ?? null;
    const strokeFrom = startStroke?.color ? parseColor(startStroke.color) : null;
    const strokeTo = targetStrokeColor ? parseColor(targetStrokeColor) : null;
    const applyAt = (tRaw) => {
      const t = easeAt(Math.max(0, Math.min(1, tRaw)), ease);
      if (props.pos) {
        this.pos(
          lerp(startPos.x, endPos.x, t),
          lerp(startPos.y, endPos.y, t)
        );
      }
      if (props.rotation !== void 0) {
        this.rotateTo(lerp(startRotation, endRotation, t));
      }
      if (props.scale !== void 0) {
        this.scaleTo(
          lerp(startScale.x, endScale.x, t),
          lerp(startScale.y, endScale.y, t)
        );
      }
      if (props.opacity !== void 0) {
        this.opacity(lerp(startOpacity, endOpacity, t));
      }
      if (props.fill !== void 0) {
        if (fillFrom && fillTo) {
          this.fill(formatColor({
            r: lerp(fillFrom.r, fillTo.r, t),
            g: lerp(fillFrom.g, fillTo.g, t),
            b: lerp(fillFrom.b, fillTo.b, t),
            a: lerp(fillFrom.a, fillTo.a, t)
          }));
        } else if (t >= 1 && endFill) {
          this.fill(endFill);
        }
      }
      if (props.stroke !== void 0) {
        const current = this.style._stroke.get() ?? {
          color: targetStrokeColor ?? "#000",
          width: targetStrokeWidth ?? 1
        };
        const nextWidth = targetStrokeWidth === null ? current.width : lerp(startStroke?.width ?? current.width, targetStrokeWidth, t);
        let nextColor = targetStrokeColor ?? current.color;
        if (strokeFrom && strokeTo) {
          nextColor = formatColor({
            r: lerp(strokeFrom.r, strokeTo.r, t),
            g: lerp(strokeFrom.g, strokeTo.g, t),
            b: lerp(strokeFrom.b, strokeTo.b, t),
            a: lerp(strokeFrom.a, strokeTo.a, t)
          });
        } else if (t >= 1 && targetStrokeColor) {
          nextColor = targetStrokeColor;
        }
        this.stroke(nextColor, nextWidth);
      }
    };
    const finish = () => {
      applyAt(1);
      this._stopAnimationFn = null;
      opts.onComplete?.();
    };
    if (duration === 0 && delay === 0) {
      finish();
      return this;
    }
    if (typeof requestAnimationFrame === "undefined") {
      finish();
      return this;
    }
    let rafId = null;
    let cancelled = false;
    let startedAt = null;
    const tick = (time) => {
      if (cancelled) return;
      if (startedAt === null) startedAt = time + delay;
      if (time < startedAt) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const elapsed = time - startedAt;
      const t = duration === 0 ? 1 : Math.max(0, Math.min(1, elapsed / duration));
      applyAt(t);
      if (t >= 1) {
        this._stopAnimationFn = null;
        opts.onComplete?.();
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    this._stopAnimationFn = () => {
      cancelled = true;
      if (rafId !== null && typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(rafId);
      }
      this._stopAnimationFn = null;
    };
    return this;
  }
  stopAnimation() {
    this._stopAnimationFn?.();
    this._stopAnimationFn = null;
    return this;
  }
  // ── Anchor API ──
  /** Access named anchor points on this node (e.g. `.anchor.right`). */
  get anchor() {
    if (!this._anchor) {
      this._anchor = new AnchorMap(this);
    }
    return this._anchor;
  }
  // ── Relative positioning (constraint) API ──
  /**
   * Position this node to the right of `target`.
   * Creates a reactive constraint: if `target` moves, this node follows.
   */
  rightOf(target, opts) {
    return this._setConstraint(target, () => new PositionConstraint(
      this,
      target,
      "rightOf",
      opts?.gap ?? 0,
      opts?.align ?? "center"
    ));
  }
  /**
   * Position this node to the left of `target`.
   */
  leftOf(target, opts) {
    return this._setConstraint(target, () => new PositionConstraint(
      this,
      target,
      "leftOf",
      opts?.gap ?? 0,
      opts?.align ?? "center"
    ));
  }
  /**
   * Position this node above `target`.
   */
  above(target, opts) {
    return this._setConstraint(target, () => new PositionConstraint(
      this,
      target,
      "above",
      opts?.gap ?? 0,
      opts?.align ?? "center"
    ));
  }
  /**
   * Position this node below `target`.
   */
  below(target, opts) {
    return this._setConstraint(target, () => new PositionConstraint(
      this,
      target,
      "below",
      opts?.gap ?? 0,
      opts?.align ?? "center"
    ));
  }
  /**
   * Set absolute position (shorthand for `.pos()`).
   * Unlike `.pos()`, accepts a tuple and is designed for use with helpers like `Z.midpoint()`.
   */
  at(position) {
    this._disposeConstraint();
    return this.pos(position);
  }
  pin(target, anchorOrFn, opts) {
    const anchorFn = typeof anchorOrFn === "string" ? () => target.anchor.get(anchorOrFn) : anchorOrFn;
    return this._setConstraint(target, () => new PinConstraint(this, target, anchorFn, opts?.offset));
  }
  /**
   * Aligns a specific anchor on this node to a specific anchor on the target node.
   * Unlike `pin()` which sets the origin of this node, `alignTarget()` ensures that 
   * `this.anchor.get(selfAnchor)` explicitly matches `target.anchor.get(targetAnchor)`.
   */
  alignTarget(target, selfAnchor, targetAnchor, opts) {
    return this._setConstraint(target, () => new AlignmentConstraint(
      this,
      target,
      () => this.anchor.get(selfAnchor),
      () => target.anchor.get(targetAnchor),
      opts?.offset
    ));
  }
  follow(target, relationOrAnchor = "center", opts) {
    if (relationOrAnchor === "above") {
      return this.above(target, opts);
    }
    if (relationOrAnchor === "below") {
      return this.below(target, opts);
    }
    if (relationOrAnchor === "right") {
      if (opts?.gap !== void 0 || opts?.align !== void 0) {
        return this.rightOf(target, opts);
      }
      return this.pin(target, "right", { offset: opts?.offset });
    }
    if (relationOrAnchor === "left") {
      if (opts?.gap !== void 0 || opts?.align !== void 0) {
        return this.leftOf(target, opts);
      }
      return this.pin(target, "left", { offset: opts?.offset });
    }
    return this.pin(target, relationOrAnchor, { offset: opts?.offset });
  }
  _disposeConstraint() {
    this._constraint?.dispose();
    this._constraint = null;
    this._constraintTarget = null;
  }
  _setConstraint(target, factory) {
    this._assertAcyclicConstraintTarget(target);
    this._disposeConstraint();
    this._constraint = factory();
    this._constraintTarget = target;
    return this;
  }
  _assertAcyclicConstraintTarget(target) {
    if (target === this) {
      throw new Error(
        `Zeta: constraint cycle detected: ${this._formatConstraintPath([this, this])}. ${this._formatConstraintRemediationHint([this, this], this)}`
      );
    }
    const chain = [this, target];
    const visited = /* @__PURE__ */ new Set([this.id]);
    let cursor = target;
    while (cursor) {
      const current = cursor;
      if (visited.has(current.id)) {
        if (current === this) {
          throw new Error(
            `Zeta: constraint cycle detected: ${this._formatConstraintPath(chain)}. ${this._formatConstraintRemediationHint(chain, this)}`
          );
        }
        const loopStart = chain.findIndex((n) => n.id === current.id);
        const loopPath = loopStart >= 0 ? [...chain.slice(loopStart), current] : [current, current];
        throw new Error(
          `Zeta: existing constraint cycle detected: ${this._formatConstraintPath(loopPath)}. ${this._formatConstraintRemediationHint(loopPath, this)}`
        );
      }
      visited.add(current.id);
      const next = current._constraintTarget;
      if (!next) return;
      chain.push(next);
      cursor = next;
    }
  }
  _formatConstraintPath(path) {
    return path.map((node) => `${node.type}#${node.id}`).join(" -> ");
  }
  _formatConstraintRemediationHint(loopPath, attemptedNode) {
    const cycleText = this._formatConstraintPath(loopPath);
    return `Hint: break one dependency in ${cycleText} before adding a new link from ${attemptedNode.type}#${attemptedNode.id}. You can clear one side with .at([x, y]) or constrain both nodes to a neutral parent/group node instead of each other.`;
  }
  _containsLocalPoint(local, tolerance) {
    if (this.type === "line") {
      const lineLike = this;
      const points = lineLike.getRoutePoints();
      if (points.length < 2) return false;
      const stroke2 = this.style._stroke.get();
      const threshold = (stroke2?.width ?? 1) / 2 + tolerance;
      for (let i = 1; i < points.length; i++) {
        const d = distancePointToSegment(local, points[i - 1], points[i]);
        if (d <= threshold) return true;
      }
      return false;
    }
    const geom = this.getShapeGeometry();
    const fill = this.style._fill.get();
    const stroke = this.style._stroke.get();
    switch (geom.type) {
      case "rect": {
        const bb = geom.bbox;
        if (fill && bb.containsPoint(local)) return true;
        if (!stroke) return false;
        const sw = stroke.width / 2 + tolerance;
        const outer = bb.expand(sw);
        if (!outer.containsPoint(local)) return false;
        const inner = new BBox(
          bb.minX + sw,
          bb.minY + sw,
          bb.maxX - sw,
          bb.maxY - sw
        );
        if (inner.isEmpty()) return true;
        return !inner.containsPoint(local);
      }
      case "circle": {
        const d = local.distance(geom.center);
        if (fill && d <= geom.radius + tolerance) return true;
        if (!stroke) return false;
        const half = stroke.width / 2 + tolerance;
        return Math.abs(d - geom.radius) <= half;
      }
      case "path": {
        const flattened = flattenPath(geom);
        if (stroke) {
          const threshold = stroke.width / 2 + tolerance;
          for (const poly of flattened) {
            for (let i = 1; i < poly.points.length; i++) {
              const d = distancePointToSegment(local, poly.points[i - 1], poly.points[i]);
              if (d <= threshold) return true;
            }
          }
        }
        if (fill) {
          for (const poly of flattened) {
            if (!poly.closed) continue;
            if (pointInPolygon(local, poly.points)) return true;
          }
        }
        return false;
      }
    }
  }
  // ── Tree management ──
  addChild(child) {
    batchSceneMutations(() => {
      if (child.parent) {
        child.parent.removeChild(child);
      }
      child.parent = this;
      child._onParentChanged();
      this.children.push(child);
      child._markTransformDirty();
      child._inheritDirtyCallback(this._onDirty);
      this._markRenderDirty(true);
    });
    return this;
  }
  removeChild(child) {
    batchSceneMutations(() => {
      const idx = this.children.indexOf(child);
      if (idx !== -1) {
        this.children.splice(idx, 1);
        child.parent = null;
        child._onParentChanged();
        child._inheritDirtyCallback(null);
        this._markRenderDirty(true);
      }
    });
    return this;
  }
  // ── Transform computation ──
  getLocalTransform() {
    if (this._localTransformDirty) {
      const pos = this._position.get();
      const rot = this._rotation.get();
      const scl = this._scale.get();
      let m = Matrix3.translate(pos.x, pos.y);
      if (rot !== 0) m = m.multiply(Matrix3.rotate(rot));
      if (scl.x !== 1 || scl.y !== 1) m = m.multiply(Matrix3.scale(scl.x, scl.y));
      this._localTransform = m;
      this._localTransformDirty = false;
    }
    return this._localTransform;
  }
  getWorldTransform() {
    if (this._worldTransformDirty) {
      const local = this.getLocalTransform();
      if (this.parent) {
        this._worldTransform = this.parent.getWorldTransform().multiply(local);
      } else {
        this._worldTransform = local;
      }
      this._worldTransformDirty = false;
    }
    return this._worldTransform;
  }
  /** Compute world-space bounding box (cached, invalidated on transform changes). */
  computeWorldBBox() {
    if (this._worldBBoxDirty) {
      const local = this.computeLocalBBox();
      if (local.isEmpty()) {
        this._cachedWorldBBox = local;
      } else {
        const wt = this.getWorldTransform();
        const corners = [local.topLeft, local.topRight, local.bottomLeft, local.bottomRight];
        const transformed = corners.map((c) => wt.transformPoint(c));
        this._cachedWorldBBox = BBox.fromPoints(transformed);
      }
      this._worldBBoxDirty = false;
    }
    return this._cachedWorldBBox;
  }
  _computeLocalBounds(kind) {
    const layout = this.computeLocalBBox();
    if (layout.isEmpty()) return layout;
    if (kind === "layout") return layout;
    if (this.isLayoutOnly()) return BBox.empty();
    const stroke = this.style._stroke.get();
    const strokeHalf = stroke && stroke.width > 0 ? stroke.width / 2 : 0;
    const visual = strokeHalf > 0 ? layout.expand(strokeHalf) : layout;
    if (kind === "visual") return visual;
    const hit = visual.expand(HIT_BOUNDS_PADDING);
    const minHitSize = this._minHitSize.get();
    if (!minHitSize) return hit;
    const width = Math.max(hit.width, minHitSize.x);
    const height = Math.max(hit.height, minHitSize.y);
    const center = hit.center;
    return BBox.fromCenter(center.x, center.y, width, height);
  }
  _computeWorldBounds(kind) {
    const local = this._computeLocalBounds(kind);
    if (local.isEmpty()) return local;
    const wt = this.getWorldTransform();
    const corners = [local.topLeft, local.topRight, local.bottomLeft, local.bottomRight];
    const transformed = corners.map((c) => wt.transformPoint(c));
    return BBox.fromPoints(transformed);
  }
  /**
   * Read node position in either local-parent space (`local`) or world space (`world`).
   */
  getPosition(opts = {}) {
    const space = opts.space ?? "local";
    if (space === "world") {
      return this.getWorldTransform().transformPoint(Vec2.zero());
    }
    return this._position.get();
  }
  /**
   * Public geometry accessor that avoids direct bbox internals.
   */
  getBounds(opts = {}) {
    const space = opts.space ?? "local";
    const kind = opts.kind ?? "layout";
    this._settleForMeasurement();
    if (space === "world") {
      if (kind === "layout") {
        return this.computeWorldBBox();
      }
      return this._computeWorldBounds(kind);
    }
    return this._computeLocalBounds(kind);
  }
  getSize() {
    return this.getBounds({ space: "local", kind: "layout" }).size;
  }
  // ── Dirty tracking ──
  _markTransformDirty(propagateToAncestors = true) {
    batchSceneMutations(() => {
      this._localTransformDirty = true;
      this._worldTransformDirty = true;
      this._worldBBoxDirty = true;
      this._renderDirty = true;
      this._emitLayoutChange();
      for (const child of this.children) {
        child._markTransformDirty(false);
      }
      if (propagateToAncestors) {
        this._markAncestorLayoutDirty();
      }
      this._onDirty?.();
    });
  }
  _markRenderDirty(layoutChanged = false) {
    batchSceneMutations(() => {
      this._worldBBoxDirty = true;
      this._renderDirty = true;
      if (layoutChanged) {
        this._emitLayoutChange();
        this._markAncestorLayoutDirty();
      }
      this._onDirty?.();
    });
  }
  isRenderDirty() {
    return this._renderDirty;
  }
  clearRenderDirty() {
    this._renderDirty = false;
  }
  /** @internal Set / propagate the dirty callback (used by Scene). */
  _setDirtyCallback(cb) {
    this._onDirty = cb;
    for (const child of this.children) {
      child._inheritDirtyCallback(cb);
    }
  }
  /** @internal */
  _inheritDirtyCallback(cb) {
    this._onDirty = cb;
    for (const child of this.children) {
      child._inheritDirtyCallback(cb);
    }
  }
  /** @internal Subscribe to layout-affecting changes. */
  _subscribeLayout(fn) {
    this._layoutListeners.add(fn);
    return () => {
      this._layoutListeners.delete(fn);
    };
  }
  _emitLayoutChange() {
    const listeners = [...this._layoutListeners];
    for (const listener of listeners) {
      queueMutationEffect(listener, "normal");
    }
    if (!isBatchingSceneMutations()) {
      flushMutationEffects();
    }
  }
  _markAncestorLayoutDirty() {
    let p = this.parent;
    while (p) {
      p._worldBBoxDirty = true;
      p._renderDirty = true;
      p._emitLayoutChange();
      p = p.parent;
    }
  }
  /**
   * Public subscription to layout-affecting changes for this node.
   * Useful for building reactive helpers without touching private internals.
   */
  watchLayout(fn) {
    return this._subscribeLayout(fn);
  }
};

// src/shapes/rect.ts
var Rect = class extends SceneNode {
  constructor(position, size) {
    super(position);
    this.type = "rect";
    this._size = new Signal(size);
    this._cornerRadius = new Signal(0);
    this._sizeSpec = parseUnitSize([size.x, size.y], "rect size.width", "rect size.height");
    this._size.subscribe(() => this._markRenderDirty(true));
    this._cornerRadius.subscribe(() => this._markRenderDirty(true));
  }
  size(sizeOrW, h) {
    this._sizeSpec = Array.isArray(sizeOrW) ? parseUnitSize(sizeOrW, "rect size.width", "rect size.height") : parseUnitSize([sizeOrW, h ?? sizeOrW], "rect size.width", "rect size.height");
    this._resolveSizeFromSpec();
    this._refreshRelativeUnitTracking();
    return this;
  }
  /** Set the corner radius for rounded corners. */
  radius(r) {
    this._cornerRadius.set(r);
    return this;
  }
  getSize() {
    return this._size.get();
  }
  getCornerRadius() {
    return this._cornerRadius.get();
  }
  _getUnitReferenceSizeForChildren() {
    const size = this._size.get();
    return { width: size.x, height: size.y };
  }
  _hasRelativeUnitSpecs() {
    return super._hasRelativeUnitSpecs() || hasRelativeUnits(this._sizeSpec);
  }
  _resolveRelativeUnits() {
    super._resolveRelativeUnits();
    this._resolveSizeFromSpec();
  }
  _resolveSizeFromSpec() {
    if (!this.parent && hasRelativeUnits(this._sizeSpec)) {
      return;
    }
    const next = new Vec2(
      this._resolveUnitSpec(this._sizeSpec[0], "x", "rect size.width"),
      this._resolveUnitSpec(this._sizeSpec[1], "y", "rect size.height")
    );
    if (!this._size.get().equals(next)) {
      this._size.set(next);
    }
  }
  computeLocalBBox() {
    const s = this._size.get();
    return BBox.fromPosSize(0, 0, s.x, s.y);
  }
  getShapeGeometry() {
    return { type: "rect", bbox: this.computeLocalBBox() };
  }
};

// src/shapes/circle.ts
var Circle = class extends SceneNode {
  constructor(center, radius) {
    super(center);
    this.type = "circle";
    this._radius = new Signal(radius);
    this._radiusSpec = parseUnitValue(radius, "circle radius");
    this._radius.subscribe(() => this._markRenderDirty(true));
  }
  /** Set the radius. */
  setRadius(r) {
    this._radiusSpec = parseUnitValue(r, "circle radius");
    this._resolveRadiusFromSpec();
    this._refreshRelativeUnitTracking();
    return this;
  }
  getRadius() {
    return this._radius.get();
  }
  _getUnitReferenceSizeForChildren() {
    const diameter = this._radius.get() * 2;
    return { width: diameter, height: diameter };
  }
  _hasRelativeUnitSpecs() {
    return super._hasRelativeUnitSpecs() || isRelativeUnit(this._radiusSpec);
  }
  _resolveRelativeUnits() {
    super._resolveRelativeUnits();
    this._resolveRadiusFromSpec();
  }
  _resolveRadiusFromSpec() {
    if (!this.parent && isRelativeUnit(this._radiusSpec)) {
      return;
    }
    const next = this._resolveUnitSpec(this._radiusSpec, "radius", "circle radius");
    if (!Number.isFinite(next)) return;
    if (this._radius.get() !== next) {
      this._radius.set(next);
    }
  }
  computeLocalBBox() {
    const r = this._radius.get();
    return BBox.fromCenter(0, 0, r * 2, r * 2);
  }
  getShapeGeometry() {
    return { type: "circle", center: Vec2.zero(), radius: this._radius.get() };
  }
};

// src/shapes/path.ts
var Path = class extends SceneNode {
  constructor(position = Vec2.zero()) {
    super(position);
    this.type = "path";
    this._segments = new Signal([]);
    this._segments.subscribe(() => this._markRenderDirty(true));
  }
  /** Start a new sub-path. */
  moveTo(x, y) {
    this._pushSegment({ cmd: "M", to: new Vec2(x, y) });
    return this;
  }
  /** Draw a line to the given point. */
  lineTo(x, y) {
    this._pushSegment({ cmd: "L", to: new Vec2(x, y) });
    return this;
  }
  /** Draw a quadratic Bézier curve. */
  quadTo(cpx, cpy, x, y) {
    this._pushSegment({ cmd: "Q", cp: new Vec2(cpx, cpy), to: new Vec2(x, y) });
    return this;
  }
  /** Draw a cubic Bézier curve. */
  cubicTo(cp1x, cp1y, cp2x, cp2y, x, y) {
    this._pushSegment({ cmd: "C", cp1: new Vec2(cp1x, cp1y), cp2: new Vec2(cp2x, cp2y), to: new Vec2(x, y) });
    return this;
  }
  /** Draw an arc. */
  arcTo(rx, ry, rotation, largeArc, sweep, x, y) {
    this._pushSegment({ cmd: "A", rx, ry, rotation, largeArc, sweep, to: new Vec2(x, y) });
    return this;
  }
  /** Close the current sub-path. */
  close() {
    this._pushSegment({ cmd: "Z" });
    return this;
  }
  /** Clear all segments. */
  clear() {
    this._segments.set([]);
    return this;
  }
  getSegments() {
    return this._segments.get();
  }
  computeLocalBBox() {
    const segs = this._segments.get();
    const points = [];
    for (const seg of segs) {
      if (seg.cmd === "Z") continue;
      points.push(seg.to);
      if (seg.cmd === "Q") points.push(seg.cp);
      if (seg.cmd === "C") {
        points.push(seg.cp1);
        points.push(seg.cp2);
      }
    }
    return points.length > 0 ? BBox.fromPoints(points) : BBox.empty();
  }
  getShapeGeometry() {
    return {
      type: "path",
      segments: this._segments.get(),
      fallbackBBox: this.computeLocalBBox()
    };
  }
  /** Convert segments to a Canvas2D Path2D for rendering. */
  toPath2D() {
    const p2d = new Path2D();
    for (const seg of this._segments.get()) {
      switch (seg.cmd) {
        case "M":
          p2d.moveTo(seg.to.x, seg.to.y);
          break;
        case "L":
          p2d.lineTo(seg.to.x, seg.to.y);
          break;
        case "Q":
          p2d.quadraticCurveTo(seg.cp.x, seg.cp.y, seg.to.x, seg.to.y);
          break;
        case "C":
          p2d.bezierCurveTo(seg.cp1.x, seg.cp1.y, seg.cp2.x, seg.cp2.y, seg.to.x, seg.to.y);
          break;
        case "A":
          p2d.lineTo(seg.to.x, seg.to.y);
          break;
        case "Z":
          p2d.closePath();
          break;
      }
    }
    return p2d;
  }
  /** Convert segments to an SVG `d` attribute string. */
  toSVGPath() {
    const parts = [];
    for (const seg of this._segments.get()) {
      switch (seg.cmd) {
        case "M":
          parts.push(`M${seg.to.x} ${seg.to.y}`);
          break;
        case "L":
          parts.push(`L${seg.to.x} ${seg.to.y}`);
          break;
        case "Q":
          parts.push(`Q${seg.cp.x} ${seg.cp.y} ${seg.to.x} ${seg.to.y}`);
          break;
        case "C":
          parts.push(`C${seg.cp1.x} ${seg.cp1.y} ${seg.cp2.x} ${seg.cp2.y} ${seg.to.x} ${seg.to.y}`);
          break;
        case "A":
          parts.push(`A${seg.rx} ${seg.ry} ${seg.rotation} ${seg.largeArc ? 1 : 0} ${seg.sweep ? 1 : 0} ${seg.to.x} ${seg.to.y}`);
          break;
        case "Z":
          parts.push("Z");
          break;
      }
    }
    return parts.join(" ");
  }
  _pushSegment(seg) {
    const segs = [...this._segments.get(), seg];
    this._segments.set(segs);
  }
};

// src/shapes/latex.ts
var COMMAND_SYMBOLS = {
  alpha: "\u03B1",
  beta: "\u03B2",
  gamma: "\u03B3",
  delta: "\u03B4",
  epsilon: "\u03B5",
  zeta: "\u03B6",
  eta: "\u03B7",
  theta: "\u03B8",
  iota: "\u03B9",
  kappa: "\u03BA",
  lambda: "\u03BB",
  mu: "\u03BC",
  nu: "\u03BD",
  xi: "\u03BE",
  pi: "\u03C0",
  rho: "\u03C1",
  sigma: "\u03C3",
  tau: "\u03C4",
  upsilon: "\u03C5",
  phi: "\u03C6",
  chi: "\u03C7",
  psi: "\u03C8",
  omega: "\u03C9",
  Gamma: "\u0393",
  Delta: "\u0394",
  Theta: "\u0398",
  Lambda: "\u039B",
  Xi: "\u039E",
  Pi: "\u03A0",
  Sigma: "\u03A3",
  Upsilon: "\u03A5",
  Phi: "\u03A6",
  Psi: "\u03A8",
  Omega: "\u03A9",
  cdot: "\xB7",
  times: "\xD7",
  div: "\xF7",
  pm: "\xB1",
  mp: "\u2213",
  neq: "\u2260",
  leq: "\u2264",
  geq: "\u2265",
  approx: "\u2248",
  infty: "\u221E",
  sum: "\u2211",
  prod: "\u220F",
  int: "\u222B",
  partial: "\u2202",
  nabla: "\u2207",
  to: "\u2192",
  leftarrow: "\u2190",
  rightarrow: "\u2192",
  leftrightarrow: "\u2194",
  mapsto: "\u21A6",
  degree: "\xB0"
};
var SUPERSCRIPT_MAP = {
  "0": "\u2070",
  "1": "\xB9",
  "2": "\xB2",
  "3": "\xB3",
  "4": "\u2074",
  "5": "\u2075",
  "6": "\u2076",
  "7": "\u2077",
  "8": "\u2078",
  "9": "\u2079",
  "+": "\u207A",
  "-": "\u207B",
  "=": "\u207C",
  "(": "\u207D",
  ")": "\u207E",
  n: "\u207F",
  i: "\u2071"
};
var SUBSCRIPT_MAP = {
  "0": "\u2080",
  "1": "\u2081",
  "2": "\u2082",
  "3": "\u2083",
  "4": "\u2084",
  "5": "\u2085",
  "6": "\u2086",
  "7": "\u2087",
  "8": "\u2088",
  "9": "\u2089",
  "+": "\u208A",
  "-": "\u208B",
  "=": "\u208C",
  "(": "\u208D",
  ")": "\u208E",
  a: "\u2090",
  e: "\u2091",
  h: "\u2095",
  i: "\u1D62",
  j: "\u2C7C",
  k: "\u2096",
  l: "\u2097",
  m: "\u2098",
  n: "\u2099",
  o: "\u2092",
  p: "\u209A",
  r: "\u1D63",
  s: "\u209B",
  t: "\u209C",
  u: "\u1D64",
  v: "\u1D65",
  x: "\u2093"
};
var TEXT_GROUP_COMMANDS = /* @__PURE__ */ new Set(["text", "mathrm", "mathit", "mathbf", "operatorname"]);
var SKIPPED_COMMANDS = /* @__PURE__ */ new Set(["left", "right", "displaystyle", "textstyle", "scriptstyle", "scriptscriptstyle"]);
function normalizeLatex(input) {
  if (!input) return "";
  const parser = new LatexParser(input);
  const normalized = parser.parse();
  return normalized.replace(/\s+/g, " ").trim();
}
var LatexParser = class {
  constructor(source) {
    this.source = source;
    this.index = 0;
  }
  parse() {
    return this.parseExpression();
  }
  parseExpression(until) {
    let out = "";
    while (this.index < this.source.length) {
      const ch = this.source[this.index];
      if (until && ch === until) {
        this.index += 1;
        break;
      }
      if (ch === "{") {
        this.index += 1;
        out += this.parseExpression("}");
        continue;
      }
      if (ch === "}") {
        this.index += 1;
        break;
      }
      if (ch === "\\") {
        out += this.parseCommand();
        continue;
      }
      if (ch === "^") {
        this.index += 1;
        out += mapScript(this.parseScriptOperand(), SUPERSCRIPT_MAP, "^");
        continue;
      }
      if (ch === "_") {
        this.index += 1;
        out += mapScript(this.parseScriptOperand(), SUBSCRIPT_MAP, "_");
        continue;
      }
      if (ch === "~") {
        this.index += 1;
        out += " ";
        continue;
      }
      if (ch === "$") {
        this.index += 1;
        continue;
      }
      out += ch;
      this.index += 1;
    }
    return out;
  }
  parseCommand() {
    this.index += 1;
    if (this.index >= this.source.length) return "";
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
      return "";
    }
    if (command === "frac") {
      const numerator = this.parseGroupOrAtom();
      const denominator = this.parseGroupOrAtom();
      return `(${numerator})/(${denominator})`;
    }
    if (command === "sqrt") {
      this.skipWhitespace();
      if (this.peek() === "[") {
        this.consumeBracketGroup("[", "]");
      }
      const body = this.parseGroupOrAtom();
      return `\u221A(${body})`;
    }
    if (command === "begin" || command === "end") {
      this.parseGroupOrAtom();
      return "";
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
  parseScriptOperand() {
    this.skipWhitespace();
    if (this.index >= this.source.length) return "";
    const ch = this.source[this.index];
    if (ch === "{") {
      this.index += 1;
      return this.parseExpression("}");
    }
    if (ch === "\\") {
      return this.parseCommand();
    }
    this.index += 1;
    return ch;
  }
  parseGroupOrAtom() {
    this.skipWhitespace();
    if (this.index >= this.source.length) return "";
    const ch = this.source[this.index];
    if (ch === "{") {
      this.index += 1;
      return this.parseExpression("}");
    }
    if (ch === "\\") {
      return this.parseCommand();
    }
    this.index += 1;
    return ch;
  }
  consumeBracketGroup(open, close) {
    if (this.peek() !== open) return "";
    this.index += 1;
    let depth = 1;
    let out = "";
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
  skipWhitespace() {
    while (this.index < this.source.length) {
      const ch = this.source[this.index];
      if (ch === " " || ch === "\n" || ch === "	" || ch === "\r") {
        this.index += 1;
        continue;
      }
      break;
    }
  }
  peek() {
    if (this.index >= this.source.length) return null;
    return this.source[this.index];
  }
};
function isLetter(ch) {
  const code = ch.charCodeAt(0);
  return code >= 65 && code <= 90 || code >= 97 && code <= 122;
}
function mapSingleSymbolCommand(ch) {
  switch (ch) {
    case "\\":
      return " ";
    case ",":
    case ";":
    case ":":
    case "!":
      return " ";
    case "{":
    case "}":
    case "$":
    case "_":
    case "^":
    case "%":
    case "&":
    case "#":
      return ch;
    default:
      return ch;
  }
}
function mapScript(input, table, fallbackPrefix) {
  if (!input) return "";
  let mapped = "";
  for (const ch of input) {
    const next = table[ch];
    if (!next) {
      return `${fallbackPrefix}(${input})`;
    }
    mapped += next;
  }
  return mapped;
}

// src/shapes/text.ts
var _Text = class _Text extends SceneNode {
  constructor(content, position = Vec2.zero()) {
    super(position);
    this.type = "text";
    this._content = new Signal(content);
    this._fontSize = new Signal(14);
    this._fontFamily = new Signal("sans-serif");
    this._textAlign = new Signal("left");
    this._textBaseline = new Signal("alphabetic");
    this._renderMode = new Signal("plain");
    this._latexDisplayMode = new Signal(false);
    this._content.subscribe(() => this._markRenderDirty(true));
    this._fontSize.subscribe(() => this._markRenderDirty(true));
    this._fontFamily.subscribe(() => this._markRenderDirty(true));
    this._textAlign.subscribe(() => this._markRenderDirty(true));
    this._textBaseline.subscribe(() => this._markRenderDirty(true));
    this._renderMode.subscribe(() => this._markRenderDirty(true));
    this._latexDisplayMode.subscribe(() => this._markRenderDirty(true));
  }
  /** Set the text content. */
  text(content) {
    this._content.set(content);
    this._renderMode.set("plain");
    this._latexDisplayMode.set(false);
    return this;
  }
  /** Set content as LaTeX and enable math rendering mode. */
  latex(expression, opts = {}) {
    this._content.set(expression);
    this._renderMode.set("latex");
    this._latexDisplayMode.set(Boolean(opts.displayMode));
    return this;
  }
  /** Set font size in pixels. */
  fontSize(size) {
    this._fontSize.set(size);
    return this;
  }
  /** Set font family. */
  fontFamily(family) {
    this._fontFamily.set(family);
    return this;
  }
  /** Set text alignment. */
  textAlign(align) {
    this._textAlign.set(align);
    return this;
  }
  /** Set text baseline. */
  textBaseline(baseline) {
    this._textBaseline.set(baseline);
    return this;
  }
  getContent() {
    return this._content.get();
  }
  getRenderedContent() {
    if (this._renderMode.get() === "latex") {
      return normalizeLatex(this._content.get());
    }
    return this._content.get();
  }
  getRenderMode() {
    return this._renderMode.get();
  }
  isLatex() {
    return this._renderMode.get() === "latex";
  }
  isLatexDisplayMode() {
    return this._renderMode.get() === "latex" && this._latexDisplayMode.get();
  }
  getFont() {
    return `${this._fontSize.get()}px ${this._fontFamily.get()}`;
  }
  /**
   * Capture renderer-backed text metrics for improved subsequent layout reads.
   */
  measureWithContext(ctx) {
    const content = this.getRenderedContent();
    ctx.save();
    ctx.font = this.getFont();
    const metrics = ctx.measureText(content);
    ctx.restore();
    const fontSize = this._fontSize.get();
    const displayScale = this.isLatexDisplayMode() ? 1.15 : 1;
    const fallbackHeight = fontSize * 1.2 * displayScale;
    const ascent = metrics.actualBoundingBoxAscent || fallbackHeight * 0.8;
    const descent = metrics.actualBoundingBoxDescent || fallbackHeight * 0.2;
    const width = metrics.width;
    _Text._metricsCache.set(this._metricsKey(content), { width, ascent, descent });
    return this;
  }
  _metricsKey(content) {
    return [
      content,
      this._fontFamily.get(),
      this._fontSize.get(),
      this._renderMode.get(),
      this._latexDisplayMode.get() ? "display" : "inline"
    ].join("|");
  }
  computeLocalBBox() {
    const content = this.getRenderedContent();
    const fontSize = this._fontSize.get();
    const displayScale = this.isLatexDisplayMode() ? 1.15 : 1;
    const cached = _Text._metricsCache.get(this._metricsKey(content));
    const widthFactor = this.isLatex() ? 0.64 : 0.6;
    const approxWidth = content.length * fontSize * widthFactor * displayScale;
    const approxHeight = fontSize * 1.2 * displayScale;
    const width = cached?.width ?? approxWidth;
    const ascent = cached?.ascent ?? approxHeight * 0.8;
    const descent = cached?.descent ?? approxHeight * 0.2;
    const align = this._textAlign.get();
    const baseline = this._textBaseline.get();
    let minX = 0;
    switch (align) {
      case "center":
        minX = -width / 2;
        break;
      case "right":
        minX = -width;
        break;
    }
    let minY;
    let maxY;
    switch (baseline) {
      case "top":
        minY = 0;
        maxY = ascent + descent;
        break;
      case "middle":
        minY = -(ascent + descent) / 2;
        maxY = (ascent + descent) / 2;
        break;
      case "bottom":
        minY = -(ascent + descent);
        maxY = 0;
        break;
      case "alphabetic":
      default:
        minY = -ascent;
        maxY = descent;
        break;
    }
    return new BBox(minX, minY, minX + width, maxY);
  }
  getShapeGeometry() {
    return { type: "rect", bbox: this.computeLocalBBox() };
  }
};
_Text._metricsCache = /* @__PURE__ */ new Map();
var Text = _Text;

// src/shapes/line.ts
var Line = class extends SceneNode {
  constructor(from, to) {
    super(Vec2.zero());
    this.type = "line";
    this._disconnectBinding = null;
    this._connectedFromNode = null;
    this._connectedToNode = null;
    this._from = new Signal(from);
    this._to = new Signal(to);
    this._fromSpec = parseUnitPoint([from.x, from.y], "line from.x", "line from.y");
    this._toSpec = parseUnitPoint([to.x, to.y], "line to.x", "line to.y");
    this._routeMode = new Signal("straight");
    this._routeRadius = new Signal(0);
    this._avoidObstacles = new Signal(false);
    this._from.subscribe(() => this._markRenderDirty(true));
    this._to.subscribe(() => this._markRenderDirty(true));
    this._routeMode.subscribe(() => this._markRenderDirty(true));
    this._routeRadius.subscribe(() => this._markRenderDirty(true));
    this._avoidObstacles.subscribe(() => this._markRenderDirty(true));
    this.stroke("#000", 1);
  }
  from(xOrPoint, y) {
    this._fromSpec = Array.isArray(xOrPoint) ? parseUnitPoint([xOrPoint[0], xOrPoint[1]], "line from.x", "line from.y") : parseUnitPoint([xOrPoint, y], "line from.x", "line from.y");
    this._resolveFromSpec();
    this._refreshRelativeUnitTracking();
    return this;
  }
  to(xOrPoint, y) {
    this._toSpec = Array.isArray(xOrPoint) ? parseUnitPoint([xOrPoint[0], xOrPoint[1]], "line to.x", "line to.y") : parseUnitPoint([xOrPoint, y], "line to.x", "line to.y");
    this._resolveToSpec();
    this._refreshRelativeUnitTracking();
    return this;
  }
  _hasRelativeUnitSpecs() {
    return super._hasRelativeUnitSpecs() || hasRelativeUnits(this._fromSpec) || hasRelativeUnits(this._toSpec);
  }
  _resolveRelativeUnits() {
    super._resolveRelativeUnits();
    this._resolveFromSpec();
    this._resolveToSpec();
  }
  _resolveFromSpec() {
    if (!this.parent && hasRelativeUnits(this._fromSpec)) {
      return;
    }
    const next = new Vec2(
      this._resolveUnitSpec(this._fromSpec[0], "x", "line from.x"),
      this._resolveUnitSpec(this._fromSpec[1], "y", "line from.y")
    );
    if (!this._from.get().equals(next)) {
      this._from.set(next);
    }
  }
  _resolveToSpec() {
    if (!this.parent && hasRelativeUnits(this._toSpec)) {
      return;
    }
    const next = new Vec2(
      this._resolveUnitSpec(this._toSpec[0], "x", "line to.x"),
      this._resolveUnitSpec(this._toSpec[1], "y", "line to.y")
    );
    if (!this._to.get().equals(next)) {
      this._to.set(next);
    }
  }
  route(mode, opts = {}) {
    this._routeMode.set(mode);
    if (opts.radius !== void 0) {
      this._routeRadius.set(Math.max(0, opts.radius));
    }
    if (opts.avoidObstacles !== void 0) {
      this._avoidObstacles.set(opts.avoidObstacles);
    }
    return this;
  }
  /**
   * Bind this line reactively between two nodes and anchors.
   * Endpoints update automatically when either node's layout changes.
   */
  connect(fromNode, toNode, opts = {}) {
    this.disconnect();
    this._connectedFromNode = fromNode;
    this._connectedToNode = toNode;
    const fromRef = opts.from ?? "auto";
    const toRef = opts.to ?? "auto";
    const fromOffset = parseUnitPoint(opts.fromOffset ?? [0, 0], "line fromOffset.x", "line fromOffset.y");
    const toOffset = parseUnitPoint(opts.toOffset ?? [0, 0], "line toOffset.x", "line toOffset.y");
    const resolve = (node, other, ref) => {
      if (typeof ref === "function") {
        return Vec2.from(ref(node, other));
      }
      if (typeof ref === "number") {
        return Vec2.from(node.anchor.atAngle(ref));
      }
      if (ref === "auto") {
        const [sx, sy] = node.anchor.center;
        const [ox, oy] = other.anchor.center;
        const deg = Math.atan2(oy - sy, ox - sx) * 180 / Math.PI;
        return Vec2.from(node.anchor.atAngle(deg));
      }
      return Vec2.from(node.anchor.get(ref));
    };
    const update = () => {
      const worldFrom = resolve(fromNode, toNode, fromRef).add(
        new Vec2(
          this._resolveUnitSpec(fromOffset[0], "x", "line fromOffset.x"),
          this._resolveUnitSpec(fromOffset[1], "y", "line fromOffset.y")
        )
      );
      const worldTo = resolve(toNode, fromNode, toRef).add(
        new Vec2(
          this._resolveUnitSpec(toOffset[0], "x", "line toOffset.x"),
          this._resolveUnitSpec(toOffset[1], "y", "line toOffset.y")
        )
      );
      const inv = this.getWorldTransform().invert();
      const localFrom = inv.transformPoint(worldFrom);
      const localTo = inv.transformPoint(worldTo);
      this.from(localFrom.x, localFrom.y).to(localTo.x, localTo.y);
    };
    const unsubFrom = fromNode.watchLayout(update);
    const unsubTo = toNode.watchLayout(update);
    const unsubParent = hasRelativeUnits(fromOffset) || hasRelativeUnits(toOffset) ? this.parent?.watchLayout(update) ?? null : null;
    this._disconnectBinding = () => {
      unsubFrom();
      unsubTo();
      unsubParent?.();
    };
    update();
    return this;
  }
  disconnect() {
    this._disconnectBinding?.();
    this._disconnectBinding = null;
    this._connectedFromNode = null;
    this._connectedToNode = null;
    return this;
  }
  getFrom() {
    return this._from.get();
  }
  getTo() {
    return this._to.get();
  }
  getRouteMode() {
    return this._routeMode.get();
  }
  getRouteRadius() {
    return this._routeRadius.get();
  }
  getRoutePoints() {
    const from = this._from.get();
    const to = this._to.get();
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const mode = this._routeMode.get();
    const avoidObstacles = this._avoidObstacles.get();
    if (mode === "straight") {
      return [from, to];
    }
    if ((dx === 0 || dy === 0) && !(mode === "orthogonal" && avoidObstacles)) {
      return [from, to];
    }
    if (mode === "step") {
      const elbow = Math.abs(dx) >= Math.abs(dy) ? new Vec2(to.x, from.y) : new Vec2(from.x, to.y);
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
  computeLocalBBox() {
    return BBox.fromPoints(this.getRoutePoints());
  }
  getShapeGeometry() {
    return { type: "rect", bbox: this.computeLocalBBox() };
  }
  _dedupeRoute(points) {
    const out = [];
    for (const p of points) {
      if (out.length === 0 || !out[out.length - 1].equals(p)) {
        out.push(p);
      }
    }
    return out;
  }
  _routeOrthogonalAvoidingObstacles(from, to) {
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
    if (cols * rows > 4e4) return null;
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
      to
    ];
    return this._simplifyOrthogonalPoints(this._orthogonalize(points));
  }
  _simpleOrthogonalRoute(from, to) {
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
        to
      ]);
    }
    const midY = from.y + dy / 2;
    return this._dedupeRoute([
      from,
      new Vec2(from.x, midY),
      new Vec2(to.x, midY),
      to
    ]);
  }
  _routeIntersectsObstacles(points, obstacles) {
    for (let i = 0; i < points.length - 1; i++) {
      if (obstacles.some((bb) => this._orthogonalSegmentIntersectsBBox(points[i], points[i + 1], bb))) {
        return true;
      }
    }
    return false;
  }
  _orthogonalSegmentIntersectsBBox(a, b, bbox) {
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    if (a.x === b.x) {
      return a.x >= bbox.minX && a.x <= bbox.maxX && maxY >= bbox.minY && minY <= bbox.maxY;
    }
    if (a.y === b.y) {
      return a.y >= bbox.minY && a.y <= bbox.maxY && maxX >= bbox.minX && minX <= bbox.maxX;
    }
    return maxX >= bbox.minX && minX <= bbox.maxX && maxY >= bbox.minY && minY <= bbox.maxY;
  }
  _aStar(start, goal, cols, rows, blocked) {
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
    const open = /* @__PURE__ */ new Set();
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
        { x: cx, y: cy - 1 }
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
  _reconstructPath(cameFrom, current, cols) {
    const out = [];
    let c = current;
    while (c !== -1) {
      out.push({ x: c % cols, y: Math.floor(c / cols) });
      c = cameFrom[c];
    }
    out.reverse();
    return out;
  }
  _manhattan(ax, ay, bx, by) {
    return Math.abs(ax - bx) + Math.abs(ay - by);
  }
  _pointToCell(p, bounds, cell, cols, rows) {
    const x = Math.round((p.x - bounds.minX) / cell);
    const y = Math.round((p.y - bounds.minY) / cell);
    return {
      x: Math.max(0, Math.min(cols - 1, x)),
      y: Math.max(0, Math.min(rows - 1, y))
    };
  }
  _gridPoint(bounds, cell, x, y) {
    return new Vec2(bounds.minX + x * cell, bounds.minY + y * cell);
  }
  _clearCellNeighborhood(blocked, cols, rows, cx, cy, radius) {
    for (let y = cy - radius; y <= cy + radius; y++) {
      if (y < 0 || y >= rows) continue;
      for (let x = cx - radius; x <= cx + radius; x++) {
        if (x < 0 || x >= cols) continue;
        blocked[y * cols + x] = 0;
      }
    }
  }
  _computeRoutingBounds(from, to, obstacles) {
    let bounds = BBox.fromPoints([from, to]);
    for (const bb of obstacles) {
      bounds = bounds.union(bb);
    }
    return bounds.expand(40);
  }
  _computeGridCellSize(from, to) {
    const span = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
    if (span > 600) return 24;
    if (span > 300) return 20;
    return 16;
  }
  _orthogonalize(points) {
    if (points.length < 2) return points;
    const out = [points[0]];
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
  _simplifyOrthogonalPoints(points) {
    const deduped = this._dedupeRoute(points);
    if (deduped.length <= 2) return deduped;
    const out = [deduped[0]];
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
  _collectObstacleBBoxesWorld(from, to) {
    const root = this._getRoot();
    const skip = /* @__PURE__ */ new Set();
    let p = this;
    while (p) {
      skip.add(p);
      p = p.parent;
    }
    const obstacles = [];
    const walk = (node) => {
      if (this._isConnectedEndpointSubtree(node)) {
        return;
      }
      if (!skip.has(node) && node._visible.get() && node.type !== "group" && node.type !== "scene" && node.type !== "line" && node.type !== "text") {
        const bb = node.computeWorldBBox();
        if (!bb.isEmpty()) {
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
  _isConnectedEndpointSubtree(node) {
    let current = node;
    while (current) {
      if (current === this._connectedFromNode || current === this._connectedToNode) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }
  _getRoot() {
    let node = this;
    while (node.parent) {
      node = node.parent;
    }
    return node;
  }
};

// src/core/group.ts
var Group = class _Group extends SceneNode {
  constructor(position = Vec2.zero()) {
    super(position);
    this.type = "group";
    this._sizeSpec = null;
    this._coords = null;
    this._projection = null;
    this._layoutConfig = null;
    this._layoutSubscriptions = /* @__PURE__ */ new Map();
    this._isApplyingLayout = false;
    this._layoutQueued = false;
    this._size = new Signal(null);
    this._size.subscribe(() => {
      this._markRenderDirty(true);
      if (this._layoutConfig && !this._isApplyingLayout) {
        this._requestAutoLayout();
      }
    });
  }
  _getUnitReferenceSizeForChildren() {
    const size = this._size.get();
    if (!size) return null;
    return { width: size.x, height: size.y };
  }
  _hasRelativeUnitSpecs() {
    return super._hasRelativeUnitSpecs() || (this._sizeSpec ? hasRelativeUnits(this._sizeSpec) : false);
  }
  _resolveRelativeUnits() {
    super._resolveRelativeUnits();
    this._resolveSizeFromSpec();
  }
  _resolveSizeFromSpec() {
    if (!this._sizeSpec) return;
    if (!this.parent && hasRelativeUnits(this._sizeSpec)) {
      return;
    }
    const next = new Vec2(
      this._resolveUnitSpec(this._sizeSpec[0], "x", "group size.width"),
      this._resolveUnitSpec(this._sizeSpec[1], "y", "group size.height")
    );
    const current = this._size.get();
    if (!current || !current.equals(next)) {
      this._size.set(next);
    }
  }
  addChild(child) {
    super.addChild(child);
    this._subscribeLayoutChild(child);
    this._requestAutoLayout();
    return this;
  }
  removeChild(child) {
    this._unsubscribeLayoutChild(child);
    super.removeChild(child);
    this._requestAutoLayout();
    return this;
  }
  computeLocalBBox() {
    let box = this._size.get() ? BBox.fromPosSize(0, 0, this._size.get().x, this._size.get().y) : BBox.empty();
    for (const child of this.children) {
      const childLocal = child.computeLocalBBox();
      if (childLocal.isEmpty()) continue;
      const lt = child.getLocalTransform();
      const corners = [
        childLocal.topLeft,
        childLocal.topRight,
        childLocal.bottomLeft,
        childLocal.bottomRight
      ];
      const transformed = corners.map((c) => lt.transformPoint(c));
      box = box.union(BBox.fromPoints(transformed));
    }
    return box;
  }
  _computeLocalBounds(kind) {
    if (kind === "layout") {
      return this.computeLocalBBox();
    }
    let box = BBox.empty();
    for (const child of this.children) {
      const childLocal = child._computeLocalBounds(kind);
      if (childLocal.isEmpty()) continue;
      const lt = child.getLocalTransform();
      const corners = [
        childLocal.topLeft,
        childLocal.topRight,
        childLocal.bottomLeft,
        childLocal.bottomRight
      ];
      const transformed = corners.map((c) => lt.transformPoint(c));
      box = box.union(BBox.fromPoints(transformed));
    }
    return box;
  }
  getShapeGeometry() {
    return { type: "rect", bbox: this.computeLocalBBox() };
  }
  size(sizeOrW, h) {
    const specs = Array.isArray(sizeOrW) ? parseUnitSize(sizeOrW, "group size.width", "group size.height") : parseUnitSize([sizeOrW, h ?? sizeOrW], "group size.width", "group size.height");
    this._sizeSpec = specs;
    this._resolveSizeFromSpec();
    this._refreshRelativeUnitTracking();
    return this;
  }
  coords(config) {
    this._coords = config;
    return this;
  }
  project(mode, opts = {}) {
    if (mode === "isometric") {
      const angleRad = (opts.angle ?? 30) * Math.PI / 180;
      this._projection = {
        mode,
        angleRad,
        scale: opts.scale ?? 20
      };
    }
    return this;
  }
  rect(pos, size) {
    const node = new Rect(Vec2.zero(), new Vec2(0, 0));
    this.addChild(node);
    node.pos(this._resolveFactoryPoint(pos));
    node.size(size);
    return node;
  }
  circle(centerOrRadius, radius) {
    if (typeof centerOrRadius === "number" || typeof centerOrRadius === "string") {
      const node2 = new Circle(Vec2.zero(), 0);
      this.addChild(node2);
      node2.setRadius(centerOrRadius);
      return node2;
    }
    const node = new Circle(Vec2.zero(), 0);
    this.addChild(node);
    node.pos(this._resolveFactoryPoint(centerOrRadius));
    node.setRadius(radius);
    return node;
  }
  text(content, pos) {
    const node = new Text(content, Vec2.zero());
    this.addChild(node);
    if (pos) {
      node.pos(this._resolveFactoryPoint(pos));
    }
    return node;
  }
  tex(expression, pos, opts = {}) {
    const node = new Text(expression, Vec2.zero()).latex(expression, opts);
    this.addChild(node);
    if (pos) {
      node.pos(this._resolveFactoryPoint(pos));
    }
    return node;
  }
  path(pos) {
    const node = new Path(Vec2.zero());
    this.addChild(node);
    if (pos) {
      node.pos(this._resolveFactoryPoint(pos));
    }
    return node;
  }
  line(from, to) {
    const node = new Line(Vec2.zero(), Vec2.zero());
    this.addChild(node);
    node.from(this._resolveFactoryPoint(from));
    node.to(this._resolveFactoryPoint(to));
    return node;
  }
  /**
   * Create a reactive connector between two nodes.
   * Endpoints auto-update when either node moves/resizes.
   */
  connect(from, to, opts = {}) {
    const node = new Line(Vec2.zero(), Vec2.zero());
    this.addChild(node);
    node.connect(from, to, opts);
    return node;
  }
  edge(from, to, opts = {}) {
    const node = this.connect(from, to, opts);
    if (opts.route) {
      node.route(opts.route, opts.routeOptions ?? {});
    }
    if (opts.color !== void 0 || opts.width !== void 0) {
      node.stroke(opts.color ?? "#111827", opts.width ?? 1.6);
    }
    if (opts.dash) {
      node.dashed(opts.dash);
    }
    return node;
  }
  group() {
    const g = new _Group();
    this.addChild(g);
    return g;
  }
  container(opts = {}) {
    return this.batch(() => {
      const container = new _Group();
      this.addChild(container);
      if (opts.at) {
        container.pos(this._resolveFactoryPoint(opts.at));
      }
      container.size(opts.size ?? [320, 200]);
      const containerSize = container._size.get();
      if (!containerSize) {
        throw new Error("Zeta: container size is unresolved. Set explicit numeric size or a resolvable % size.");
      }
      const width = containerSize.x;
      const height = containerSize.y;
      const [padX, padY] = this._normalizePadding(opts.padding ?? 16);
      const frame = new Rect(Vec2.zero(), new Vec2(width, height)).radius(opts.radius ?? 16).fill(opts.fill ?? "rgba(255,255,255,0.02)").stroke(opts.stroke ?? "rgba(255,255,255,0.1)", opts.strokeWidth ?? 1);
      container.addChild(frame);
      const title = opts.title?.trim() ? opts.title.trim() : "";
      const titleFontSize = opts.titleFontSize ?? 13;
      const contentOffsetSpec = parseUnitPoint(
        opts.contentOffset ?? [padX, padY + (title ? titleFontSize + 10 : 0)],
        "container contentOffset.x",
        "container contentOffset.y"
      );
      const containerRef = { width, height };
      const contentOffset = [
        resolveUnitSpec(contentOffsetSpec[0], "x", containerRef, "container contentOffset.x"),
        resolveUnitSpec(contentOffsetSpec[1], "y", containerRef, "container contentOffset.y")
      ];
      let titleNode = null;
      if (title) {
        titleNode = new Text(title, new Vec2(padX, padY + titleFontSize)).fill(opts.titleColor ?? "#9fb6ff").fontSize(titleFontSize).fontFamily(opts.titleFontFamily ?? "'IBM Plex Sans', 'Inter', sans-serif");
        container.addChild(titleNode);
      }
      const content = new _Group(new Vec2(0, 0));
      content.pos(contentOffset);
      content.size([
        Math.max(0, width - contentOffset[0] - padX),
        Math.max(0, height - contentOffset[1] - padY)
      ]);
      container.addChild(content);
      Object.defineProperties(container, {
        frame: { value: frame, enumerable: true },
        content: { value: content, enumerable: true },
        titleNode: { value: titleNode, enumerable: true }
      });
      return container;
    });
  }
  row(childrenOrOpts = {}, opts = {}) {
    const children = Array.isArray(childrenOrOpts) ? childrenOrOpts : [];
    const resolvedOpts = (Array.isArray(childrenOrOpts) ? opts : childrenOrOpts) ?? {};
    const g = new _Group()._setLayoutConfig({
      mode: "row",
      gap: parseUnitValue(resolvedOpts.gap ?? 0, "row gap"),
      align: resolvedOpts.align ?? "center"
    });
    this.addChild(g);
    if (children.length > 0) {
      g.add(...children);
    }
    return g;
  }
  column(childrenOrOpts = {}, opts = {}) {
    const children = Array.isArray(childrenOrOpts) ? childrenOrOpts : [];
    const resolvedOpts = (Array.isArray(childrenOrOpts) ? opts : childrenOrOpts) ?? {};
    const g = new _Group()._setLayoutConfig({
      mode: "column",
      gap: parseUnitValue(resolvedOpts.gap ?? 0, "column gap"),
      align: resolvedOpts.align ?? "center"
    });
    this.addChild(g);
    if (children.length > 0) {
      g.add(...children);
    }
    return g;
  }
  grid(childrenOrOpts = {}, opts = {}) {
    const children = Array.isArray(childrenOrOpts) ? childrenOrOpts : [];
    const resolvedOpts = (Array.isArray(childrenOrOpts) ? opts : childrenOrOpts) ?? {};
    const [gapX, gapY] = this._normalizeGap(resolvedOpts.gap);
    const g = new _Group()._setLayoutConfig({
      mode: "grid",
      columns: resolvedOpts.columns !== void 0 ? Math.max(1, Math.floor(resolvedOpts.columns)) : null,
      rows: resolvedOpts.rows !== void 0 ? Math.max(1, Math.floor(resolvedOpts.rows)) : null,
      gapX,
      gapY,
      alignX: resolvedOpts.alignX ?? "center",
      alignY: resolvedOpts.alignY ?? "center"
    });
    this.addChild(g);
    if (children.length > 0) {
      g.add(...children);
    }
    return g;
  }
  stack(childrenOrOpts = {}, opts = {}) {
    const children = Array.isArray(childrenOrOpts) ? childrenOrOpts : [];
    const resolvedOpts = (Array.isArray(childrenOrOpts) ? opts : childrenOrOpts) ?? {};
    const g = new _Group()._setLayoutConfig({
      mode: "stack",
      align: resolvedOpts.align ?? "center",
      offset: parseUnitPoint(resolvedOpts.offset ?? [0, 0], "stack offset.x", "stack offset.y")
    });
    this.addChild(g);
    if (children.length > 0) {
      g.add(...children);
    }
    return g;
  }
  node(label, opts = {}) {
    return this.batch(() => {
      const container = new _Group();
      this.addChild(container);
      if (opts.at) {
        container.pos(this._resolveFactoryPoint(opts.at));
      }
      const fontSize = opts.fontSize ?? 13;
      const [padX, padY] = this._normalizePadding(opts.padding);
      const subtitle = opts.subtitle?.trim() ? opts.subtitle.trim() : null;
      const subtitleFontSize = opts.subtitleFontSize ?? Math.max(10, fontSize - 2);
      const approxTextWidth = label.length * fontSize * 0.6;
      const approxSubWidth = subtitle ? subtitle.length * subtitleFontSize * 0.58 : 0;
      const contentWidth = Math.max(approxTextWidth, approxSubWidth);
      const approxTextHeight = subtitle ? fontSize * 1.2 + subtitleFontSize * 1.2 + 4 : fontSize * 1.2;
      const minSizeSpec = opts.minSize ? parseUnitSize(opts.minSize, "node minSize.width", "node minSize.height") : null;
      const minWidth = minSizeSpec ? this._resolveChildRelativeUnit(minSizeSpec[0], "x", "node minSize.width") : 0;
      const minHeight = minSizeSpec ? this._resolveChildRelativeUnit(minSizeSpec[1], "y", "node minSize.height") : 0;
      const sizeSpec = opts.size ? parseUnitSize(opts.size, "node size.width", "node size.height") : null;
      const width = sizeSpec ? this._resolveChildRelativeUnit(sizeSpec[0], "x", "node size.width") : Math.max(minWidth, contentWidth + padX * 2);
      const height = sizeSpec ? this._resolveChildRelativeUnit(sizeSpec[1], "y", "node size.height") : Math.max(minHeight, approxTextHeight + padY * 2);
      const frame = new Rect(Vec2.zero(), new Vec2(width, height)).radius(opts.radius ?? 8).fill(opts.fill ?? "#fff").stroke(opts.stroke ?? "#111827", opts.strokeWidth ?? 1.5);
      const textX = (width - approxTextWidth) / 2;
      const baselineY = subtitle ? height / 2 - subtitleFontSize * 0.7 + fontSize * 0.2 : height / 2 + fontSize * 0.6;
      const caption = new Text(label, new Vec2(textX, baselineY)).fill(opts.textColor ?? "#111827").fontSize(fontSize);
      if (opts.fontFamily) {
        caption.fontFamily(opts.fontFamily);
      }
      container.add(frame, caption);
      if (subtitle) {
        const subX = (width - approxSubWidth) / 2;
        const subY = height / 2 + subtitleFontSize * 0.95;
        const sub = new Text(subtitle, new Vec2(subX, subY)).fill(opts.subtitleColor ?? "#6b7280").fontSize(subtitleFontSize);
        if (opts.fontFamily) {
          sub.fontFamily(opts.fontFamily);
        }
        container.add(sub);
      }
      if (opts.ports && opts.ports.length > 0) {
        const defaultPortRadius = opts.portRadius ?? 4;
        const defaultPortColor = opts.portColor ?? "#ffffff";
        const strokeColor = opts.stroke ?? "#111827";
        opts.ports.forEach((port, idx) => {
          const spec = typeof port === "string" ? { side: idx % 2 === 0 ? "left" : "right" } : port;
          const side = spec.side ?? "left";
          const radius = spec.radius ?? defaultPortRadius;
          const portNode = new Circle(Vec2.zero(), radius).fill(spec.color ?? defaultPortColor).stroke(strokeColor, 1.2);
          const offset = spec.offset ?? 0;
          const anchor = this._portSideToAnchor(side);
          const pinOffset = side === "left" || side === "right" ? [0, this._resolveChildRelativeValue(offset, "y", "node port offset")] : [this._resolveChildRelativeValue(offset, "x", "node port offset"), 0];
          portNode.pin(frame, anchor, { offset: pinOffset });
          container.add(portNode);
        });
      }
      return container;
    });
  }
  axes(opts = {}) {
    return this.batch(() => {
      const size = this._size.get() ?? this.computeLocalBBox().size;
      if (size.x <= 0 || size.y <= 0) return this;
      const color = opts.color ?? "#666";
      const labelColor = opts.labelColor ?? "#777";
      const tickCount = Math.max(2, opts.tickCount ?? 5);
      const fontSize = opts.fontSize ?? 11;
      const axisY = size.y;
      const axisX = 0;
      const xAxis = new Line(new Vec2(0, axisY), new Vec2(size.x, axisY)).stroke(color, 1);
      const yAxis = new Line(new Vec2(axisX, 0), new Vec2(axisX, size.y)).stroke(color, 1);
      this.addChild(xAxis);
      this.addChild(yAxis);
      const xTicks = this._axisTicks(this._coords?.x, tickCount);
      for (const tick of xTicks) {
        const x = this._coords ? this._mapAxisValue(tick, this._coords.x, 0, size.x, false) : (tick - xTicks[0]) / (xTicks[xTicks.length - 1] - xTicks[0] || 1) * size.x;
        const t = new Line(new Vec2(x, axisY), new Vec2(x, axisY + 5)).stroke(color, 1);
        this.addChild(t);
        if (opts.grid && x > 0 && x < size.x) {
          const g = new Line(new Vec2(x, 0), new Vec2(x, size.y)).stroke("#d8d8d8", 1);
          this.addChild(g);
        }
        const label = new Text(this._formatTick(tick), new Vec2(x - 8, axisY + 18)).fill(labelColor).fontSize(fontSize);
        this.addChild(label);
      }
      const yTicks = this._axisTicks(this._coords?.y, tickCount);
      for (const tick of yTicks) {
        const y = this._coords ? this._mapAxisValue(tick, this._coords.y, 0, size.y, true) : size.y - (tick - yTicks[0]) / (yTicks[yTicks.length - 1] - yTicks[0] || 1) * size.y;
        const t = new Line(new Vec2(axisX - 5, y), new Vec2(axisX, y)).stroke(color, 1);
        this.addChild(t);
        if (opts.grid && y > 0 && y < size.y) {
          const g = new Line(new Vec2(0, y), new Vec2(size.x, y)).stroke("#d8d8d8", 1);
          this.addChild(g);
        }
        const label = new Text(this._formatTick(tick), new Vec2(axisX - 36, y + 4)).fill(labelColor).fontSize(fontSize);
        this.addChild(label);
      }
      if (opts.xLabel) {
        const label = new Text(opts.xLabel, new Vec2(size.x / 2 - opts.xLabel.length * 3, size.y + 34)).fill(labelColor).fontSize(fontSize + 1);
        this.addChild(label);
      }
      if (opts.yLabel) {
        const label = new Text(opts.yLabel, new Vec2(-56, size.y / 2 + opts.yLabel.length * 3)).fill(labelColor).fontSize(fontSize + 1).rotateTo(-Math.PI / 2);
        this.addChild(label);
      }
      return this;
    });
  }
  func(fn, opts = {}) {
    const samples = Math.max(2, opts.samples ?? 128);
    const domain = opts.xDomain ?? this._coords?.x.domain ?? [0, this._size.get()?.x ?? 1];
    const [x0, x1] = domain;
    const path = new Path();
    let hasOpen = false;
    for (let i = 0; i < samples; i++) {
      const t = i / (samples - 1);
      const x = x0 + (x1 - x0) * t;
      const y = fn(x);
      if (!Number.isFinite(y)) {
        hasOpen = false;
        continue;
      }
      const p = this._mapPoint([x, y]);
      if (!hasOpen) {
        path.moveTo(p.x, p.y);
        hasOpen = true;
      } else {
        path.lineTo(p.x, p.y);
      }
    }
    this.addChild(path);
    return path;
  }
  /** Add one or more children. */
  add(...nodes) {
    this.batch(() => {
      for (const node of nodes) {
        this.addChild(node);
      }
    });
    return this;
  }
  _setLayoutConfig(config) {
    this._layoutConfig = config;
    this._syncLayoutSubscriptions();
    this._requestAutoLayout();
    return this;
  }
  _normalizeGap(gap) {
    if (Array.isArray(gap)) {
      return parseUnitPoint(
        [gap[0] ?? 0, gap[1] ?? 0],
        "grid gap.x",
        "grid gap.y"
      );
    }
    const g = gap ?? 0;
    return [
      parseUnitValue(g, "grid gap.x"),
      parseUnitValue(g, "grid gap.y")
    ];
  }
  _normalizePadding(padding) {
    if (Array.isArray(padding)) {
      return [Math.max(0, padding[0] ?? 0), Math.max(0, padding[1] ?? 0)];
    }
    const p = Math.max(0, padding ?? 14);
    return [p, p];
  }
  _resolveChildRelativeUnit(spec, axis, context) {
    return resolveUnitSpec(spec, axis, this._getUnitReferenceSizeForChildren(), context);
  }
  _resolveChildRelativeValue(value, axis, context) {
    return this._resolveChildRelativeUnit(parseUnitValue(value, context), axis, context);
  }
  _resolveFactoryPoint(point) {
    if (point.length === 3) {
      const mapped2 = this._mapPoint(point);
      return [mapped2.x, mapped2.y];
    }
    const x = point[0];
    const y = point[1];
    if (typeof x === "string" || typeof y === "string") {
      return [x, y];
    }
    const mapped = this._mapPoint([x, y]);
    return [mapped.x, mapped.y];
  }
  _portSideToAnchor(side) {
    switch (side) {
      case "left":
        return "left";
      case "right":
        return "right";
      case "top":
        return "top";
      case "bottom":
        return "bottom";
    }
  }
  _subscribeLayoutChild(child) {
    if (!this._layoutConfig) return;
    if (this._layoutSubscriptions.has(child)) return;
    const unsubscribe = child.watchLayout(() => {
      if (this._isApplyingLayout) return;
      this._requestAutoLayout();
    });
    this._layoutSubscriptions.set(child, unsubscribe);
  }
  _unsubscribeLayoutChild(child) {
    const unsubscribe = this._layoutSubscriptions.get(child);
    if (!unsubscribe) return;
    unsubscribe();
    this._layoutSubscriptions.delete(child);
  }
  _syncLayoutSubscriptions() {
    if (!this._layoutConfig) {
      for (const unsubscribe of this._layoutSubscriptions.values()) {
        unsubscribe();
      }
      this._layoutSubscriptions.clear();
      return;
    }
    for (const [child, unsubscribe] of [...this._layoutSubscriptions.entries()]) {
      if (!this.children.includes(child)) {
        unsubscribe();
        this._layoutSubscriptions.delete(child);
      }
    }
    for (const child of this.children) {
      this._subscribeLayoutChild(child);
    }
  }
  _requestAutoLayout() {
    if (!this._layoutConfig) return;
    if (this._layoutQueued) return;
    this._layoutQueued = true;
    queueMutationEffect(() => {
      this._layoutQueued = false;
      this._applyAutoLayout();
    }, "high");
    if (!isBatchingSceneMutations()) {
      flushMutationEffects();
    }
  }
  _applyAutoLayout() {
    if (!this._layoutConfig) return;
    if (this._isApplyingLayout) return;
    if (this.children.length === 0) return;
    if (this._layoutNeedsExplicitSize(this._layoutConfig) && !this._size.get()) {
      throw new Error(
        "Zeta: Layout uses percentage gap/offset but this layout group has no explicit size. Set group.size(...) or use pixel units."
      );
    }
    this._isApplyingLayout = true;
    try {
      switch (this._layoutConfig.mode) {
        case "row":
          this._applyRowLayout(
            this._resolveLayoutUnit(this._layoutConfig.gap, "x", "row gap"),
            this._layoutConfig.align
          );
          break;
        case "column":
          this._applyColumnLayout(
            this._resolveLayoutUnit(this._layoutConfig.gap, "y", "column gap"),
            this._layoutConfig.align
          );
          break;
        case "grid":
          this._applyGridLayout({
            ...this._layoutConfig,
            gapX: this._resolveLayoutUnit(this._layoutConfig.gapX, "x", "grid gap.x"),
            gapY: this._resolveLayoutUnit(this._layoutConfig.gapY, "y", "grid gap.y")
          });
          break;
        case "stack":
          this._applyStackLayout(
            this._layoutConfig.align,
            new Vec2(
              this._resolveLayoutUnit(this._layoutConfig.offset[0], "x", "stack offset.x"),
              this._resolveLayoutUnit(this._layoutConfig.offset[1], "y", "stack offset.y")
            )
          );
          break;
      }
    } finally {
      this._isApplyingLayout = false;
    }
  }
  _collectLayoutMetrics() {
    const metrics = [];
    for (const child of this.children) {
      const raw = child.computeLocalBBox();
      const bbox = raw.isEmpty() ? BBox.fromPosSize(0, 0, 0, 0) : raw;
      metrics.push({
        node: child,
        bbox,
        width: bbox.width,
        height: bbox.height
      });
    }
    return metrics;
  }
  _applyRowLayout(gap, align) {
    const metrics = this._collectLayoutMetrics();
    const rowHeight = metrics.reduce((max, m) => Math.max(max, m.height), 0);
    let cursorX = 0;
    for (const metric of metrics) {
      const minY = this._alignOffsetY(align, rowHeight, metric.height);
      metric.node.pos(cursorX - metric.bbox.minX, minY - metric.bbox.minY);
      cursorX += metric.width + gap;
    }
  }
  _applyColumnLayout(gap, align) {
    const metrics = this._collectLayoutMetrics();
    const colWidth = metrics.reduce((max, m) => Math.max(max, m.width), 0);
    let cursorY = 0;
    for (const metric of metrics) {
      const minX = this._alignOffsetX(align, colWidth, metric.width);
      metric.node.pos(minX - metric.bbox.minX, cursorY - metric.bbox.minY);
      cursorY += metric.height + gap;
    }
  }
  _applyGridLayout(config) {
    const metrics = this._collectLayoutMetrics();
    const { columns, rows } = this._resolveGridDimensions(metrics.length, config.columns, config.rows);
    const colWidths = new Array(columns).fill(0);
    const rowHeights = new Array(rows).fill(0);
    for (let i = 0; i < metrics.length; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const metric = metrics[i];
      if (row >= rows) break;
      colWidths[col] = Math.max(colWidths[col], metric.width);
      rowHeights[row] = Math.max(rowHeights[row], metric.height);
    }
    const colOffsets = new Array(columns).fill(0);
    const rowOffsets = new Array(rows).fill(0);
    for (let col = 1; col < columns; col++) {
      colOffsets[col] = colOffsets[col - 1] + colWidths[col - 1] + config.gapX;
    }
    for (let row = 1; row < rows; row++) {
      rowOffsets[row] = rowOffsets[row - 1] + rowHeights[row - 1] + config.gapY;
    }
    for (let i = 0; i < metrics.length; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      if (row >= rows) break;
      const metric = metrics[i];
      const minX = colOffsets[col] + this._alignOffsetX(config.alignX, colWidths[col], metric.width);
      const minY = rowOffsets[row] + this._alignOffsetY(config.alignY, rowHeights[row], metric.height);
      metric.node.pos(minX - metric.bbox.minX, minY - metric.bbox.minY);
    }
  }
  _applyStackLayout(align, offset) {
    const metrics = this._collectLayoutMetrics();
    const width = metrics.reduce((max, m) => Math.max(max, m.width), 0);
    const height = metrics.reduce((max, m) => Math.max(max, m.height), 0);
    const horizontal = align === "left" || align === "topLeft" || align === "bottomLeft" ? "left" : align === "right" || align === "topRight" || align === "bottomRight" ? "right" : "center";
    const vertical = align === "top" || align === "topLeft" || align === "topRight" ? "top" : align === "bottom" || align === "bottomLeft" || align === "bottomRight" ? "bottom" : "center";
    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];
      const minX = this._alignOffsetX(horizontal, width, metric.width) + offset.x * i;
      const minY = this._alignOffsetY(vertical, height, metric.height) + offset.y * i;
      metric.node.pos(minX - metric.bbox.minX, minY - metric.bbox.minY);
    }
  }
  _layoutNeedsExplicitSize(config) {
    switch (config.mode) {
      case "row":
      case "column":
        return isRelativeUnit(config.gap);
      case "grid":
        return isRelativeUnit(config.gapX) || isRelativeUnit(config.gapY);
      case "stack":
        return hasRelativeUnits(config.offset);
    }
  }
  _resolveLayoutUnit(spec, axis, context) {
    const current = this._size.get();
    const reference = current ? { width: current.x, height: current.y } : null;
    return resolveUnitSpec(spec, axis, reference, context);
  }
  _alignOffsetX(align, container, item) {
    if (align === "left") return 0;
    if (align === "right") return container - item;
    return (container - item) / 2;
  }
  _alignOffsetY(align, container, item) {
    if (align === "top") return 0;
    if (align === "bottom") return container - item;
    return (container - item) / 2;
  }
  _resolveGridDimensions(count, columns, rows) {
    if (count <= 0) return { columns: 1, rows: 1 };
    const resolvedColumns = columns ?? (rows ? Math.ceil(count / rows) : Math.ceil(Math.sqrt(count)));
    const cols = Math.max(1, Math.floor(resolvedColumns));
    const resolvedRows = rows ?? Math.ceil(count / cols);
    const neededRows = Math.ceil(count / cols);
    return {
      columns: cols,
      rows: Math.max(1, Math.floor(Math.max(resolvedRows, neededRows)))
    };
  }
  _mapPoint(point) {
    const mapped = this._mapCoords(point);
    return this._applyProjection(mapped);
  }
  _mapCoords(point) {
    const x = point[0];
    const y = point[1];
    const z = point[2] ?? 0;
    if (!this._coords) return [x, y, z];
    const size = this._size.get() ?? new Vec2(1, 1);
    const sx = this._mapAxisValue(x, this._coords.x, 0, size.x, false);
    const sy = this._mapAxisValue(y, this._coords.y, 0, size.y, true);
    return [sx, sy, z];
  }
  _applyProjection(point) {
    const [x, y, z] = point;
    if (!this._projection) {
      return new Vec2(x, y);
    }
    if (this._projection.mode === "isometric") {
      const cos = Math.cos(this._projection.angleRad);
      const sin = Math.sin(this._projection.angleRad);
      const s = this._projection.scale;
      const px = (x - y) * cos * s;
      const py = (x + y) * sin * s - z * s;
      return new Vec2(px, py);
    }
    return new Vec2(x, y);
  }
  _mapAxisValue(value, axis, rangeMin, rangeMax, invert) {
    const [d0, d1] = axis.domain;
    const type = axis.type ?? "linear";
    const t = type === "log" ? this._mapLog(value, d0, d1) : (value - d0) / (d1 - d0 || 1);
    const clampedT = Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0;
    const interpT = invert ? 1 - clampedT : clampedT;
    return rangeMin + (rangeMax - rangeMin) * interpT;
  }
  _mapLog(value, d0, d1) {
    const min = Math.max(d0, 1e-9);
    const max = Math.max(d1, min + 1e-9);
    const v = Math.max(value, min);
    const logMin = Math.log(min);
    const logMax = Math.log(max);
    return (Math.log(v) - logMin) / (logMax - logMin || 1);
  }
  _axisTicks(axis, tickCount) {
    if (!axis) {
      const out2 = [];
      for (let i = 0; i < tickCount; i++) out2.push(i);
      return out2;
    }
    if ((axis.type ?? "linear") === "log") {
      const min = Math.max(axis.domain[0], 1e-9);
      const max = Math.max(axis.domain[1], min);
      const startPow = Math.ceil(Math.log10(min));
      const endPow = Math.floor(Math.log10(max));
      const out2 = [];
      for (let p = startPow; p <= endPow; p++) {
        out2.push(10 ** p);
      }
      if (out2.length >= 2) return out2;
    }
    const [d0, d1] = axis.domain;
    const out = [];
    for (let i = 0; i < tickCount; i++) {
      const t = i / (tickCount - 1);
      out.push(d0 + (d1 - d0) * t);
    }
    return out;
  }
  _formatTick(value) {
    const abs = Math.abs(value);
    if (abs >= 1e4 || abs > 0 && abs < 1e-3) {
      return value.toExponential(1);
    }
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(2).replace(/\.?0+$/, "");
  }
};

// src/core/scene.ts
var Scene = class extends Group {
  constructor() {
    super();
    this.type = "scene";
    this._renderer = null;
    this._rafId = null;
    this._needsRender = true;
    this._setDirtyCallback(() => this._scheduleRender());
  }
  setRenderer(renderer) {
    this._renderer = renderer;
    this._scheduleRender();
  }
  getRenderer() {
    return this._renderer;
  }
  /** Force a synchronous render. */
  render() {
    if (!this._renderer) return;
    this.measure();
    this._renderer.clear();
    this._renderer.renderNode(this);
    this._needsRender = false;
  }
  /**
   * Force synchronous layout/constraint settlement without rendering.
   */
  measure() {
    flushMutationEffects();
    return this;
  }
  /**
   * Alias for `measure()`; useful when emphasizing explicit layout flushes.
   */
  flushLayout() {
    return this.measure();
  }
  /**
   * Subscribe to post-layout snapshots.
   * The callback runs once immediately and after each subsequent layout change.
   */
  afterLayout(fn) {
    const run = () => {
      this.measure();
      fn(this);
    };
    const unsubscribe = this.watchLayout(run);
    run();
    return unsubscribe;
  }
  /**
   * Execute a callback against a settled layout snapshot.
   */
  withLayoutSnapshot(fn) {
    this.measure();
    return fn(this);
  }
  /**
   * Attach an optional constraint tracing hook for runtime layout diagnostics.
   */
  setConstraintTrace(fn) {
    setConstraintTraceHook(fn);
    return this;
  }
  /**
   * Attach a beginner-friendly narrative trace hook.
   */
  setConstraintTraceExplainer(fn) {
    if (!fn) {
      return this.setConstraintTrace(null);
    }
    return this.setConstraintTrace((event) => {
      fn(explainConstraintTrace(event), event);
    });
  }
  /** Mark scene as needing re-render on next frame. */
  _scheduleRender() {
    if (this._needsRender) return;
    this._needsRender = true;
    if (typeof requestAnimationFrame !== "undefined") {
      if (this._rafId !== null) cancelAnimationFrame(this._rafId);
      this._rafId = requestAnimationFrame(() => {
        this._rafId = null;
        if (this._needsRender) {
          this.render();
        }
      });
    }
  }
  /** Force an immediate synchronous render (useful for tests / SSR). */
  flush() {
    if (this._rafId !== null && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this.measure();
    if (this._needsRender) {
      this.render();
    }
  }
  dispose() {
    if (this._rafId !== null && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(this._rafId);
    }
    this._renderer = null;
    this._setDirtyCallback(null);
  }
};

// src/renderers/canvas2d.ts
var Canvas2DRenderer = class {
  constructor(width, height, existingCanvas) {
    if (existingCanvas) {
      this.canvas = existingCanvas;
    } else {
      this.canvas = document.createElement("canvas");
    }
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get Canvas2D context");
    ctx.scale(dpr, dpr);
    this.ctx = ctx;
  }
  getElement() {
    return this.canvas;
  }
  clear() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }
  resize(width, height) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  renderNode(node) {
    if (!node._visible.get()) return;
    const ctx = this.ctx;
    ctx.save();
    const m = node.getLocalTransform().m;
    ctx.transform(m[0], m[1], m[3], m[4], m[6], m[7]);
    const opacity = node.style._opacity.get();
    if (opacity < 1) {
      ctx.globalAlpha *= opacity;
    }
    if (!node.isLayoutOnly()) {
      switch (node.type) {
        case "rect":
          this._renderRect(ctx, node);
          break;
        case "circle":
          this._renderCircle(ctx, node);
          break;
        case "path":
          this._renderPath(ctx, node);
          break;
        case "text":
          this._renderText(ctx, node);
          break;
        case "line":
          this._renderLine(ctx, node);
          break;
      }
    }
    this._renderBoundsOverlay(ctx, node);
    for (const child of node.children) {
      this.renderNode(child);
    }
    ctx.restore();
    node.clearRenderDirty();
  }
  _renderBoundsOverlay(ctx, node) {
    const kinds = node._getShownBoundsKinds();
    if (kinds.length === 0) return;
    for (const kind of kinds) {
      const box = node.getBounds({ space: "local", kind });
      if (box.isEmpty()) continue;
      const style = this._boundsOverlayStyle(kind);
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash(style.dash);
      ctx.strokeStyle = style.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(box.minX, box.minY, box.width, box.height);
      ctx.restore();
    }
  }
  _boundsOverlayStyle(kind) {
    if (kind === "layout") return { color: "#3b82f6", dash: [6, 3] };
    if (kind === "visual") return { color: "#10b981", dash: [4, 3] };
    return { color: "#f59e0b", dash: [2, 2] };
  }
  _applyStroke(ctx, node) {
    const stroke = node.style._stroke.get();
    const dash = node.style._dashPattern.get();
    if (stroke) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      if (dash) {
        ctx.setLineDash(dash);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
    }
  }
  _renderRect(ctx, rect) {
    const s = rect.getSize();
    const r = rect.getCornerRadius();
    const fill = rect.style._fill.get();
    if (r > 0) {
      ctx.beginPath();
      ctx.roundRect(0, 0, s.x, s.y, r);
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      this._applyStroke(ctx, rect);
    } else {
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fillRect(0, 0, s.x, s.y);
      }
      const stroke = rect.style._stroke.get();
      if (stroke) {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        const dash = rect.style._dashPattern.get();
        ctx.setLineDash(dash ?? []);
        ctx.strokeRect(0, 0, s.x, s.y);
      }
    }
  }
  _renderCircle(ctx, circle) {
    const r = circle.getRadius();
    const fill = circle.style._fill.get();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    this._applyStroke(ctx, circle);
  }
  _renderPath(ctx, path) {
    const p2d = path.toPath2D();
    const fill = path.style._fill.get();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill(p2d);
    }
    const stroke = path.style._stroke.get();
    if (stroke) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      const dash = path.style._dashPattern.get();
      ctx.setLineDash(dash ?? []);
      ctx.stroke(p2d);
    }
  }
  _renderText(ctx, text) {
    const content = text.getRenderedContent();
    const fill = text.style._fill.get();
    ctx.font = text.getFont();
    text.measureWithContext(ctx);
    ctx.textAlign = text._textAlign.get();
    ctx.textBaseline = text._textBaseline.get();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillText(content, 0, 0);
    }
    const stroke = text.style._stroke.get();
    if (stroke) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.strokeText(content, 0, 0);
    }
  }
  _renderLine(ctx, line) {
    const points = line.getRoutePoints();
    const radius = line.getRouteRadius();
    if (points.length < 2) return;
    ctx.beginPath();
    if (radius > 0 && points.length > 2) {
      this._traceRoundedPolyline(ctx, points, radius);
    } else {
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
    }
    this._applyStroke(ctx, line);
  }
  _traceRoundedPolyline(ctx, points, radius) {
    const first = points[0];
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      const next = points[i + 1];
      const inX = cur.x - prev.x;
      const inY = cur.y - prev.y;
      const outX = next.x - cur.x;
      const outY = next.y - cur.y;
      const inLen = Math.hypot(inX, inY);
      const outLen = Math.hypot(outX, outY);
      if (inLen === 0 || outLen === 0) {
        continue;
      }
      const r = Math.min(radius, inLen / 2, outLen / 2);
      const inUnitX = inX / inLen;
      const inUnitY = inY / inLen;
      const outUnitX = outX / outLen;
      const outUnitY = outY / outLen;
      const cornerStartX = cur.x - inUnitX * r;
      const cornerStartY = cur.y - inUnitY * r;
      const cornerEndX = cur.x + outUnitX * r;
      const cornerEndY = cur.y + outUnitY * r;
      ctx.lineTo(cornerStartX, cornerStartY);
      ctx.quadraticCurveTo(cur.x, cur.y, cornerEndX, cornerEndY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  }
  dispose() {
  }
};

// src/renderers/svg.ts
var SVG_NS = "http://www.w3.org/2000/svg";
var SVGRenderer = class {
  constructor(width, height) {
    this.nodeElements = /* @__PURE__ */ new Map();
    this.svg = document.createElementNS(SVG_NS, "svg");
    this.svg.setAttribute("width", String(width));
    this.svg.setAttribute("height", String(height));
    this.svg.setAttribute("xmlns", SVG_NS);
    this.svg.style.width = `${width}px`;
    this.svg.style.height = `${height}px`;
  }
  getElement() {
    return this.svg;
  }
  clear() {
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }
    this.nodeElements.clear();
  }
  resize(width, height) {
    this.svg.setAttribute("width", String(width));
    this.svg.setAttribute("height", String(height));
    this.svg.style.width = `${width}px`;
    this.svg.style.height = `${height}px`;
  }
  renderNode(node) {
    const el = this._renderNodeToElement(node);
    if (el) {
      this.svg.appendChild(el);
    }
  }
  _renderNodeToElement(node) {
    if (!node._visible.get()) return null;
    let el;
    const layoutOnly = node.isLayoutOnly();
    switch (node.type) {
      case "rect":
        el = layoutOnly ? document.createElementNS(SVG_NS, "g") : this._createRect(node);
        break;
      case "circle":
        el = layoutOnly ? document.createElementNS(SVG_NS, "g") : this._createCircle(node);
        break;
      case "path":
        el = layoutOnly ? document.createElementNS(SVG_NS, "g") : this._createPath(node);
        break;
      case "text":
        el = layoutOnly ? document.createElementNS(SVG_NS, "g") : this._createText(node);
        break;
      case "line":
        el = layoutOnly ? document.createElementNS(SVG_NS, "g") : this._createLine(node);
        break;
      case "group":
      case "scene":
        el = document.createElementNS(SVG_NS, "g");
        break;
      default:
        return null;
    }
    this._applyTransform(el, node);
    const opacity = node.style._opacity.get();
    if (opacity < 1) {
      el.setAttribute("opacity", String(opacity));
    }
    for (const child of node.children) {
      const childEl = this._renderNodeToElement(child);
      if (childEl) {
        el.appendChild(childEl);
      }
    }
    this._appendBoundsOverlay(el, node);
    this.nodeElements.set(node.id, el);
    node.clearRenderDirty();
    return el;
  }
  _applyTransform(el, node) {
    const m = node.getLocalTransform().m;
    if (m[0] !== 1 || m[1] !== 0 || m[3] !== 0 || m[4] !== 1 || m[6] !== 0 || m[7] !== 0) {
      el.setAttribute("transform", `matrix(${m[0]},${m[1]},${m[3]},${m[4]},${m[6]},${m[7]})`);
    }
  }
  _applyStyle(el, node) {
    const fill = node.style._fill.get();
    el.setAttribute("fill", fill ?? "none");
    const stroke = node.style._stroke.get();
    if (stroke) {
      el.setAttribute("stroke", stroke.color);
      el.setAttribute("stroke-width", String(stroke.width));
    }
    const dash = node.style._dashPattern.get();
    if (dash) {
      el.setAttribute("stroke-dasharray", dash.join(" "));
    }
  }
  _createRect(rect) {
    const el = document.createElementNS(SVG_NS, "rect");
    const s = rect.getSize();
    const r = rect.getCornerRadius();
    el.setAttribute("width", String(s.x));
    el.setAttribute("height", String(s.y));
    if (r > 0) {
      el.setAttribute("rx", String(r));
      el.setAttribute("ry", String(r));
    }
    this._applyStyle(el, rect);
    return el;
  }
  _createCircle(circle) {
    const el = document.createElementNS(SVG_NS, "circle");
    const r = circle.getRadius();
    el.setAttribute("cx", "0");
    el.setAttribute("cy", "0");
    el.setAttribute("r", String(r));
    this._applyStyle(el, circle);
    return el;
  }
  _createPath(path) {
    const el = document.createElementNS(SVG_NS, "path");
    el.setAttribute("d", path.toSVGPath());
    this._applyStyle(el, path);
    return el;
  }
  _createText(text) {
    const el = document.createElementNS(SVG_NS, "text");
    el.textContent = text.getRenderedContent();
    el.setAttribute("font-size", String(text._fontSize.get()));
    el.setAttribute("font-family", text._fontFamily.get());
    const align = text._textAlign.get();
    const anchorMap = { left: "start", center: "middle", right: "end" };
    el.setAttribute("text-anchor", anchorMap[align]);
    const baseline = text._textBaseline.get();
    const baselineMap = {
      top: "text-before-edge",
      middle: "central",
      bottom: "text-after-edge",
      alphabetic: "alphabetic"
    };
    el.setAttribute("dominant-baseline", baselineMap[baseline]);
    if (text.isLatex()) {
      el.setAttribute("data-zeta-text-mode", "latex");
      if (text.isLatexDisplayMode()) {
        el.setAttribute("data-zeta-latex-display", "true");
      }
    }
    this._applyStyle(el, text);
    return el;
  }
  _createLine(line) {
    const points = line.getRoutePoints();
    const radius = line.getRouteRadius();
    const el = points.length === 2 && radius <= 0 ? document.createElementNS(SVG_NS, "line") : document.createElementNS(SVG_NS, "path");
    if (el.tagName.toLowerCase() === "line") {
      const from = points[0];
      const to = points[1];
      el.setAttribute("x1", String(from.x));
      el.setAttribute("y1", String(from.y));
      el.setAttribute("x2", String(to.x));
      el.setAttribute("y2", String(to.y));
    } else {
      el.setAttribute("d", this._buildLinePath(points, radius));
    }
    this._applyStyle(el, line);
    return el;
  }
  _buildLinePath(points, radius) {
    if (points.length === 0) return "";
    if (points.length === 1) return `M${points[0].x} ${points[0].y}`;
    const cmds = [`M${points[0].x} ${points[0].y}`];
    if (radius <= 0 || points.length === 2) {
      for (let i = 1; i < points.length; i++) {
        cmds.push(`L${points[i].x} ${points[i].y}`);
      }
      return cmds.join(" ");
    }
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      const next = points[i + 1];
      const inX = cur.x - prev.x;
      const inY = cur.y - prev.y;
      const outX = next.x - cur.x;
      const outY = next.y - cur.y;
      const inLen = Math.hypot(inX, inY);
      const outLen = Math.hypot(outX, outY);
      if (inLen === 0 || outLen === 0) {
        continue;
      }
      const r = Math.min(radius, inLen / 2, outLen / 2);
      const inUnitX = inX / inLen;
      const inUnitY = inY / inLen;
      const outUnitX = outX / outLen;
      const outUnitY = outY / outLen;
      const cornerStartX = cur.x - inUnitX * r;
      const cornerStartY = cur.y - inUnitY * r;
      const cornerEndX = cur.x + outUnitX * r;
      const cornerEndY = cur.y + outUnitY * r;
      cmds.push(`L${cornerStartX} ${cornerStartY}`);
      cmds.push(`Q${cur.x} ${cur.y} ${cornerEndX} ${cornerEndY}`);
    }
    const last = points[points.length - 1];
    cmds.push(`L${last.x} ${last.y}`);
    return cmds.join(" ");
  }
  _appendBoundsOverlay(el, node) {
    const kinds = node._getShownBoundsKinds();
    if (kinds.length === 0) return;
    for (const kind of kinds) {
      const box = node.getBounds({ space: "local", kind });
      if (box.isEmpty()) continue;
      const style = this._boundsOverlayStyle(kind);
      const rect = document.createElementNS(SVG_NS, "rect");
      rect.setAttribute("x", String(box.minX));
      rect.setAttribute("y", String(box.minY));
      rect.setAttribute("width", String(box.width));
      rect.setAttribute("height", String(box.height));
      rect.setAttribute("fill", "none");
      rect.setAttribute("stroke", style.color);
      rect.setAttribute("stroke-width", "1");
      rect.setAttribute("stroke-dasharray", style.dash.join(" "));
      rect.setAttribute("pointer-events", "none");
      el.appendChild(rect);
    }
  }
  _boundsOverlayStyle(kind) {
    if (kind === "layout") return { color: "#3b82f6", dash: [6, 3] };
    if (kind === "visual") return { color: "#10b981", dash: [4, 3] };
    return { color: "#f59e0b", dash: [2, 2] };
  }
  /** Export the current SVG as a string. */
  export() {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(this.svg);
  }
  dispose() {
    this.clear();
    this.nodeElements.clear();
  }
};

// src/canvas.ts
var BUILTIN_THEMES = {
  diagram: {
    node: {
      fill: "#f8fafc",
      stroke: "#0f172a",
      strokeWidth: 1.5,
      textColor: "#0f172a",
      radius: 10,
      padding: [16, 12],
      subtitleColor: "#475569",
      portColor: "#ffffff"
    },
    edge: {
      route: "orthogonal",
      routeOptions: { radius: 8, avoidObstacles: true },
      color: "#334155",
      width: 1.8
    }
  },
  slate: {
    node: {
      fill: "#1e293b",
      stroke: "#94a3b8",
      strokeWidth: 1.4,
      textColor: "#e2e8f0",
      subtitleColor: "#cbd5e1",
      radius: 10,
      padding: [16, 12]
    },
    edge: {
      route: "orthogonal",
      color: "#cbd5e1",
      width: 1.6
    }
  }
};
var ZCanvas = class {
  constructor(selector, options = {}) {
    this._resizeObserver = null;
    this._hoveredNode = null;
    this._activePointerTargets = /* @__PURE__ */ new Map();
    this._lastPointerPositions = /* @__PURE__ */ new Map();
    this._dragState = null;
    this._theme = {};
    this._onPointerMove = (event) => {
      const point = this._eventWorldPoint(event);
      const delta = this._deltaForPointer(event.pointerId, point);
      if (this._dragState && this._dragState.pointerId === event.pointerId) {
        const parentPoint = this._dragState.parentInverse.transformPoint(point);
        const deltaParent = parentPoint.sub(this._dragState.startPointerParent);
        let next = this._dragState.startPosition.add(deltaParent);
        if (this._dragState.axis === "x") {
          next = new Vec2(next.x, this._dragState.startPosition.y);
        } else if (this._dragState.axis === "y") {
          next = new Vec2(this._dragState.startPosition.x, next.y);
        }
        next = this._clampDragPosition(this._dragState.node, next, this._dragState.bounds);
        this._dragState.node.pos(next.x, next.y);
        this._dispatchPointerEvent("drag", this._dragState.node, event, point, delta);
      }
      const target = this._pickTopNode(point);
      if (target !== this._hoveredNode) {
        if (this._hoveredNode) {
          this._dispatchPointerEvent("pointerleave", this._hoveredNode, event, point, delta);
        }
        if (target) {
          this._dispatchPointerEvent("pointerenter", target, event, point, delta);
        }
        this._hoveredNode = target;
        this._updateCursor(target);
      }
      if (target) {
        this._dispatchPointerEvent("pointermove", target, event, point, delta);
      }
    };
    this._onPointerDown = (event) => {
      const point = this._eventWorldPoint(event);
      this._deltaForPointer(event.pointerId, point);
      const target = this._pickTopNode(point);
      if (!target) return;
      this._activePointerTargets.set(event.pointerId, target);
      this._dispatchPointerEvent("pointerdown", target, event, point, Vec2.zero());
      const dragTarget = this._findDraggableTarget(target);
      if (!dragTarget) return;
      const dragOpts = dragTarget._getDraggableOptions();
      const parentInverse = dragTarget.parent ? dragTarget.parent.getWorldTransform().invert() : Matrix3.identity();
      const startPointerParent = parentInverse.transformPoint(point);
      const startPosition = dragTarget._position.get();
      this._dragState = {
        pointerId: event.pointerId,
        node: dragTarget,
        axis: dragOpts?.axis ?? "both",
        bounds: this._resolveDragBounds(dragTarget, dragOpts),
        parentInverse,
        startPointerParent,
        startPosition
      };
      this._dispatchPointerEvent("dragstart", dragTarget, event, point, Vec2.zero());
      const element = this._renderer.getElement();
      if ("setPointerCapture" in element) {
        try {
          element.setPointerCapture(event.pointerId);
        } catch {
        }
      }
    };
    this._onPointerUp = (event) => {
      const point = this._eventWorldPoint(event);
      const delta = this._deltaForPointer(event.pointerId, point);
      const active = this._activePointerTargets.get(event.pointerId) ?? null;
      if (active) {
        this._dispatchPointerEvent("pointerup", active, event, point, delta);
        const hit = this._pickTopNode(point);
        if (hit === active) {
          this._dispatchPointerEvent("click", active, event, point, delta);
        }
        this._activePointerTargets.delete(event.pointerId);
      }
      if (this._dragState && this._dragState.pointerId === event.pointerId) {
        this._dispatchPointerEvent("dragend", this._dragState.node, event, point, delta);
        this._dragState = null;
      }
      this._lastPointerPositions.delete(event.pointerId);
    };
    this._onPointerCancel = (event) => {
      const point = this._eventWorldPoint(event);
      const delta = this._deltaForPointer(event.pointerId, point);
      const active = this._activePointerTargets.get(event.pointerId) ?? null;
      if (active) {
        this._dispatchPointerEvent("pointerup", active, event, point, delta);
        this._activePointerTargets.delete(event.pointerId);
      }
      if (this._dragState && this._dragState.pointerId === event.pointerId) {
        this._dispatchPointerEvent("dragend", this._dragState.node, event, point, delta);
        this._dragState = null;
      }
      this._lastPointerPositions.delete(event.pointerId);
    };
    this._onPointerLeave = (event) => {
      if (!this._hoveredNode) return;
      const point = this._eventWorldPoint(event);
      const delta = this._deltaForPointer(event.pointerId, point);
      this._dispatchPointerEvent("pointerleave", this._hoveredNode, event, point, delta);
      this._hoveredNode = null;
      this._updateCursor(null);
    };
    const container = typeof selector === "string" ? document.querySelector(selector) : selector;
    if (!container) {
      throw new Error(`Zeta: Container "${selector}" not found`);
    }
    this._container = container;
    const width = options.width ?? (container.clientWidth || 800);
    const height = options.height ?? (container.clientHeight || 600);
    this._size = new Vec2(width, height);
    const rendererType = options.renderer ?? "auto";
    if (rendererType === "svg") {
      this._renderer = new SVGRenderer(width, height);
    } else {
      this._renderer = new Canvas2DRenderer(width, height);
    }
    container.appendChild(this._renderer.getElement());
    this._scene = new Scene();
    this._scene.size([width, height]);
    this._scene.setRenderer(this._renderer);
    this._attachPointerDelegation();
    if (options.responsive) {
      this._resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect;
          this._size = new Vec2(w, h);
          this._renderer.resize(w, h);
          this._scene.size([w, h]);
          this._scene.flush();
        }
      });
      this._resizeObserver.observe(container);
    }
    this._scene.flush();
  }
  // ── Primitive factories ──
  /**
   * Create a rectangle.
   * @param pos - Position as [x, y]
   * @param size - Size as [w, h]
   */
  rect(pos, size) {
    const node = new Rect(Vec2.zero(), new Vec2(0, 0));
    this._scene.addChild(node);
    node.pos(pos);
    node.size(size);
    return node;
  }
  circle(centerOrRadius, radius) {
    if (typeof centerOrRadius === "number" || typeof centerOrRadius === "string") {
      const node2 = new Circle(Vec2.zero(), 0);
      this._scene.addChild(node2);
      node2.setRadius(centerOrRadius);
      return node2;
    }
    const node = new Circle(Vec2.zero(), 0);
    this._scene.addChild(node);
    node.pos(centerOrRadius);
    node.setRadius(radius);
    return node;
  }
  /**
   * Create a text node.
   * @param content - Text string
   * @param pos - Optional position as [x, y]
   */
  text(content, pos) {
    const node = new Text(content, Vec2.zero());
    this._scene.addChild(node);
    if (pos) {
      node.pos(pos.length === 3 ? [pos[0], pos[1]] : pos);
    }
    return node;
  }
  /**
   * Create a LaTeX-enabled text node.
   * @param expression - LaTeX expression
   * @param pos - Optional position as [x, y]
   * @param opts - LaTeX rendering options
   */
  tex(expression, pos, opts = {}) {
    const node = new Text(expression, Vec2.zero()).latex(expression, opts);
    this._scene.addChild(node);
    if (pos) {
      node.pos(pos.length === 3 ? [pos[0], pos[1]] : pos);
    }
    return node;
  }
  /**
   * Create an empty path.
   * @param pos - Optional starting position
   */
  path(pos) {
    const node = new Path(Vec2.zero());
    this._scene.addChild(node);
    if (pos) {
      node.pos(pos);
    }
    return node;
  }
  /**
   * Create a line between two points.
   * @param from - Start point as [x, y]
   * @param to - End point as [x, y]
   */
  line(from, to) {
    const node = new Line(Vec2.zero(), Vec2.zero());
    this._scene.addChild(node);
    node.from(from).to(to);
    return node;
  }
  /**
   * Create a reactive connector between two nodes.
   * The line endpoints track node layout changes automatically.
   */
  connect(from, to, opts = {}) {
    return this.line([0, 0], [0, 0]).connect(from, to, opts);
  }
  edge(from, to, opts = {}) {
    const merged = this._mergeEdgeOptions(opts);
    const line = this.connect(from, to, merged);
    if (merged.route) {
      line.route(merged.route, merged.routeOptions ?? {});
    }
    if (merged.color !== void 0 || merged.width !== void 0) {
      line.stroke(merged.color ?? "#111827", merged.width ?? 1.6);
    }
    if (merged.dash) {
      line.dashed(merged.dash);
    }
    return line;
  }
  /**
   * Create a group container.
   */
  group() {
    const g = new Group();
    this._scene.addChild(g);
    return g;
  }
  container(opts = {}) {
    return this._scene.container(opts);
  }
  row(childrenOrOpts = {}, opts = {}) {
    if (Array.isArray(childrenOrOpts)) {
      return this._scene.row(childrenOrOpts, opts);
    }
    return this._scene.row(childrenOrOpts);
  }
  column(childrenOrOpts = {}, opts = {}) {
    if (Array.isArray(childrenOrOpts)) {
      return this._scene.column(childrenOrOpts, opts);
    }
    return this._scene.column(childrenOrOpts);
  }
  grid(childrenOrOpts = {}, opts = {}) {
    if (Array.isArray(childrenOrOpts)) {
      return this._scene.grid(childrenOrOpts, opts);
    }
    return this._scene.grid(childrenOrOpts);
  }
  stack(childrenOrOpts = {}, opts = {}) {
    if (Array.isArray(childrenOrOpts)) {
      return this._scene.stack(childrenOrOpts, opts);
    }
    return this._scene.stack(childrenOrOpts);
  }
  node(label, opts = {}) {
    return this._scene.node(label, this._mergeNodeOptions(opts));
  }
  theme(nameOrTheme) {
    const next = typeof nameOrTheme === "string" ? BUILTIN_THEMES[nameOrTheme] ?? {} : nameOrTheme;
    this._theme = {
      node: { ...this._theme.node ?? {}, ...next.node ?? {} },
      edge: { ...this._theme.edge ?? {}, ...next.edge ?? {} }
    };
    return this;
  }
  /**
   * Collect geometry diagnostics for debugging bounds/anchors/routes.
   * This is the data foundation for visual debug overlays.
   */
  debugSnapshot(opts = {}) {
    const includeBounds = opts.bounds ?? true;
    const includeAnchors = opts.anchors ?? false;
    const includeRoutes = opts.routes ?? true;
    const anchorNames = [
      "top",
      "bottom",
      "left",
      "right",
      "center",
      "topLeft",
      "topRight",
      "bottomLeft",
      "bottomRight"
    ];
    const snapshot = {
      bounds: [],
      anchors: [],
      routes: []
    };
    const visit = (node) => {
      if (node.type !== "scene") {
        if (includeBounds) {
          const bb = node.computeWorldBBox();
          snapshot.bounds.push({
            id: node.id,
            type: node.type,
            bbox: [bb.minX, bb.minY, bb.maxX, bb.maxY]
          });
        }
        if (includeAnchors) {
          for (const name of anchorNames) {
            snapshot.anchors.push({
              id: node.id,
              type: node.type,
              semantic: "box",
              name,
              point: node.anchor.box.get(name)
            });
            snapshot.anchors.push({
              id: node.id,
              type: node.type,
              semantic: "shape",
              name,
              point: node.anchor.shape.get(name)
            });
          }
        }
        if (includeRoutes && node.type === "line") {
          const lineLike = node;
          const world = node.getWorldTransform();
          const points = lineLike.getRoutePoints().map((p) => {
            const wp = world.transformPoint(p);
            return [wp.x, wp.y];
          });
          snapshot.routes.push({ id: node.id, points });
        }
      }
      for (const child of node.children) {
        visit(child);
      }
    };
    visit(this._scene);
    return snapshot;
  }
  _mergeNodeOptions(opts) {
    return {
      ...this._theme.node ?? {},
      ...opts
    };
  }
  _mergeEdgeOptions(opts) {
    return {
      ...this._theme.edge ?? {},
      ...opts,
      routeOptions: {
        ...this._theme.edge?.routeOptions ?? {},
        ...opts.routeOptions ?? {}
      }
    };
  }
  _attachPointerDelegation() {
    const element = this._renderer.getElement();
    element.style.touchAction = "none";
    element.addEventListener("pointermove", this._onPointerMove);
    element.addEventListener("pointerdown", this._onPointerDown);
    element.addEventListener("pointerup", this._onPointerUp);
    element.addEventListener("pointercancel", this._onPointerCancel);
    element.addEventListener("pointerleave", this._onPointerLeave);
  }
  _detachPointerDelegation() {
    const element = this._renderer.getElement();
    element.removeEventListener("pointermove", this._onPointerMove);
    element.removeEventListener("pointerdown", this._onPointerDown);
    element.removeEventListener("pointerup", this._onPointerUp);
    element.removeEventListener("pointercancel", this._onPointerCancel);
    element.removeEventListener("pointerleave", this._onPointerLeave);
  }
  _eventWorldPoint(event) {
    const rect = this._renderer.getElement().getBoundingClientRect();
    const scaleX = rect.width > 0 ? this._size.x / rect.width : 1;
    const scaleY = rect.height > 0 ? this._size.y / rect.height : 1;
    return new Vec2(
      (event.clientX - rect.left) * scaleX,
      (event.clientY - rect.top) * scaleY
    );
  }
  _deltaForPointer(pointerId, next) {
    const prev = this._lastPointerPositions.get(pointerId);
    this._lastPointerPositions.set(pointerId, next);
    if (!prev) return Vec2.zero();
    return next.sub(prev);
  }
  _pickTopNode(point) {
    const visit = (node) => {
      if (!node._visible.get()) return null;
      for (let i = node.children.length - 1; i >= 0; i--) {
        const child = node.children[i];
        const hitChild = visit(child);
        if (hitChild) return hitChild;
      }
      if (node.type === "scene") return null;
      if (node.containsWorldPoint(point.x, point.y, 2)) return node;
      return null;
    };
    return visit(this._scene);
  }
  _findDraggableTarget(from) {
    let node = from;
    while (node) {
      if (node._isDraggable()) return node;
      node = node.parent;
    }
    return null;
  }
  _resolveDragBounds(node, opts) {
    if (!opts?.bounds) return null;
    if (opts.bounds === "parent") {
      if (!node.parent) return null;
      return node.parent.computeLocalBBox();
    }
    if (opts.bounds instanceof BBox) {
      return opts.bounds;
    }
    const [minX, minY, maxX, maxY] = opts.bounds;
    return new BBox(minX, minY, maxX, maxY);
  }
  _clampDragPosition(node, next, bounds) {
    if (!bounds) return next;
    const localBox = node.computeLocalBBox();
    const minX = bounds.minX - localBox.minX;
    const maxX = bounds.maxX - localBox.maxX;
    const minY = bounds.minY - localBox.minY;
    const maxY = bounds.maxY - localBox.maxY;
    const x = minX <= maxX ? Math.max(minX, Math.min(maxX, next.x)) : (minX + maxX) / 2;
    const y = minY <= maxY ? Math.max(minY, Math.min(maxY, next.y)) : (minY + maxY) / 2;
    return new Vec2(x, y);
  }
  _dispatchPointerEvent(type, target, originalEvent, worldPoint, delta) {
    let propagationStopped = false;
    let node = target;
    while (node) {
      const local = node.getWorldTransform().invert().transformPoint(worldPoint);
      const event = {
        type,
        target,
        currentTarget: node,
        originalEvent,
        worldX: worldPoint.x,
        worldY: worldPoint.y,
        localX: local.x,
        localY: local.y,
        deltaX: delta.x,
        deltaY: delta.y,
        stopPropagation: () => {
          propagationStopped = true;
        }
      };
      node._emitPointerEvent(type, event);
      if (propagationStopped) return;
      node = node.parent;
    }
  }
  _updateCursor(target) {
    let node = target;
    while (node) {
      const cursor = node.style._cursor.get();
      if (cursor) {
        this._renderer.getElement().style.cursor = cursor;
        return;
      }
      node = node.parent;
    }
    this._renderer.getElement().style.cursor = "";
  }
  // ── Scene access ──
  getScene() {
    return this._scene;
  }
  getRenderer() {
    return this._renderer;
  }
  /** Force a synchronous render. */
  flush() {
    this._scene.flush();
  }
  /** Batch multiple scene mutations into one layout/constraint settlement pass. */
  batch(fn) {
    return this._scene.batch(fn);
  }
  /** Run a function on every animation frame. */
  loop(fn) {
    let lastTime = 0;
    let running = true;
    const tick = (time) => {
      if (!running) return;
      const dt = lastTime ? time - lastTime : 0;
      lastTime = time;
      fn(time, dt);
      this._scene.flush();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => {
      running = false;
    };
  }
  /** Dispose the canvas instance and clean up. */
  dispose() {
    this._detachPointerDelegation();
    this._hoveredNode = null;
    this._activePointerTargets.clear();
    this._lastPointerPositions.clear();
    this._dragState = null;
    this._resizeObserver?.disconnect();
    this._scene.dispose();
    this._renderer.dispose();
    const el = this._renderer.getElement();
    el.parentNode?.removeChild(el);
  }
};

// src/index.ts
var installedPlugins = /* @__PURE__ */ new Set();
var shapeRegistry = /* @__PURE__ */ new Map();
var macroRegistry = /* @__PURE__ */ new Map();
function assertMethodNameAvailable(name) {
  const existingOnCanvas = name in ZCanvas.prototype;
  const existingOnGroup = name in Group.prototype;
  if (existingOnCanvas || existingOnGroup) {
    throw new Error(`Zeta: Cannot register "${name}" because that method already exists`);
  }
}
function installPrototypeMethod(name, factory) {
  const method = function(attrs) {
    return factory(this, attrs);
  };
  ZCanvas.prototype[name] = method;
  Group.prototype[name] = method;
}
var Z = {
  /** Create a new Zeta canvas instance. */
  Canvas: ZCanvas,
  /**
   * Compute the midpoint between two nodes (by their world-space bbox centers).
   */
  midpoint(a, b) {
    const ca = a.computeWorldBBox().center;
    const cb = b.computeWorldBBox().center;
    const mid = ca.lerp(cb, 0.5);
    return [mid.x, mid.y];
  },
  /**
   * Register a plugin. Plugins receive the Z namespace and can
   * attach custom shapes and macros.
   */
  use(plugin) {
    if (installedPlugins.has(plugin)) return;
    installedPlugins.add(plugin);
    plugin(Z);
  },
  /** Define a custom shape type available on both `Canvas` and `Group` instances. */
  defineShape(name, factory) {
    if (!name) {
      throw new Error("Zeta: defineShape(name, factory) requires a non-empty name");
    }
    if (shapeRegistry.has(name)) {
      throw new Error(`Zeta: shape "${name}" is already defined`);
    }
    assertMethodNameAvailable(name);
    const runtimeFactory = (host, attrs) => {
      return factory(host, attrs);
    };
    shapeRegistry.set(name, runtimeFactory);
    installPrototypeMethod(name, runtimeFactory);
  },
  /** Define a macro available on both `Canvas` and `Group` instances. */
  defineMacro(name, factory) {
    if (!name) {
      throw new Error("Zeta: defineMacro(name, factory) requires a non-empty name");
    }
    if (macroRegistry.has(name)) {
      throw new Error(`Zeta: macro "${name}" is already defined`);
    }
    assertMethodNameAvailable(name);
    const runtimeFactory = (host, attrs) => {
      return factory(host, attrs);
    };
    macroRegistry.set(name, runtimeFactory);
    installPrototypeMethod(name, runtimeFactory);
  }
};
var index_default = Z;

export { AnchorMap, BBox, Canvas2DRenderer, Circle, Computed, Group, Line, Matrix3, Path, PinConstraint, PositionConstraint, Rect, SVGRenderer, Scene, SceneNode, Signal, Style, StyleManager, Text, Vec2, ZCanvas, batch, computed, index_default as default, explainConstraintTrace, perimeterPoint, rayShapeIntersection, setConstraintTraceHook, signal };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map