import { useEffect, useState } from "react";

export function SplineDemo() {
  const [splineStatus, setSplineStatus] = useState('checking');

  useEffect(() => {
    const checkSpline = () => {
      try {
        const testElement = document.createElement('spline-viewer');
        if (testElement && testElement.tagName === 'SPLINE-VIEWER') {
          setSplineStatus('available');
        } else {
          setSplineStatus('not-available');
        }
      } catch (error) {
        console.log('Spline not available:', error);
        setSplineStatus('not-available');
      }
    };

    setTimeout(checkSpline, 1500);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Status indicator */}
      <div className="fixed top-4 left-4 z-50 bg-background/95 backdrop-blur p-3 rounded-lg border text-xs">
        <div className="font-bold mb-1">Your 3D Model</div>
        <div className={splineStatus === 'available' ? 'text-green-500' : 'text-orange-500'}>
          {splineStatus === 'checking' && 'Loading your 3D model...'}
          {splineStatus === 'available' && '✅ Your 3D model loaded'}
          {splineStatus === 'not-available' && '⚠️ 3D model not available'}
        </div>
      </div>

      {/* Your specific Spline 3D model */}
      {splineStatus === 'available' && (
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
      )}

      {/* Enhanced gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(var(--primary), 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(var(--secondary), 0.15) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(var(--accent), 0.1) 0%, transparent 70%),
            linear-gradient(135deg, 
              rgba(var(--primary), 0.08) 0%, 
              rgba(var(--secondary), 0.08) 50%, 
              rgba(var(--accent), 0.08) 100%
            )
          `,
        }}
      />
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/35 rounded-full floating-particle" style={{ animationDelay: '0s' }} />
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-secondary/45 rounded-full floating-particle" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-accent/40 rounded-full floating-particle" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary/30 rounded-full floating-particle" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-secondary/35 rounded-full floating-particle" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/6 right-1/6 w-1 h-1 bg-accent/25 rounded-full floating-particle" style={{ animationDelay: '5s' }} />
      </div>

      {/* Text overlay for readability */}
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