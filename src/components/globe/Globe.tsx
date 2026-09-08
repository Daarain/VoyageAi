"use client";

import { Component, Suspense, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { latLngToVector3, buildArcPoints } from "./geo-utils";
import type { Port } from "@/lib/types";

const RADIUS = 2.4;

class MeshErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: unknown) {
    console.warn("3D Texture loader caught, falling back to procedural sphere:", err);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// Procedural high-contrast fallback earth sphere
function FallbackEarthSphere() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[RADIUS, 64, 64]} />
        <meshStandardMaterial
          color="#0B1220"
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>
      <mesh scale={1.002}>
        <sphereGeometry args={[RADIUS, 24, 24]} />
        <meshBasicMaterial
          color="#1E293B"
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}

function GlobeCore() {
  const [dayMap, nightMap, specularMap] = useLoader(THREE.TextureLoader, [
    "/textures/earth_day.jpg",
    "/textures/earth_lights.png",
    "/textures/earth_specular.jpg",
  ]);

  return (
    <mesh>
      <sphereGeometry args={[RADIUS, 96, 96]} />
      <meshStandardMaterial
        map={dayMap}
        emissiveMap={nightMap}
        emissive="#ffe9b0"
        emissiveIntensity={1.1}
        roughnessMap={specularMap}
        roughness={0.75}
        metalness={0.05}
      />
    </mesh>
  );
}

function CloudLayer() {
  const cloudMap = useLoader(THREE.TextureLoader, "/textures/earth_clouds.png");
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.012;
  });

  return (
    <mesh ref={ref} scale={1.006}>
      <sphereGeometry args={[RADIUS, 64, 64]} />
      <meshStandardMaterial map={cloudMap} transparent opacity={0.35} depthWrite={false} />
    </mesh>
  );
}

function Atmosphere() {
  return (
    <mesh scale={1.09}>
      <sphereGeometry args={[RADIUS, 64, 64]} />
      <meshBasicMaterial color="#22D3EE" transparent opacity={0.07} side={THREE.BackSide} />
    </mesh>
  );
}

