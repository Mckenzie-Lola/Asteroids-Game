// Main Game Logic

console.log('Game script loading...');

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

console.log('Canvas:', canvas);
console.log('Context:', ctx);

// Game state
let gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver'
let score = 0;
let highScore = parseInt(localStorage.getItem('asteroidsHighScore')) || 0;
let lives = 3;
let level = 1;
let frame = 0;

// Combo system
let combo = 0;
let comboTimer = 0;
let comboMultiplier = 1;

// Game objects
let ship;
let asteroids = [];
let gameBullets = [];
let ufoBullets = [];
let powerUps = [];
let ufos = [];

// Systems
let particleSystem = new ParticleSystem();
let starfield = new Starfield(canvas.width, canvas.height, 200);
let screenShake = new ScreenShake();

// Timers
let ufoSpawnTimer = 0;
let ufoSpawnDelay = 600; // 10 seconds

// Audio Context for sound effects
let audioContext;
let audioEnabled = true;
let thrustOscillator = null;
let thrustOscillator2 = null;
let thrustNoise = null;
let thrustGain = null;
let thrustNoiseGain = null;

// Responsive canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (starfield) {
        starfield.resize(canvas.width, canvas.height);
    }
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (gameState === 'playing') {
        if (e.key === ' ' && ship) {
            e.preventDefault();
            const bullets = ship.shoot();
            bullets.forEach(bullet => gameBullets.push(bullet));
            if (bullets.length > 0) {
                playSound('shoot');
            }
        }
        if (e.key === 'Shift' && ship) {
            e.preventDefault();
            const damaged = ship.hyperspace(canvas.width, canvas.height);
            particleSystem.createExplosion(ship.x, ship.y, 30, '#00ffff', 2);
            playSound('hyperspace');
            if (damaged) {
                loseLife();
            }
        }
        if (e.key === 'p' || e.key === 'P') {
            pauseGame();
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Web Audio API not supported');
        audioEnabled = false;
    }
}

// Start thrust sound - realistic rocket engine
function startThrustSound() {
    if (!audioEnabled || !audioContext || thrustOscillator) return;

    const now = audioContext.currentTime;

    // Create white noise for the "whoosh" effect
    const bufferSize = audioContext.sampleRate * 2;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    thrustNoise = audioContext.createBufferSource();
    thrustNoise.buffer = noiseBuffer;
    thrustNoise.loop = true;

    // Band pass filter for the noise to make it sound more like exhaust
    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.Q.setValueAtTime(0.5, now);

    thrustNoiseGain = audioContext.createGain();
    thrustNoiseGain.gain.setValueAtTime(0.08, now);

    // Low frequency rumble
    thrustOscillator = audioContext.createOscillator();
    thrustOscillator.type = 'sawtooth';
    thrustOscillator.frequency.setValueAtTime(60, now);

    // Higher frequency modulation for turbulence
    thrustOscillator2 = audioContext.createOscillator();
    thrustOscillator2.type = 'triangle';
    thrustOscillator2.frequency.setValueAtTime(40, now);

    thrustGain = audioContext.createGain();
    thrustGain.gain.setValueAtTime(0.15, now);

    const thrust2Gain = audioContext.createGain();
    thrust2Gain.gain.setValueAtTime(0.08, now);

    // Connect everything
    thrustNoise.connect(noiseFilter);
    noiseFilter.connect(thrustNoiseGain);
    thrustNoiseGain.connect(audioContext.destination);

    thrustOscillator.connect(thrustGain);
    thrustGain.connect(audioContext.destination);

    thrustOscillator2.connect(thrust2Gain);
    thrust2Gain.connect(audioContext.destination);

    // Start all sources
    thrustNoise.start(now);
    thrustOscillator.start(now);
    thrustOscillator2.start(now);
}

// Stop thrust sound
function stopThrustSound() {
    const now = audioContext ? audioContext.currentTime : 0;

    if (thrustOscillator) {
        thrustGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        thrustOscillator.stop(now + 0.05);
        thrustOscillator = null;
        thrustGain = null;
    }

    if (thrustOscillator2) {
        thrustOscillator2.stop(now + 0.05);
        thrustOscillator2 = null;
    }

    if (thrustNoise) {
        thrustNoiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        thrustNoise.stop(now + 0.05);
        thrustNoise = null;
        thrustNoiseGain = null;
    }
}

