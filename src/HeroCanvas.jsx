import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import {
  endHeroPlusDrag,
  enterHeroPlusCursor,
  leaveHeroPlusCursor,
  resetHeroPlusCursor,
  startHeroPlusDrag
} from "./cursorInteractive.js";

/** "low" = mobile / coarse pointer / reduced motion — fewer pluses + lower DPR. */
const HeroPerfContext = createContext({ tier: "high", reducedMotion: false });

function computeHeroTier() {
  if (typeof window === "undefined") return "high";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "low";
  if (window.innerWidth < 780) return "low";
  if (window.matchMedia("(pointer: coarse)").matches) return "low";
  const mem = navigator.deviceMemory;
  if (typeof mem === "number" && mem <= 4) return "low";
  const { connection } = navigator;
  if (connection && connection.saveData) return "low";
  return "high";
}

const HERO_CANVAS_FONT =
  "https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj4PVksj.ttf";

const HERO_HEADER_CLEARANCE_RATIO = 0.05;
const HERO_LAYOUT_BOTTOM_AIR_RATIO = 0.035;
const HERO_LAYOUT_VERTICAL_OFFSET_RATIO = 0.07;

const HERO_HEADLINE_LINES = ["WHERE ART", "MEETS", "ENGINEERING"];
const FG_LINE_START_INDEX = 1;

const HERO_COMMON_TEXT_PROPS = {
  font: HERO_CANVAS_FONT,
  anchorX: "left",
  anchorY: "top",
  letterSpacing: -0.045,
  color: "#ffffff"
};

const HERO_PLUS_COLORS = ["#c2fe0c", "#5200ff", "#ff0d1a"];
const PLUS_GLOW_SCALE = 1.28;
const PLUS_GLOW_OPACITY = { low: 0.07, high: 0.11 };
const PLUS_EMISSIVE_INTENSITY = { low: 0.2, high: 0.32 };
const HERO_MINI_COUNT = { low: 7, high: 14 };
const HERO_MINI_SEED = 0xc0ffee42;
const HERO_MINI_MIN_NORM_DIST = 0.34;
const HERO_MINI_CANVAS_SPAN = 0.54;
const HERO_MINI_COLLISION_PASSES = { low: 3, high: 4 };
const HERO_MINI_MOVEMENT_EPS = 0.015;

/** Five circles in mesh space — hub + four arms — approximate the plus silhouette. */
function buildPlusColliders(scale) {
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

const PLUS_GEOMETRY = extrudeRoundedPlus(0.1, {
  bevelThickness: 0.11,
  bevelSize: 0.11,
  bevelSegments: 3,
  curveSegments: 8
});

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

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createSeededMiniPluses(viewport, count, seed = HERO_MINI_SEED) {
  const rand = createSeededRandom(seed);
  const xSpan = viewport.width * HERO_MINI_CANVAS_SPAN;
  const ySpan = viewport.height * HERO_MINI_CANVAS_SPAN;
  const minDistSq = HERO_MINI_MIN_NORM_DIST * HERO_MINI_MIN_NORM_DIST;
  const placed = [];
  const particles = [];

  for (let i = 0; i < count; i++) {
    let normX = 0;
    let normY = 0;

    for (let attempt = 0; attempt < 96; attempt++) {
      normX = rand() * 2 - 1;
      normY = rand() * 2 - 1;
      const tooClose = placed.some((p) => {
        const dx = normX - p.normX;
        const dy = normY - p.normY;
        return dx * dx + dy * dy < minDistSq;
      });
      if (!tooClose) {
        placed.push({ normX, normY });
        break;
      }
      if (attempt === 95) {
        placed.push({ normX, normY });
      }
    }

    const angle = rand() * Math.PI * 2;
    const speed = 0.22 + rand() * 0.42;
    particles.push({
      position: new THREE.Vector3(normX * xSpan, normY * ySpan, 0.16 + rand() * 0.3),
      velocity: new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, 0),
      spin: (rand() > 0.5 ? 1 : -1) * (0.35 + rand() * 0.55),
      scale: 0.34 + rand() * 0.16,
      colliders: null,
      color: HERO_PLUS_COLORS[Math.floor(rand() * HERO_PLUS_COLORS.length)]
    });
  }

  particles.forEach((p) => {
    p.colliders = buildPlusColliders(p.scale);
  });

  return particles;
}

function scaleParticlesForViewport(particles, prevWidth, prevHeight, nextWidth, nextHeight) {
  const scaleX = nextWidth / prevWidth;
  const scaleY = nextHeight / prevHeight;
  particles.forEach((p) => {
    p.position.x *= scaleX;
    p.position.y *= scaleY;
    p.velocity.x *= scaleX;
    p.velocity.y *= scaleY;
  });
}

