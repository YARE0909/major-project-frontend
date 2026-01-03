import { useEffect, useState } from "react";
import { getOSRMRoute, RouteGeometry } from "../routing/osrm";

export function useOSRMRoute(
  from?: [number, number],
  to?: [number, number]
) {
  const [route, setRoute] = useState<RouteGeometry | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!from || !to) return;

    let cancelled = false;
    setLoading(true);

    getOSRMRoute(from, to)
      .then((res) => {
        if (!cancelled) setRoute(res);
      })
      .finally(() => setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [from?.[0], from?.[1], to?.[0], to?.[1]]);

  return { route, loading };
}