// Sound effects using Web Audio API
function playSound(type) {
    if (!audioEnabled || !audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const now = audioContext.currentTime;

    switch (type) {
        case 'shoot':
            oscillator.frequency.setValueAtTime(800, now);
            oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            oscillator.start(now);
            oscillator.stop(now + 0.1);
            break;

        case 'explosion':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.3);
            gainNode.gain.setValueAtTime(0.4, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
            break;

        case 'powerUp':
            oscillator.frequency.setValueAtTime(400, now);
            oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.2);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            oscillator.start(now);
            oscillator.stop(now + 0.2);
            break;

        case 'hyperspace':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1000, now);
            oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.3);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
            break;

        case 'ufo':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(150, now);
            oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.2);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            oscillator.start(now);
            oscillator.stop(now + 0.2);
            break;

        case 'buttonClick':
            oscillator.frequency.setValueAtTime(600, now);
            oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.08);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            oscillator.start(now);
            oscillator.stop(now + 0.08);
            break;
    }
}

// Initialize game
function initGame() {
    ship = new Ship(canvas.width / 2, canvas.height / 2);
    ship.invincible = true;
    ship.invincibleTimer = 120;

    asteroids = [];
    gameBullets = [];
    ufoBullets = [];
    powerUps = [];
    ufos = [];
    particleSystem.clear();

    // Spawn initial asteroids
    spawnAsteroids(3 + level);

    ufoSpawnTimer = ufoSpawnDelay;
}

// Spawn asteroids away from player
function spawnAsteroids(count) {
    for (let i = 0; i < count; i++) {
        let x, y;
        do {
            x = Math.random() * canvas.width;
            y = Math.random() * canvas.height;
        } while (Math.hypot(x - ship.x, y - ship.y) < 150);

        asteroids.push(new Asteroid(x, y, 'large'));
    }
}

// Spawn power-up
function spawnPowerUp(x, y) {
    // 30% chance to spawn a power-up
    if (Math.random() < 0.3) {
        const types = ['rapidFire', 'shield', 'multiShot'];
        const type = types[Math.floor(Math.random() * types.length)];
        powerUps.push(new PowerUp(x, y, type));
    }
}

// Spawn UFO
function spawnUFO() {
    const side = Math.floor(Math.random() * 4);
    let x, y;

    if (side === 0) { // Top
        x = Math.random() * canvas.width;
        y = -20;
    } else if (side === 1) { // Right
        x = canvas.width + 20;
        y = Math.random() * canvas.height;
    } else if (side === 2) { // Bottom
        x = Math.random() * canvas.width;
        y = canvas.height + 20;
    } else { // Left
        x = -20;
        y = Math.random() * canvas.height;
    }

    ufos.push(new UFO(x, y, canvas.width, canvas.height));
    playSound('ufo');
}

