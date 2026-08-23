import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  Play, Pause, RotateCcw, Sparkles, Compass, Info, Layers, ZoomIn, ZoomOut, Eye, Globe,
  Crosshair, Target, Radio, LocateFixed, Navigation, Activity, ShieldCheck, Zap,
  Volume2, VolumeX, Scale, Clock, HelpCircle, MapPin, Rocket, Award, ChevronRight, BarChart2
} from 'lucide-react';

// --- DATA STRUCTURES & DEFINITIONS ---

export interface PlanetData {
  id: string;
  name: string;
  color: number;
  size: number;
  distance: number;
  speed: number; // Relative orbital speed
  tilt: number;  // Axial tilt in degrees
  inclination?: number; // Orbital inclination relative to ecliptic (deg)
  eccentricity?: number; // Orbital eccentricity e
  realSemiMajorAxisAu?: number; // Distance in AU
  realOrbitalVelocityKm?: number; // Average orbital speed in km/s
  rotationPeriodHours?: number; // Sidereal rotation period in hours (negative = retrograde)
  surfaceGravityMps?: number; // Surface gravity in m/s^2
  escapeVelocityKm?: number; // Escape velocity in km/s
  realMassKg?: string; // Real planetary mass
  hasRings?: boolean;
  ringInnerRadius?: number;
  ringOuterRadius?: number;
  hasMoon?: boolean;
  isDwarf?: boolean;
  info: {
    type: string;
    distanceFromSun: string;
    orbitalPeriod: string;
    moons: number;
    diameter: string;
    tempRange: string;
    fact: string;
    ncertNote: string;
    atmosphericComposition: string;
    gravityVsEarth: string;
  };
}

export interface LandmarkHotspot {
  planetId: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  ncertConnection: string;
  type: 'volcano' | 'crater' | 'storm' | 'mountain' | 'ring' | 'glacier' | 'ocean';
}

export interface SpaceProbe {
  id: string;
  name: string;
  agency: string;
  parentBody: string; // 'mars', 'earth', 'sun'
  distance: number;
  speed: number;
  launchYear: string;
  missionObjective: string;
  isIndianMission?: boolean;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  planetId: string; // Fly to this planet when answered
  explanation: string;
}

// NCERT Curriculum Quiz Questions
const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Which planet is known as the 'Morning Star' or 'Evening Star' and rotates backwards (retrograde)?",
    options: ["Mars", "Venus", "Mercury", "Jupiter"],
    correctIndex: 1,
    planetId: "venus",
    explanation: "Venus is often called the Morning or Evening Star. It has an extreme axial tilt of 177.3°, causing it to spin retrograde (east to west)."
  },
  {
    id: 2,
    question: "Which gas giant planet is less dense than water (0.69 g/cm³) and would float in a giant bathtub?",
    options: ["Jupiter", "Uranus", "Saturn", "Neptune"],
    correctIndex: 2,
    planetId: "saturn",
    explanation: "Saturn is composed mostly of hydrogen and helium gas. Its average density is 0.69 g/cm³, which is less than liquid water (1.0 g/cm³)."
  },
  {
    id: 3,
    question: "Which terrestrial planet houses 'Olympus Mons'—a shield volcano three times taller than Mt. Everest?",
    options: ["Mercury", "Earth", "Mars", "Venus"],
    correctIndex: 2,
    planetId: "mars",
    explanation: "Mars is home to Olympus Mons, the largest volcano in the Solar System, standing nearly 22 km (72,000 ft) high."
  },
  {
    id: 4,
    question: "Which celestial body contains the 'Great Red Spot', a high-pressure anticyclonic storm larger than Earth?",
    options: ["Jupiter", "Saturn", "Neptune", "Sun"],
    correctIndex: 0,
    planetId: "jupiter",
    explanation: "Jupiter's Great Red Spot is a persistent high-pressure storm system that has been raging for at least 350 years."
  },
  {
    id: 5,
    question: "Which ice giant planet rotates almost completely on its side with an axial tilt of nearly 98 degrees?",
    options: ["Neptune", "Uranus", "Saturn", "Pluto"],
    correctIndex: 1,
    planetId: "uranus",
    explanation: "Uranus has a dramatic axial tilt of 97.8°, causing extreme 42-year long polar seasons during its 84 Earth-year orbit."
  }
];

const PLANETS: PlanetData[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    color: 0x9e9e9e,
    size: 0.5,
    distance: 8,
    speed: 0.035,
    tilt: 0.03,
    inclination: 7.00,
    eccentricity: 0.2056,
    realSemiMajorAxisAu: 0.387,
    realOrbitalVelocityKm: 47.36,
    rotationPeriodHours: 1407.6,
    surfaceGravityMps: 3.70,
    escapeVelocityKm: 4.25,
    realMassKg: '3.301 × 10²³ kg',
    info: {
      type: 'Terrestrial Planet',
      distanceFromSun: '57.9 million km (0.39 AU)',
      orbitalPeriod: '88 Earth Days',
      moons: 0,
      diameter: '4,879 km',
      tempRange: '-180°C to 430°C',
      atmosphericComposition: 'Traces of Sodium, Helium, Oxygen',
      gravityVsEarth: '0.38x Earth Gravity (3.70 m/s²)',
      fact: 'Smallest planet in our solar system and closest to the Sun with an extremely cratered surface.',
      ncertNote: 'Lacks an atmospheric thermal blanket, leading to extreme day-night temperature swings (-180°C to 430°C).'
    }
  },
  {
    id: 'venus',
    name: 'Venus',
    color: 0xeab308,
    size: 0.8,
    distance: 12,
    speed: 0.025,
    tilt: 177.3,
    inclination: 3.39,
    eccentricity: 0.0067,
    realSemiMajorAxisAu: 0.723,
    realOrbitalVelocityKm: 35.02,
    rotationPeriodHours: -5832.5, // Retrograde spin!
    surfaceGravityMps: 8.87,
    escapeVelocityKm: 10.36,
    realMassKg: '4.867 × 10²⁴ kg',
    info: {
      type: 'Terrestrial Planet',
      distanceFromSun: '108.2 million km (0.72 AU)',
      orbitalPeriod: '225 Earth Days',
      moons: 0,
      diameter: '12,104 km',
      tempRange: '462°C (Constant)',
      atmosphericComposition: '96.5% Carbon Dioxide, 3.5% Nitrogen',
      gravityVsEarth: '0.90x Earth Gravity (8.87 m/s²)',
      fact: 'Hottest planet in the solar system due to a runaway carbon dioxide greenhouse effect.',
      ncertNote: 'Known as the "Morning Star" or "Evening Star". Spins backwards (retrograde) relative to Earth.'
    }
  },
  {
    id: 'earth',
    name: 'Earth',
    color: 0x2563eb,
    size: 0.9,
    distance: 17,
    speed: 0.018,
    tilt: 23.44,
    inclination: 0.00,
    eccentricity: 0.0167,
    realSemiMajorAxisAu: 1.000,
    realOrbitalVelocityKm: 29.78,
    rotationPeriodHours: 23.93,
    surfaceGravityMps: 9.81,
    escapeVelocityKm: 11.19,
    realMassKg: '5.972 × 10²⁴ kg',
    hasMoon: true,
    info: {
      type: 'Terrestrial Planet (Our Home)',
      distanceFromSun: '149.6 million km (1.00 AU)',
      orbitalPeriod: '365.25 Days (1 Year)',
      moons: 1,
      diameter: '12,742 km',
      tempRange: '-89°C to 58°C',
      atmosphericComposition: '78% Nitrogen, 21% Oxygen, 1% Argon',
      gravityVsEarth: '1.00x (9.81 m/s² Standard)',
      fact: 'The only planet in the universe confirmed to harbor liquid surface oceans and life.',
      ncertNote: 'Axial tilt of 23.5° combined with revolution around the Sun creates changing seasons on Earth.'
    }
  },
  {
    id: 'mars',
    name: 'Mars',
    color: 0xef4444,
    size: 0.65,
    distance: 22,
    speed: 0.014,
    tilt: 25.19,
    inclination: 1.85,
    eccentricity: 0.0934,
    realSemiMajorAxisAu: 1.524,
    realOrbitalVelocityKm: 24.07,
    rotationPeriodHours: 24.62,
    surfaceGravityMps: 3.72,
    escapeVelocityKm: 5.03,
    realMassKg: '6.417 × 10²³ kg',
    info: {
      type: 'Terrestrial Planet',
      distanceFromSun: '227.9 million km (1.52 AU)',
      orbitalPeriod: '687 Earth Days',
      moons: 2,
      diameter: '6,779 km',
      tempRange: '-125°C to 20°C',
      atmosphericComposition: '95% Carbon Dioxide, 2.8% Nitrogen, Argon',
      gravityVsEarth: '0.38x Earth Gravity (3.72 m/s²)',
      fact: 'Known as the "Red Planet" due to iron oxide dust covering its ancient volcanic terrain.',
      ncertNote: 'Home to Olympus Mons, an extinct shield volcano three times taller than Mount Everest.'
    }
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    color: 0xd97706,
    size: 2.3,
    distance: 30,
    speed: 0.008,
    tilt: 3.13,
    inclination: 1.30,
    eccentricity: 0.0485,
    realSemiMajorAxisAu: 5.204,
    realOrbitalVelocityKm: 13.07,
    rotationPeriodHours: 9.92, // Fastest spin!
    surfaceGravityMps: 24.79,
    escapeVelocityKm: 59.54,
    realMassKg: '1.898 × 10²⁷ kg',
    hasRings: true,
    ringInnerRadius: 2.5,
    ringOuterRadius: 2.9,
    info: {
      type: 'Gas Giant',
      distanceFromSun: '778.5 million km (5.20 AU)',
      orbitalPeriod: '11.86 Earth Years',
      moons: 95,
      diameter: '139,820 km',
      tempRange: '-110°C (Cloud tops)',
      atmosphericComposition: '90% Hydrogen, 10% Helium',
      gravityVsEarth: '2.53x Earth Gravity (24.79 m/s²)',
      fact: 'Largest planet in our solar system, containing twice the mass of all other planets combined.',
      ncertNote: 'Houses the Great Red Spot—a massive high-pressure anticyclonic storm larger than Earth.'
    }
  },
  {
    id: 'saturn',
    name: 'Saturn',
    color: 0xfacc15,
    size: 1.9,
    distance: 38,
    speed: 0.0055,
    tilt: 26.73,
    inclination: 2.49,
    eccentricity: 0.0555,
    realSemiMajorAxisAu: 9.582,
    realOrbitalVelocityKm: 9.68,
    rotationPeriodHours: 10.66,
    surfaceGravityMps: 10.44,
    escapeVelocityKm: 35.49,
    realMassKg: '5.683 × 10²⁶ kg',
    hasRings: true,
    ringInnerRadius: 2.3,
    ringOuterRadius: 4.4,
    info: {
      type: 'Gas Giant',
      distanceFromSun: '1.43 billion km (9.58 AU)',
      orbitalPeriod: '29.45 Earth Years',
      moons: 146,
      diameter: '116,460 km',
      tempRange: '-140°C',
      atmosphericComposition: '96% Hydrogen, 3% Helium',
      gravityVsEarth: '1.06x Earth Gravity (10.44 m/s²)',
      fact: 'Famous for its dazzling system of icy ringlets stretching over 282,000 km into space.',
      ncertNote: 'Least dense planet in our solar system (0.69 g/cm³)—it is less dense than water!'
    }
  },
  {
    id: 'uranus',
    name: 'Uranus',
    color: 0x06b6d4,
    size: 1.3,
    distance: 46,
    speed: 0.0035,
    tilt: 97.77,
    inclination: 0.77,
    eccentricity: 0.0463,
    realSemiMajorAxisAu: 19.201,
    realOrbitalVelocityKm: 6.80,
    rotationPeriodHours: -17.24, // Retrograde spin!
    surfaceGravityMps: 8.69,
    escapeVelocityKm: 21.29,
    realMassKg: '8.681 × 10²⁵ kg',
    hasRings: true,
    ringInnerRadius: 1.6,
    ringOuterRadius: 2.1,
    info: {
      type: 'Ice Giant',
      distanceFromSun: '2.87 billion km (19.2 AU)',
      orbitalPeriod: '84 Earth Years',
      moons: 28,
      diameter: '50,724 km',
      tempRange: '-195°C',
      atmosphericComposition: '83% Hydrogen, 15% Helium, 2% Methane',
      gravityVsEarth: '0.89x Earth Gravity (8.69 m/s²)',
      fact: 'Rotates almost completely on its side with an extreme axial tilt of nearly 98 degrees.',
      ncertNote: 'Methane gas in its cold upper atmosphere absorbs red light, giving Uranus a cyan-blue hue.'
    }
  },
  {
    id: 'neptune',
    name: 'Neptune',
    color: 0x2563eb,
    size: 1.25,
    distance: 53,
    speed: 0.0025,
    tilt: 28.32,
    inclination: 1.77,
    eccentricity: 0.0095,
    realSemiMajorAxisAu: 30.047,
    realOrbitalVelocityKm: 5.43,
    rotationPeriodHours: 16.11,
    surfaceGravityMps: 11.15,
    escapeVelocityKm: 23.56,
    realMassKg: '1.024 × 10²⁶ kg',
    info: {
      type: 'Ice Giant',
      distanceFromSun: '4.50 billion km (30.1 AU)',
      orbitalPeriod: '164.8 Earth Years',
      moons: 16,
      diameter: '49,244 km',
      tempRange: '-200°C',
      atmosphericComposition: '80% Hydrogen, 19% Helium, 1.5% Methane',
      gravityVsEarth: '1.14x Earth Gravity (11.15 m/s²)',
      fact: 'The most distant major planet, plagued by supersonic methane winds exceeding 2,100 km/h.',
      ncertNote: 'First planet located through mathematical prediction before telescope confirmation.'
    }
  }
];

