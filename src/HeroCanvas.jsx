import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, MeshTransmissionMaterial, Text } from "@react-three/drei";

/** "low" = mobile / coarse pointer / reduced motion / low-memory heuristics — cheaper glass + fewer mesh segments. */
const HeroPerfContext = createContext({ tier: "high" });

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

/** Pull hero content below the fixed header — fraction of Drei viewport height (replaces DOM padding). */
const HERO_HEADER_CLEARANCE_RATIO = 0.1;
/** Tiny upward nudge so the last headline line stays inside the orthographic framebuffer (pairs with taller CSS stage). */
const HERO_LAYOUT_BOTTOM_AIR_RATIO = 0.035;
/** Moves headline + hero plus downward (subtract from anchor Y — smaller Y sits lower on screen). */
const HERO_LAYOUT_VERTICAL_OFFSET_RATIO = 0.1;

const HERO_HEADLINE_LINES = ["DESIGN THAT", "ELEVATES", "YOUR", "AI PRODUCTS"];
const FG_LINE_START_INDEX = 2;

const HERO_COMMON_TEXT_PROPS = {
  font: HERO_CANVAS_FONT,
  anchorX: "left",
  anchorY: "top",
  letterSpacing: -0.045,
  color: "#e9eef8"
};

/** Silhouette shared by hero orb + burst minis (`half`/`arm` match prior Extrude meshes). */
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

/** Single factory for ExtrudeGeometry(+ center) — replaces duplicated builders in hero + SplitBurst */
function extrudeRoundedPlus(cornerRadius, extrudeOverrides) {
  const shape = buildPlusShape(cornerRadius);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: 0.58,
    bevelEnabled: true,
    ...extrudeOverrides
  });
  g.center();
  return g;
}

function readScrollProgress(scrollRef) {
  const s = scrollRef?.current;
  if (s === null || s === undefined) return 0;
  if (typeof s !== "object") return typeof s === "number" ? s : 0;
  return typeof s.progress === "number" ? s.progress : 0;
}

function PlusMesh({
  position,
  scale = 1,
  speed = 1,
  main = false,
  micro = false,
  scrollRef,
  draggable = false,
  onDragStart,
  onDragChange,
  onDragEnd,
  onDoubleActivate,
  visible = true,
  qualityTier = "high"
}) {
  const low = qualityTier === "low";
  const ref = useRef(null);
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef(new THREE.Vector3(0, 0, 0));
  const pressRef = useRef({ x: 0, y: 0, moved: false, lastTapTs: -1000 });
  const { pointer } = useThree();
  const geometry = useMemo(() => {
    const r = main ? 0.16 : micro ? 0.07 : 0.1;
    return extrudeRoundedPlus(r, {
      bevelThickness: main ? 0.18 : micro ? 0.11 : 0.18,
      bevelSize: main ? 0.18 : micro ? 0.11 : 0.18,
      bevelSegments: main ? (low ? 10 : 32) : micro ? 3 : 10,
      curveSegments: main ? (low ? 38 : 96) : micro ? 10 : 28
    });
  }, [low, main, micro]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    const scroll = readScrollProgress(scrollRef);
    ref.current.rotation.x = Math.sin(t * speed) * 0.16 + pointer.y * 0.12;
    ref.current.rotation.y = Math.cos(t * speed * 0.8) * 0.18 + pointer.x * 0.14;
    ref.current.rotation.z = Math.cos(t * speed * 0.55) * 0.08;
    ref.current.position.set(position[0], position[1], position[2]);
    ref.current.rotation.z += scroll * (main ? 0.01 : micro ? 0.004 : 0.006);
    ref.current.scale.setScalar(scale * (1 - scroll * (main ? 0.15 : micro ? 0.04 : 0.08)));
  });

  const handlePointerDown = (event) => {
    if (!draggable) return;
    event.stopPropagation();
    draggingRef.current = true;
    event.target.setPointerCapture(event.pointerId);
    pressRef.current.x = event.clientX ?? 0;
    pressRef.current.y = event.clientY ?? 0;
    pressRef.current.moved = false;
    onDragStart?.(event.timeStamp);
    const p = event.unprojectedPoint || event.point;
    dragOffsetRef.current.set(
      ref.current.position.x - p.x,
      ref.current.position.y - p.y,
      0
    );
  };

  const handlePointerMove = (event) => {
    if (!draggable || !draggingRef.current || !onDragChange) return;
    const dx = (event.clientX ?? 0) - pressRef.current.x;
    const dy = (event.clientY ?? 0) - pressRef.current.y;
    if (Math.hypot(dx, dy) > 6) pressRef.current.moved = true;
    const p = event.unprojectedPoint || event.point;
    onDragChange(
      [
      p.x + dragOffsetRef.current.x,
      p.y + dragOffsetRef.current.y,
      position[2]
      ],
      event.timeStamp
    );
  };

  const handlePointerUp = (event) => {
    if (!draggable) return;
    draggingRef.current = false;
    event.target.releasePointerCapture(event.pointerId);
    onDragEnd?.(event.timeStamp);
    if (!pressRef.current.moved) {
      const now = event.timeStamp ?? 0;
      if (now - pressRef.current.lastTapTs < 320) {
        onDoubleActivate?.();
        pressRef.current.lastTapTs = -1000;
      } else {
        pressRef.current.lastTapTs = now;
      }
    }
  };

  return (
    <mesh
      ref={ref}
      geometry={geometry}
      position={position}
      scale={scale}
      visible={visible}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <MeshTransmissionMaterial
        transmission={1}
        roughness={0}
        thickness={main ? 1.6 : micro ? 0.25 : 0.5}
        ior={main ? 1.08 : micro ? 1.03 : 1.04}
        chromaticAberration={main ? (low ? 0.012 : 0.025) : 0}
        anisotropy={low ? 0.04 : 0.08}
        distortion={main ? (low ? 0.04 : 0.08) : 0}
        distortionScale={main ? (low ? 0.1 : 0.18) : 0}
        temporalDistortion={main ? (low ? 0 : 0.05) : 0}
        backside
        backsideThickness={main ? 0.7 : micro ? 0.12 : 0.2}
        samples={main ? (low ? 3 : 5) : micro ? 1 : 2}
        resolution={main ? (low ? 128 : 384) : micro ? 64 : 96}
        clearcoat={1}
        clearcoatRoughness={0}
        envMapIntensity={main ? 0.7 : micro ? 0.25 : 0.35}
        color="#ffffff"
      />
    </mesh>
  );
}