// Update game
function update(deltaTime) {
    if (gameState !== 'playing') return;

    frame++;

    // Update ship
    if (ship && !ship.destroyed) {
        ship.update(deltaTime, keys, canvas.width, canvas.height);

        // Create thrust particles and sound
        if (ship.thrust > 0) {
            particleSystem.createThrustParticle(
                ship.x - Math.cos(ship.rotation) * 10,
                ship.y - Math.sin(ship.rotation) * 10,
                ship.rotation
            );
            startThrustSound();
        } else {
            stopThrustSound();
        }
    } else {
        stopThrustSound();
    }

    // Update asteroids
    asteroids.forEach(asteroid => {
        asteroid.update(deltaTime, canvas.width, canvas.height);
    });

    // Update bullets
    gameBullets.forEach((bullet, index) => {
        bullet.update(deltaTime, canvas.width, canvas.height);

        // Create bullet trail
        if (frame % 2 === 0) {
            particleSystem.createBulletTrail(bullet.x, bullet.y);
        }

        // Remove dead bullets
        if (bullet.isDead()) {
            gameBullets.splice(index, 1);
        }
    });

    // Update UFO bullets
    ufoBullets.forEach((bullet, index) => {
        bullet.update(deltaTime, canvas.width, canvas.height);
        if (bullet.isDead()) {
            ufoBullets.splice(index, 1);
        }
    });

    // Update power-ups
    powerUps.forEach((powerUp, index) => {
        powerUp.update(deltaTime, canvas.width, canvas.height);
        if (powerUp.isDead()) {
            powerUps.splice(index, 1);
        }
    });

    // Update UFOs
    ufos.forEach((ufo, index) => {
        ufo.update(deltaTime, ship.x, ship.y);

        // UFO shooting
        if (ufo.canShoot() && ship && !ship.destroyed) {
            const bullet = ufo.shoot(ship.x, ship.y);
            if (bullet) {
                ufoBullets.push(bullet);
                playSound('shoot');
            }
        }
    });

    // Collision: Bullets vs Asteroids
    for (let i = gameBullets.length - 1; i >= 0; i--) {
        const bullet = gameBullets[i];
        for (let j = asteroids.length - 1; j >= 0; j--) {
            const asteroid = asteroids[j];
            if (bullet.checkCollision(asteroid)) {
                // Remove bullet
                gameBullets.splice(i, 1);

                // Destroy asteroid
                const children = asteroid.split();
                asteroids.splice(j, 1);
                asteroids.push(...children);

                // Effects
                particleSystem.createExplosion(asteroid.x, asteroid.y, 20, '#888888');
                screenShake.shake(5, 10);
                playSound('explosion');

                // Scoring with combo
                addScore(asteroid.points);

                // Spawn power-up
                if (children.length === 0) {
                    spawnPowerUp(asteroid.x, asteroid.y);
                }

                break;
            }
        }
    }

    // Collision: Bullets vs UFOs
    for (let i = gameBullets.length - 1; i >= 0; i--) {
        const bullet = gameBullets[i];
        for (let j = ufos.length - 1; j >= 0; j--) {
            const ufo = ufos[j];
            if (bullet.checkCollision(ufo)) {
                gameBullets.splice(i, 1);
                ufos.splice(j, 1);

                particleSystem.createExplosion(ufo.x, ufo.y, 30, '#ff00ff', 2);
                screenShake.shake(8, 15);
                playSound('explosion');

                addScore(ufo.points);
                spawnPowerUp(ufo.x, ufo.y);

                break;
            }
        }
    }

    // Collision: Ship vs Asteroids
    if (ship && !ship.destroyed && !ship.invincible) {
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const asteroid = asteroids[i];
            if (ship.checkCollision(asteroid)) {
                if (ship.hasShield) {
                    // Shield absorbs hit
                    ship.hasShield = false;
                    ship.shieldTimer = 0;
                    updatePowerUpIndicators();

                    // Destroy asteroid
                    const children = asteroid.split();
                    asteroids.splice(i, 1);
                    asteroids.push(...children);

                    particleSystem.createExplosion(asteroid.x, asteroid.y, 20, '#888888');
                    playSound('explosion');
                } else {
                    // Ship destroyed
                    particleSystem.createExplosion(ship.x, ship.y, 50, '#00ff00', 3);
                    screenShake.shake(15, 20);
                    playSound('explosion');
                    loseLife();
                }
                break;
            }
        }
    }

    // Collision: Ship vs UFO bullets
    if (ship && !ship.destroyed && !ship.invincible) {
        for (let i = ufoBullets.length - 1; i >= 0; i--) {
            const bullet = ufoBullets[i];
            if (ship.checkCollision(bullet)) {
                ufoBullets.splice(i, 1);

                if (ship.hasShield) {
                    ship.hasShield = false;
                    ship.shieldTimer = 0;
                    updatePowerUpIndicators();
                } else {
                    particleSystem.createExplosion(ship.x, ship.y, 50, '#00ff00', 3);
                    screenShake.shake(15, 20);
                    playSound('explosion');
                    loseLife();
                }
                break;
            }
        }
    }

    // Collision: Ship vs Power-ups
    if (ship && !ship.destroyed) {
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const powerUp = powerUps[i];
            if (ship.checkCollision(powerUp)) {
                ship.activatePowerUp(powerUp.type);
                powerUps.splice(i, 1);
                particleSystem.createExplosion(powerUp.x, powerUp.y, 20, powerUp.color);
                playSound('powerUp');
                updatePowerUpIndicators();
            }
        }
    }

    // Update particle system
    particleSystem.update(deltaTime);

    // Update starfield with parallax
    starfield.update(ship ? ship.vx : 0, ship ? ship.vy : 0);

    // Update screen shake
    screenShake.update(deltaTime);

    // Update combo timer
    if (comboTimer > 0) {
        comboTimer -= deltaTime;
        if (comboTimer <= 0) {
            combo = 0;
            comboMultiplier = 1;
            updateComboDisplay();
        }
    }

    // Check if level complete
    if (asteroids.length === 0 && ufos.length === 0) {
        nextLevel();
    }

    // UFO spawning
    ufoSpawnTimer -= deltaTime;
    if (ufoSpawnTimer <= 0 && ufos.length === 0) {
        spawnUFO();
        ufoSpawnTimer = ufoSpawnDelay;
    }
}