const DWARF_PLANETS: PlanetData[] = [
  {
    id: 'pluto',
    name: 'Pluto',
    color: 0xc084fc,
    size: 0.38,
    distance: 62,
    speed: 0.0018,
    tilt: 122.5,
    inclination: 17.16, // High inclination!
    eccentricity: 0.2488, // Highly elliptical!
    realSemiMajorAxisAu: 39.482,
    realOrbitalVelocityKm: 4.74,
    rotationPeriodHours: -153.29,
    surfaceGravityMps: 0.62,
    escapeVelocityKm: 1.21,
    realMassKg: '1.303 × 10²² kg',
    isDwarf: true,
    info: {
      type: 'Dwarf Planet (Kuiper Belt)',
      distanceFromSun: '5.91 billion km (39.5 AU)',
      orbitalPeriod: '248 Earth Years',
      moons: 5,
      diameter: '2,376 km',
      tempRange: '-230°C',
      atmosphericComposition: 'Nitrogen, Methane, Carbon Monoxide',
      gravityVsEarth: '0.06x Earth Gravity (0.62 m/s²)',
      fact: 'Reclassified as a Dwarf Planet in 2006 because it has not cleared its orbital neighborhood.',
      ncertNote: 'Features Tombaugh Regio—a bright, heart-shaped glacier composed of nitrogen and carbon monoxide ice.'
    }
  },
  {
    id: 'ceres',
    name: 'Ceres',
    color: 0xa8a29e,
    size: 0.32,
    distance: 26,
    speed: 0.012,
    tilt: 4.0,
    inclination: 10.59,
    eccentricity: 0.0758,
    realSemiMajorAxisAu: 2.767,
    realOrbitalVelocityKm: 17.90,
    rotationPeriodHours: 9.07,
    surfaceGravityMps: 0.27,
    escapeVelocityKm: 0.51,
    realMassKg: '9.39 × 10²⁰ kg',
    isDwarf: true,
    info: {
      type: 'Dwarf Planet (Asteroid Belt)',
      distanceFromSun: '413 million km (2.77 AU)',
      orbitalPeriod: '4.6 Earth Years',
      moons: 0,
      diameter: '940 km',
      tempRange: '-105°C',
      atmosphericComposition: 'Water Vapor (Transient)',
      gravityVsEarth: '0.03x Earth Gravity (0.27 m/s²)',
      fact: 'The largest object in the Main Asteroid Belt between Mars and Jupiter.',
      ncertNote: 'Contains vast deposits of water ice and bright sodium carbonate salt spots inside Occator Crater.'
    }
  }
];

const LANDMARK_HOTSPOTS: LandmarkHotspot[] = [
  {
    planetId: 'mars',
    name: 'Olympus Mons',
    lat: 18.6,
    lng: 226.2,
    type: 'volcano',
    description: 'Extinct shield volcano standing 21.9 km tall—three times the height of Mt. Everest.',
    ncertConnection: 'Demonstrates ancient Martian basaltic volcanic activity unhindered by moving tectonic plates.'
  },
  {
    planetId: 'mars',
    name: 'Valles Marineris',
    lat: -14.0,
    lng: 290.0,
    type: 'mountain',
    description: 'Grand canyon system stretching over 4,000 km across the equator of Mars.',
    ncertConnection: 'A massive tectonic fracture zone carved by ancient crustal spreading and thermal contraction.'
  },
  {
    planetId: 'earth',
    name: 'Himalayan Mountain Range',
    lat: 28.0,
    lng: 84.0,
    type: 'mountain',
    description: 'Home to Mt. Everest and K2, formed by the tectonic collision of Indian and Eurasian plates.',
    ncertConnection: 'A classic young fold mountain range driven by continental plate tectonics.'
  },
  {
    planetId: 'jupiter',
    name: 'Great Red Spot',
    lat: -22.0,
    lng: 0.0,
    type: 'storm',
    description: 'High-pressure anticyclonic storm larger than planet Earth that has churned for over 350 years.',
    ncertConnection: 'Illustrates atmospheric fluid dynamics under intense Coriolis forces and solar heating.'
  },
  {
    planetId: 'saturn',
    name: 'Cassini Division',
    lat: 0.0,
    lng: 0.0,
    type: 'ring',
    description: 'A 4,800 km wide gap between Saturn A and B rings cleared by orbital resonance with moon Mimas.',
    ncertConnection: 'Demonstrates gravitational orbital resonances in celestial mechanical systems.'
  },
  {
    planetId: 'pluto',
    name: 'Tombaugh Regio (Heart Glacier)',
    lat: 20.0,
    lng: 180.0,
    type: 'glacier',
    description: 'Bright heart-shaped nitrogen and carbon monoxide ice glacier named after Clyde Tombaugh.',
    ncertConnection: 'Exhibits cryo-convection and volatile seasonal ice cycles in the outer frigid realm.'
  }
];

const SPACE_PROBES: SpaceProbe[] = [
  {
    id: 'mangalyaan',
    name: 'ISRO Mangalyaan (MOM)',
    agency: 'ISRO (India)',
    parentBody: 'mars',
    distance: 1.8,
    speed: 0.02,
    launchYear: '2013',
    isIndianMission: true,
    missionObjective: "India's landmark maiden interplanetary mission to study Martian surface features, morphology, and methane signatures."
  },
  {
    id: 'chandrayaan3',
    name: 'ISRO Chandrayaan-3 (Vikram/Pragyan)',
    agency: 'ISRO (India)',
    parentBody: 'earth',
    distance: 2.1,
    speed: 0.04,
    launchYear: '2023',
    isIndianMission: true,
    missionObjective: "Historical mission achieving the world's first successful soft-landing at the lunar South Pole region."
  },
  {
    id: 'jwst',
    name: 'James Webb Space Telescope (JWST)',
    agency: 'NASA / ESA / CSA',
    parentBody: 'sun',
    distance: 20,
    speed: 0.018,
    launchYear: '2021',
    missionObjective: "Infrared space observatory located at Lagrange Point L2 uncovering the earliest galaxies and exoplanet atmospheres."
  }
];

// --- SYNTHESIZED WEB AUDIO SOUND ENGINE ---

class SpaceSoundEngine {
  private ctx: AudioContext | null = null;
  public isEnabled: boolean = false;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  public toggleSound(): boolean {
    this.isEnabled = !this.isEnabled;
    if (this.isEnabled) this.init();
    return this.isEnabled;
  }

