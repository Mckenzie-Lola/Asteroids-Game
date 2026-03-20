# Asteroids Game - Project Instructions

## Project Overview
This is a modern, polished recreation of the classic Asteroids arcade game with neon graphics, dynamic visual effects, power-ups, UFO enemies, and progressive difficulty. Built with pure vanilla JavaScript, HTML5 Canvas, and Web Audio API.

## Architecture & Design Patterns

### File Structure
```
asteroids-game/
├── index.html      # Main HTML with canvas and UI overlays
├── game.js         # Game loop, state management, collision detection, audio
├── entities.js     # All game object classes (Ship, Asteroid, Bullet, PowerUp, UFO)
├── particles.js    # Particle system and visual effects (Particle, ParticleSystem, Starfield, ScreenShake)
├── prompt.md       # Original prompt used to generate this game
├── CLAUDE.md       # This file - project instructions
└── README.md       # User-facing documentation
```

### Code Organization Principles

**game.js Variable Declaration Order (CRITICAL)**
- ALL variables must be declared at the top of the file BEFORE any functions
- This is essential due to JavaScript's temporal dead zone
- Order:
  1. Canvas and context
  2. Game state variables (gameState, score, lives, etc.)
  3. Game object arrays (asteroids, bullets, powerUps, ufos)
  4. System instances (particleSystem, starfield, screenShake)
  5. Audio variables (audioContext, oscillators, gain nodes)
  6. Then all functions
  7. Global scope exposure at the end (window.functionName = functionName)

**Object-Oriented Design**
- Base `Entity` class with collision detection and screen wrapping
- All game objects extend Entity
- Each class is self-contained with its own update() and draw() methods

### Audio System

**Multi-Layered Thrust Sound**
The rocket thrust sound is composed of 3 layers for realism:
1. White noise buffer with bandpass filter (800Hz) - exhaust whoosh
2. 60Hz sawtooth wave - deep engine rumble
3. 40Hz triangle wave - turbulence/fluctuation

**Sound Management**
- Initialize audio on first user interaction (initAudio on startGame)
- Continuous sounds (thrust) use persistent oscillators that start/stop
- One-shot sounds (shoot, explosion) create temporary oscillators
- Always call stopThrustSound() when ship is destroyed or game pauses

### Visual Style

**Neon Aesthetic**
- Glowing vector graphics with shadowBlur effects
- Color scheme:
  - Ship: `#00ff00` (green)
  - Bullets: `#00ffff` (cyan)
  - Asteroids: `#888888` (gray)
  - UFO: `#ff00ff` (magenta)
  - Shield: `#00ffff` (cyan)
  - Power-ups: Red (rapid fire), Cyan (shield), Magenta (multi-shot)

**Particle Effects**
- Explosions when asteroids are destroyed
- Engine thrust trail when ship accelerates
- Bullet trails with fade effect
- Three-layer parallax starfield with twinkling

### Game State Management

States: `'menu'`, `'playing'`, `'paused'`, `'gameOver'`

Always include button click sounds (`playSound('buttonClick')`) when changing states through UI interactions.

### Physics & Collision

**Movement**
- Momentum-based physics with friction (0.99)
- Delta time for frame-rate independence
- Screen wrapping on all edges

**Collision Detection**
- Circle-based using radius checks
- Distance formula: `Math.sqrt(dx * dx + dy * dy) < radius1 + radius2`

### Power-Up System

Duration: 300 frames (~5 seconds)
- Rapid Fire: Reduces shoot cooldown from 15 to 5
- Shield: Absorbs one hit, renders with pulsing cyan circle
- Multi-Shot: Fires 3 bullets with ±0.2 radian spread

## Development Guidelines

### When Making Changes

1. **Never** create new files unless absolutely necessary
2. **Always** use Edit tool for modifications, not Write (to preserve context)
3. **Test** audio changes carefully - Web Audio API requires proper cleanup
4. **Maintain** the neon aesthetic and smooth particle effects
5. **Preserve** delta time calculations for consistent physics

### Common Pitfalls to Avoid

- Accessing variables before they're declared (temporal dead zone)
- Forgetting to expose functions to global scope for onclick handlers
- Creating audio oscillators without proper cleanup (memory leaks)
- Breaking the multi-layered thrust sound (all 3 layers must work together)
- Removing shadowBlur effects (critical for neon glow aesthetic)

### Testing Checklist

When modifying code, verify:
- [ ] Start Game button works
- [ ] All power-ups function correctly
- [ ] Thrust sound starts/stops properly
- [ ] Screen shake activates on collisions
- [ ] Particles render with proper fade
- [ ] UFOs spawn and shoot at player
- [ ] Combo system tracks properly
- [ ] High score persists in localStorage

## User Preferences

- Pure vanilla JavaScript - no frameworks
- Clean, readable code with proper separation of concerns
- Satisfying "game feel" with particles, shake, and audio feedback
- 60 FPS smooth rendering
- Responsive canvas that scales to window size

## Deployment

Hosted on GitHub Pages: https://github.com/Mckenzie-Lola/Asteroids-Game

Push changes to main branch - GitHub Pages will auto-deploy.
