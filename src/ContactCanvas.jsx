import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  endHeroPlusDrag,
  enterHeroPlusCursor,
  leaveHeroPlusCursor,
  resetHeroPlusCursor,
  startHeroPlusDrag
} from "./cursorInteractive.js";
import {
  HERO_PLUS_COLORS,
  MiniPlus,
  buildPlusColliders,
  createSeededRandom,
  getWorldColliders,
  resolveMiniCollisions
} from "./plusMotif.jsx";

const CONTACT_PLUS_COUNT = { low: 8, high: 14 };
const CONTACT_FLOAT_COUNT = { low: 5, high: 9 };
const CONTACT_PLUS_SEED = 0xca11b077;
const CONTACT_COLLISION_PASSES = { low: 4, high: 6 };
const CONTACT_CANVAS_SPAN = 0.52;
const CONTACT_MOVEMENT_EPS = 0.015;
const CONTACT_GRAVITY = -3.6;
const CONTACT_FLOAT_GRAVITY = -0.55;
const CONTACT_DROP_STAGGER = 0.08;
const CONTACT_FLOAT_WAVE_DELAY = 0.95;
const CONTACT_FLOOR_PAD = 0.1;
/** Keep high enough for several visible hops; each bounce multiplies by this. */
const CONTACT_FLOOR_RESTITUTION = 0.72;
const CONTACT_WALL_RESTITUTION = 0.34;
const CONTACT_FRICTION = 0.94;
/** Only stop hopping once vertical speed is tiny. */
const CONTACT_SETTLE_SPEED = 0.045;

