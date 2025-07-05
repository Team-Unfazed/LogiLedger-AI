export function SplineFinal() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: -10,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
    }}>
      <spline-viewer
        url="https://prod.spline.design/69MvDxVo49NWd3f4/scene.splinecode"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          opacity: 1,
          background: 'transparent',
          border: 'none',
          pointerEvents: 'none', // So it doesn't block UI
        }}
      />
    </div>
  );
} 