// Add score with combo multiplier
function addScore(points) {
    combo++;
    comboTimer = 120; // 2 seconds to maintain combo

    if (combo >= 10) {
        comboMultiplier = 4;
    } else if (combo >= 5) {
        comboMultiplier = 3;
    } else if (combo >= 3) {
        comboMultiplier = 2;
    } else {
        comboMultiplier = 1;
    }

    score += points * comboMultiplier;
    updateScore();
    updateComboDisplay();
}

// Lose a life
function loseLife() {
    lives--;
    updateLives();

    if (lives <= 0) {
        endGame();
    } else {
        // Respawn ship
        ship = new Ship(canvas.width / 2, canvas.height / 2);
        ship.invincible = true;
        ship.invincibleTimer = 120;
    }
}

// Next level
function nextLevel() {
    level++;
    spawnAsteroids(3 + level);
    ufoSpawnTimer = ufoSpawnDelay;
}

// UI Updates
function updateScore() {
    document.getElementById('score').textContent = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('asteroidsHighScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }
}

function updateLives() {
    document.getElementById('lives').textContent = lives;
}

function updateComboDisplay() {
    const comboPanel = document.getElementById('comboPanel');
    const comboValue = document.getElementById('comboValue');

    if (comboMultiplier > 1) {
        comboPanel.classList.add('active');
        comboValue.textContent = `x${comboMultiplier}`;
    } else {
        comboPanel.classList.remove('active');
    }
}

function updatePowerUpIndicators() {
    document.getElementById('rapidFireIndicator').classList.toggle('active', ship && ship.hasRapidFire);
    document.getElementById('shieldIndicator').classList.toggle('active', ship && ship.hasShield);
    document.getElementById('multiShotIndicator').classList.toggle('active', ship && ship.hasMultiShot);
}

// Draw game
function draw() {
    // Clear with glow effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply screen shake
    const shakeOffset = screenShake.getOffset();
    ctx.save();
    ctx.translate(shakeOffset.x, shakeOffset.y);

    // Draw starfield
    starfield.draw(ctx);

    // Draw particles
    particleSystem.draw(ctx);

    // Draw asteroids
    asteroids.forEach(asteroid => asteroid.draw(ctx));

    // Draw power-ups
    powerUps.forEach(powerUp => powerUp.draw(ctx));

    // Draw bullets
    gameBullets.forEach(bullet => bullet.draw(ctx));
    ufoBullets.forEach(bullet => bullet.draw(ctx));

    // Draw UFOs
    ufos.forEach(ufo => ufo.draw(ctx, frame));

    // Draw ship
    if (ship && !ship.destroyed) {
        ship.draw(ctx, frame);
    }

    ctx.restore();

    // Update power-up indicators
    if (gameState === 'playing') {
        updatePowerUpIndicators();
    }
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime || 0;
    lastTime = timestamp;

    update(Math.min(deltaTime / 16.67, 2)); // Cap deltaTime to prevent large jumps
    draw();

    requestAnimationFrame(gameLoop);
}

// Game state functions
function startGame() {
    console.log('startGame() called');
    playSound('buttonClick');
    initAudio();
    gameState = 'playing';
    score = 0;
    lives = 3;
    level = 1;
    combo = 0;
    comboMultiplier = 1;

    updateScore();
    updateLives();
    updateComboDisplay();

    document.getElementById('menuScreen').classList.add('hidden');
    document.getElementById('highScore').textContent = highScore;

    initGame();
    console.log('Game started');
}

function pauseGame() {
    if (gameState === 'playing') {
        playSound('buttonClick');
        gameState = 'paused';
        document.getElementById('pauseScreen').classList.remove('hidden');
        stopThrustSound();
    }
}

function resumeGame() {
    if (gameState === 'paused') {
        playSound('buttonClick');
        gameState = 'playing';
        document.getElementById('pauseScreen').classList.add('hidden');
    }
}

function endGame() {
    gameState = 'gameOver';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    stopThrustSound();
}

function restartGame() {
    playSound('buttonClick');
    document.getElementById('gameOverScreen').classList.add('hidden');
    startGame();
}

function returnToMenu() {
    playSound('buttonClick');
    gameState = 'menu';
    document.getElementById('pauseScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('menuScreen').classList.remove('hidden');
    stopThrustSound();
}

// Expose functions to global scope for onclick handlers
window.startGame = startGame;
window.resumeGame = resumeGame;
window.restartGame = restartGame;
window.returnToMenu = returnToMenu;

// Initialize high score display
document.getElementById('highScore').textContent = highScore;

// Start game loop
gameLoop(0);

console.log('Game script loaded completely');
console.log('startGame function:', typeof startGame);
console.log('window.startGame:', typeof window.startGame);