  public playTargetLock() {
    if (!this.isEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.12); // C6
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  public playClick() {
    if (!this.isEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  public playWhoosh() {
    if (!this.isEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.5);
    } catch (e) {}
  }
}

const audioEngine = new SpaceSoundEngine();

// --- HIGH-PRECISION PHOTOREALISTIC PROCEDURAL TEXTURE GENERATORS ---

/** Sun Texture with Granulation, Magnetic Filaments & Sunspots */
function createPhotorealisticSunTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#fffbeb');
  grad.addColorStop(0.15, '#fef08a');
  grad.addColorStop(0.4, '#f59e0b');
  grad.addColorStop(0.75, '#ea580c');
  grad.addColorStop(1, '#9a3412');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Granulation pattern
  for (let i = 0; i < 2800; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const r = Math.random() * 16 + 2;
    const spotGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
    spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.88)');
    spotGrad.addColorStop(0.35, 'rgba(251, 191, 36, 0.45)');
    spotGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dark sunspot pairs
  for (let i = 0; i < 36; i++) {
    const x = 80 + Math.random() * 864;
    const y = 120 + Math.random() * 272;
    const r = Math.random() * 14 + 4;

    ctx.fillStyle = 'rgba(180, 83, 9, 0.85)';
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.9, r * 1.3, Math.random(), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1c0a02';
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.95, r * 0.65, Math.random(), 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/** Mercury Texture with Craters, Ray Systems, and Basalt */
function createPhotorealisticMercuryTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#52525b';
  ctx.fillRect(0, 0, 1024, 512);

  for (let i = 0; i < 450; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const r = Math.random() * 16 + 2;

    ctx.fillStyle = 'rgba(24, 24, 27, 0.65)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(228, 228, 231, 0.45)';
    ctx.lineWidth = Math.max(1, r * 0.15);
    ctx.stroke();

    if (r > 8) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      for (let k = 0; k < 6; k++) {
        const angle = (k / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * (r * 3.5), y + Math.sin(angle) * (r * 3.5));
        ctx.stroke();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/** Venus Atmosphere Texture */
function createPhotorealisticVenusTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#fef08a';
  ctx.fillRect(0, 0, 1024, 512);

  const colors = ['#fef08a', '#fde047', '#eab308', '#ca8a04', '#a16207', '#fde047'];
  for (let y = 0; y < 512; y += 4) {
    const norm = y / 512;
    const color = colors[Math.floor(norm * colors.length)];
    ctx.fillStyle = color;
    ctx.fillRect(0, y, 1024, 4);
  }

  for (let i = 0; i < 180; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    ctx.fillStyle = 'rgba(202, 138, 4, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y, Math.random() * 80 + 20, Math.random() * 15 + 4, (Math.random() - 0.5) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/** Earth Texture with Continents, Ice Caps, and Topography */
function createPhotorealisticEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f3d7a';
  ctx.fillRect(0, 0, 1024, 512);

  ctx.fillStyle = '#1d6fcd';
  for (let i = 0; i < 280; i++) {
    const x = Math.random() * 1024;
    const y = 40 + Math.random() * 432;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 32 + 10, 0, Math.PI * 2);
    ctx.fill();
  }

  const drawContinent = (cx: number, cy: number, rx: number, ry: number, color: string) => {
    ctx.fillStyle = color;
    for (let i = 0; i < 16; i++) {
      const x = cx + (Math.random() - 0.5) * rx;
      const y = cy + (Math.random() - 0.5) * ry;
      const r1 = (Math.random() * 0.6 + 0.4) * rx;
      const r2 = (Math.random() * 0.6 + 0.4) * ry;
      ctx.beginPath();
      ctx.ellipse(x, y, r1, r2, (Math.random() - 0.5) * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  drawContinent(650, 180, 180, 90, '#15803d'); // Eurasia
  drawContinent(720, 200, 140, 70, '#166534');
  drawContinent(680, 260, 48, 58, '#ca8a04'); // India
  drawContinent(500, 280, 85, 105, '#15803d'); // Africa
  drawContinent(500, 220, 80, 48, '#d97706'); // Sahara
  drawContinent(250, 170, 125, 85, '#15803d'); // North America
  drawContinent(320, 320, 65, 115, '#15803d'); // South America
  drawContinent(820, 340, 70, 50, '#d97706'); // Australia

  // Polar Ice Caps
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 1024, 45);
  ctx.fillRect(0, 467, 1024, 45);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/** Earth Night City Lights Texture (Emissive Map) */
function createEarthNightCityLightsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 1024, 512);

  const addCityCluster = (cx: number, cy: number, radius: number, density: number) => {
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.5) * radius;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;

      const brightness = Math.random() * 0.85 + 0.15;
      ctx.fillStyle = Math.random() > 0.25 ? `rgba(251, 191, 36, ${brightness})` : `rgba(255, 237, 213, ${brightness})`;
      ctx.fillRect(x, y, Math.random() * 1.5 + 0.8, Math.random() * 1.5 + 0.8);
    }
  };

  addCityCluster(680, 240, 38, 160); // India
  addCityCluster(750, 210, 55, 200); // East Asia
  addCityCluster(520, 170, 48, 220); // Europe
  addCityCluster(260, 170, 58, 200); // North America East
  addCityCluster(200, 190, 28, 100);  // US West
  addCityCluster(330, 340, 32, 90);  // South America
  addCityCluster(820, 350, 22, 70);  // Australia

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/** Earth Clouds Texture */
function createPhotorealisticCloudsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 1024, 512);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';

  for (let i = 0; i < 240; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const rx = Math.random() * 95 + 20;
    const ry = Math.random() * 22 + 4;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, (Math.random() - 0.5) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/** Mars Texture with Distinct White Polar Caps & Valles Marineris Canyon */
function createPhotorealisticMarsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(0, 0, 1024, 512);

  // Dark basalt volcanic regions
  ctx.fillStyle = '#7f1d1d';
  for (let i = 0; i < 110; i++) {
    const x = Math.random() * 1024;
    const y = 80 + Math.random() * 352;
    ctx.beginPath();
    ctx.ellipse(x, y, Math.random() * 65 + 15, Math.random() * 25 + 8, (Math.random() - 0.5) * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Valles Marineris canyon scratch
  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(350, 260);
  ctx.bezierCurveTo(450, 270, 550, 250, 650, 265);
  ctx.stroke();

  // Distinct North & South Polar Ice Caps (CO2 + Water Ice)
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(512, 20, 320, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(512, 492, 300, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/** Jupiter Texture with Bands & Great Red Spot */
function createPhotorealisticJupiterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d97706';
  ctx.fillRect(0, 0, 1024, 512);

  const colors = ['#fef3c7', '#fde047', '#d97706', '#b45309', '#78350f', '#fef3c7', '#ca8a04', '#d97706'];
  for (let y = 0; y < 512; y += 8) {
    const idx = Math.floor((y / 512) * colors.length);
    ctx.fillStyle = colors[idx % colors.length];
    ctx.fillRect(0, y, 1024, 8);
  }

  // Turbulent storm eddies
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    ctx.fillStyle = 'rgba(254, 243, 199, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y, Math.random() * 45 + 10, Math.random() * 8 + 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Famous Great Red Spot
  const grsX = 620;
  const grsY = 320;
  const grsGrad = ctx.createRadialGradient(grsX, grsY, 5, grsX, grsY, 42);
  grsGrad.addColorStop(0, '#ef4444');
  grsGrad.addColorStop(0.5, '#dc2626');
  grsGrad.addColorStop(0.85, '#991b1b');
  grsGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');

  ctx.fillStyle = grsGrad;
  ctx.beginPath();
  ctx.ellipse(grsX, grsY, 52, 32, 0.1, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/** Saturn Surface Texture */
function createPhotorealisticSaturnTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#fef08a';
  ctx.fillRect(0, 0, 1024, 512);

  const colors = ['#fef9c3', '#fef08a', '#fde047', '#eab308', '#ca8a04', '#fef08a'];
  for (let y = 0; y < 512; y += 6) {
    const idx = Math.floor((y / 512) * colors.length);
    ctx.fillStyle = colors[idx % colors.length];
    ctx.fillRect(0, y, 1024, 6);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/** Saturn Ring Texture with Cassini Division Gap */
function createSaturnRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  for (let x = 0; x < 1024; x++) {
    const norm = x / 1024;
    let alpha = 0;
    let color = '#fef08a';

    if (norm < 0.18) {
      alpha = norm * 0.4;
      color = '#ca8a04';
    } else if (norm >= 0.18 && norm <= 0.62) {
      alpha = 0.88 + Math.sin(norm * 120) * 0.12;
      color = '#fef08a';
    } else if (norm > 0.62 && norm < 0.68) {
      // CASSINI DIVISION GAP
      alpha = 0.04;
      color = '#1c1917';
    } else if (norm >= 0.68 && norm <= 0.94) {
      alpha = 0.68 + Math.cos(norm * 90) * 0.15;
      color = '#fde047';
    } else {
      alpha = 0.22;
      color = '#eab308';
    }

    ctx.fillStyle = color;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillRect(x, 0, 1, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/** Ice Giant Texture (Uranus / Neptune) */
function createPhotorealisticIceGiantTexture(baseHex: string, accentHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = accentHex;
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    ctx.beginPath();
    ctx.ellipse(x, y, Math.random() * 70 + 20, Math.random() * 9 + 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/** Pluto Texture with Tombaugh Regio Heart Glacier */
function createPlutoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#78350f';
  ctx.fillRect(0, 0, 512, 256);

  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    ctx.fillStyle = 'rgba(120, 113, 108, 0.4)';
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 25 + 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Heart-shaped glacier (Tombaugh Regio)
  ctx.fillStyle = '#f8fafc';
  const hx = 260;
  const hy = 130;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.bezierCurveTo(hx - 30, hy - 30, hx - 50, hy + 20, hx, hy + 50);
  ctx.bezierCurveTo(hx + 50, hy + 20, hx + 30, hy - 30, hx, hy);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

// --- MAIN COMPONENT ---

export const ThreeDSolarSystem: React.FC = React.memo(() => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Core Modes
  const [activeTab, setActiveTab] = useState<'orbit' | 'comparison' | 'inspector' | 'time' | 'quiz'>('orbit');
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showDwarfPlanets, setShowDwarfPlanets] = useState(false);
  const [showProbes, setShowProbes] = useState(true);
  const [isTrueScale, setIsTrueScale] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [isTrackingMode, setIsTrackingMode] = useState(true);
  const [hoveredPlanetName, setHoveredPlanetName] = useState<string | null>(null);

  // 3D Navigation Control Mode ('orbit' rotation vs 'pan' translation)
  const [controlMode, setControlMode] = useState<'orbit' | 'pan'>('orbit');
  const controlModeRef = useRef(controlMode);
  useEffect(() => { controlModeRef.current = controlMode; }, [controlMode]);

  // Spatial Panning Along Camera Screen X/Y Axes
  const handlePanSpatial = (dxScreen: number, dyScreen: number) => {
    if (!cameraRef.current) return;
    const cameraRight = new THREE.Vector3();
    const cameraUp = new THREE.Vector3();
    cameraRef.current.matrixWorld.extractBasis(cameraRight, cameraUp, new THREE.Vector3());

    const panScale = orbitParamsRef.current.radius * 0.05;
    orbitParamsRef.current.targetPos.addScaledVector(cameraRight, dxScreen * panScale);
    orbitParamsRef.current.targetPos.addScaledVector(cameraUp, dyScreen * panScale);
    setIsTrackingMode(false);
  };

  // Preset View Angles
  const handlePresetView = (preset: 'top' | 'side' | 'iso' | 'reset') => {
    if (preset === 'top') {
      orbitParamsRef.current.targetPhi = 0.02;
      orbitParamsRef.current.targetTheta = 0;
    } else if (preset === 'side') {
      orbitParamsRef.current.targetPhi = Math.PI / 2 - 0.02;
      orbitParamsRef.current.targetTheta = 0;
    } else if (preset === 'iso') {
      orbitParamsRef.current.targetPhi = Math.PI / 4;
      orbitParamsRef.current.targetTheta = Math.PI / 4;
    } else if (preset === 'reset') {
      orbitParamsRef.current.targetPos.set(0, 0, 0);
      orbitParamsRef.current.targetPhi = Math.PI / 4;
      orbitParamsRef.current.targetTheta = 0;
      orbitParamsRef.current.targetRadius = 75;
      setSelectedPlanet(null);
      setIsTrackingMode(true);
    }
  };

  // Time Travel Simulator State
  const [simYear, setSimYear] = useState<number>(2026);

  // Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showQuizResult, setShowQuizResult] = useState(false);

  // Landmark Hotspot State
  const [selectedHotspot, setSelectedHotspot] = useState<LandmarkHotspot | null>(null);

  // Telemetry & Screen Projection
  const [targetScreenPos, setTargetScreenPos] = useState<{ x: number; y: number; visible: boolean } | null>(null);
  const [liveTelemetry, setLiveTelemetry] = useState<{ distanceAu: string; speedKm: string; posX: string; posY: string; posZ: string }>({
    distanceAu: '0.00',
    speedKm: '0 km/s',
    posX: '0.0',
    posY: '0.0',
    posZ: '0.0'
  });

  // Refs for Animation Loop
  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speedMultiplier);
  const selectedPlanetRef = useRef<string | null>(null);
  const isTrackingModeRef = useRef(isTrackingMode);
  const isTrueScaleRef = useRef(isTrueScale);
  const simYearRef = useRef(simYear);
  const showOrbitsRef = useRef(showOrbits);
  const showDwarfPlanetsRef = useRef(showDwarfPlanets);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { speedRef.current = speedMultiplier; }, [speedMultiplier]);
  useEffect(() => { selectedPlanetRef.current = selectedPlanet?.id || null; }, [selectedPlanet]);
  useEffect(() => { isTrackingModeRef.current = isTrackingMode; }, [isTrackingMode]);
  useEffect(() => { simYearRef.current = simYear; }, [simYear]);

  const planetMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const probeMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const orbitRingsMapRef = useRef<Map<string, THREE.Line>>(new Map());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Camera Spherical Controls Ref (Smooth Target Interpolation Engine)
  const orbitParamsRef = useRef({
    theta: 0,
    targetTheta: 0,
    phi: Math.PI / 4,
    targetPhi: Math.PI / 4,
    radius: 75,
    targetRadius: 75,
    pos: new THREE.Vector3(0, 0, 0),
    targetPos: new THREE.Vector3(0, 0, 0)
  });

  // Dynamic Orbit Ring Alignment Rebuilder
  const rebuildOrbitRings = () => {
    const allBodies = [...PLANETS, ...DWARF_PLANETS];
    allBodies.forEach((p) => {
      const line = orbitRingsMapRef.current.get(p.id);
      if (!line) return;

      const a = isTrueScaleRef.current ? Math.pow(p.distance, 1.25) * 0.7 : p.distance;
      const e = p.eccentricity || 0;
      const inc = THREE.MathUtils.degToRad(p.inclination || 0);

      const segments = 256;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const r = (a * (1 - e * e)) / (1 + e * Math.cos(theta));
        const x0 = Math.cos(theta) * r;
        const z0 = Math.sin(theta) * r;
        points.push(new THREE.Vector3(x0, z0 * Math.sin(inc), z0 * Math.cos(inc)));
      }

      line.geometry.dispose();
      line.geometry = new THREE.BufferGeometry().setFromPoints(points);

      const isDwarf = !!p.isDwarf;
      const isVisible = showOrbitsRef.current && (!isDwarf || showDwarfPlanetsRef.current);
      line.visible = isVisible;
    });
  };

  useEffect(() => {
    showOrbitsRef.current = showOrbits;
    rebuildOrbitRings();
  }, [showOrbits]);

  useEffect(() => {
    showDwarfPlanetsRef.current = showDwarfPlanets;
    rebuildOrbitRings();
  }, [showDwarfPlanets]);

  useEffect(() => {
    isTrueScaleRef.current = isTrueScale;
    rebuildOrbitRings();
  }, [isTrueScale]);

  // Combine planets + dwarf planets list
  const allCelestialBodies = useMemo(() => {
    return showDwarfPlanets ? [...PLANETS, ...DWARF_PLANETS] : PLANETS;
  }, [showDwarfPlanets]);

  // --- THREE.JS ENGINE SCENE INITIALIZATION ---
  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    const width = mountNode.clientWidth || 800;
    const height = mountNode.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 35, 65);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch (e) {
      console.warn('WebGL init failed in ThreeDSolarSystem:', e);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    mountNode.appendChild(renderer.domElement);

    // 4. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.32);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xfff7ed, 5.2, 800);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    const sunGlowLight = new THREE.PointLight(0xfba11d, 2.5, 150);
    sunGlowLight.position.set(0, 0, 0);
    scene.add(sunGlowLight);

    // 5. Sun Mesh
    const sunTexture = createPhotorealisticSunTexture();
    const sunGeo = new THREE.SphereGeometry(4.5, 64, 64);
    const sunMat = new THREE.MeshBasicMaterial({ map: sunTexture });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunMesh);

    // Sun Inner Corona
    const coronaGeo = new THREE.SphereGeometry(5.2, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.42,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    scene.add(coronaMesh);

    // Sun Outer Flare Halo
    const haloGeo = new THREE.SphereGeometry(6.4, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xea580c,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    scene.add(haloMesh);

    // 6. Deep Space Background Starfield & Shooting Stars
    const starCount = 2800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 800;
      starPos[i + 1] = (Math.random() - 0.5) * 800;
      starPos[i + 2] = (Math.random() - 0.5) * 800;

      const rand = Math.random();
      if (rand > 0.8) {
        starColors[i] = 0.6; starColors[i + 1] = 0.85; starColors[i + 2] = 1.0;
      } else if (rand > 0.6) {
        starColors[i] = 1.0; starColors[i + 1] = 0.9; starColors[i + 2] = 0.6;
      } else {
        starColors[i] = 0.95; starColors[i + 1] = 0.95; starColors[i + 2] = 1.0;
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({ size: 0.95, vertexColors: true, transparent: true, opacity: 0.95 });
    scene.add(new THREE.Points(starGeo, starMat));

    // 7. Main Asteroid Belt (including Ceres)
    const asteroidGroup = new THREE.Group();
    const asteroidCount = 450;
    const asteroidGeo = new THREE.DodecahedronGeometry(0.14, 1);
    const asteroidMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });

    for (let i = 0; i < asteroidCount; i++) {
      const astMesh = new THREE.Mesh(asteroidGeo, asteroidMat);
      const dist = 26 + (Math.random() - 0.5) * 5.0;
      const angle = Math.random() * Math.PI * 2;
      const heightOffset = (Math.random() - 0.5) * 1.8;

      astMesh.position.set(Math.cos(angle) * dist, heightOffset, Math.sin(angle) * dist);
      astMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      astMesh.scale.setScalar(0.4 + Math.random() * 1.5);
      asteroidGroup.add(astMesh);
    }
    scene.add(asteroidGroup);

    // 8. Kuiper Belt (including Pluto) - Realistic Icy Micro-Debris
    const kuiperGroup = new THREE.Group();
    const kuiperCount = 380;
    const kuiperGeo = new THREE.SphereGeometry(0.12, 8, 8); // Smooth icy spheres - NO low poly blue icosahedron hexagons!
    const kuiperMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      roughness: 0.7,
      metalness: 0.1,
      transparent: true,
      opacity: 0.82
    });

    for (let i = 0; i < kuiperCount; i++) {
      const kMesh = new THREE.Mesh(kuiperGeo, kuiperMat);
      const dist = 60 + (Math.random() - 0.5) * 12;
      const angle = Math.random() * Math.PI * 2;
      const heightOffset = (Math.random() - 0.5) * 3.2;

      kMesh.position.set(Math.cos(angle) * dist, heightOffset, Math.sin(angle) * dist);
      kMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      const scaleVal = 0.3 + Math.random() * 1.2;
      kMesh.scale.set(scaleVal, scaleVal * (0.8 + Math.random() * 0.4), scaleVal);
      kuiperGroup.add(kMesh);
    }
    scene.add(kuiperGroup);

    // 9. Halley's Comet
    const cometGroup = new THREE.Group();
    const cometNucleus = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.32, 1),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 })
    );
    cometGroup.add(cometNucleus);

    const cometTailGeo = new THREE.ConeGeometry(0.5, 6.0, 16);
    cometTailGeo.translate(0, 3.0, 0);
    const cometTailMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending });
    const cometTail = new THREE.Mesh(cometTailGeo, cometTailMat);
    cometTail.rotation.x = Math.PI / 2;
    cometGroup.add(cometTail);
    scene.add(cometGroup);

    // 10. Generate Planets & Dwarf Planets
    const planetAngles: Record<string, number> = {};

    [...PLANETS, ...DWARF_PLANETS].forEach((p) => {
      // Orbit Ring (3D Keplerian Ellipse with Orbital Inclination)
      const orbitGeo = new THREE.BufferGeometry();
      const orbitColor = p.isDwarf ? 0xc084fc : 0x38bdf8;
      const orbitMat = new THREE.LineBasicMaterial({ color: orbitColor, transparent: true, opacity: p.isDwarf ? 0.35 : 0.5 });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      scene.add(orbitLine);
      orbitRingsMapRef.current.set(p.id, orbitLine);

      // Select Texture
      let planetTex: THREE.CanvasTexture;
      if (p.id === 'earth') planetTex = createPhotorealisticEarthTexture();
      else if (p.id === 'jupiter') planetTex = createPhotorealisticJupiterTexture();
      else if (p.id === 'saturn') planetTex = createPhotorealisticSaturnTexture();
      else if (p.id === 'mars') planetTex = createPhotorealisticMarsTexture();
      else if (p.id === 'mercury') planetTex = createPhotorealisticMercuryTexture();
      else if (p.id === 'venus') planetTex = createPhotorealisticVenusTexture();
      else if (p.id === 'uranus') planetTex = createPhotorealisticIceGiantTexture('#06b6d4', '#0891b2');
      else if (p.id === 'neptune') planetTex = createPhotorealisticIceGiantTexture('#1d4ed8', '#1e40af');
      else if (p.id === 'pluto') planetTex = createPlutoTexture();
      else planetTex = createPhotorealisticMercuryTexture();

      const pGeo = new THREE.SphereGeometry(p.size, 64, 64);
      let pMat: THREE.Material;

      if (p.id === 'earth') {
        const nightTex = createEarthNightCityLightsTexture();
        pMat = new THREE.MeshStandardMaterial({
          map: planetTex,
          emissiveMap: nightTex,
          emissive: new THREE.Color(0xffb703),
          emissiveIntensity: 0.75,
          roughness: 0.45,
          metalness: 0.1
        });
      } else {
        pMat = new THREE.MeshStandardMaterial({ map: planetTex, roughness: 0.65, metalness: 0.1 });
      }

      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.userData = { planetId: p.id, planetName: p.name, isDwarf: p.isDwarf };
      pMesh.rotation.z = THREE.MathUtils.degToRad(p.tilt);
      if (p.isDwarf) {
        pMesh.visible = showDwarfPlanetsRef.current;
      }

      const a = p.distance;
      const e = p.eccentricity || 0;
      const inc = THREE.MathUtils.degToRad(p.inclination || 0);

      planetAngles[p.id] = Math.random() * Math.PI * 2;
      const rInit = (a * (1 - e * e)) / (1 + e * Math.cos(planetAngles[p.id]));
      pMesh.position.x = Math.cos(planetAngles[p.id]) * rInit;
      pMesh.position.y = Math.sin(planetAngles[p.id]) * rInit * Math.sin(inc);
      pMesh.position.z = Math.sin(planetAngles[p.id]) * rInit * Math.cos(inc);

      // Special Layer: Earth Clouds & Blue Atmosphere Glow
      if (p.id === 'earth') {
        const cloudTex = createPhotorealisticCloudsTexture();
        const cloudMesh = new THREE.Mesh(
          new THREE.SphereGeometry(p.size + 0.038, 64, 64),
          new THREE.MeshStandardMaterial({ map: cloudTex, transparent: true, opacity: 0.72 })
        );
        cloudMesh.name = 'earthClouds';
        pMesh.add(cloudMesh);

        pMesh.add(new THREE.Mesh(
          new THREE.SphereGeometry(p.size + 0.095, 32, 32),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.38, side: THREE.BackSide, blending: THREE.AdditiveBlending })
        ));
      }

      // Special Layer: Venus Golden Atmospheric Glow
      if (p.id === 'venus') {
        pMesh.add(new THREE.Mesh(
          new THREE.SphereGeometry(p.size + 0.05, 32, 32),
          new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.30, side: THREE.BackSide, blending: THREE.AdditiveBlending })
        ));
      }