function PortMarker({
  lat,
  lng,
  color = "#22D3EE",
}: {
  lat: number;
  lng: number;
  color?: string;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const position = useMemo(() => latLngToVector3(lat, lng, RADIUS * 1.008), [lat, lng]);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const t = (clock.getElapsedTime() % 2) / 2;
      ringRef.current.scale.setScalar(1 + t * 1.8);
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.6 * (1 - t);
    }
  });

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.028, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.035, 0.045, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function RealisticCargoVessel() {
  const bowGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const w = 0.038;
    const h = 0.038;
    const z0 = 0.10;
    const z1 = 0.16;
    const positions = new Float32Array([
      // Top deck face (0, 1, 2)
      w, h, z0, -w, h, z0, 0, h, z1,
      // Keel / bottom face (3, 5, 4)
      w * 0.85, 0, z0, 0, 0, z1 * 0.95, -w * 0.85, 0, z0,
      // Starboard hull flare
      w, h, z0, 0, h, z1, 0, 0, z1 * 0.95,
      w, h, z0, 0, 0, z1 * 0.95, w * 0.85, 0, z0,
      // Port hull flare
      -w, h, z0, -w * 0.85, 0, z0, 0, 0, z1 * 0.95,
      -w, h, z0, 0, 0, z1 * 0.95, 0, h, z1,
    ]);
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.computeVertexNormals();
    return geom;
  }, []);

  const lowerBowGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const w = 0.036;
    const h = 0.010;
    const z0 = 0.10;
    const z1 = 0.155;
    const positions = new Float32Array([
      w, h, z0, -w, h, z0, 0, h, z1,
      w * 0.8, 0, z0, 0, 0, z1 * 0.9, -w * 0.8, 0, z0,
      w, h, z0, 0, h, z1, 0, 0, z1 * 0.9,
      w, h, z0, 0, 0, z1 * 0.9, w * 0.8, 0, z0,
      -w, h, z0, -w * 0.8, 0, z0, 0, 0, z1 * 0.9,
      -w, h, z0, 0, 0, z1 * 0.9, 0, h, z1,
    ]);
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.computeVertexNormals();
    return geom;
  }, []);

  return (
    <group>
      {/* 1. Main Hull (Midships & Cargo Hold Bay) in Dark Marine Steel */}
      <mesh position={[0, 0.019, 0]}>
        <boxGeometry args={[0.076, 0.038, 0.20]} />
        <meshStandardMaterial color="#1E293B" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* 2. Red Anti-Fouling Waterline Keel Base */}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[0.074, 0.010, 0.20]} />
        <meshStandardMaterial color="#991B1B" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* 3. Tapered Bow Prisms (Upper Steel + Lower Red Waterline) */}
      <mesh geometry={bowGeometry}>
        <meshStandardMaterial color="#1E293B" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh geometry={lowerBowGeometry}>
        <meshStandardMaterial color="#991B1B" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* 4. Bulbous Bow at Forefoot */}
      <mesh position={[0, 0.008, 0.15]} scale={[1, 0.8, 1.8]}>
        <sphereGeometry args={[0.012, 12, 12]} />
        <meshStandardMaterial color="#991B1B" roughness={0.6} />
      </mesh>

      {/* 5. Transom Stern / Aft Counter */}
      <mesh position={[0, 0.019, -0.117]}>
        <boxGeometry args={[0.070, 0.038, 0.035]} />
        <meshStandardMaterial color="#1E293B" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* 6. Cargo Holds & Multi-Color Container Bays */}
      {/* Bay 1 - Fore Hold (Terracotta / Oxide) */}
      <mesh position={[0, 0.043, 0.070]}>
        <boxGeometry args={[0.052, 0.016, 0.036]} />
        <meshStandardMaterial color="#C2410C" roughness={0.6} />
      </mesh>
      {/* Bay 2 - Mid-Fore Hold (Maritime Royal Blue) */}
      <mesh position={[0, 0.044, 0.024]}>
        <boxGeometry args={[0.054, 0.018, 0.036]} />
        <meshStandardMaterial color="#1D4ED8" roughness={0.5} />
      </mesh>
      {/* Bay 3 - Mid-Aft Hold (Deep Sea Evergreen) */}
      <mesh position={[0, 0.043, -0.022]}>
        <boxGeometry args={[0.054, 0.017, 0.036]} />
        <meshStandardMaterial color="#047857" roughness={0.6} />
      </mesh>
      {/* Bay 4 - Aft Hold (Industrial Safety Gold/Orange) */}
      <mesh position={[0, 0.043, -0.068]}>
        <boxGeometry args={[0.052, 0.016, 0.036]} />
        <meshStandardMaterial color="#D97706" roughness={0.6} />
      </mesh>

      {/* 7. Electro-Hydraulic Cargo Cranes between Bays */}
      {/* Crane 1 */}
      <group position={[0, 0.040, 0.047]}>
        <mesh position={[0, 0.011, 0]}>
          <cylinderGeometry args={[0.0035, 0.004, 0.022, 10]} />
          <meshStandardMaterial color="#F59E0B" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.020, 0.010]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.0025, 0.0025, 0.024]} />
          <meshStandardMaterial color="#F59E0B" roughness={0.4} />
        </mesh>
      </group>
      {/* Crane 2 */}
      <group position={[0, 0.040, 0.001]}>
        <mesh position={[0, 0.011, 0]}>
          <cylinderGeometry args={[0.0035, 0.004, 0.022, 10]} />
          <meshStandardMaterial color="#F59E0B" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.020, 0.010]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.0025, 0.0025, 0.024]} />
          <meshStandardMaterial color="#F59E0B" roughness={0.4} />
        </mesh>
      </group>
      {/* Crane 3 */}
      <group position={[0, 0.040, -0.045]}>
        <mesh position={[0, 0.011, 0]}>
          <cylinderGeometry args={[0.0035, 0.004, 0.022, 10]} />
          <meshStandardMaterial color="#F59E0B" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.020, 0.010]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.0025, 0.0025, 0.024]} />
          <meshStandardMaterial color="#F59E0B" roughness={0.4} />
        </mesh>
      </group>

      {/* 8. Superstructure & Accommodation Bridge Tower (Aft) */}
      <mesh position={[0, 0.052, -0.115]}>
        <boxGeometry args={[0.056, 0.032, 0.038]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.35} />
      </mesh>

      {/* Bridge Wings & Wheelhouse Navigation Deck */}
      <mesh position={[0, 0.071, -0.112]}>
        <boxGeometry args={[0.072, 0.010, 0.030]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.35} />
      </mesh>

      {/* Wheelhouse Tinted Panoramic Glass Visor */}
      <mesh position={[0, 0.071, -0.096]}>
        <boxGeometry args={[0.066, 0.007, 0.006]} />
        <meshBasicMaterial color="#0B132B" />
      </mesh>

      {/* Funnel / Smokestack with Marine Red & Black Crown */}
      <mesh position={[0, 0.072, -0.132]} rotation={[-0.18, 0, 0]}>
        <cylinderGeometry args={[0.0065, 0.0075, 0.026, 16]} />
        <meshStandardMaterial color="#DC2626" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.084, -0.134]} rotation={[-0.18, 0, 0]}>
        <cylinderGeometry args={[0.0068, 0.0068, 0.006, 16]} />
        <meshBasicMaterial color="#0F172A" />
      </mesh>

      {/* Main Radar Mast Needle & Yardarm */}
      <group position={[0, 0.088, -0.110]}>
        <mesh position={[0, 0.009, 0]}>
          <cylinderGeometry args={[0.0016, 0.0022, 0.022, 8]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.014, 0]}>
          <boxGeometry args={[0.026, 0.002, 0.002]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.7} roughness={0.25} />
        </mesh>
      </group>

      {/* 9. Maritime Navigation Lights */}
      {/* Port Side Navigation Light (Ruby Red) */}
      <mesh position={[-0.037, 0.071, -0.108]}>
        <sphereGeometry args={[0.004, 10, 10]} />
        <meshBasicMaterial color="#EF4444" />
      </mesh>
      {/* Starboard Side Navigation Light (Emerald Green) */}
      <mesh position={[0.037, 0.071, -0.108]}>
        <sphereGeometry args={[0.004, 10, 10]} />
        <meshBasicMaterial color="#10B981" />
      </mesh>
      {/* Forecastle Masthead Steaming Light (Bright White) */}
      <mesh position={[0, 0.050, 0.145]}>
        <sphereGeometry args={[0.0035, 10, 10]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      {/* Stern Navigation Light (Warm Amber/White) */}
      <mesh position={[0, 0.042, -0.134]}>
        <sphereGeometry args={[0.0032, 10, 10]} />
        <meshBasicMaterial color="#FEF08A" />
      </mesh>

      {/* 10. Subtle Vessel Illumination & Soft Contact Aura */}
      <pointLight color="#E0F2FE" intensity={1.2} distance={0.8} position={[0, 0.09, 0]} />
      <mesh position={[0, -0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.10, 0.32]} />
        <meshBasicMaterial color="#22D3EE" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function RouteArc({
  origin,
  destination,
  progress,
}: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  progress: number;
}) {
  const points = useMemo(
    () => buildArcPoints(origin.lat, origin.lng, destination.lat, destination.lng, RADIUS),
    [origin, destination]
  );

  const curveObj = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  const tubeGeometry = useMemo(
    () => new THREE.TubeGeometry(curveObj, 96, 0.007, 8, false),
    [curveObj]
  );

  const vesselGroupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!vesselGroupRef.current) return;

    const t = Math.min(Math.max(progress, 0.001), 0.998);
    const pos = curveObj.getPointAt(t);

    // 1. Surface normal vector pointing away from earth center (Up)
    const up = pos.clone().normalize();

    // 2. Tangent vector along travel direction (Forward)
    const tNext = Math.min(t + 0.004, 1.0);
    const posNext = curveObj.getPointAt(tNext);
    const forward = posNext.clone().sub(pos).normalize();

    // 3. Starboard / Right vector perpendicular to up and forward
    const right = new THREE.Vector3().crossVectors(up, forward).normalize();

    // 4. Re-orthogonalize true forward vector
    const trueForward = new THREE.Vector3().crossVectors(right, up).normalize();

    // 5. Build orthonormal basis matrix and set vessel group orientation
    const matrix = new THREE.Matrix4();
    matrix.makeBasis(right, up, trueForward);

    vesselGroupRef.current.position.copy(pos);
    vesselGroupRef.current.quaternion.setFromRotationMatrix(matrix);
  });

  return (
    <group>
      {/* Luminous Glowing Route Tube Underlayer */}
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial color="#06B6D4" transparent opacity={0.55} />
      </mesh>

      {/* Core Glowing Cyan Dashed Route Line */}
      <line>
        <primitive object={geometry} attach="geometry" />
        <lineDashedMaterial
          color="#A5F3FC"
          dashSize={0.06}
          gapSize={0.03}
          transparent
          opacity={0.95}
        />
      </line>

      {/* Realistic 3D Miniature Cargo Ship */}
      <group ref={vesselGroupRef}>
        <RealisticCargoVessel />
      </group>
    </group>
  );
}

