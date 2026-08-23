import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useCMS } from '../../context/CMSContext';

export const FallingStarsCanvas: React.FC = React.memo(() => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { getContentBlock } = useCMS();

  // Read editable settings from CMS
  const isStarsEnabled = getContentBlock('stars.enabled', 'true') !== 'false';
  const speedMultiplier = parseFloat(getContentBlock('stars.speed', '1.0')) || 1.0;
  const baseOpacity = parseFloat(getContentBlock('stars.opacity', '0.75')) || 0.75;
  const dofMode = getContentBlock('stars.dof_blur', 'High'); // 'High' | 'Medium' | 'Off'

  const speedRef = useRef(speedMultiplier);
  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode || !isStarsEnabled) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 25;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
    } catch (e) {
      console.warn('WebGL not supported or context lost in FallingStarsCanvas:', e);
      return;
    }

    const handleContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    mountNode.appendChild(renderer.domElement);

    // --- TEXTURE CREATORS FOR DEPTH-OF-FIELD VISUAL HIERARCHY ---

    // A. Crisp Foreground Star Texture (Sharp pinpoint flare)
    function createSharpStarTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 64, 64);
        
        // Intense sharp center core
        const coreGrad = ctx.createRadialGradient(32, 32, 0, 32, 32, 16);
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        coreGrad.addColorStop(0.2, 'rgba(254, 240, 138, 0.95)');
        coreGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.4)');
        coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = coreGrad;
        ctx.fillRect(0, 0, 64, 64);

        // Sharp 4-point star flare spikes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.moveTo(32, 8);
        ctx.lineTo(32, 56);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(8, 32);
        ctx.lineTo(56, 32);
        ctx.stroke();
      }
      return new THREE.CanvasTexture(canvas);
    }

    // B. Midground Glow Texture (Soft ambient particle)
    function createGlowTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        grad.addColorStop(0.3, 'rgba(253, 224, 71, 0.6)');
        grad.addColorStop(0.7, 'rgba(125, 211, 252, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
      }
      return new THREE.CanvasTexture(canvas);
    }

    // C. Background Depth-of-Field Bokeh Blur Texture (Heavy out-of-focus soft blur)
    function createBlurredStarTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Soft gaussian blur ring (bokeh disk)
        const blurGrad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
        blurGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        blurGrad.addColorStop(0.4, 'rgba(186, 230, 253, 0.18)');
        blurGrad.addColorStop(0.8, 'rgba(251, 191, 36, 0.06)');
        blurGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = blurGrad;
        ctx.fillRect(0, 0, 128, 128);
      }
      return new THREE.CanvasTexture(canvas);
    }

    const sharpTexture = createSharpStarTexture();
    const glowTexture = createGlowTexture();
    const blurTexture = createBlurredStarTexture();

    // --- 2. LAYER 1: FOREGROUND STARS (Ultra Sharp & Fast) ---
    const fgCount = 45;
    const fgGeo = new THREE.BufferGeometry();
    const fgPos = new Float32Array(fgCount * 3);
    const fgColors = new Float32Array(fgCount * 3);
    const fgVelocities = new Float32Array(fgCount);

    for (let i = 0; i < fgCount; i++) {
      const idx = i * 3;
      fgPos[idx] = (Math.random() - 0.5) * 55;
      fgPos[idx + 1] = (Math.random() - 0.5) * 55;
      fgPos[idx + 2] = 5 + Math.random() * 18; // Close to camera (Z: 5 to 23)

      fgVelocities[i] = 0.08 + Math.random() * 0.09;

      // Sparkling Crisp Colors
      const rColor = Math.random();
      if (rColor < 0.5) {
        fgColors[idx] = 1.0; fgColors[idx + 1] = 0.95; fgColors[idx + 2] = 0.6; // Amber
      } else if (rColor < 0.85) {
        fgColors[idx] = 0.4; fgColors[idx + 1] = 0.8; fgColors[idx + 2] = 1.0; // Cyan
      } else {
        fgColors[idx] = 1.0; fgColors[idx + 1] = 1.0; fgColors[idx + 2] = 1.0; // White
      }
    }
    fgGeo.setAttribute('position', new THREE.BufferAttribute(fgPos, 3));
    fgGeo.setAttribute('color', new THREE.BufferAttribute(fgColors, 3));

    const fgMat = new THREE.PointsMaterial({
      size: 1.15,
      vertexColors: true,
      map: sharpTexture,
      transparent: true,
      opacity: baseOpacity * 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const fgParticles = new THREE.Points(fgGeo, fgMat);
    scene.add(fgParticles);

    // --- 3. LAYER 2: MIDGROUND STARS (Medium Soft Focus) ---
    const mgCount = 90;
    const mgGeo = new THREE.BufferGeometry();
    const mgPos = new Float32Array(mgCount * 3);
    const mgColors = new Float32Array(mgCount * 3);
    const mgVelocities = new Float32Array(mgCount);

    for (let i = 0; i < mgCount; i++) {
      const idx = i * 3;
      mgPos[idx] = (Math.random() - 0.5) * 65;
      mgPos[idx + 1] = (Math.random() - 0.5) * 65;
      mgPos[idx + 2] = -10 + Math.random() * 15; // Mid z range (-10 to 5)

      mgVelocities[i] = 0.04 + Math.random() * 0.05;

      const rColor = Math.random();
      if (rColor < 0.5) {
        mgColors[idx] = 1.0; mgColors[idx + 1] = 0.8; mgColors[idx + 2] = 0.3;
      } else {
        mgColors[idx] = 0.5; mgColors[idx + 1] = 0.7; mgColors[idx + 2] = 1.0;
      }
    }
    mgGeo.setAttribute('position', new THREE.BufferAttribute(mgPos, 3));
    mgGeo.setAttribute('color', new THREE.BufferAttribute(mgColors, 3));

    const mgMat = new THREE.PointsMaterial({
      size: 0.7,
      vertexColors: true,
      map: glowTexture,
      transparent: true,
      opacity: baseOpacity * 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const mgParticles = new THREE.Points(mgGeo, mgMat);
    scene.add(mgParticles);

    // --- 4. LAYER 3: BACKGROUND STARS (Depth of Field Soft Bokeh Blur) ---
    const bgCount = 140;
    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(bgCount * 3);
    const bgColors = new Float32Array(bgCount * 3);
    const bgVelocities = new Float32Array(bgCount);

    for (let i = 0; i < bgCount; i++) {
      const idx = i * 3;
      bgPos[idx] = (Math.random() - 0.5) * 80;
      bgPos[idx + 1] = (Math.random() - 0.5) * 80;
      bgPos[idx + 2] = -40 + Math.random() * 25; // Far in background Z (-40 to -15)

      bgVelocities[i] = 0.015 + Math.random() * 0.03; // Slow distant parallax

      bgColors[idx] = 0.8;
      bgColors[idx + 1] = 0.85;
      bgColors[idx + 2] = 1.0;
    }
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    bgGeo.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));

    const bgMat = new THREE.PointsMaterial({
      size: dofMode === 'Off' ? 0.6 : 2.2, // Larger size when blurred creates soft bokeh disks
      vertexColors: true,
      map: dofMode === 'Off' ? glowTexture : blurTexture,
      transparent: true,
      opacity: baseOpacity * 0.55, // Subtle back layer
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const bgParticles = new THREE.Points(bgGeo, bgMat);
    scene.add(bgParticles);

    // --- 5. SHOOTING STAR COMETS ---
    const shootingStarCount = 4;
    interface ShootingStar {
      line: THREE.Line;
      speed: number;
      reset: () => void;
    }
    const shootingStars: ShootingStar[] = [];

    for (let i = 0; i < shootingStarCount; i++) {
      const lineGeo = new THREE.BufferGeometry();
      const linePos = new Float32Array(6);
      lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));

      const lineMat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0xfbbf24 : 0x38bdf8,
        transparent: true,
        opacity: 0.85,
        linewidth: 2
      });

      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      const starData: ShootingStar = {
        line,
        speed: 0.35 + Math.random() * 0.4,
        reset: () => {
          const startX = (Math.random() - 0.2) * 55;
          const startY = 30 + Math.random() * 15;
          const startZ = (Math.random() - 0.5) * 20;
          const tailLen = 3.0 + Math.random() * 4.0;

          const posAttr = line.geometry.attributes.position as THREE.BufferAttribute;
          posAttr.setXYZ(0, startX, startY, startZ);
          posAttr.setXYZ(1, startX + tailLen * 0.6, startY + tailLen, startZ);
          posAttr.needsUpdate = true;
          starData.speed = 0.35 + Math.random() * 0.4;
        }
      };

      starData.reset();
      shootingStars.push(starData);
    }

    // --- 6. PARALLAX MOUSE CONTROL ---
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // --- 7. ANIMATION RENDER LOOP ---
    let animId: number;
    let isVisible = true;

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.01 });
    observer.observe(mountNode);

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isVisible || document.hidden) return;

      const currentSpeed = speedRef.current;

      // Smooth camera sway
      camera.position.x += (targetX - camera.position.x) * 0.03;
      camera.position.y += (-targetY - camera.position.y) * 0.03;

      // Update Foreground particles
      const fgArray = (fgParticles.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      for (let i = 0; i < fgCount; i++) {
        const yIdx = i * 3 + 1;
        const xIdx = i * 3;
        fgArray[yIdx] -= fgVelocities[i] * currentSpeed;
        fgArray[xIdx] -= fgVelocities[i] * 0.2 * currentSpeed;

        if (fgArray[yIdx] < -35) {
          fgArray[yIdx] = 35;
          fgArray[xIdx] = (Math.random() - 0.5) * 55;
        }
      }
      (fgParticles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

      // Update Midground particles
      const mgArray = (mgParticles.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      for (let i = 0; i < mgCount; i++) {
        const yIdx = i * 3 + 1;
        const xIdx = i * 3;
        mgArray[yIdx] -= mgVelocities[i] * currentSpeed;
        mgArray[xIdx] -= mgVelocities[i] * 0.15 * currentSpeed;

        if (mgArray[yIdx] < -35) {
          mgArray[yIdx] = 35;
          mgArray[xIdx] = (Math.random() - 0.5) * 65;
        }
      }
      (mgParticles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

      // Update Background (Blurred Bokeh) particles
      const bgArray = (bgParticles.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      for (let i = 0; i < bgCount; i++) {
        const yIdx = i * 3 + 1;
        const xIdx = i * 3;
        bgArray[yIdx] -= bgVelocities[i] * currentSpeed;
        bgArray[xIdx] -= bgVelocities[i] * 0.1 * currentSpeed;

        if (bgArray[yIdx] < -40) {
          bgArray[yIdx] = 40;
          bgArray[xIdx] = (Math.random() - 0.5) * 80;
        }
      }
      (bgParticles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

      // Update shooting stars
      shootingStars.forEach((star) => {
        const posAttr = star.line.geometry.attributes.position as THREE.BufferAttribute;
        const headY = posAttr.getY(0) - star.speed * currentSpeed;
        const headX = posAttr.getX(0) - star.speed * 0.6 * currentSpeed;
        const tailY = posAttr.getY(1) - star.speed * currentSpeed;
        const tailX = posAttr.getX(1) - star.speed * 0.6 * currentSpeed;

        posAttr.setXYZ(0, headX, headY, posAttr.getZ(0));
        posAttr.setXYZ(1, tailX, tailY, posAttr.getZ(1));
        posAttr.needsUpdate = true;

        if (headY < -35) {
          star.reset();
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (mountNode.contains(renderer.domElement)) {
        mountNode.removeChild(renderer.domElement);
      }

      fgGeo.dispose(); fgMat.dispose();
      mgGeo.dispose(); mgMat.dispose();
      bgGeo.dispose(); bgMat.dispose();
      renderer.dispose();
    };
  }, [isStarsEnabled, dofMode, baseOpacity]);

  if (!isStarsEnabled) return null;

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-75 dark:opacity-90"
    />
  );
});
