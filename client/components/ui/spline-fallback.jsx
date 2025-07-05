import { useEffect, useState } from "react";

export function SplineFallback() {
  const [splineStatus, setSplineStatus] = useState('checking');

  useEffect(() => {
    // Check if Spline is available
    const checkSpline = () => {
      try {
        // Try to create a spline-viewer element
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

    // Wait for DOM to be ready
    setTimeout(checkSpline, 1000);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Status indicator */}
      <div className="fixed top-4 left-4 z-50 bg-background/95 backdrop-blur p-3 rounded-lg border text-xs">
        <div className="font-bold mb-1">Spline Status</div>
        <div className={splineStatus === 'available' ? 'text-green-500' : 'text-orange-500'}>
          {splineStatus === 'checking' && 'Checking...'}
          {splineStatus === 'available' && '✅ Available'}
          {splineStatus === 'not-available' && '⚠️ Not Available'}
        </div>
      </div>

      {/* Try to render Spline if available */}
      {splineStatus === 'available' && (
        <spline-viewer
          url="https://prod.spline.design/Yega7tze1J1rKU3d/scene.splinecode"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.3,
            filter: 'blur(0.2px)',
          }}
        />
      )}

      {/* Enhanced gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(var(--primary), 0.12) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(var(--secondary), 0.12) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(var(--accent), 0.08) 0%, transparent 70%),
            linear-gradient(135deg, 
              rgba(var(--primary), 0.06) 0%, 
              rgba(var(--secondary), 0.06) 50%, 
              rgba(var(--accent), 0.06) 100%
            )
          `,
        }}
      />
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full floating-particle" style={{ animationDelay: '0s' }} />
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-secondary/40 rounded-full floating-particle" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-accent/35 rounded-full floating-particle" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary/25 rounded-full floating-particle" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-secondary/30 rounded-full floating-particle" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/6 right-1/6 w-1 h-1 bg-accent/20 rounded-full floating-particle" style={{ animationDelay: '5s' }} />
      </div>

      {/* Text overlay for readability */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom right, rgba(var(--background), 0.75), rgba(var(--background), 0.55))',
          backdropFilter: 'blur(0.3px)',
        }}
      />
    </div>
  );
} 