function GlobeLoadingPlaceholder() {
  return (
    <mesh>
      <sphereGeometry args={[RADIUS, 32, 32]} />
      <meshBasicMaterial color="#0B1220" />
    </mesh>
  );
}

function Scene({
  origin,
  destination,
  progress,
}: {
  origin: Port;
  destination: Port;
  progress: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.025;
    }
  });

  return (
    <>
      <color attach="background" args={["#050810"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 2, 3]} intensity={1.4} color="#FFF8E7" />
      <Stars radius={80} depth={40} count={2500} factor={2.5} saturation={0} fade speed={0.4} />
      <group
        ref={groupRef}
        onPointerDown={() => setAutoRotate(false)}
        onPointerUp={() => setAutoRotate(true)}
      >
        <MeshErrorBoundary fallback={<FallbackEarthSphere />}>
          <Suspense fallback={<GlobeLoadingPlaceholder />}>
            <GlobeCore />
            <CloudLayer />
          </Suspense>
        </MeshErrorBoundary>
        <Atmosphere />
        <PortMarker lat={origin.lat} lng={origin.lng} color="#F59E0B" />
        <PortMarker lat={destination.lat} lng={destination.lng} color="#22D3EE" />
        <RouteArc
          origin={{ lat: origin.lat, lng: origin.lng }}
          destination={{ lat: destination.lat, lng: destination.lng }}
          progress={progress}
        />
      </group>
      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={3.5}
        maxDistance={9}
        rotateSpeed={0.4}
        zoomSpeed={0.6}
      />
    </>
  );
}

export function Globe({
  origin,
  destination,
  progress,
}: {
  origin: Port;
  destination: Port;
  progress: number;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.2, 6.5], fov: 42 }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#050810", 1)}
    >
      <Scene origin={origin} destination={destination} progress={progress} />
    </Canvas>
  );
}