function SplitBurst({ origin, viewport, qualityTier = "high" }) {
  const low = qualityTier === "low";
  const refs = useRef([]);
  const dragRef = useRef([]);
  const particleState = useMemo(() => {
    const dirs = [
      [0.85, 0.55],
      [-0.78, 0.62],
      [0.72, -0.74],
      [-0.8, -0.58]
    ];
    return dirs.map(([x, y], i) => ({
      position: new THREE.Vector3(origin[0], origin[1], origin[2]),
      velocity: new THREE.Vector3(x, y, 0).normalize().multiplyScalar(5.4 + i * 0.32),
      spin: (i % 2 ? 1 : -1) * (0.9 + i * 0.2)
    }));
  }, [origin]);

  const geometry = useMemo(
    () =>
      extrudeRoundedPlus(0.1, {
        bevelThickness: 0.11,
        bevelSize: 0.11,
        bevelSegments: low ? 2 : 3,
        curveSegments: low ? 6 : 10
      }),
    [low]
  );

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame((_, delta) => {
    const xLimit = viewport.width * 0.55;
    const yLimit = viewport.height * 0.55;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const p = particleState[i];
      const drag = dragRef.current[i];
      if (drag?.dragging) {
        mesh.position.set(drag.x, drag.y, p.position.z);
        return;
      }
      p.position.addScaledVector(p.velocity, delta);
      p.velocity.multiplyScalar(0.995);
      if (p.position.x > xLimit) p.position.x = -xLimit;
      if (p.position.x < -xLimit) p.position.x = xLimit;
      if (p.position.y > yLimit) p.position.y = -yLimit;
      if (p.position.y < -yLimit) p.position.y = yLimit;
      mesh.position.copy(p.position);
      mesh.rotation.x += delta * p.spin * 0.55;
      mesh.rotation.y += delta * p.spin * 0.9;
      mesh.rotation.z += delta * p.spin * 0.35;
    });
  });

  const handlePointerDown = (i, event) => {
    event.stopPropagation();
    event.target.setPointerCapture(event.pointerId);
    const p = event.unprojectedPoint || event.point;
    if (!dragRef.current[i]) {
      dragRef.current[i] = { dragging: false, x: p.x, y: p.y, offsetX: 0, offsetY: 0, lastTs: 0 };
    }
    const state = dragRef.current[i];
    state.dragging = true;
    state.offsetX = particleState[i].position.x - p.x;
    state.offsetY = particleState[i].position.y - p.y;
    state.x = particleState[i].position.x;
    state.y = particleState[i].position.y;
    state.lastTs = event.timeStamp ?? 0;
  };

  const handlePointerMove = (i, event) => {
    const state = dragRef.current[i];
    if (!state?.dragging) return;
    const p = event.unprojectedPoint || event.point;
    const nextX = p.x + state.offsetX;
    const nextY = p.y + state.offsetY;
    const now = event.timeStamp ?? state.lastTs;
    const dt = Math.max(0.001, (now - state.lastTs) / 1000);
    particleState[i].velocity.x = (nextX - state.x) / dt;
    particleState[i].velocity.y = (nextY - state.y) / dt;
    state.x = nextX;
    state.y = nextY;
    state.lastTs = now;
    particleState[i].position.x = nextX;
    particleState[i].position.y = nextY;
  };

  const handlePointerUp = (i, event) => {
    const state = dragRef.current[i];
    if (!state?.dragging) return;
    state.dragging = false;
    particleState[i].velocity.multiplyScalar(0.55);
    event.target.releasePointerCapture(event.pointerId);
  };

  return (
    <group>
      {particleState.map((p, i) => (
        <mesh
          key={`split-${i}`}
          ref={(el) => {
            refs.current[i] = el;
          }}
          geometry={geometry}
          position={[p.position.x, p.position.y, p.position.z]}
          scale={0.55}
          onPointerDown={(event) => handlePointerDown(i, event)}
          onPointerMove={(event) => handlePointerMove(i, event)}
          onPointerUp={(event) => handlePointerUp(i, event)}
        >
          <MeshTransmissionMaterial
            transmission={1}
            roughness={0}
            thickness={0.26}
            ior={1.02}
            chromaticAberration={low ? 0.08 : 0.18}
            anisotropy={0.02}
            distortion={0}
            distortionScale={0}
            temporalDistortion={0}
            clearcoat={1}
            clearcoatRoughness={0}
            envMapIntensity={0.35}
            samples={low ? 3 : 6}
            resolution={low ? 128 : 256}
            color="#ffffff"
          />
        </mesh>
      ))}
    </group>
  );
}

