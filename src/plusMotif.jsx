import * as THREE from "three";

export const HERO_PLUS_COLORS = ["#c2fe0c", "#5200ff", "#ff0d1a"];
export const PLUS_GLOW_SCALE = 1.28;
export const PLUS_GLOW_OPACITY = { low: 0.07, high: 0.11 };
export const PLUS_EMISSIVE_INTENSITY = { low: 0.2, high: 0.32 };

/** Five circles in mesh space — hub + four arms — approximate the plus silhouette. */
export function buildPlusColliders(scale) {
  const arm = 0.58 * scale;
  const hubR = 0.36 * scale;
  const armR = 0.27 * scale;
  return [
    { lx: 0, ly: 0, r: hubR },
    { lx: 0, ly: arm, r: armR },
    { lx: 0, ly: -arm, r: armR },
    { lx: arm, ly: 0, r: armR },
    { lx: -arm, ly: 0, r: armR }
  ];
}

const _colliderVec = new THREE.Vector3();
const _colliderMatrix = new THREE.Matrix4();

const PLUS_OUTLINE_XY = [
  [-0.34, 0.92],
  [0.34, 0.92],
  [0.34, 0.34],
  [0.92, 0.34],
  [0.92, -0.34],
  [0.34, -0.34],
  [0.34, -0.92],
  [-0.34, -0.92],
  [-0.34, -0.34],
  [-0.92, -0.34],
  [-0.92, 0.34],
  [-0.34, 0.34]
];

function buildPlusShape(cornerRadius) {
  const points = PLUS_OUTLINE_XY.map(([x, y]) => new THREE.Vector2(x, y));
  const rounded = points.map((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const fromPrevious = previous.clone().sub(point).normalize();
    const toNext = next.clone().sub(point).normalize();
    return {
      point,
      start: point.clone().add(fromPrevious.multiplyScalar(cornerRadius)),
      end: point.clone().add(toNext.multiplyScalar(cornerRadius))
    };
  });
  const shape = new THREE.Shape();
  shape.moveTo(rounded[0].start.x, rounded[0].start.y);
  rounded.forEach((corner, index) => {
    const nextCorner = rounded[(index + 1) % rounded.length];
    shape.quadraticCurveTo(corner.point.x, corner.point.y, corner.end.x, corner.end.y);
    shape.lineTo(nextCorner.start.x, nextCorner.start.y);
  });
  shape.closePath();
  return shape;
}

function extrudeRoundedPlus(cornerRadius, extrudeOverrides) {
  const shape = buildPlusShape(cornerRadius);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.58,
    bevelEnabled: true,
    ...extrudeOverrides
  });
  geometry.center();
  return geometry;
}

export const PLUS_GEOMETRY = extrudeRoundedPlus(0.1, {
  bevelThickness: 0.11,
  bevelSize: 0.11,
  bevelSegments: 3,
  curveSegments: 8
});

export function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getWorldColliders(particle, group, localColliders) {
  _colliderMatrix.makeRotationFromEuler(group.rotation);
  const px = particle.position.x;
  const py = particle.position.y;
  return localColliders.map((c) => {
    _colliderVec.set(c.lx, c.ly, 0).applyMatrix4(_colliderMatrix);
    return { x: px + _colliderVec.x, y: py + _colliderVec.y, r: c.r };
  });
}

export function circleOverlap(ax, ay, ar, bx, by, br) {
  let dx = bx - ax;
  let dy = by - ay;
  let distSq = dx * dx + dy * dy;
  const minDist = ar + br;

  if (distSq === 0) {
    dx = 0.001;
    dy = 0;
    distSq = dx * dx;
  }

  if (distSq >= minDist * minDist) return null;

  const dist = Math.sqrt(distSq);
  return {
    nx: dx / dist,
    ny: dy / dist,
    pen: minDist - dist
  };
}

export function separateParticles(a, b, nx, ny, pen, aDrag, bDrag) {
  let aShare = 0.5;
  let bShare = 0.5;
  if (aDrag && !bDrag) {
    aShare = 0;
    bShare = 1;
  } else if (!aDrag && bDrag) {
    aShare = 1;
    bShare = 0;
  }

  a.position.x -= nx * pen * aShare;
  a.position.y -= ny * pen * aShare;
  b.position.x += nx * pen * bShare;
  b.position.y += ny * pen * bShare;

  if (aDrag && bDrag) return;

  const rvx = b.velocity.x - a.velocity.x;
  const rvy = b.velocity.y - a.velocity.y;
  const velAlongNormal = rvx * nx + rvy * ny;
  if (velAlongNormal >= 0) return;

  const impulse = (-1.35 * velAlongNormal) / 2;
  if (!aDrag) {
    a.velocity.x -= impulse * nx;
    a.velocity.y -= impulse * ny;
  }
  if (!bDrag) {
    b.velocity.x += impulse * nx;
    b.velocity.y += impulse * ny;
  }
}

export function resolveMiniCollisions(particles, dragging, groups) {
  const count = particles.length;
  let hits = 0;

  const worldSets = new Array(count);
  for (let i = 0; i < count; i++) {
    const group = groups[i];
    worldSets[i] =
      group && particles[i].colliders ? getWorldColliders(particles[i], group, particles[i].colliders) : [];
  }

  for (let i = 0; i < count; i++) {
    const worldA = worldSets[i];
    if (!worldA.length) continue;

    for (let j = i + 1; j < count; j++) {
      const worldB = worldSets[j];
      if (!worldB.length) continue;

      for (const ca of worldA) {
        for (const cb of worldB) {
          const overlap = circleOverlap(ca.x, ca.y, ca.r, cb.x, cb.y, cb.r);
          if (!overlap) continue;
          hits++;
          separateParticles(
            particles[i],
            particles[j],
            overlap.nx,
            overlap.ny,
            overlap.pen,
            dragging[i],
            dragging[j]
          );
        }
      }
    }
  }

  return hits;
}

export function MiniPlus({
  particle,
  groupRef,
  low,
  onPointerOver,
  onPointerOut,
  onPointerDown
}) {
  const glowOpacity = low ? PLUS_GLOW_OPACITY.low : PLUS_GLOW_OPACITY.high;
  const emissiveIntensity = low ? PLUS_EMISSIVE_INTENSITY.low : PLUS_EMISSIVE_INTENSITY.high;

  return (
    <group
      ref={groupRef}
      position={[particle.position.x, particle.position.y, particle.position.z]}
    >
      <mesh
        geometry={PLUS_GEOMETRY}
        scale={particle.scale * PLUS_GLOW_SCALE}
        raycast={() => null}
      >
        <meshBasicMaterial
          color={particle.color}
          transparent
          opacity={glowOpacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh
        geometry={PLUS_GEOMETRY}
        scale={particle.scale}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onPointerDown={onPointerDown}
      >
        <meshStandardMaterial
          color={particle.color}
          roughness={0.34}
          metalness={0.1}
          emissive={particle.color}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={1}
        />
      </mesh>
    </group>
  );
}
