import React, { useState, useRef } from 'react';

interface Card3DTiltProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // max tilt angle in degrees
  perspective?: number; // 3D perspective depth in px
  scaleOnHover?: number;
  glareOpacity?: number;
}

export const Card3DTilt: React.FC<Card3DTiltProps> = React.memo(({
  children,
  className = '',
  maxTilt = 12,
  perspective = 1000,
  scaleOnHover = 1.03,
  glareOpacity = 0.25
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [scale, setScale] = useState(1);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width;
    const yPct = mouseY / height;

    // Calculate rotation (-maxTilt to +maxTilt)
    const rotX = (0.5 - yPct) * (maxTilt * 2);
    const rotY = (xPct - 0.5) * (maxTilt * 2);

    setRotateX(rotX);
    setRotateY(rotY);
    setScale(scaleOnHover);
    setGlarePos({
      x: xPct * 100,
      y: yPct * 100,
      opacity: glareOpacity
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setScale(1);
    setGlarePos(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative transition-transform duration-200 ease-out preserve-3d ${className}`}
      style={{
        perspective: `${perspective}px`,
        transformStyle: 'preserve-3d',
        transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`
      }}
    >
      {children}

      {/* Dynamic 3D Glare Overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 z-30"
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glarePos.opacity}) 0%, rgba(255,255,255,0) 75%)`,
          opacity: glarePos.opacity > 0 ? 1 : 0
        }}
      />
    </div>
  );
});
