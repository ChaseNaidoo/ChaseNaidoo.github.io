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
import {
  HERO_PLUS_COLORS,
  MiniPlus,
  PLUS_EMISSIVE_INTENSITY,
  PLUS_GLOW_OPACITY,
  buildPlusColliders,
  createSeededRandom,
  resolveMiniCollisions
} from "./plusMotif.jsx";

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

const HERO_MINI_COUNT = { low: 7, high: 14 };
const HERO_MINI_SEED = 0xc0ffee42;
const HERO_MINI_MIN_NORM_DIST = 0.34;
const HERO_MINI_CANVAS_SPAN = 0.54;
const HERO_MINI_COLLISION_PASSES = { low: 3, high: 4 };
const HERO_MINI_MOVEMENT_EPS = 0.015;
const HERO_MINI_ENTRY_DIST = 1.15;
const HERO_MINI_ENTRY_SPEED = { min: 0.55, max: 1.05 };
const HERO_MINI_REVEAL_DURATION = 1.25;
const HERO_MINI_REVEAL_STAGGER = 0.07;
/** Extra margin past the visible edge so wrap happens off-screen. */
const HERO_MINI_WRAP_PAD = 0.55;

function createSeededMiniPluses(viewport, count, { seed = HERO_MINI_SEED, reducedMotion = false } = {}) {
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
    const cruise = 0.22 + rand() * 0.42;
    const speed = reducedMotion
      ? cruise
      : HERO_MINI_ENTRY_SPEED.min +
        rand() * (HERO_MINI_ENTRY_SPEED.max - HERO_MINI_ENTRY_SPEED.min);
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const targetX = normX * xSpan;
    const targetY = normY * ySpan;
    const entry = reducedMotion ? 0 : HERO_MINI_ENTRY_DIST * (0.75 + rand() * 0.55);

    particles.push({
      position: new THREE.Vector3(
        targetX - dirX * entry,
        targetY - dirY * entry,
        0.16 + rand() * 0.3
      ),
      velocity: new THREE.Vector3(dirX * speed, dirY * speed, 0),
      spin: (rand() > 0.5 ? 1 : -1) * (0.45 + rand() * 0.7),
      scale: 0.34 + rand() * 0.16,
      colliders: null,
      color: HERO_PLUS_COLORS[Math.floor(rand() * HERO_PLUS_COLORS.length)]
    });
  }

  particles.forEach((p) => {
    p.radius = p.scale * 0.92;
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

const _dragWorld = new THREE.Vector3();

function HeroMinPluses({ viewport, low, reducedMotion }) {
  const count = low ? HERO_MINI_COUNT.low : HERO_MINI_COUNT.high;
  const collisionPasses = low ? HERO_MINI_COLLISION_PASSES.low : HERO_MINI_COLLISION_PASSES.high;
  const { camera, gl } = useThree();
  const meshRefs = useRef([]);
  const dragRef = useRef([]);
  const draggingFlags = useRef([]);
  const activeDragRef = useRef(null);
  const particlesRef = useRef(null);
  const viewportSizeRef = useRef(null);
  const introElapsedRef = useRef(0);

  if (!particlesRef.current || particlesRef.current.length !== count) {
    particlesRef.current = createSeededMiniPluses(viewport, count, { reducedMotion });
    viewportSizeRef.current = { width: viewport.width, height: viewport.height };
    introElapsedRef.current = 0;
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

    introElapsedRef.current += delta;
    // Wrap past the visible frame (+ radius) so the teleport never shows.
    const xLimit = viewport.width * 0.5 + HERO_MINI_WRAP_PAD;
    const yLimit = viewport.height * 0.5 + HERO_MINI_WRAP_PAD;
    const dragging = draggingFlags.current;
    const glowBase = low ? PLUS_GLOW_OPACITY.low : PLUS_GLOW_OPACITY.high;
    const emissiveBase = low ? PLUS_EMISSIVE_INTENSITY.low : PLUS_EMISSIVE_INTENSITY.high;
    const easeOut = (v) => 1 - Math.pow(1 - v, 4);
    const clamp01 = (v) => Math.min(1, Math.max(0, v));

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
      wrapMiniPosition(p.position, xLimit + (p.radius ?? 0), yLimit + (p.radius ?? 0));
    }

    if (runCollision) {
      for (let pass = 0; pass < collisionPasses; pass++) {
        if (resolveMiniCollisions(particles, dragging, meshRefs.current) === 0) {
          break;
        }
      }
      for (let i = 0; i < count; i++) {
        const p = particles[i];
        wrapMiniPosition(p.position, xLimit + (p.radius ?? 0), yLimit + (p.radius ?? 0));
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

      const reveal = reducedMotion
        ? 1
        : easeOut(
            clamp01(
              (introElapsedRef.current - i * HERO_MINI_REVEAL_STAGGER) / HERO_MINI_REVEAL_DURATION
            )
          );
      const appear = 0.88 + reveal * 0.12;
      group.scale.setScalar(appear);

      const glowMat = group.children[0]?.material;
      const solidMat = group.children[1]?.material;
      if (glowMat) glowMat.opacity = glowBase * reveal;
      if (solidMat) {
        solidMat.transparent = true;
        solidMat.opacity = reveal;
        solidMat.depthWrite = reveal > 0.92;
        solidMat.emissiveIntensity = emissiveBase * (0.4 + reveal * 0.6);
      }
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
            if (el && !reducedMotion && introElapsedRef.current < 0.001) {
              el.scale.setScalar(0.88);
              const glowMat = el.children[0]?.material;
              const solidMat = el.children[1]?.material;
              if (glowMat) glowMat.opacity = 0;
              if (solidMat) {
                solidMat.transparent = true;
                solidMat.opacity = 0;
                solidMat.depthWrite = false;
              }
            }
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

    if (textGroupRef.current) {
      textGroupRef.current.position.y = (1 - textReveal) * 0.22;
      textGroupRef.current.scale.setScalar(0.986 + textReveal * 0.014);
    }
    if (plusGroupRef.current) {
      // No scale/z pop — pluses enter via their own momentum instead.
      plusGroupRef.current.scale.setScalar(1);
      plusGroupRef.current.position.z = 0;
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

      // Wait for title reveal + layout before showing subtitle (avoids jump).
      const subtitleReadyAt = reducedMotion ? 0 : 0.58;
      if (elapsed >= subtitleReadyAt) {
        stage.classList.add("is-title-ready");
      }
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
        <HeroMinPluses viewport={viewport} low={low} reducedMotion={reducedMotion} />
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
