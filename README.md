# Asteroids - Neon Edition

A modern, polished recreation of the classic Asteroids arcade game with dynamic visual effects, power-ups, and progressive difficulty.

## Features

### Core Gameplay
- **Smooth Physics**: Momentum-based movement with realistic rotation and thrust
- **Screen Wrapping**: All objects wrap around screen edges
- **Progressive Difficulty**: More asteroids spawn as you advance through levels
- **Lives System**: 3 lives with respawn invincibility frames
- **Asteroid Breaking**: Large → Medium → Small → Destroyed

### Dynamic Visual Effects
- **Neon Glow Graphics**: Vector-style rendering with bloom effects
- **Particle Explosions**: Satisfying debris when asteroids are destroyed
- **Engine Thrust Particles**: Animated trail when accelerating
- **Bullet Trails**: Glowing fade effect on projectiles
- **Screen Shake**: Impact feedback on collisions
- **Parallax Starfield**: Three-layer scrolling star background with twinkling
- **Smooth Animations**: 60 FPS with proper delta time handling

### Advanced Features

#### Power-Ups (30% drop chance)
- **Rapid Fire** (Red): Increased firing rate
- **Shield** (Cyan): Absorbs one hit from asteroid or enemy bullet
- **Multi-Shot** (Magenta): Fire 3 bullets in a spread pattern

#### UFO Enemies
- Spawn periodically throughout the game
- Shoot at the player with moderate accuracy
- Worth 200 points when destroyed

#### Combo System
- Destroy asteroids quickly to build combos
- Score multipliers:
  - x2 at 3+ combo
  - x3 at 5+ combo
  - x4 at 10+ combo
- 2-second window to maintain combo

#### High Score Persistence
- High scores saved to browser localStorage
- Persists across sessions

#### Sound Effects
- Web Audio API synthesized sounds
- Shooting, explosions, power-ups, and hyperspace effects
- Dynamic audio generation (no audio files needed)

### Controls

| Key | Action |
|-----|--------|
| **←** | Rotate Left |
| **→** | Rotate Right |
| **↑** | Thrust Forward |
| **SPACE** | Shoot |
| **SHIFT** | Hyperspace (random teleport with 20% damage risk) |
| **P** | Pause Game |

### Scoring

- **Small Asteroid**: 20 points
- **Medium Asteroid**: 50 points
- **Large Asteroid**: 100 points
- **UFO**: 200 points
- All scores multiplied by current combo multiplier

## Technical Details

### Architecture
- **Pure Vanilla JavaScript**: No frameworks or dependencies
- **Object-Oriented Design**: Clean class structure for all entities
- **Modular Code**: Separated into logical files
- **Responsive Canvas**: Automatically scales to window size

### File Structure
```
asteroids-game/
├── index.html      # Main HTML with UI overlay
├── game.js         # Game loop, state management, collision detection
├── entities.js     # All game object classes (Ship, Asteroid, Bullet, etc.)
├── particles.js    # Particle system and visual effects
└── README.md       # This file
```

### Classes

#### Entities (entities.js)
- **Entity**: Base class with collision detection
- **Ship**: Player-controlled spaceship with power-ups
- **Asteroid**: Procedurally generated asteroids with irregular shapes
- **Bullet**: Projectiles with lifetime management
- **PowerUp**: Collectible power-ups with type-specific behavior
- **UFO**: AI-controlled enemy that tracks and shoots at player

#### Visual Systems (particles.js)
- **Particle**: Individual particle with physics and fade-out
- **ParticleSystem**: Manages all particles and effect creation
- **Starfield**: Parallax scrolling background with twinkling stars
- **ScreenShake**: Dynamic camera shake for impact feedback

### Collision Detection
- Circle-based collision using radius checks
- Efficient spatial calculations with distance formula
- Proper hitbox sizing for fair gameplay

### Game States
- **Menu**: Start screen with controls
- **Playing**: Active gameplay
- **Paused**: Frozen game state
- **Game Over**: End screen with final score

## How to Play

1. Open `index.html` in a modern web browser
2. Click "Start Game"
3. Survive as long as possible by destroying asteroids
4. Collect power-ups to enhance your ship
5. Avoid collisions with asteroids and UFO bullets
6. Use hyperspace as a last resort (risky!)

## Tips & Strategy

- **Master the momentum**: Plan your movements ahead - you can't stop instantly!
- **Use corners**: Maneuver to corners when overwhelmed
- **Save hyperspace**: Only use when about to die (20% self-damage risk)
- **Chain combos**: Destroy asteroids quickly for massive point multipliers
- **Prioritize UFOs**: They're dangerous but worth lots of points
- **Shield is best**: The shield power-up can save your life
- **Multi-shot for crowds**: Great for quickly clearing multiple asteroids

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Requires HTML5 Canvas and Web Audio API

## Performance

- Optimized rendering with proper delta time
- Particle system with automatic cleanup
- Smooth 60 FPS gameplay
- Tested on desktop and laptop displays

## Credits

A modern remake of the 1979 Atari classic, rebuilt from scratch with enhanced visuals and gameplay features.

## License

Free to use and modify. Have fun!

---

**High Score Challenge**: Can you break 10,000 points? Share your best combo multiplier!
