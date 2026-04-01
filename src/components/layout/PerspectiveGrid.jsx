export default function PerspectiveGrid() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#09090B] via-[#0f0a1a] to-[#09090B]" />

      {/* 3D perspective grid floor */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-[60%]"
        style={{
          perspective: '400px',
        }}
      >
        <div
          className="w-full h-full origin-bottom"
          style={{
            transform: 'rotateX(60deg)',
            backgroundImage: `
              linear-gradient(to right, rgba(139, 92, 246, 0.12) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(139, 92, 246, 0.12) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            maskImage: 'linear-gradient(to top, white 20%, transparent 90%)',
            WebkitMaskImage: 'linear-gradient(to top, white 20%, transparent 90%)',
          }}
        />
      </div>

      {/* Violet glow at horizon */}
      <div
        className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.4) 0%, rgba(159, 18, 57, 0.15) 50%, transparent 70%)',
          animation: 'glow-pulse 6s ease-in-out infinite',
        }}
      />

      {/* Scanlines overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />

    </div>
  )
}
