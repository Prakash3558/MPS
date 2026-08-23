import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MapPin, Navigation, Sparkles } from 'lucide-react';

export const ThreeDGlobeCanvas: React.FC = React.memo(() => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    const width = mountNode.clientWidth || 320;
    const height = mountNode.clientHeight || 320;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 7.5;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (e) {
      console.warn('WebGL not supported or context lost in ThreeDGlobeCanvas:', e);
      return;
    }

    const handleContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountNode.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf59e0b, 2.5);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Globe Sphere
    const sphereGeo = new THREE.SphereGeometry(2.5, 48, 48);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Deep slate blue
      roughness: 0.6,
      metalness: 0.4,
      wireframe: false
    });
    const globe = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(globe);

    // 2. Dotted Globe Wireframe Outer Shell
    const wireGeo = new THREE.SphereGeometry(2.53, 32, 32);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const wireSphere = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireSphere);

    // 3. Latitude / Longitude Glowing Rings
    const ringGeo = new THREE.TorusGeometry(3.1, 0.04, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b, // Amber glow
      transparent: true,
      opacity: 0.6
    });
    const orbitRing1 = new THREE.Mesh(ringGeo, ringMat);
    orbitRing1.rotation.x = Math.PI / 2.5;
    globeGroup.add(orbitRing1);

    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x10b981, // Emerald ring
      transparent: true,
      opacity: 0.5
    });
    const orbitRing2 = new THREE.Mesh(ringGeo, ringMat2);
    orbitRing2.rotation.y = Math.PI / 3;
    globeGroup.add(orbitRing2);

    // 4. Pin Point Marker for MPS Sikta (Lat: 26.85° N, Long: 84.55° E approx for West Champaran, Bihar)
    // Convert Lat/Long to 3D Cartesian Coordinates
    const lat = 26.85;
    const lon = 84.55;
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const radius = 2.56;

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    // Glowing Pin Mesh
    const pinGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // Red glow
    const pin = new THREE.Mesh(pinGeo, pinMat);
    pin.position.set(x, y, z);
    globeGroup.add(pin);

    // Pulsing Light Ring around Pin
    const pinRingGeo = new THREE.RingGeometry(0.1, 0.28, 32);
    const pinRingMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const pinRing = new THREE.Mesh(pinRingGeo, pinRingMat);
    pinRing.position.set(x * 1.02, y * 1.02, z * 1.02);
    pinRing.lookAt(0, 0, 0);
    globeGroup.add(pinRing);

    // Orient Globe initially so Bihar/India points towards user
    globeGroup.rotation.y = -theta + Math.PI / 4;
    globeGroup.rotation.x = 0.3;

    // Interactive Dragging
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      globeGroup.rotation.y += deltaX * 0.01;
      globeGroup.rotation.x += deltaY * 0.01;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch events for mobile
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;

      globeGroup.rotation.y += deltaX * 0.01;
      globeGroup.rotation.x += deltaY * 0.01;

      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    domEl.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    // Animation Loop
    let animId: number;
    const startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Continuous gentle idle rotation if not dragging
      if (!isDragging) {
        globeGroup.rotation.y += 0.004;
      }

      orbitRing1.rotation.z = elapsedTime * 0.3;
      orbitRing2.rotation.z = -elapsedTime * 0.2;

      // Pulse pin ring
      const scale = 1 + Math.sin(elapsedTime * 4) * 0.3;
      pinRing.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);

      if (mountNode.contains(renderer.domElement)) {
        mountNode.removeChild(renderer.domElement);
      }

      sphereGeo.dispose();
      sphereMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      ringMat2.dispose();
      pinGeo.dispose();
      pinMat.dispose();
      pinRingGeo.dispose();
      pinRingMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center p-4 bg-slate-900/90 dark:bg-slate-950/95 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden group">
      {/* Top Header Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-800/80 backdrop-blur-md border border-slate-700/80 text-amber-400 font-bold text-xs px-3 py-1.5 rounded-full shadow">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>3D Interactive Campus Location</span>
      </div>

      {/* 3D Canvas Container */}
      <div
        ref={mountRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full h-72 sm:h-80 cursor-grab active:cursor-grabbing flex items-center justify-center relative z-0"
      />

      {/* Floating Info Overlay at Bottom */}
      <div className="relative z-10 w-full mt-2 p-3 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-white text-xs">Model Public School (MPS Sikta)</div>
            <div className="text-[11px] text-slate-400">AT- Bhawanipur, P.O.- Kursi Barwa, Sikta, West Champaran, Bihar</div>
          </div>
        </div>

        <a
          href="https://maps.google.com/?q=Model+Public+School+Bhawanipur+Sikta+West+Champaran+Bihar"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md whitespace-nowrap"
        >
          <Navigation className="w-3.5 h-3.5" /> Open Maps
        </a>
      </div>

      <div className="mt-1 text-[10px] text-slate-500 flex items-center gap-1">
        <span>💡 Click and drag 3D Earth to rotate view</span>
      </div>
    </div>
  );
});
