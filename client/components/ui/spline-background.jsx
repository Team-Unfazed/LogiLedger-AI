import { useEffect, useRef, useState } from "react";

export function SplineBackground() {
  const splineRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Wait for the DOM to be ready
    const timer = setTimeout(() => {
      if (splineRef.current) {
        // Add load event listener
        const handleLoad = () => {
          console.log('Spline 3D model loaded successfully');
          setIsLoaded(true);
        };

        // Add error event listener
        const handleError = (error) => {
          console.error('Spline 3D model failed to load:', error);
          setHasError(true);
        };

        splineRef.current.addEventListener('load', handleLoad);
        splineRef.current.addEventListener('error', handleError);

        // Fallback: if no load event after 5 seconds, show anyway
        const fallbackTimer = setTimeout(() => {
          if (!isLoaded && !hasError) {
            console.log('Spline fallback: showing after timeout');
            setIsLoaded(true);
          }
        }, 5000);

        return () => {
          clearTimeout(fallbackTimer);
          if (splineRef.current) {
            splineRef.current.removeEventListener('load', handleLoad);
            splineRef.current.removeEventListener('error', handleError);
          }
        };
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isLoaded, hasError]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Spline 3D Model */}
      <spline-viewer
        ref={splineRef}
        url="https://prod.spline.design/Yega7tze1J1rKU3d/scene.splinecode"
        className="w-full h-full"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: isLoaded ? 0.5 : 0.3, // Show with some opacity even if not fully loaded
          filter: 'blur(0.2px)',
          transform: 'scale(1.05)',
          transition: 'opacity 1s ease-in-out',
        }}
      />
      
      {/* Fallback gradient if Spline fails */}
      {hasError && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10"
          style={{
            background: `
              radial-gradient(circle at 20% 80%, rgba(var(--primary), 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(var(--secondary), 0.15) 0%, transparent 50%),
              linear-gradient(135deg, rgba(var(--primary), 0.1), rgba(var(--secondary), 0.1))
            `
          }}
        />
      )}
      
      {/* Enhanced gradient overlay for better text contrast */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{
          backdropFilter: 'blur(0.3px)',
          background: `
            radial-gradient(circle at 20% 80%, rgba(var(--primary), 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(var(--secondary), 0.08) 0%, transparent 50%),
            linear-gradient(to bottom right, 
              rgba(var(--background), 0.8), 
              rgba(var(--background), 0.6), 
              rgba(var(--background), 0.4)
            )
          `
        }}
      />
      
      {/* Enhanced animated particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full floating-particle" style={{ animationDelay: '0s' }} />
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-secondary/40 rounded-full floating-particle" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-accent/35 rounded-full floating-particle" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary/25 rounded-full floating-particle" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-secondary/30 rounded-full floating-particle" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/6 right-1/6 w-1 h-1 bg-accent/20 rounded-full floating-particle" style={{ animationDelay: '5s' }} />
      </div>
    </div>
  );
} 