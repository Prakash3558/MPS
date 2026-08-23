import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ThreeDHeroCanvas: React.FC = React.memo(() => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      mountNode.clientWidth / mountNode.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 18;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
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

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xf59e0b, 3, 50); // Amber golden glow
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x3b82f6, 2, 50); // Blue glow
    pointLight2.position.set(-10, -10, 8);
    scene.add(pointLight2);

    // Group for 3D objects
    const group = new THREE.Group();
    scene.add(group);

    // 1. Central Metallic TorusKnot
    const torusKnotGeo = new THREE.TorusKnotGeometry(2.8, 0.7, 128, 32);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.8,
      roughness: 0.2,
      wireframe: false,
      transparent: true,
      opacity: 0.85
    });
    const torusKnot = new THREE.Mesh(torusKnotGeo, torusMat);
    torusKnot.position.set(6, 1, -2);
    group.add(torusKnot);

    // Wireframe overlay on TorusKnot
    const torusWireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const torusWire = new THREE.Mesh(torusKnotGeo, torusWireMat);
    torusKnot.add(torusWire);

    // 2. Floating Octahedron (Left)
    const octaGeo = new THREE.OctahedronGeometry(2.2, 0);
    const octaMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Emerald green
      metalness: 0.7,
      roughness: 0.3,
      transparent: true,
      opacity: 0.8
    });
    const octahedron = new THREE.Mesh(octaGeo, octaMat);
    octahedron.position.set(-8, 3, -1);
    group.add(octahedron);

    // 3. Floating Icosahedron (Bottom Left)
    const icoGeo = new THREE.IcosahedronGeometry(1.8, 0);
    const icoMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1, // Indigo
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.75
    });
    const icosahedron = new THREE.Mesh(icoGeo, icoMat);
    icosahedron.position.set(-6, -4, 2);
    group.add(icosahedron);

    // 4. Ring / Torus Orbit
    const ringGeo = new THREE.TorusGeometry(3.8, 0.12, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.4
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(torusKnot.position);
    ring.rotation.x = Math.PI / 3;
    group.add(ring);

    // 5. 3D Particle Stars Field
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 45;
      positions[i + 1] = (Math.random() - 0.5) * 35;
      positions[i + 2] = (Math.random() - 0.5) * 30;

      // Golden or cyan spark colors
      if (Math.random() > 0.5) {
        colors[i] = 0.96; // R
        colors[i + 1] = 0.62; // G
        colors[i + 2] = 0.07; // B
      } else {
        colors[i] = 0.23;
        colors[i + 1] = 0.51;
        colors[i + 2] = 0.96;
      }
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Mouse Parallax Interaction
    let targetX = 0;
    let targetY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      mouseX = (e.clientX - windowHalfX) * 0.0008;
      mouseY = (e.clientY - windowHalfY) * 0.0008;
    };

    window.addEventListener('mousemove', handleMouseMove);

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

      // Rotate objects
      torusKnot.rotation.x = elapsedTime * 0.25;
      torusKnot.rotation.y = elapsedTime * 0.35;

      octahedron.rotation.x = elapsedTime * 0.3;
      octahedron.rotation.z = elapsedTime * 0.2;

      icosahedron.rotation.y = elapsedTime * 0.4;
      icosahedron.rotation.x = elapsedTime * 0.2;

      ring.rotation.z = elapsedTime * 0.15;

      // Particle floating
      particleSystem.rotation.y = elapsedTime * 0.03;

      // Smooth mouse camera sway
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      group.rotation.y = targetX * 1.5;
      group.rotation.x = -targetY * 1.5;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      if (mountNode.contains(renderer.domElement)) {
        mountNode.removeChild(renderer.domElement);
      }

      // Dispose geometries & materials
      torusKnotGeo.dispose();
      torusMat.dispose();
      octaGeo.dispose();
      octaMat.dispose();
      icoGeo.dispose();
      icoMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 z-12 pointer-events-none overflow-hidden opacity-75 md:opacity-90"
      style={{ mixBlendMode: 'screen' }}
    />
  );
});
