import { useEffect, useState } from "react";

export function SplineTest() {
  const [isSplineAvailable, setIsSplineAvailable] = useState(false);

  useEffect(() => {
    // Check if Spline viewer is available
    const checkSpline = () => {
      const splineViewer = document.createElement('spline-viewer');
      setIsSplineAvailable(!!splineViewer);
      console.log('Spline viewer available:', !!splineViewer);
    };

    // Wait a bit for the script to load
    setTimeout(checkSpline, 1000);
  }, []);

  return (
    <div className="fixed top-4 left-4 z-50 bg-background/90 backdrop-blur p-4 rounded-lg border">
      <h3 className="font-bold mb-2">Spline Status</h3>
      <p className="text-sm">
        Spline Available: {isSplineAvailable ? '✅ Yes' : '❌ No'}
      </p>
      <p className="text-sm text-muted-foreground">
        Check console for detailed logs
      </p>
    </div>
  );
} 