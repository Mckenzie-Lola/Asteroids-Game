# Asteroids Game Prompt

Create a dynamic, polished version of the classic Asteroids game in the `asteroids-game` folder with these features:

## Core Gameplay

- Player controls a triangular spaceship that can rotate, thrust forward, and shoot
- Large asteroids spawn randomly and drift across the screen with varying velocities
- When shot, asteroids break into smaller pieces (large → medium → small → destroyed)
- Screen wraps around all edges (ship and asteroids reappear on opposite side)
- Score increases based on asteroid size destroyed
- Progressive difficulty - more asteroids spawn as score increases
- Lives system with respawn invincibility

## Dynamic Visual Effects

- Particle explosions when asteroids are destroyed (debris particles that fade out)
- Engine thrust particles that trail behind the ship when accelerating
- Bullet trails with fade effect
- Screen shake on collisions
- Smooth rotation and momentum-based physics
- Starfield background with parallax scrolling
- Glowing neon-style vector graphics with bloom effect

## Advanced Features

- **Power-ups** that occasionally spawn from destroyed asteroids:
  - Rapid Fire - increased firing rate
  - Shield - absorbs one hit from asteroid or enemy bullet
  - Multi-Shot - fire 3 bullets in a spread pattern
- **UFO enemies** that appear periodically and shoot at the player
- **Combo system** - destroying multiple asteroids quickly multiplies score
- **High score persistence** using localStorage
- **Sound effects** using Web Audio API:
  - Shooting sounds
  - Explosion sounds
  - Power-up collection sounds
  - Hyperspace teleport sound
  - Realistic rocket thrust sound (continuous while thrusting)
  - Button click sounds for menu interactions
- **Responsive canvas** that scales to window size

## Controls

- **Arrow Keys**: Left/Right to rotate, Up to thrust
- **Spacebar**: Shoot
- **Shift**: Hyperspace (teleport to random location with 20% damage risk)
- **P**: Pause game

## Technical Requirements

- Pure HTML/CSS/JavaScript (no frameworks)
- HTML5 Canvas with smooth 60 FPS rendering
- Object-oriented design with classes for Ship, Asteroid, Bullet, Particle, etc.
- Proper collision detection using circle-based or polygon-based hitboxes
- Game state management (menu, playing, paused, game over)

## File Structure

Create the following files:

- `index.html` - Game interface with canvas and UI overlay
- `game.js` - Main game logic and loop
- `entities.js` - Classes for game objects (Ship, Asteroid, Bullet, PowerUp, UFO)
- `particles.js` - Particle system and visual effects (Particle, ParticleSystem, Starfield, ScreenShake)
- `README.md` - Documentation with controls and features

## Implementation Notes

Make it feel modern and juicy with smooth animations, satisfying feedback, and polished visual effects while maintaining the classic Asteroids gameplay.