function computePerfTier() {
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

function createWavePluses(
  viewport,
  count,
  {
    reducedMotion = false,
    seed = CONTACT_PLUS_SEED,
    gravity = CONTACT_GRAVITY,
    waveDelay = 0,
    stagger = CONTACT_DROP_STAGGER,
    scaleMin = 0.34,
    scaleRange = 0.16,
    fallSpeed = 0.22
  } = {}
) {
  const rand = createSeededRandom(seed);
  const xSpan = viewport.width * CONTACT_CANVAS_SPAN;
  const floorY = -viewport.height * 0.5 + CONTACT_FLOOR_PAD;
  const particles = [];

  for (let i = 0; i < count; i++) {
    const scale = scaleMin + rand() * scaleRange;
    const radius = 0.92 * scale;
    const t = count <= 1 ? 0.5 : i / (count - 1);
    const normX = (t - 0.5) * 1.7 + (rand() - 0.5) * 0.45;
    const x = THREE.MathUtils.clamp(normX, -1, 1) * xSpan;
    const startY = reducedMotion
      ? floorY + radius + rand() * 0.55
      : viewport.height * 0.5 + radius + 0.55 + rand() * 1.6 + i * 0.2;

    particles.push({
      position: new THREE.Vector3(x, startY, 0.12 + rand() * 0.35),
      velocity: reducedMotion
        ? new THREE.Vector3((rand() - 0.5) * 0.2, 0, 0)
        : new THREE.Vector3((rand() - 0.5) * 0.28, -fallSpeed * (0.55 + rand() * 0.7), 0),
      spin: (rand() > 0.5 ? 1 : -1) * (0.35 + rand() * 0.55),
      scale,
      radius,
      colliders: buildPlusColliders(scale),
      color: HERO_PLUS_COLORS[Math.floor(rand() * HERO_PLUS_COLORS.length)],
      dropDelay: waveDelay + i * stagger + rand() * 0.05,
      released: reducedMotion,
      restitution: CONTACT_FLOOR_RESTITUTION * (0.92 + rand() * 0.14),
      gravity
    });
  }

  return particles;
}

function createContactPluses(viewport, counts, { reducedMotion = false } = {}) {
  const heavy = createWavePluses(viewport, counts.heavy, {
    reducedMotion,
    seed: CONTACT_PLUS_SEED,
    gravity: CONTACT_GRAVITY,
    waveDelay: 0,
    stagger: CONTACT_DROP_STAGGER,
    fallSpeed: 0.18
  });
  const light = createWavePluses(viewport, counts.light, {
    reducedMotion,
    seed: CONTACT_PLUS_SEED ^ 0x5f3759df,
    gravity: CONTACT_FLOAT_GRAVITY,
    waveDelay: CONTACT_FLOAT_WAVE_DELAY,
    stagger: CONTACT_DROP_STAGGER * 1.35,
    scaleMin: 0.28,
    scaleRange: 0.14,
    fallSpeed: 0.06
  });
  return heavy.concat(light);
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

function bounceOffFloor(particle, floorY) {
  const r = particle.radius ?? particle.scale * 0.92;
  const bottom = floorY + r;
  if (particle.position.y >= bottom) return false;

  particle.position.y = bottom;
  if (particle.velocity.y >= 0) return true;

  const restitution = particle.restitution ?? CONTACT_FLOOR_RESTITUTION;
  const impact = -particle.velocity.y;

  if (impact < CONTACT_SETTLE_SPEED) {
    particle.velocity.y = 0;
    particle.velocity.x *= CONTACT_FRICTION * 0.92;
    return true;
  }

  // Reflect with energy loss — smaller hop each time until settle.
  particle.velocity.y = impact * restitution;
  particle.velocity.x *= CONTACT_FRICTION;
  return true;
}

function collideFloorAndSides(particle, xLimit, floorY, dragging) {
  const r = particle.radius ?? particle.scale * 0.92;
  const left = -xLimit + r;
  const right = xLimit - r;

  if (particle.position.x < left) {
    particle.position.x = left;
    if (!dragging) particle.velocity.x = Math.abs(particle.velocity.x) * CONTACT_WALL_RESTITUTION;
  } else if (particle.position.x > right) {
    particle.position.x = right;
    if (!dragging) particle.velocity.x = -Math.abs(particle.velocity.x) * CONTACT_WALL_RESTITUTION;
  }

  if (!dragging) bounceOffFloor(particle, floorY);
  else {
    const bottom = floorY + r;
    if (particle.position.y < bottom) particle.position.y = bottom;
  }
}

function resolveFloorAgainstColliders(particles, groups, floorY, dragging) {
  for (let i = 0; i < particles.length; i++) {
    const group = groups[i];
    const p = particles[i];
    if (!group || !p.colliders || dragging[i]) continue;
    const world = getWorldColliders(p, group, p.colliders);
    let minY = Infinity;
    for (const c of world) {
      minY = Math.min(minY, c.y - c.r);
    }
    if (minY >= floorY) continue;

    // Lift so silhouette sits on the floor, then bounce once from impact speed.
    p.position.y += floorY - minY;
    if (p.velocity.y >= 0) continue;

    const restitution = p.restitution ?? CONTACT_FLOOR_RESTITUTION;
    const impact = -p.velocity.y;
    if (impact < CONTACT_SETTLE_SPEED) {
      p.velocity.y = 0;
      p.velocity.x *= CONTACT_FRICTION * 0.92;
    } else {
      p.velocity.y = impact * restitution;
      p.velocity.x *= CONTACT_FRICTION;
    }
  }
}

function particlesNeedCollision(particles, dragging) {
  const epsSq = CONTACT_MOVEMENT_EPS * CONTACT_MOVEMENT_EPS;
  for (let i = 0; i < particles.length; i++) {
    if (dragging[i]) return true;
    const v = particles[i].velocity;
    if (v.x * v.x + v.y * v.y > epsSq) return true;
  }
  return false;
}

const _dragWorld = new THREE.Vector3();

function ContactPluses({ viewport, low, active, reducedMotion }) {
  const counts = {
    heavy: low ? CONTACT_PLUS_COUNT.low : CONTACT_PLUS_COUNT.high,
    light: low ? CONTACT_FLOAT_COUNT.low : CONTACT_FLOAT_COUNT.high
  };
  const count = counts.heavy + counts.light;
  const collisionPasses = low ? CONTACT_COLLISION_PASSES.low : CONTACT_COLLISION_PASSES.high;
  const { camera, gl } = useThree();
  const meshRefs = useRef([]);
  const dragRef = useRef([]);
  const draggingFlags = useRef([]);
  const activeDragRef = useRef(null);
  const particlesRef = useRef(null);
  const viewportSizeRef = useRef(null);
  const elapsedRef = useRef(0);
  const wasActiveRef = useRef(false);

  if (!particlesRef.current || particlesRef.current.length !== count) {
    particlesRef.current = createContactPluses(viewport, counts, { reducedMotion });
    viewportSizeRef.current = { width: viewport.width, height: viewport.height };
    elapsedRef.current = 0;
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

  useEffect(() => {
    if (active && !wasActiveRef.current) {
      elapsedRef.current = 0;
      particlesRef.current = createContactPluses(viewport, counts, { reducedMotion });
    }
    wasActiveRef.current = active;
  }, [active, reducedMotion, viewport.width, viewport.height, count]);

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
      const activeDrag = activeDragRef.current;
      const particles = particlesRef.current;
      if (!activeDrag || !particles) return;
      const { index, pointerId } = activeDrag;
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
      const activeDrag = activeDragRef.current;
      if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
      endDrag(activeDrag.index, true);
      if (canvas.hasPointerCapture?.(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    const onPointerCancel = (event) => {
      const activeDrag = activeDragRef.current;
      if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
      endDrag(activeDrag.index, false);
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

    const dt = Math.min(delta, 0.033);
    if (active) elapsedRef.current += dt;
    if (!active && !reducedMotion) return;

    const xLimit = viewport.width * 0.5 - 0.06;
    const floorY = -viewport.height * 0.5 + CONTACT_FLOOR_PAD;
    const dragging = draggingFlags.current;

    for (let i = 0; i < count; i++) {
      dragging[i] = !!dragRef.current[i]?.dragging;
    }

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const drag = dragRef.current[i];

      if (dragging[i]) {
        p.position.x = drag.x;
        p.position.y = drag.y;
        p.released = true;
        collideFloorAndSides(p, xLimit, floorY, true);
        continue;
      }

      if (!p.released) {
        if (elapsedRef.current < p.dropDelay) continue;
        p.released = true;
      }

      p.velocity.y += (p.gravity ?? CONTACT_GRAVITY) * dt;
      p.position.x += p.velocity.x * dt;
      p.position.y += p.velocity.y * dt;
      collideFloorAndSides(p, xLimit, floorY, false);
    }

    if (particlesNeedCollision(particles, dragging)) {
      for (let pass = 0; pass < collisionPasses; pass++) {
        if (resolveMiniCollisions(particles, dragging, meshRefs.current) === 0) {
          break;
        }
      }
      resolveFloorAgainstColliders(particles, meshRefs.current, floorY, dragging);
      for (let i = 0; i < count; i++) {
        if (!dragging[i]) collideFloorAndSides(particles[i], xLimit, floorY, false);
      }
    }

    for (let i = 0; i < count; i++) {
      const group = meshRefs.current[i];
      const p = particles[i];
      if (!group) continue;

      group.position.copy(p.position);
      const speed = Math.hypot(p.velocity.x, p.velocity.y);
      const spinScale = dragging[i] ? 1.4 : speed > 0.05 ? 1 : 0.22;
      group.rotation.x += dt * p.spin * 0.55 * spinScale;
      group.rotation.y += dt * p.spin * 0.9 * spinScale;
      group.rotation.z += dt * p.spin * 0.35 * spinScale;
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
        /* capture can fail on some mobile browsers */
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

function ContactScene({ active, reducedMotion, tier }) {
  const { viewport } = useThree();
  const low = tier === "low";

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight intensity={2.2} position={[3, 4, 5]} />
      <directionalLight intensity={1} position={[-3, -2, 3]} color="#ffffff" />
      <ContactPluses
        viewport={viewport}
        low={low}
        active={active}
        reducedMotion={reducedMotion}
      />
    </>
  );
}

export default function ContactCanvas({ active = false }) {
  const [tier, setTier] = useState(() => computePerfTier());
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
      setTier(computePerfTier());
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

  const running = tabVisible && (active || reducedMotion);

  return (
    <Canvas
      className="contact-plus-canvas"
      orthographic
      frameloop={running ? "always" : "demand"}
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
      <ContactScene active={active} reducedMotion={reducedMotion} tier={tier} />
    </Canvas>
  );
}
