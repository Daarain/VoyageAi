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

  const vesselRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const pos = curveObj.getPointAt(Math.min(Math.max(progress, 0), 0.999));
    if (vesselRef.current) vesselRef.current.position.copy(pos);
    if (glowRef.current) glowRef.current.position.copy(pos);
  });

  return (
    <group>
      <line>
        <primitive object={geometry} attach="geometry" />
        <lineDashedMaterial
          color="#22D3EE"
          dashSize={0.05}
          gapSize={0.03}
          transparent
          opacity={0.85}
        />
      </line>
      <mesh ref={vesselRef}>
        <sphereGeometry args={[0.038, 16, 16]} />
        <meshBasicMaterial color="#F1F5F9" />
      </mesh>
      <pointLight ref={glowRef} color="#22D3EE" intensity={2.4} distance={0.9} />
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
