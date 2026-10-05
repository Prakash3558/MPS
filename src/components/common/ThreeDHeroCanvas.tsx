import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Eye, Compass, Layers, RotateCcw } from 'lucide-react';

export type SceneMode = 'hologram' | 'nebula' | 'wireframe';

export const ThreeDHeroCanvas: React.FC = React.memo(() => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [currentMode, setCurrentMode] = useState<SceneMode>('hologram');
  const [isInteracting, setIsInteracting] = useState(false);
  const [isOrbiting, setIsOrbiting] = useState(false);

  // Store references to mutable 3D objects for dynamic mode switching
  const sceneElementsRef = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    group?: THREE.Group;
    torusMat?: THREE.MeshStandardMaterial;
    octaMat?: THREE.MeshStandardMaterial;
    icoMat?: THREE.MeshStandardMaterial;
    ringMat?: THREE.MeshBasicMaterial;
    particleMat?: THREE.PointsMaterial;
    lights?: THREE.PointLight[];
    resetRotation?: () => void;
  }>({});

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      mountNode.clientWidth / mountNode.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 17;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch (e) {
      console.warn('WebGL not supported or context lost in ThreeDHeroCanvas:', e);
      return;
    }

    const handleContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

    renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountNode.appendChild(renderer.domElement);

    // Lights Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xf59e0b, 3.5, 60); // Golden Amber
    pointLight1.position.set(12, 10, 12);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x38bdf8, 3.0, 60); // Sky Blue
    pointLight2.position.set(-12, -8, 10);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xec4899, 2.0, 50); // Pink accent
    pointLight3.position.set(0, 12, -6);
    scene.add(pointLight3);

    // Master Group for 3D Interactive Rotation
    const group = new THREE.Group();
    scene.add(group);

    // 1. Central Metallic TorusKnot (Core Knowledge Symbol)
    const torusKnotGeo = new THREE.TorusKnotGeometry(2.6, 0.65, 140, 36);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.2,
      wireframe: false,
      transparent: true,
      opacity: 0.88
    });
    const torusKnot = new THREE.Mesh(torusKnotGeo, torusMat);
    torusKnot.position.set(5.5, 0.5, -2);
    group.add(torusKnot);

    // Glowing Wireframe overlay
    const torusWireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    const torusWire = new THREE.Mesh(torusKnotGeo, torusWireMat);
    torusKnot.add(torusWire);

    // 2. Academic Astrolabe / Concentric Orbital Rings
    const ringGeo1 = new THREE.TorusGeometry(3.6, 0.08, 16, 120);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.5
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.position.copy(torusKnot.position);
    ring1.rotation.x = Math.PI / 3;
    group.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(4.4, 0.05, 16, 120);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.position.copy(torusKnot.position);
    ring2.rotation.y = Math.PI / 4;
    group.add(ring2);

    // 3. Floating Interactive Geometric Polyhedra
    // Octahedron (Left - Science & Logic)
    const octaGeo = new THREE.OctahedronGeometry(2.0, 0);
    const octaMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Emerald Green
      metalness: 0.75,
      roughness: 0.25,
      transparent: true,
      opacity: 0.85
    });
    const octahedron = new THREE.Mesh(octaGeo, octaMat);
    octahedron.position.set(-7.5, 2.5, -1);
    group.add(octahedron);

    const octaWire = new THREE.Mesh(octaGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.25 }));
    octahedron.add(octaWire);

    // Icosahedron (Bottom Left - Arts & Humanities)
    const icoGeo = new THREE.IcosahedronGeometry(1.6, 0);
    const icoMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1, // Indigo
      metalness: 0.85,
      roughness: 0.15,
      transparent: true,
      opacity: 0.8
    });
    const icosahedron = new THREE.Mesh(icoGeo, icoMat);
    icosahedron.position.set(-5.5, -3.5, 1.5);
    group.add(icosahedron);

    // Dodecahedron (Upper Center - Innovation & Tech)
    const dodecaGeo = new THREE.DodecahedronGeometry(1.2, 0);
    const dodecaMat = new THREE.MeshStandardMaterial({
      color: 0xec4899, // Fuchsia
      metalness: 0.7,
      roughness: 0.3,
      transparent: true,
      opacity: 0.85
    });
    const dodecahedron = new THREE.Mesh(dodecaGeo, dodecaMat);
    dodecahedron.position.set(-1.0, 4.0, -3);
    group.add(dodecahedron);

    // 4. Interactive 3D Cosmic Particle Vortex
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 50;
      positions[i + 1] = (Math.random() - 0.5) * 40;
      positions[i + 2] = (Math.random() - 0.5) * 35;

      const rand = Math.random();
      if (rand > 0.6) {
        colors[i] = 0.96; // Golden Amber
        colors[i + 1] = 0.62;
        colors[i + 2] = 0.07;
      } else if (rand > 0.3) {
        colors[i] = 0.22; // Sky Cyan
        colors[i + 1] = 0.74;
        colors[i + 2] = 0.97;
      } else {
        colors[i] = 0.92; // Purple Violet
        colors[i + 1] = 0.28;
        colors[i + 2] = 0.6;
      }
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Save elements for dynamic mode switching
    sceneElementsRef.current = {
      scene,
      camera,
      group,
      torusMat,
      octaMat,
      icoMat,
      ringMat: ringMat1,
      particleMat,
      lights: [pointLight1, pointLight2, pointLight3],
      resetRotation: () => {
        targetRotX = 0;
        targetRotY = 0;
        group.rotation.x = 0;
        group.rotation.y = 0;
      }
    };

    // --- Interactive Orbit & Drag Controls ---
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      setIsInteracting(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      previousMouseX = clientX;
      previousMouseY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      mouseX = (clientX - windowHalfX) * 0.0006;
      mouseY = (clientY - windowHalfY) * 0.0006;

      if (isDragging) {
        const deltaX = clientX - previousMouseX;
        const deltaY = clientY - previousMouseY;

        targetRotY += deltaX * 0.008;
        targetRotX += deltaY * 0.008;

        previousMouseX = clientX;
        previousMouseY = clientY;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
      setIsInteracting(false);
    };

    const canvasElem = renderer.domElement;
    canvasElem.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    canvasElem.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Resize Handler
    const handleResize = () => {
      if (!mountNode) return;
      camera.aspect = mountNode.clientWidth / mountNode.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const startTime = performance.now();

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(mountNode);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible || document.hidden) return;

      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Autonomous organic rotations
      torusKnot.rotation.x = elapsedTime * 0.22;
      torusKnot.rotation.y = elapsedTime * 0.28;

      octahedron.rotation.x = elapsedTime * 0.35;
      octahedron.rotation.z = elapsedTime * 0.25;

      icosahedron.rotation.y = elapsedTime * 0.4;
      icosahedron.rotation.x = elapsedTime * 0.2;

      dodecahedron.rotation.x = elapsedTime * 0.3;
      dodecahedron.rotation.y = elapsedTime * 0.25;

      ring1.rotation.z = elapsedTime * 0.16;
      ring2.rotation.z = -elapsedTime * 0.12;

      // Particle constellation slow drift
      particleSystem.rotation.y = elapsedTime * 0.025;

      // Dynamic light tracking
      pointLight1.position.x = 12 + Math.sin(elapsedTime * 0.8) * 4;
      pointLight1.position.y = 10 + Math.cos(elapsedTime * 0.6) * 3;

      pointLight2.position.x = -12 + Math.cos(elapsedTime * 0.7) * 4;
      pointLight2.position.y = -8 + Math.sin(elapsedTime * 0.5) * 3;

      // Smooth mouse sway and interactive orbit drag interpolation
      group.rotation.y += (targetRotY + mouseX * 1.6 - group.rotation.y) * 0.06;
      group.rotation.x += (targetRotX - mouseY * 1.6 - group.rotation.x) * 0.06;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      observer.disconnect();
      canvasElem.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      canvasElem.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      if (mountNode.contains(renderer.domElement)) {
        mountNode.removeChild(renderer.domElement);
      }

      torusKnotGeo.dispose();
      torusMat.dispose();
      torusWireMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      octaGeo.dispose();
      octaMat.dispose();
      icoGeo.dispose();
      icoMat.dispose();
      dodecaGeo.dispose();
      dodecaMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, []);

  // Update scene materials based on selected 3D mode
  const switchMode = (mode: SceneMode) => {
    setCurrentMode(mode);
    const { torusMat, octaMat, icoMat, particleMat, lights } = sceneElementsRef.current;
    if (!torusMat || !octaMat || !icoMat || !particleMat || !lights) return;

    if (mode === 'wireframe') {
      torusMat.wireframe = true;
      octaMat.wireframe = true;
      icoMat.wireframe = true;
      torusMat.opacity = 0.9;
      octaMat.opacity = 0.9;
      icoMat.opacity = 0.9;
    } else if (mode === 'nebula') {
      torusMat.wireframe = false;
      octaMat.wireframe = false;
      icoMat.wireframe = false;
      torusMat.color.setHex(0x8b5cf6); // Purple
      octaMat.color.setHex(0x06b6d4); // Cyan
      icoMat.color.setHex(0xf43f5e); // Rose
      lights[0].color.setHex(0xa855f7);
      lights[1].color.setHex(0x06b6d4);
    } else {
      // Default Hologram
      torusMat.wireframe = false;
      octaMat.wireframe = false;
      icoMat.wireframe = false;
      torusMat.color.setHex(0xf59e0b); // Golden Amber
      octaMat.color.setHex(0x10b981); // Emerald
      icoMat.color.setHex(0x6366f1); // Indigo
      lights[0].color.setHex(0xf59e0b);
      lights[1].color.setHex(0x38bdf8);
    }
  };

  const handleResetOrbit = () => {
    if (sceneElementsRef.current.resetRotation) {
      sceneElementsRef.current.resetRotation();
    }
  };

  return (
    <div className="absolute inset-0 z-12 overflow-hidden pointer-events-none">
      {/* Three.js interactive canvas (pointer-events active on canvas) */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing pointer-events-auto opacity-80 md:opacity-95"
        style={{ mixBlendMode: 'screen' }}
        title="Interactive 3D Space: Click and drag to orbit in 360°"
      />

      {/* Floating 3D Interaction Control Dock */}
      <div className="absolute top-4 right-4 z-30 pointer-events-auto flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md border border-white/15 p-1.5 rounded-2xl shadow-xl transition-all hover:border-amber-500/50">
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-amber-400">
          <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          <span>3D Space</span>
        </span>

        {/* Mode Selector Buttons */}
        <button
          onClick={() => switchMode('hologram')}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
            currentMode === 'hologram'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title="Hologram Gold 3D Core"
        >
          Holo
        </button>

        <button
          onClick={() => switchMode('nebula')}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
            currentMode === 'nebula'
              ? 'bg-purple-500 text-white shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title="Cosmic Nebula Atmosphere"
        >
          Nebula
        </button>

        <button
          onClick={() => switchMode('wireframe')}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
            currentMode === 'wireframe'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title="Cyber Wireframe Grid"
        >
          Wire
        </button>

        <button
          onClick={handleResetOrbit}
          className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
          title="Reset 3D Orbit Position"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtle Drag Prompt Pill on bottom */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden sm:flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 text-white/70 text-[10px] px-3 py-1 rounded-full shadow-sm">
        <Compass className="w-3 h-3 text-amber-400 animate-pulse" />
        <span>Drag anywhere to orbit in 3D</span>
      </div>
    </div>
  );
});