function HeroCanvasScene({ scrollRef }) {
  const { tier } = useContext(HeroPerfContext);
  const { viewport } = useThree();
  const sceneParallaxRef = useRef(null);
  const fontSize = Math.min(1.28, viewport.width * 0.145);
  const lineGap = fontSize * 0.92;
  const left = -viewport.width / 2 + 0.25;
  const top =
    viewport.height / 2 -
    0.15 -
    viewport.height * HERO_HEADER_CLEARANCE_RATIO +
    viewport.height * HERO_LAYOUT_BOTTOM_AIR_RATIO -
    viewport.height * HERO_LAYOUT_VERTICAL_OFFSET_RATIO;
  const initialPlusPosition = useMemo(() => [left + fontSize * 8, top - lineGap * 2.05, 0.35], [
    left,
    top,
    fontSize,
    lineGap
  ]);
  const [plusPosition, setPlusPosition] = useState(initialPlusPosition);
  const [burstState, setBurstState] = useState(null);
  const [hideMainPlus, setHideMainPlus] = useState(false);
  const motionRef = useRef({
    dragging: false,
    easing: false,
    lastTs: 0,
    lastX: 0,
    lastY: 0,
    velocityX: 0,
    velocityY: 0,
    targetX: 0,
    targetY: 0
  });

  const wrapPosition = useCallback((x, y) => {
    const xLimit = viewport.width * 0.52;
    const yLimit = viewport.height * 0.52;
    const wrappedX = x > xLimit ? -xLimit : x < -xLimit ? xLimit : x;
    const wrappedY = y > yLimit ? -yLimit : y < -yLimit ? yLimit : y;
    return [wrappedX, wrappedY];
  }, [viewport.height, viewport.width]);

  const handleDragStart = (ts) => {
    const motion = motionRef.current;
    motion.dragging = true;
    motion.easing = false;
    motion.velocityX = 0;
    motion.velocityY = 0;
    motion.lastTs = ts ?? 0;
    motion.lastX = plusPosition[0];
    motion.lastY = plusPosition[1];
  };

  const handleDragMove = (nextPosition, ts) => {
    const motion = motionRef.current;
    const [wrappedX, wrappedY] = wrapPosition(nextPosition[0], nextPosition[1]);
    setPlusPosition([wrappedX, wrappedY, plusPosition[2]]);

    const now = ts ?? motion.lastTs;
    const dt = Math.max(0.001, (now - motion.lastTs) / 1000);
    motion.velocityX = (wrappedX - motion.lastX) / dt;
    motion.velocityY = (wrappedY - motion.lastY) / dt;
    motion.lastX = wrappedX;
    motion.lastY = wrappedY;
    motion.lastTs = now;
  };

  const handleDragEnd = () => {
    const motion = motionRef.current;
    motion.dragging = false;
    motion.easing = true;
    motion.targetX = plusPosition[0] + motion.velocityX * 0.15;
    motion.targetY = plusPosition[1] + motion.velocityY * 0.15;
    [motion.targetX, motion.targetY] = wrapPosition(motion.targetX, motion.targetY);
  };

  const triggerSplit = () => {
    if (burstState) return;
    setHideMainPlus(true);
    setBurstState({
      id: Date.now(),
      origin: [plusPosition[0], plusPosition[1], plusPosition[2]]
    });
  };

  useFrame((_, delta) => {
    const data = scrollRef?.current;
    const sy =
      typeof data === "object" && data !== null && data !== undefined
        ? data.scrollYPixels ?? 0
        : 0;
    const ih = typeof window !== "undefined" ? window.innerHeight : 1;
    const lift = (sy / Math.max(ih, 1)) * viewport.height * 0.42;
    if (sceneParallaxRef.current) {
      sceneParallaxRef.current.position.y = lift;
    }

    const motion = motionRef.current;
    if (motion.dragging || !motion.easing) return;

    const currentX = plusPosition[0];
    const currentY = plusPosition[1];
    const [wrappedTargetX, wrappedTargetY] = wrapPosition(motion.targetX, motion.targetY);
    motion.targetX = wrappedTargetX;
    motion.targetY = wrappedTargetY;

    motion.velocityX += (motion.targetX - currentX) * 10 * delta;
    motion.velocityY += (motion.targetY - currentY) * 10 * delta;
    const damping = Math.exp(-7 * delta);
    motion.velocityX *= damping;
    motion.velocityY *= damping;

    let nextX = currentX + motion.velocityX * delta;
    let nextY = currentY + motion.velocityY * delta;
    [nextX, nextY] = wrapPosition(nextX, nextY);
    setPlusPosition([nextX, nextY, plusPosition[2]]);

    const distance = Math.hypot(motion.targetX - nextX, motion.targetY - nextY);
    const speed = Math.hypot(motion.velocityX, motion.velocityY);
    if (distance < 0.02 && speed < 0.02) {
      motion.easing = false;
      motion.velocityX = 0;
      motion.velocityY = 0;
      setPlusPosition([motion.targetX, motion.targetY, plusPosition[2]]);
    }
  });

  return (
    <group ref={sceneParallaxRef}>
      <ambientLight intensity={0.8} />
      <directionalLight intensity={2.4} position={[3, 4, 5]} />
      <directionalLight intensity={1.2} position={[-3, -2, 3]} color="#e8f3ff" />
      <Environment preset="studio" resolution={tier === "low" ? 128 : 512} />

      {HERO_HEADLINE_LINES.map((line, index) => (
        <Text
          key={`bg-${line}`}
          position={[left, top - lineGap * index, -1.15]}
          fontSize={fontSize}
          {...HERO_COMMON_TEXT_PROPS}
        >
          {line}
        </Text>
      ))}

      <PlusMesh
        position={plusPosition}
        scale={1.45}
        speed={0.85}
        main
        qualityTier={tier}
        scrollRef={scrollRef}
        draggable
        onDragStart={handleDragStart}
        onDragChange={handleDragMove}
        onDragEnd={handleDragEnd}
        onDoubleActivate={triggerSplit}
        visible={!hideMainPlus}
      />
      {burstState ? (
        <SplitBurst
          key={burstState.id}
          origin={burstState.origin}
          viewport={viewport}
          qualityTier={tier}
        />
      ) : null}
      {HERO_HEADLINE_LINES.slice(FG_LINE_START_INDEX).map((line, i) => (
        <Text
          key={`fg-${line}`}
          position={[left, top - lineGap * (i + FG_LINE_START_INDEX), 0.8]}
          fontSize={fontSize}
          {...HERO_COMMON_TEXT_PROPS}
        >
          {line}
        </Text>
      ))}
    </group>
  );
}

export default function HeroTitleCanvas({ scrollRef }) {
  const [tier, setTier] = useState(() => computeHeroTier());
  const [tabVisible, setTabVisible] = useState(() =>
    typeof document === "undefined" ? true : !document.hidden
  );

  useEffect(() => {
    const syncTier = () => setTier(computeHeroTier());
    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqCoarse = window.matchMedia("(pointer: coarse)");
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

  const dpr = useMemo(() => {
    if (tier === "low") return [1, 1];
    const pr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    return [1, Math.min(pr, 1.35)];
  }, [tier]);

  const low = tier === "low";
  const perfValue = useMemo(() => ({ tier }), [tier]);

  return (
    <HeroPerfContext.Provider value={perfValue}>
      <Canvas
        className="hero-title-canvas"
        orthographic
        frameloop={tabVisible ? "always" : "never"}
        dpr={dpr}
        gl={{
          antialias: !low,
          powerPreference: "high-performance",
          alpha: true,
          premultipliedAlpha: false,
          stencil: false
        }}
        camera={{ zoom: 100, position: [0, 0, 10] }}
      >
        <HeroCanvasScene scrollRef={scrollRef} />
      </Canvas>
    </HeroPerfContext.Provider>
  );
}
