import { useEffect, useState } from "react";

function getViewport() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function useViewport() {
  const [viewport, setViewport] = useState(getViewport);

  useEffect(() => {
    const onResize = () => setViewport(getViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return viewport;
}
