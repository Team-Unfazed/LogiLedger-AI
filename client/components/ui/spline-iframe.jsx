import { useState } from "react";

export function SplineIframe() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Try iframe approach */}
      <iframe
        src="https://my.spline.design/untitledcopy-0c0c0c0c0c0c0c0c0c0c0c0c/"
        title="Spline 3D Background"
        className="w-full h-full"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.4,
          filter: 'blur(0.2px)',
          border: 'none',
          pointerEvents: 'none',
        }}
        onLoad={() => setIsLoaded(true)}
      />
      
      {/* Fallback gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(var(--primary), 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(var(--secondary), 0.1) 0%, transparent 50%),
            linear-gradient(135deg, rgba(var(--primary), 0.05), rgba(var(--secondary), 0.05))
          `,
          backdropFilter: 'blur(0.3px)',
        }}
      />
      
      {/* Overlay for text readability */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom right, rgba(var(--background), 0.7), rgba(var(--background), 0.5))',
        }}
      />
    </div>
  );
} 