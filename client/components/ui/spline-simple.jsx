import { useEffect, useState } from "react";

export function SplineSimple() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simple approach: just wait a bit and show the Spline viewer
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <spline-viewer
        url="https://prod.spline.design/Yega7tze1J1rKU3d/scene.splinecode"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.4,
          filter: 'blur(0.2px)',
        }}
      />
      
      {/* Simple overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom right, rgba(var(--background), 0.7), rgba(var(--background), 0.5))',
          backdropFilter: 'blur(0.3px)',
        }}
      />
    </div>
  );
} 