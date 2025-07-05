import { useEffect, useState, useRef } from "react";

export function SplineDebug() {
  const [status, setStatus] = useState('Loading...');
  const [error, setError] = useState(null);
  const splineRef = useRef(null);

  useEffect(() => {
    const checkSpline = () => {
      try {
        // Check if custom element is registered
        if (customElements.get('spline-viewer')) {
          setStatus('Spline viewer element found ✅');
          
          // Try to create the element
          if (splineRef.current) {
            setStatus('Spline viewer element created ✅');
          }
        } else {
          setStatus('Spline viewer element NOT found ❌');
          setError('Custom element not registered');
        }
      } catch (err) {
        setStatus('Error checking Spline ❌');
        setError(err.message);
      }
    };

    // Check immediately
    checkSpline();
    
    // Check again after a delay
    const timer = setTimeout(checkSpline, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Debug info */}
      <div className="fixed top-4 left-4 z-50 bg-background/95 backdrop-blur p-4 rounded-lg border max-w-sm">
        <h3 className="font-bold mb-2">Spline Debug</h3>
        <p className="text-sm mb-2">Status: {status}</p>
        {error && (
          <p className="text-sm text-red-500 mb-2">Error: {error}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Check browser console for more details
        </p>
      </div>

      {/* Try the Spline viewer */}
      <spline-viewer
        ref={splineRef}
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
        onLoad={() => {
          console.log('Spline loaded successfully');
          setStatus('Spline loaded successfully ✅');
        }}
        onError={(e) => {
          console.error('Spline error:', e);
          setStatus('Spline failed to load ❌');
          setError('Failed to load 3D model');
        }}
      />
      
      {/* Fallback background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(var(--primary), 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(var(--secondary), 0.1) 0%, transparent 50%),
            linear-gradient(135deg, rgba(var(--primary), 0.05), rgba(var(--secondary), 0.05))
          `,
        }}
      />
      
      {/* Text overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom right, rgba(var(--background), 0.8), rgba(var(--background), 0.6))',
        }}
      />
    </div>
  );
} 