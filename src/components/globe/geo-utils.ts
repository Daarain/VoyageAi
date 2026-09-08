import * as THREE from "three";

/** Converts latitude/longitude (degrees) to a 3D point on a sphere of given radius. */
export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * Builds a smooth arc of points between two lat/lng pairs, lifted above the
 * sphere surface at its midpoint to read as a "flight path" rather than a
 * line drawn directly on the globe surface.
 */
export function buildArcPoints(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  radius: number,
  segments = 96,
  liftFactor = 0.32
): THREE.Vector3[] {
  const start = latLngToVector3(originLat, originLng, radius);
  const end = latLngToVector3(destLat, destLng, radius);

  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const midLength = midpoint.length();
  midpoint.normalize().multiplyScalar(radius * (1 + liftFactor));

  // Guard against a degenerate midpoint when origin/destination are near-antipodal
  if (midLength < 0.001) {
    midpoint.set(0, radius * (1 + liftFactor), 0);
  }

  const curve = new THREE.QuadraticBezierCurve3(start, midpoint, end);
  return curve.getPoints(segments);
}