      // Special Layer: Mars Iron Oxide Atmosphere Haze
      if (p.id === 'mars') {
        pMesh.add(new THREE.Mesh(
          new THREE.SphereGeometry(p.size + 0.04, 32, 32),
          new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.28, side: THREE.BackSide, blending: THREE.AdditiveBlending })
        ));
      }

      // Special Layer: Uranus Atmosphere & Vertical Rings
      if (p.id === 'uranus') {
        pMesh.add(new THREE.Mesh(
          new THREE.SphereGeometry(p.size + 0.06, 32, 32),
          new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.35, side: THREE.BackSide, blending: THREE.AdditiveBlending })
        ));
        const uRingGeo = new THREE.RingGeometry(p.size + 0.35, p.size + 0.65, 64);
        const uRingMesh = new THREE.Mesh(uRingGeo, new THREE.MeshBasicMaterial({ color: 0xa5f3fc, side: THREE.DoubleSide, transparent: true, opacity: 0.40 }));
        uRingMesh.rotation.y = Math.PI / 2;
        pMesh.add(uRingMesh);
      }

      // Special Layer: Neptune Atmosphere & Rings
      if (p.id === 'neptune') {
        pMesh.add(new THREE.Mesh(
          new THREE.SphereGeometry(p.size + 0.06, 32, 32),
          new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.35, side: THREE.BackSide, blending: THREE.AdditiveBlending })
        ));
        const nRingGeo = new THREE.RingGeometry(p.size + 0.3, p.size + 0.55, 64);
        const nRingMesh = new THREE.Mesh(nRingGeo, new THREE.MeshBasicMaterial({ color: 0x60a5fa, side: THREE.DoubleSide, transparent: true, opacity: 0.35 }));
        nRingMesh.rotation.x = Math.PI / 2.2;
        pMesh.add(nRingMesh);
      }

      // Special Layer: Saturn Rings
      if (p.id === 'saturn' && p.ringInnerRadius && p.ringOuterRadius) {
        const ringTex = createSaturnRingTexture();
        const ringGeo = new THREE.RingGeometry(p.ringInnerRadius, p.ringOuterRadius, 128);

        const pos = ringGeo.attributes.position;
        const uvs = new Float32Array(pos.count * 2);
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const len = Math.sqrt(x * x + y * y);
          uvs[i * 2] = (len - p.ringInnerRadius) / (p.ringOuterRadius - p.ringInnerRadius);
          uvs[i * 2 + 1] = 0.5;
        }
        ringGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        const ringMesh = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ map: ringTex, side: THREE.DoubleSide, transparent: true, opacity: 0.94, roughness: 0.5 }));
        ringMesh.rotation.x = Math.PI / 2.1;
        pMesh.add(ringMesh);
      }

      // Moons: Earth Moon
      if (p.hasMoon) {
        const moonTex = createPhotorealisticMercuryTexture();
        const moonMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 32, 32),
          new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.85 })
        );
        moonMesh.position.set(1.7, 0, 0);
        moonMesh.name = 'earthMoon';
        pMesh.add(moonMesh);
      }

      // Galilean Moons for Jupiter
      if (p.id === 'jupiter') {
        const moonData = [
          { name: 'Io', color: 0xfacc15, dist: 3.1, size: 0.14 },
          { name: 'Europa', color: 0xf8fafc, dist: 3.8, size: 0.12 },
          { name: 'Ganymede', color: 0x94a3b8, dist: 4.6, size: 0.18 },
          { name: 'Callisto', color: 0x64748b, dist: 5.4, size: 0.16 }
        ];

        moonData.forEach(m => {
          const mMesh = new THREE.Mesh(
            new THREE.SphereGeometry(m.size, 16, 16),
            new THREE.MeshStandardMaterial({ color: m.color, roughness: 0.7 })
          );
          mMesh.name = `jupiterMoon_${m.name}`;
          mMesh.position.set(m.dist, 0, 0);
          pMesh.add(mMesh);
        });
      }

      scene.add(pMesh);
      planetMeshesRef.current.set(p.id, pMesh);
    });

    // Populate orbit ring geometries and visibilities immediately
    rebuildOrbitRings();

    // 11. Create Space Probes / Satellites (Mangalyaan, Chandrayaan-3, JWST)
    SPACE_PROBES.forEach(probe => {
      const probeGroup = new THREE.Group();
      probeGroup.userData = { probeId: probe.id, probeName: probe.name };

      // Gold foil body cube
      const bodyMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.25, 0.25),
        new THREE.MeshStandardMaterial({ color: probe.isIndianMission ? 0xf59e0b : 0xe2e8f0, metalness: 0.9, roughness: 0.2 })
      );
      probeGroup.add(bodyMesh);

      // Solar Panel Wings
      const wingGeo = new THREE.BoxGeometry(0.8, 0.02, 0.2);
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.8, roughness: 0.3 });
      const wings = new THREE.Mesh(wingGeo, wingMat);
      wings.position.set(0, 0, 0);
      probeGroup.add(wings);

      // Dish antenna
      const dishMesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.08, 16),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.5 })
      );
      dishMesh.rotation.x = Math.PI;
      dishMesh.position.set(0, 0.18, 0);
      probeGroup.add(dishMesh);

      scene.add(probeGroup);
      probeMeshesRef.current.set(probe.id, probeGroup);
    });

    // 12. Raycaster & Pointer Interaction
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const checkIntersection = (e: MouseEvent) => {
      const rect = domEl.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseVec, camera);
      const meshes: THREE.Object3D[] = Array.from(planetMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const id = hit.userData.planetId;
        const name = hit.userData.planetName;
        if (id && name) {
          setHoveredPlanetName(name);
          domEl.style.cursor = 'pointer';
          return hit;
        }
      }
      setHoveredPlanetName(null);
      domEl.style.cursor = isDragging ? 'grabbing' : 'grab';
      return null;
    };

    const onClickCanvas = (e: MouseEvent) => {
      const hit = checkIntersection(e);
      if (hit) {
        const allBodies = [...PLANETS, ...DWARF_PLANETS];
        const pData = allBodies.find(p => p.id === hit.userData.planetId);
        if (pData) {
          setSelectedPlanet(pData);
          setIsTrackingMode(true);
          audioEngine.playTargetLock();
          const idealRadius = Math.max(3.2, pData.size * 3.8);
          orbitParamsRef.current.targetRadius = idealRadius;
        }
      }
    };

    // 13. Dual-Axis Interactive Controls Engine (X/Y Pan & 3D Orbit Spin)
    let isDragging = false;
    let dragButton = 0;
    let prevMouse = { x: 0, y: 0 };
    let prevTouchDist = 0;
    let prevTouchCenter = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      dragButton = e.button;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      checkIntersection(e);
      if (!isDragging) return;

      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;

      const isPan = dragButton === 2 || dragButton === 1 || e.shiftKey || controlModeRef.current === 'pan';

      if (isPan) {
        // Disengage locked planet tracking so user can freely translate camera in X/Y axes
        setIsTrackingMode(false);

        const cameraRight = new THREE.Vector3();
        const cameraUp = new THREE.Vector3();
        camera.matrixWorld.extractBasis(cameraRight, cameraUp, new THREE.Vector3());

        const panScale = orbitParamsRef.current.radius * 0.0016;
        orbitParamsRef.current.targetPos.addScaledVector(cameraRight, -dx * panScale);
        orbitParamsRef.current.targetPos.addScaledVector(cameraUp, dy * panScale);
      } else {
        // Smooth Orbit Rotation Targets
        orbitParamsRef.current.targetTheta += dx * 0.0035;
        orbitParamsRef.current.targetPhi = Math.max(0.04, Math.min(Math.PI / 2 - 0.02, orbitParamsRef.current.targetPhi - dy * 0.0035));
      }

      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => { isDragging = false; };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Enable right-click dragging without context menu popup
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        isDragging = true;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        prevTouchDist = Math.hypot(dx, dy);
        prevTouchCenter = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - prevMouse.x;
        const dy = e.touches[0].clientY - prevMouse.y;

        if (controlModeRef.current === 'pan') {
          setIsTrackingMode(false);
          const cameraRight = new THREE.Vector3();
          const cameraUp = new THREE.Vector3();
          camera.matrixWorld.extractBasis(cameraRight, cameraUp, new THREE.Vector3());
          const panScale = orbitParamsRef.current.radius * 0.0016;
          orbitParamsRef.current.targetPos.addScaledVector(cameraRight, -dx * panScale);
          orbitParamsRef.current.targetPos.addScaledVector(cameraUp, dy * panScale);
        } else {
          orbitParamsRef.current.targetTheta += dx * 0.0035;
          orbitParamsRef.current.targetPhi = Math.max(0.04, Math.min(Math.PI / 2 - 0.02, orbitParamsRef.current.targetPhi - dy * 0.0035));
        }
        prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        setIsTrackingMode(false);
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const zoomDelta = (prevTouchDist - dist) * 0.1;
        orbitParamsRef.current.targetRadius = Math.max(2.0, Math.min(180, orbitParamsRef.current.targetRadius + zoomDelta));
        prevTouchDist = dist;

        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const panDx = cx - prevTouchCenter.x;
        const panDy = cy - prevTouchCenter.y;

        const cameraRight = new THREE.Vector3();
        const cameraUp = new THREE.Vector3();
        camera.matrixWorld.extractBasis(cameraRight, cameraUp, new THREE.Vector3());
        const panScale = orbitParamsRef.current.radius * 0.0016;
        orbitParamsRef.current.targetPos.addScaledVector(cameraRight, -panDx * panScale);
        orbitParamsRef.current.targetPos.addScaledVector(cameraUp, panDy * panScale);

        prevTouchCenter = { x: cx, y: cy };
      }
    };

    const onTouchEnd = () => { isDragging = false; };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.035;
      const isPlanetSelected = !!selectedPlanetRef.current;
      const minR = isPlanetSelected ? 2.0 : 12;
      const maxR = isPlanetSelected ? 35 : 180;

      orbitParamsRef.current.targetRadius = Math.max(minR, Math.min(maxR, orbitParamsRef.current.targetRadius + zoomFactor));
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('click', onClickCanvas);
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domEl.addEventListener('contextmenu', onContextMenu);
    domEl.addEventListener('touchstart', onTouchStart, { passive: true });
    domEl.addEventListener('touchmove', onTouchMove, { passive: true });
    domEl.addEventListener('touchend', onTouchEnd);
    domEl.addEventListener('wheel', onWheel, { passive: false });

    const handleResize = () => {
      if (!mountNode) return;
      const w = mountNode.clientWidth;
      const h = mountNode.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 14. Main Animation Render Loop
    let animId: number;
    let lastTime = performance.now();
    const startTime = lastTime;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (document.hidden) return;

      const now = performance.now();
      const delta = Math.min((now - lastTime) * 0.001, 0.1);
      lastTime = now;
      const elapsedTime = (now - startTime) * 0.001;

      // Sun rotations
      sunMesh.rotation.y += 0.002;
      coronaMesh.rotation.y -= 0.0015;
      haloMesh.rotation.y += 0.001;

      // Belt rotations
      if (isPlayingRef.current) {
        asteroidGroup.rotation.y += 0.001 * speedRef.current;
        kuiperGroup.rotation.y += 0.0004 * speedRef.current;

        const cometAngle = elapsedTime * 0.15 * speedRef.current;
        const cX = Math.cos(cometAngle) * 44;
        const cZ = Math.sin(cometAngle) * 26;
        cometGroup.position.set(cX, Math.sin(cometAngle * 2) * 5, cZ);

        const awayVec = cometGroup.position.clone().normalize();
        cometTail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), awayVec);
      }

      // Orbit Celestial Bodies with Real Keplerian Mechanics
      const allBodies = [...PLANETS, ...DWARF_PLANETS];
      allBodies.forEach((p) => {
        const mesh = planetMeshesRef.current.get(p.id);
        if (mesh) {
          if (isPlayingRef.current) {
            // Adjust angle by simulation year if time mode is altered
            const yearOffset = (simYearRef.current - 2026) * (365 / Math.max(1, p.distance));
            planetAngles[p.id] += (p.speed * speedRef.current * delta * 15);
            const effectiveAngle = planetAngles[p.id] + yearOffset;

            // Real Semi-major Axis and Elliptical Orbit Calculations
            const a = isTrueScaleRef.current ? Math.pow(p.distance, 1.25) * 0.7 : p.distance;
            const e = p.eccentricity || 0;
            const inc = THREE.MathUtils.degToRad(p.inclination || 0);

            const r = (a * (1 - e * e)) / (1 + e * Math.cos(effectiveAngle));
            const x0 = Math.cos(effectiveAngle) * r;
            const z0 = Math.sin(effectiveAngle) * r;

            mesh.position.x = x0;
            mesh.position.y = z0 * Math.sin(inc);
            mesh.position.z = z0 * Math.cos(inc);
          }

          // Real Sidereal Axial Spin (supporting retrograde)
          const spinDir = (p.rotationPeriodHours || 24) < 0 ? -1 : 1;
          const spinSpeed = (24.0 / Math.abs(p.rotationPeriodHours || 24)) * 0.012;
          mesh.rotation.y += spinDir * spinSpeed * speedRef.current;

          // Earth clouds & Moon
          if (p.id === 'earth') {
            const clouds = mesh.getObjectByName('earthClouds');
            if (clouds) clouds.rotation.y += 0.016;

            const moon = mesh.getObjectByName('earthMoon');
            if (moon) {
              const moonTime = elapsedTime * 1.5;
              moon.position.x = Math.cos(moonTime) * 1.7;
              moon.position.z = Math.sin(moonTime) * 1.7;
            }
          }

          // Jupiter Galilean Moons
          if (p.id === 'jupiter') {
            const moonNames = [
              { name: 'Io', speed: 2.2, dist: 3.1 },
              { name: 'Europa', speed: 1.7, dist: 3.8 },
              { name: 'Ganymede', speed: 1.2, dist: 4.6 },
              { name: 'Callisto', speed: 0.8, dist: 5.4 }
            ];

            moonNames.forEach(m => {
              const jMoon = mesh.getObjectByName(`jupiterMoon_${m.name}`);
              if (jMoon) {
                const angle = elapsedTime * m.speed;
                jMoon.position.x = Math.cos(angle) * m.dist;
                jMoon.position.z = Math.sin(angle) * m.dist;
              }
            });
          }
        }
      });

      // Orbit Space Probes
      SPACE_PROBES.forEach(probe => {
        const probeGroup = probeMeshesRef.current.get(probe.id);
        if (probeGroup) {
          const parentMesh = planetMeshesRef.current.get(probe.parentBody);
          let basePos = new THREE.Vector3(0, 0, 0);
          if (parentMesh && probe.parentBody !== 'sun') {
            basePos = parentMesh.position.clone();
          }

          const angle = elapsedTime * probe.speed * 2.0;
          probeGroup.position.x = basePos.x + Math.cos(angle) * probe.distance;
          probeGroup.position.z = basePos.z + Math.sin(angle) * probe.distance;
          probeGroup.position.y = basePos.y + Math.sin(angle * 1.5) * 0.4;
          probeGroup.rotation.y += 0.01;
        }
      });

      // --- DYNAMIC TRACKER CAMERA ENGINE ---
      const activePlanetId = selectedPlanetRef.current;
      const activePlanetMesh = activePlanetId ? planetMeshesRef.current.get(activePlanetId) : null;

      if (activePlanetMesh && isTrackingModeRef.current) {
        orbitParamsRef.current.targetPos.copy(activePlanetMesh.position);
      }

      // Smooth frame-rate independent exponential lerp
      const lerpAlpha = 1.0 - Math.exp(-12 * delta);
      orbitParamsRef.current.theta += (orbitParamsRef.current.targetTheta - orbitParamsRef.current.theta) * lerpAlpha;
      orbitParamsRef.current.phi += (orbitParamsRef.current.targetPhi - orbitParamsRef.current.phi) * lerpAlpha;
      orbitParamsRef.current.radius += (orbitParamsRef.current.targetRadius - orbitParamsRef.current.radius) * lerpAlpha;
      orbitParamsRef.current.pos.lerp(orbitParamsRef.current.targetPos, lerpAlpha);

      // Auto drift if no planet selected and not dragging
      if (!activePlanetId && !isDragging) {
        orbitParamsRef.current.targetTheta += 0.0003 * speedRef.current;
      }

      const r = orbitParamsRef.current.radius;
      const th = orbitParamsRef.current.theta;
      const ph = orbitParamsRef.current.phi;
      const target = orbitParamsRef.current.pos;

      camera.position.x = target.x + r * Math.sin(ph) * Math.sin(th);
      camera.position.y = target.y + r * Math.cos(ph);
      camera.position.z = target.z + r * Math.sin(ph) * Math.cos(th);
      camera.lookAt(target);

      // --- PROJECT TARGET TO 2D SCREEN SPACE FOR HUD RETICLE ---
      if (activePlanetMesh) {
        const pWorld = activePlanetMesh.position.clone();
        const pScreen = pWorld.clone().project(camera);

        const canvasW = mountNode.clientWidth;
        const canvasH = mountNode.clientHeight;
        const sx = (pScreen.x * 0.5 + 0.5) * canvasW;
        const sy = (-pScreen.y * 0.5 + 0.5) * canvasH;

        const isVisible = pScreen.z < 1.0;
        setTargetScreenPos({ x: sx, y: sy, visible: isVisible });

        // Calculate live telemetry values
        const distFromSunAu = (pWorld.length() / 17.0).toFixed(2);
        const curSpeedKm = (47.8 / Math.sqrt(Math.max(0.1, pWorld.length() / 17.0))).toFixed(1);

        setLiveTelemetry({
          distanceAu: `${distFromSunAu} AU`,
          speedKm: `${curSpeedKm} km/s`,
          posX: pWorld.x.toFixed(1),
          posY: pWorld.y.toFixed(1),
          posZ: pWorld.z.toFixed(1)
        });
      } else {
        setTargetScreenPos(null);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      domEl.removeEventListener('click', onClickCanvas);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);

      if (mountNode.contains(renderer.domElement)) {
        mountNode.removeChild(renderer.domElement);
      }

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((mat: any) => {
              if (mat.map) mat.map.dispose();
              if (mat.emissiveMap) mat.emissiveMap.dispose();
              mat.dispose();
            });
          }
        }
      });
      renderer.dispose();
    };
  }, []);

  // Update Dwarf Planets visibility
  useEffect(() => {
    planetMeshesRef.current.forEach((mesh) => {
      if (mesh.userData.isDwarf) {
        mesh.visible = showDwarfPlanets;
      }
    });
  }, [showDwarfPlanets]);

  useEffect(() => {
    probeMeshesRef.current.forEach((group) => {
      group.visible = showProbes;
    });
  }, [showProbes]);

  // Handler for planet selection
  const handleSelectPlanet = (p: PlanetData | null) => {
    setSelectedPlanet(p);
    if (p) {
      setIsTrackingMode(true);
      audioEngine.playTargetLock();
      const idealR = Math.max(3.2, p.size * 3.8);
      orbitParamsRef.current.targetRadius = idealR;
      // Auto select first hotspot if available
      const spots = LANDMARK_HOTSPOTS.filter(h => h.planetId === p.id);
      setSelectedHotspot(spots.length > 0 ? spots[0] : null);
    } else {
      setIsTrackingMode(false);
      setSelectedHotspot(null);
      orbitParamsRef.current.targetRadius = 75;
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    audioEngine.playWhoosh();
    const factor = direction === 'in' ? 0.72 : 1.38;
    const currentR = orbitParamsRef.current.targetRadius;
    const isPlanetSelected = !!selectedPlanet;
    const minR = isPlanetSelected ? 2.0 : 12;
    const maxR = isPlanetSelected ? 35 : 180;

    orbitParamsRef.current.targetRadius = Math.max(minR, Math.min(maxR, currentR * factor));
  };

  const handleQuizAnswer = (optionIdx: number) => {
    audioEngine.playClick();
    const currentQ = QUIZ_QUESTIONS[quizIndex];
    const newAnswers = [...userAnswers, optionIdx];
    setUserAnswers(newAnswers);

    // Auto fly to planet in 3D scene!
    const targetP = allCelestialBodies.find(p => p.id === currentQ.planetId);
    if (targetP) {
      handleSelectPlanet(targetP);
    }

    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      setTimeout(() => {
        setQuizIndex(quizIndex + 1);
      }, 1800);
    } else {
      setShowQuizResult(true);
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setUserAnswers([]);
    setShowQuizResult(false);
  };

  // Calculate Quiz Score
  const quizScore = useMemo(() => {
    return userAnswers.reduce((acc, ans, idx) => {
      return ans === QUIZ_QUESTIONS[idx].correctIndex ? acc + 1 : acc;
    }, 0);
  }, [userAnswers]);

  return (
    <section id="solarsystem" className="py-12 bg-slate-950 text-white relative overflow-hidden border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-xs mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>NCERT Interactive Photorealistic 3D Space Observatory & Laboratory</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-heading tracking-tight text-white">
              Model Public School 3D Solar System Explorer
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-body">
              Explore 3D planets, ISRO probes, landmark surface hotspots, true astronomical scales, and NCERT curriculum quests
            </p>
          </div>

          {/* Core Feature Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => { setActiveTab('orbit'); audioEngine.playClick(); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === 'orbit' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>3D Orbit View</span>
            </button>

            <button
              onClick={() => { setActiveTab('comparison'); audioEngine.playClick(); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === 'comparison' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Size Sandbox</span>
            </button>

            <button
              onClick={() => { setActiveTab('inspector'); audioEngine.playClick(); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === 'inspector' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Hotspots & Surface</span>
            </button>

            <button
              onClick={() => { setActiveTab('time'); audioEngine.playClick(); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === 'time' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Time Machine</span>
            </button>

            <button
              onClick={() => { setActiveTab('quiz'); audioEngine.playClick(); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === 'quiz' ? 'bg-purple-600 text-white font-extrabold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>NCERT Quest</span>
            </button>
          </div>
        </div>

        {/* Action Controls & Toggles Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition-all shadow-sm"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={() => setShowOrbits(!showOrbits)}
              className={`flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-xl border transition-all ${
                showOrbits ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Orbits {showOrbits ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setShowDwarfPlanets(!showDwarfPlanets)}
              className={`flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-xl border transition-all ${
                showDwarfPlanets ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dwarfs (Pluto/Ceres)</span>
            </button>

            <button
              onClick={() => setShowProbes(!showProbes)}
              className={`flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-xl border transition-all ${
                showProbes ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>ISRO & Space Probes</span>
            </button>

            <button
              onClick={() => setIsTrueScale(!isTrueScale)}
              className={`flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-xl border transition-all ${
                isTrueScale ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{isTrueScale ? 'True Distance Scale' : 'Visual Scale'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const soundOn = audioEngine.toggleSound();
                setIsSoundOn(soundOn);
              }}
              className={`p-2 rounded-xl border font-bold transition-all ${
                isSoundOn ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={isSoundOn ? 'Mute Sound FX' : 'Enable Synthesized Audio'}
            >
              {isSoundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-0.5">
              <button
                onClick={() => handleZoom('in')}
                className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleZoom('out')}
                className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => handleSelectPlanet(null)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold px-3 py-1.5 rounded-xl transition-all shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset View</span>
            </button>
          </div>
        </div>

        {/* Planet Selection Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
          <button
            onClick={() => handleSelectPlanet(null)}
            className={`px-3.5 py-2 rounded-full font-bold whitespace-nowrap transition-all border ${
              selectedPlanet === null
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            ☀️ Sun & Solar Overview
          </button>

          {allCelestialBodies.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPlanet(p)}
              className={`px-3.5 py-2 rounded-full font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                selectedPlanet?.id === p.id
                  ? 'bg-purple-600 text-white border-purple-400 shadow-lg scale-105'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shadow-xs"
                style={{ backgroundColor: `#${p.color.toString(16).padStart(6, '0')}` }}
              />
              <span>{p.name} {p.isDwarf ? '📍' : ''}</span>
            </button>
          ))}
        </div>

        {/* TAB CONTENT RENDERER */}

        {/* TAB 1: 3D ORBIT VIEW */}
        {activeTab === 'orbit' && (
          <div className="relative w-full h-[520px] sm:h-[640px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden group">
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* SCREEN-SPACE PLANET TRACKING HUD RETICLE */}
            {selectedPlanet && targetScreenPos && targetScreenPos.visible && (
              <div
                className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
                style={{ left: `${targetScreenPos.x}px`, top: `${targetScreenPos.y}px` }}
              >
                <div className="relative flex items-center justify-center w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-400/80 animate-ping opacity-75"></div>
                  <div className="absolute inset-2 rounded-full border border-dashed border-cyan-400 animate-spin" style={{ animationDuration: '8s' }}></div>
                  <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-lg shadow-emerald-500/50"></div>

                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-400"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-400"></div>
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-400"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-400"></div>

                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-950/90 border border-emerald-500/60 px-2.5 py-0.5 rounded-full text-[10px] font-black text-emerald-300 tracking-wider flex items-center gap-1 shadow-lg">
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>TRACKING: {selectedPlanet.name.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Hover Tooltip Overlay */}
            {hoveredPlanetName && !selectedPlanet && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-slate-900/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-purple-500/50 text-xs font-bold text-purple-300 shadow-lg flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>Click to lock tracking camera on 3D {hoveredPlanetName}</span>
              </div>
            )}

            {/* Interactive Badge */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 text-[11px] text-slate-300 shadow-md">
              <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />
              <span>Click any 3D body or probe to lock target tracker & orbital camera</span>
            </div>

            {/* 3D Navigation & Dual-Axis Pan Control Bar */}
            <div className="absolute top-16 left-4 z-10 flex flex-col gap-2">
              {/* Control Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-800 shadow-xl text-xs font-bold">
                <button
                  onClick={() => { setControlMode('orbit'); audioEngine.playClick(); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                    controlMode === 'orbit' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Left-click drag rotates 3D solar system"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Orbit Rotate</span>
                </button>
                <button
                  onClick={() => { setControlMode('pan'); audioEngine.playClick(); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                    controlMode === 'pan' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Left-click drag pans view along X and Y screen axes (or right-click drag / Shift+drag)"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Pan (X/Y Axis)</span>
                </button>
              </div>

              {/* View Angle Presets */}
              <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl text-[11px] font-bold">
                <button
                  onClick={() => { handlePresetView('top'); audioEngine.playClick(); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                  title="North Polar Overhead View"
                >
                  Top View
                </button>
                <button
                  onClick={() => { handlePresetView('side'); audioEngine.playClick(); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                  title="Ecliptic Flat Plane View"
                >
                  Ecliptic View
                </button>
                <button
                  onClick={() => { handlePresetView('iso'); audioEngine.playClick(); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                  title="3D Isometric Perspective"
                >
                  3D Iso
                </button>
                <button
                  onClick={() => { handlePresetView('reset'); audioEngine.playClick(); }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition-all"
                  title="Reset camera center to Sun (0,0,0)"
                >
                  Center Sun
                </button>
              </div>
            </div>

            {/* Spatial D-Pad Pan Directional Overlay Controls */}
            <div className="absolute bottom-4 right-4 z-10 hidden sm:flex flex-col items-center bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-800 shadow-2xl text-xs">
              <span className="text-[10px] font-bold text-slate-400 mb-1">X/Y Axis Pan</span>
              <div className="grid grid-cols-3 gap-1 w-24 h-24">
                <div />
                <button
                  onClick={() => handlePanSpatial(0, -1)}
                  className="flex items-center justify-center bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded-lg p-1 active:scale-90 transition-all shadow-sm"
                  title="Pan Up (+Y Axis)"
                >
                  ▲
                </button>
                <div />
                <button
                  onClick={() => handlePanSpatial(1, 0)}
                  className="flex items-center justify-center bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded-lg p-1 active:scale-90 transition-all shadow-sm"
                  title="Pan Left (-X Axis)"
                >
                  ◀
                </button>
                <button
                  onClick={() => handlePresetView('reset')}
                  className="flex items-center justify-center bg-amber-500 text-slate-950 font-black rounded-lg text-[10px] active:scale-90 transition-all shadow-sm"
                  title="Center Camera"
                >
                  •
                </button>
                <button
                  onClick={() => handlePanSpatial(-1, 0)}
                  className="flex items-center justify-center bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded-lg p-1 active:scale-90 transition-all shadow-sm"
                  title="Pan Right (+X Axis)"
                >
                  ▶
                </button>
                <div />
                <button
                  onClick={() => handlePanSpatial(0, 1)}
                  className="flex items-center justify-center bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded-lg p-1 active:scale-90 transition-all shadow-sm"
                  title="Pan Down (-Y Axis)"
                >
                  ▼
                </button>
                <div />
              </div>
            </div>

            {/* Orbit Speed Slider Overlay */}
            <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-3 text-xs">
              <span className="font-bold text-slate-300">Orbit Speed:</span>
              <input
                type="range"
                min="0.1"
                max="4"
                step="0.1"
                value={speedMultiplier}
                onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                className="w-24 accent-amber-500 cursor-pointer"
              />
              <span className="font-extrabold text-amber-400 w-8">{speedMultiplier.toFixed(1)}x</span>
            </div>

            {/* DYNAMIC TELEMETRY & PLANET DETAILS CARD OVERLAY */}
            {selectedPlanet && (
              <div className="absolute top-4 right-4 z-20 w-88 max-w-[calc(100%-2rem)] bg-slate-950/95 backdrop-blur-2xl p-5 rounded-3xl border border-purple-500/40 shadow-2xl text-white space-y-4 animate-in fade-in slide-in-from-right duration-300 max-h-[90%] overflow-y-auto">
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                        <LocateFixed className="w-3 h-3 text-emerald-400 animate-pulse" />
                        TARGET LOCKED
                      </span>
                      <span className="text-[10px] font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                        {selectedPlanet.info.type}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black font-heading text-white mt-1.5 flex items-center gap-2">
                      <span>{selectedPlanet.name}</span>
                    </h3>
                  </div>
                  <button
                    onClick={() => handleSelectPlanet(null)}
                    className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-all"
                    title="Unlock Target & Reset View"
                  >
                    ✕
                  </button>
                </div>

                {/* Real-time Telemetry */}
                <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-black text-purple-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> LIVE TELEMETRY</span>
                    <span className="text-emerald-400 font-extrabold animate-pulse">● TRACKING ACTIVE</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-body">
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">Orbital Distance</span>
                      <span className="font-extrabold text-amber-400 text-xs">{liveTelemetry.distanceAu}</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">Current Speed</span>
                      <span className="font-extrabold text-cyan-400 text-xs">{liveTelemetry.speedKm}</span>
                    </div>
                  </div>
                </div>

                {/* Real Astronomical Constants */}
                <div className="space-y-1.5 text-xs text-slate-300 font-body">
                  {selectedPlanet.realMassKg && (
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Planetary Mass:</span>
                      <span className="font-bold text-emerald-400">{selectedPlanet.realMassKg}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Distance from Sun:</span>
                    <span className="font-bold text-white">{selectedPlanet.info.distanceFromSun}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Orbital Period:</span>
                    <span className="font-bold text-amber-400">{selectedPlanet.info.orbitalPeriod}</span>
                  </div>
                  {selectedPlanet.inclination !== undefined && (
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Orbital Inclination:</span>
                      <span className="font-bold text-cyan-300">{selectedPlanet.inclination}°</span>
                    </div>
                  )}
                  {selectedPlanet.eccentricity !== undefined && (
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Orbital Eccentricity (e):</span>
                      <span className="font-bold text-purple-300">{selectedPlanet.eccentricity}</span>
                    </div>
                  )}
                  {selectedPlanet.escapeVelocityKm !== undefined && (
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Escape Velocity:</span>
                      <span className="font-bold text-rose-300">{selectedPlanet.escapeVelocityKm} km/s</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Diameter:</span>
                    <span className="font-bold text-slate-200">{selectedPlanet.info.diameter}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Moons:</span>
                    <span className="font-bold text-emerald-400">{selectedPlanet.info.moons}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Atmosphere:</span>
                    <span className="font-bold text-cyan-300">{selectedPlanet.info.atmosphericComposition}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Surface Gravity:</span>
                    <span className="font-bold text-purple-300">{selectedPlanet.info.gravityVsEarth}</span>
                  </div>
                </div>

                {/* NCERT Fact Box */}
                <div className="bg-purple-950/40 p-3 rounded-2xl border border-purple-800/50 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Info className="w-3.5 h-3.5" />
                    <span>NCERT Science Note</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {selectedPlanet.info.ncertNote}
                  </p>
                </div>

                <div className="text-[11px] text-slate-400 italic">
                  "{selectedPlanet.info.fact}"
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PLANET SIZE COMPARISON SANDBOX */}
        {activeTab === 'comparison' && (
          <div className="bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Scale className="w-6 h-6 text-amber-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Comparative Planet Size Sandbox</h3>
                <p className="text-xs text-slate-400">Visual 1:1 diameter comparison of celestial bodies relative to Earth & Sun</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLANETS.map((p) => {
                const ratioVsEarth = (p.size / 0.9).toFixed(2);
                return (
                  <div
                    key={p.id}
                    onClick={() => { handleSelectPlanet(p); setActiveTab('orbit'); }}
                    className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-purple-500/60 transition-all cursor-pointer group space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">{p.name}</span>
                      <span className="text-[10px] font-black text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">{p.info.type}</span>
                    </div>

                    <div className="h-20 flex items-center justify-center bg-slate-900/60 rounded-xl">
                      <div
                        className="rounded-full shadow-lg transition-transform group-hover:scale-110"
                        style={{
                          width: `${Math.max(12, p.size * 28)}px`,
                          height: `${Math.max(12, p.size * 28)}px`,
                          backgroundColor: `#${p.color.toString(16).padStart(6, '0')}`
                        }}
                      />
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-400">
                      <div className="flex justify-between">
                        <span>Diameter:</span>
                        <span className="font-bold text-white">{p.info.diameter}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Relative to Earth:</span>
                        <span className="font-extrabold text-amber-400">{ratioVsEarth}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Moons:</span>
                        <span className="font-bold text-emerald-400">{p.info.moons}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: LANDMARK SURFACE HOTSPOTS */}
        {activeTab === 'inspector' && (
          <div className="bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <MapPin className="w-6 h-6 text-purple-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Landmark Surface Feature Inspector</h3>
                <p className="text-xs text-slate-400">Examine famous volcanoes, canyons, storms, and glaciers across the solar system</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {LANDMARK_HOTSPOTS.map((hotspot) => (
                <div
                  key={hotspot.name}
                  onClick={() => {
                    const p = allCelestialBodies.find(b => b.id === hotspot.planetId);
                    if (p) handleSelectPlanet(p);
                    setSelectedHotspot(hotspot);
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    selectedHotspot?.name === hotspot.name
                      ? 'bg-purple-950/60 border-purple-500 shadow-lg'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-400 tracking-wider">{hotspot.planetId.toUpperCase()} LANDMARK</span>
                    <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300 capitalize">{hotspot.type}</span>
                  </div>
                  <h4 className="font-extrabold text-base text-white">{hotspot.name}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{hotspot.description}</p>
                  <div className="bg-purple-950/40 p-2.5 rounded-xl border border-purple-800/40 text-[11px] text-purple-200">
                    <span className="font-bold text-amber-400 block mb-0.5">NCERT Science Relevance:</span>
                    {hotspot.ncertConnection}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TIME MACHINE ORBIT SIMULATOR */}
        {activeTab === 'time' && (
          <div className="bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Clock className="w-6 h-6 text-cyan-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Orbital Mechanics Time Machine</h3>
                <p className="text-xs text-slate-400">Scrub through years (2020 – 2030) to visualize relative planetary revolution periods</p>
              </div>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6 max-w-2xl mx-auto text-center">
              <div className="text-4xl font-black font-heading text-amber-400 tracking-tight">
                YEAR {simYear}
              </div>

              <input
                type="range"
                min="2020"
                max="2030"
                step="0.5"
                value={simYear}
                onChange={(e) => setSimYear(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />

              <div className="flex justify-between text-xs text-slate-400 font-bold">
                <span>2020</span>
                <span>2022</span>
                <span>2024</span>
                <span>2026 (Now)</span>
                <span>2028</span>
                <span>2030</span>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                Notice how inner planets (Mercury & Venus) revolve rapidly around the Sun multiple times per Earth year, while outer gas giants (Jupiter & Saturn) require over a decade to complete a single orbit!
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: NCERT SPACE QUEST QUIZ */}
        {activeTab === 'quiz' && (
          <div className="bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">NCERT Astronomy Space Quest</h3>
                  <p className="text-xs text-slate-400">Test your planetary knowledge with interactive 3D camera auto-tracking</p>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-300 bg-purple-950 px-3 py-1 rounded-full border border-purple-800">
                Question {quizIndex + 1} of {QUIZ_QUESTIONS.length}
              </span>
            </div>

            {!showQuizResult ? (
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6 max-w-2xl mx-auto">
                <h4 className="text-base sm:text-lg font-extrabold text-white leading-relaxed">
                  {QUIZ_QUESTIONS[quizIndex].question}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {QUIZ_QUESTIONS[quizIndex].options.map((option, idx) => (
                    <button
                      key={option}
                      onClick={() => handleQuizAnswer(idx)}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-purple-900/40 hover:border-purple-500 text-left font-bold text-xs text-white transition-all flex items-center justify-between group"
                    >
                      <span>{option}</span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center space-y-4 max-w-lg mx-auto">
                <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto text-2xl border border-amber-500/40">
                  🏆
                </div>
                <h4 className="text-2xl font-black text-white">Quest Completed!</h4>
                <p className="text-sm text-slate-300 font-body">
                  You scored <span className="font-extrabold text-amber-400">{quizScore} / {QUIZ_QUESTIONS.length}</span> on the Model Public School Space Quest.
                </p>
                <button
                  onClick={resetQuiz}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-2.5 rounded-xl transition-all shadow-lg text-xs"
                >
                  Restart Quest
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
});
