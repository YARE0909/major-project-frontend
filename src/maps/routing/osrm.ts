export type RouteGeometry = {
  coordinates: [number, number][]; // [lat, lng]
  distance: number; // meters
  duration: number; // seconds
};

export async function getOSRMRoute(
  from: [number, number],
  to: [number, number]
): Promise<RouteGeometry | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.routes?.length) return null;

  const route = data.routes[0];

  return {
    coordinates: route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    ),
    distance: route.distance,
    duration: route.duration,
  };
}