function wrapMiniPosition(position, xLimit, yLimit) {
  if (position.x > xLimit) position.x = -xLimit;
  else if (position.x < -xLimit) position.x = xLimit;
  if (position.y > yLimit) position.y = -yLimit;
  else if (position.y < -yLimit) position.y = yLimit;
}

function particlesNeedCollision(particles, dragging) {
  const epsSq = HERO_MINI_MOVEMENT_EPS * HERO_MINI_MOVEMENT_EPS;
  for (let i = 0; i < particles.length; i++) {
    if (dragging[i]) return true;
    const v = particles[i].velocity;
    if (v.x * v.x + v.y * v.y > epsSq) return true;
  }
  return false;
}

function getWorldColliders(particle, group, localColliders) {
  _colliderMatrix.makeRotationFromEuler(group.rotation);
  const px = particle.position.x;
  const py = particle.position.y;
  return localColliders.map((c) => {
    _colliderVec.set(c.lx, c.ly, 0).applyMatrix4(_colliderMatrix);
    return { x: px + _colliderVec.x, y: py + _colliderVec.y, r: c.r };
  });
}

function circleOverlap(ax, ay, ar, bx, by, br) {
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

function separateParticles(a, b, nx, ny, pen, aDrag, bDrag) {
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

function resolveMiniCollisions(particles, dragging, groups) {
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

function MiniPlus({
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
        />
      </mesh>
    </group>
  );
}

const _dragWorld = new THREE.Vector3();

function HeroMinPluses({ viewport, low }) {
  const count = low ? HERO_MINI_COUNT.low : HERO_MINI_COUNT.high;
  const collisionPasses = low ? HERO_MINI_COLLISION_PASSES.low : HERO_MINI_COLLISION_PASSES.high;
  const { camera, gl } = useThree();
  const meshRefs = useRef([]);
  const dragRef = useRef([]);
  const draggingFlags = useRef([]);
  const activeDragRef = useRef(null);
  const particlesRef = useRef(null);
  const viewportSizeRef = useRef(null);

  if (!particlesRef.current || particlesRef.current.length !== count) {
    particlesRef.current = createSeededMiniPluses(viewport, count);
    viewportSizeRef.current = { width: viewport.width, height: viewport.height };
  }

  useEffect(() => {
    const prev = viewportSizeRef.current;
    const particles = particlesRef.current;
    if (!prev || !particles || (prev.width === viewport.width && prev.height === viewport.height)) {
      return;
    }
    scaleParticlesForViewport(particles, prev.width, prev.height, viewport.width, viewport.height);
    viewportSizeRef.current = { width: viewport.width, height: viewport.height };
  }, [viewport.width, viewport.height]);

  useEffect(() => () => resetHeroPlusCursor(), []);

  useEffect(() => {
    const canvas = gl.domElement;

    const clientToWorld = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const ndcX = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      const ndcY = -((clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
      _dragWorld.set(ndcX, ndcY, 0).unproject(camera);
      return _dragWorld;
    };

    const endDrag = (index, dampVelocity) => {
      const particles = particlesRef.current;
      const drag = dragRef.current[index];
      if (!drag?.dragging) return;
      drag.dragging = false;
      if (dampVelocity && particles?.[index]) {
        particles[index].velocity.multiplyScalar(0.55);
      }
      if (activeDragRef.current?.index === index) {
        activeDragRef.current = null;
      }
      endHeroPlusDrag();
      canvas.classList.remove("is-dragging-plus");
    };

    const onPointerMove = (event) => {
      const active = activeDragRef.current;
      const particles = particlesRef.current;
      if (!active || !particles) return;
      const { index, pointerId } = active;
      if (event.pointerId !== pointerId) return;
      const drag = dragRef.current[index];
      if (!drag?.dragging) return;

      event.preventDefault();
      const hit = clientToWorld(event.clientX, event.clientY);
      const nextX = hit.x + drag.offsetX;
      const nextY = hit.y + drag.offsetY;
      const now = event.timeStamp || drag.lastTs;
      const dt = Math.max(0.001, (now - drag.lastTs) / 1000);
      particles[index].velocity.x = (nextX - drag.x) / dt;
      particles[index].velocity.y = (nextY - drag.y) / dt;
      drag.x = nextX;
      drag.y = nextY;
      drag.lastTs = now;
      particles[index].position.x = nextX;
      particles[index].position.y = nextY;
    };

    const onPointerUp = (event) => {
      const active = activeDragRef.current;
      if (!active || event.pointerId !== active.pointerId) return;
      endDrag(active.index, true);
      if (canvas.hasPointerCapture?.(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    const onPointerCancel = (event) => {
      const active = activeDragRef.current;
      if (!active || event.pointerId !== active.pointerId) return;
      endDrag(active.index, false);
    };

    canvas.addEventListener("pointermove", onPointerMove, { passive: false });
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);

    return () => {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [camera, gl]);

  useFrame((_, delta) => {
    const particles = particlesRef.current;
    if (!particles) return;

    const xLimit = viewport.width * 0.55;
    const yLimit = viewport.height * 0.55;
    const dragging = draggingFlags.current;

    for (let i = 0; i < count; i++) {
      dragging[i] = !!dragRef.current[i]?.dragging;
    }

    const runCollision = particlesNeedCollision(particles, dragging);

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const drag = dragRef.current[i];

      if (dragging[i]) {
        p.position.x = drag.x;
        p.position.y = drag.y;
        continue;
      }

      if (!runCollision) continue;

      p.position.x += p.velocity.x * delta;
      p.position.y += p.velocity.y * delta;
      p.velocity.x *= 0.995;
      p.velocity.y *= 0.995;
      wrapMiniPosition(p.position, xLimit, yLimit);
    }

    if (runCollision) {
      for (let pass = 0; pass < collisionPasses; pass++) {
        if (resolveMiniCollisions(particles, dragging, meshRefs.current) === 0) {
          break;
        }
      }
      for (let i = 0; i < count; i++) {
        wrapMiniPosition(particles[i].position, xLimit, yLimit);
      }
    }

    for (let i = 0; i < count; i++) {
      const group = meshRefs.current[i];
      const p = particles[i];
      if (!group) continue;

      group.position.copy(p.position);
      group.rotation.x += delta * p.spin * 0.55;
      group.rotation.y += delta * p.spin * 0.9;
      group.rotation.z += delta * p.spin * 0.35;
    }
  });

  const bindDrag = (i) => ({
    onPointerOver: (event) => {
      event.stopPropagation();
      enterHeroPlusCursor();
    },
    onPointerOut: (event) => {
      event.stopPropagation();
      leaveHeroPlusCursor();
    },
    onPointerDown: (event) => {
      const particles = particlesRef.current;
      if (!particles) return;
      event.stopPropagation();
      event.nativeEvent?.preventDefault?.();

      const hit = event.unprojectedPoint || event.point;
      if (!dragRef.current[i]) {
        dragRef.current[i] = { dragging: false, x: 0, y: 0, offsetX: 0, offsetY: 0, lastTs: 0 };
      }
      const drag = dragRef.current[i];
      drag.dragging = true;
      drag.offsetX = particles[i].position.x - hit.x;
      drag.offsetY = particles[i].position.y - hit.y;
      drag.x = particles[i].position.x;
      drag.y = particles[i].position.y;
      drag.lastTs = event.timeStamp ?? 0;

      activeDragRef.current = { index: i, pointerId: event.pointerId };
      startHeroPlusDrag();
      gl.domElement.classList.add("is-dragging-plus");
      try {
        gl.domElement.setPointerCapture(event.pointerId);
      } catch {
        /* capture can fail on some mobile browsers; window listeners still work */
      }
    }
  });

  const particles = particlesRef.current ?? [];

  return (
    <group>
      {particles.map((particle, i) => (
        <MiniPlus
          key={i}
          particle={particle}
          low={low}
          groupRef={(el) => {
            meshRefs.current[i] = el;
          }}
          {...bindDrag(i)}
        />
      ))}
    </group>
  );
}

function HeroCanvasScene({ scrollRef }) {
  const { tier, reducedMotion } = useContext(HeroPerfContext);
  const low = tier === "low";
  const { viewport, size, gl } = useThree();
  const sceneParallaxRef = useRef(null);
  const textGroupRef = useRef(null);
  const plusGroupRef = useRef(null);
  const introStartRef = useRef(null);
  const layoutStageRef = useRef(null);

  const fontSize = Math.min(1.28, viewport.width * 0.145);
  const lineGap = fontSize * 0.92;
  const left = -viewport.width / 2 + 0.25;
  const top =
    viewport.height / 2 -
    0.15 -
    viewport.height * HERO_HEADER_CLEARANCE_RATIO +
    viewport.height * HERO_LAYOUT_BOTTOM_AIR_RATIO -
    viewport.height * HERO_LAYOUT_VERTICAL_OFFSET_RATIO;

  useEffect(() => {
    layoutStageRef.current = gl.domElement.closest(".hero-title-stage");
  }, [gl]);

  useFrame(() => {
    if (introStartRef.current === null) {
      introStartRef.current = performance.now();
    }
    const elapsed = (performance.now() - introStartRef.current) / 1000;
    const clamp01 = (v) => Math.min(1, Math.max(0, v));
    const easeOut = (v) => 1 - Math.pow(1 - v, 3);
    const textReveal = reducedMotion ? 1 : easeOut(clamp01(elapsed / 0.52));
    const plusReveal = reducedMotion ? 1 : easeOut(clamp01((elapsed - 0.14) / 0.72));

    if (textGroupRef.current) {
      textGroupRef.current.position.y = (1 - textReveal) * 0.22;
      textGroupRef.current.scale.setScalar(0.986 + textReveal * 0.014);
    }
    if (plusGroupRef.current) {
      plusGroupRef.current.scale.setScalar(0.82 + plusReveal * 0.18);
      plusGroupRef.current.position.z = (1 - plusReveal) * 0.75;
    }

    const data = scrollRef?.current;
    const sy =
      typeof data === "object" && data !== null && data !== undefined
        ? data.scrollYPixels ?? 0
        : 0;
    const ih = typeof window !== "undefined" ? window.innerHeight : 1;
    if (sceneParallaxRef.current) {
      sceneParallaxRef.current.position.y = (sy / Math.max(ih, 1)) * viewport.height * 0.42;
    }

    const stage = layoutStageRef.current;
    if (stage && size.width > 0 && size.height > 0 && viewport.width > 0) {
      const textY = textGroupRef.current?.position.y ?? 0;
      const parallaxY = sceneParallaxRef.current?.position.y ?? 0;
      const lastLineTop = top - lineGap * (HERO_HEADLINE_LINES.length - 1);
      const subtitleWorldY = lastLineTop - fontSize * 1.12 + textY + parallaxY;
      const pxPerUnitY = size.height / viewport.height;
      const cssTop = size.height / 2 - subtitleWorldY * pxPerUnitY;
      stage.style.setProperty("--hero-sub-top", `${cssTop.toFixed(2)}px`);
    }
  });

  return (
    <group ref={sceneParallaxRef}>
      <ambientLight intensity={0.85} />
      <directionalLight intensity={2.2} position={[3, 4, 5]} />
      <directionalLight intensity={1} position={[-3, -2, 3]} color="#ffffff" />

      <group ref={textGroupRef}>
        {HERO_HEADLINE_LINES.map((line, index) => (
          <Text
            key={`bg-${line}`}
            position={[left, top - lineGap * index, -1.15]}
            fontSize={fontSize}
            pointerEvents="none"
            {...HERO_COMMON_TEXT_PROPS}
          >
            {line}
          </Text>
        ))}
        {HERO_HEADLINE_LINES.slice(FG_LINE_START_INDEX).map((line, i) => (
          <Text
            key={`fg-${line}`}
            position={[left, top - lineGap * (i + FG_LINE_START_INDEX), 0.8]}
            fontSize={fontSize}
            pointerEvents="none"
            {...HERO_COMMON_TEXT_PROPS}
          >
            {line}
          </Text>
        ))}
      </group>

      <group ref={plusGroupRef}>
        <HeroMinPluses viewport={viewport} low={low} />
      </group>
    </group>
  );
}

export default function HeroTitleCanvas({ scrollRef }) {
  const [tier, setTier] = useState(() => computeHeroTier());
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [tabVisible, setTabVisible] = useState(() =>
    typeof document === "undefined" ? true : !document.hidden
  );

  useEffect(() => {
    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const syncTier = () => {
      setReducedMotion(mqReduced.matches);
      setTier(computeHeroTier());
    };
    syncTier();
    window.addEventListener("resize", syncTier);
    mqReduced.addEventListener("change", syncTier);
    mqCoarse.addEventListener("change", syncTier);
    return () => {
      window.removeEventListener("resize", syncTier);
      mqReduced.removeEventListener("change", syncTier);
      mqCoarse.removeEventListener("change", syncTier);
    };
  }, []);

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const low = tier === "low";
  const dpr = useMemo(() => {
    const pr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    if (low) return [1, Math.min(pr, 1.75)];
    return [1, Math.min(pr, 2)];
  }, [low]);

  const perfValue = useMemo(() => ({ tier, reducedMotion }), [tier, reducedMotion]);

  return (
    <HeroPerfContext.Provider value={perfValue}>
      <Canvas
        className="hero-title-canvas"
        orthographic
        frameloop={tabVisible ? "always" : "never"}
        dpr={dpr}
        style={{ touchAction: "none" }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: true,
          premultipliedAlpha: false,
          stencil: false
        }}
        camera={{ zoom: 100, position: [0, 0, 10] }}
        onCreated={({ gl }) => {
          gl.domElement.style.touchAction = "none";
        }}
      >
        <HeroCanvasScene scrollRef={scrollRef} />
      </Canvas>
    </HeroPerfContext.Provider>
  );
}
