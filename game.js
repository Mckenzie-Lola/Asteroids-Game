// Main game class
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Resize canvas to window
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Game state
        this.state = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.lives = 3;
        this.level = 1;

        // Combo system
        this.combo = 0;
        this.comboTimer = 0;
        this.comboTimeout = 2;
        this.lastComboDisplay = 0;

        // Game objects
        this.ship = null;
        this.asteroids = [];
        this.bullets = [];
        this.ufoBullets = [];
        this.powerUps = [];
        this.ufos = [];

        // Systems
        this.particleSystem = new ParticleSystem();
        this.starfield = new Starfield(this.canvas);
        this.screenShake = new ScreenShake();
        this.soundEngine = new SoundEngine();

        // UFO spawn
        this.ufoSpawnTimer = 0;
        this.ufoSpawnInterval = 20;

        // Input
        this.keys = {};
        this.setupInput();

        // UI
        this.setupUI();

        // Game loop
        this.lastTime = 0;
        this.requestId = null;
        this.isThrusting = false;

        this.gameLoop = this.gameLoop.bind(this);
        this.gameLoop(0);
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.starfield) {
            this.starfield.resize(this.canvas.width, this.canvas.height);
        }
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;

            // Prevent scrolling
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }

            // Pause
            if (e.key === 'p' || e.key === 'P') {
                if (this.state === 'playing') {
                    this.pauseGame();
                } else if (this.state === 'paused') {
                    this.resumeGame();
                }
            }

            // Hyperspace
            if (e.key === 'Shift' && this.state === 'playing' && this.ship) {
                this.soundEngine.playHyperspace();
                const damaged = this.ship.hyperspace(this.canvas);
                if (damaged) {
                    this.loseLife();
                }
                this.particleSystem.createExplosion(this.ship.x, this.ship.y, 50, '#0ff', 3);
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    setupUI() {
        document.getElementById('startButton').addEventListener('click', () => {
            this.soundEngine.playButtonClick();
            this.startGame();
        });

        document.getElementById('restartButton').addEventListener('click', () => {
            this.soundEngine.playButtonClick();
            this.startGame();
        });

        document.getElementById('menuButton').addEventListener('click', () => {
            this.soundEngine.playButtonClick();
            this.showMenu();
        });

        this.updateUI();
    }

    startGame() {
        // Initialize sound engine on first interaction
        this.soundEngine.init();

        this.state = 'playing';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.combo = 0;
        this.comboTimer = 0;

        // Create ship
        this.ship = new Ship(this.canvas.width / 2, this.canvas.height / 2);
        this.ship.makeInvincible();

        // Clear arrays
        this.asteroids = [];
        this.bullets = [];
        this.ufoBullets = [];
        this.powerUps = [];
        this.ufos = [];
        this.particleSystem.clear();

        // Spawn initial asteroids
        this.spawnAsteroids(4);

        // Hide menu screens
        document.getElementById('menuScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');

        this.updateUI();
    }

    pauseGame() {
        this.state = 'paused';
        document.getElementById('pauseScreen').classList.remove('hidden');
        if (this.isThrusting) {
            this.soundEngine.stopThrust();
        }
    }

    resumeGame() {
        this.state = 'playing';
        document.getElementById('pauseScreen').classList.add('hidden');
    }

    showMenu() {
        this.state = 'menu';
        document.getElementById('menuScreen').classList.remove('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        this.screenShake.reset();
    }

    gameOver() {
        this.state = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalHighScore').textContent = this.highScore;
        document.getElementById('gameOverScreen').classList.remove('hidden');

        if (this.isThrusting) {
            this.soundEngine.stopThrust();
            this.isThrusting = false;
        }
    }

    spawnAsteroids(count) {
        for (let i = 0; i < count; i++) {
            let x, y;
            const margin = 100;

            // Spawn away from ship
            do {
                x = Math.random() * this.canvas.width;
                y = Math.random() * this.canvas.height;
            } while (
                this.ship &&
                Math.abs(x - this.ship.x) < margin &&
                Math.abs(y - this.ship.y) < margin
            );

            this.asteroids.push(new Asteroid(x, y, 3));
        }
    }

    spawnUFO() {
        const side = Math.floor(Math.random() * 4);
        let x, y;

        switch (side) {
            case 0: // Top
                x = Math.random() * this.canvas.width;
                y = -50;
                break;
            case 1: // Right
                x = this.canvas.width + 50;
                y = Math.random() * this.canvas.height;
                break;
            case 2: // Bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 50;
                break;
            case 3: // Left
                x = -50;
                y = Math.random() * this.canvas.height;
                break;
        }

        this.ufos.push(new UFO(x, y, this.canvas));
        this.soundEngine.playUFO();
    }

    spawnPowerUp(x, y) {
        // 30% chance to spawn a power-up
        if (Math.random() < 0.3) {
            const types = ['rapidFire', 'shield', 'multiShot'];
            const type = types[Math.floor(Math.random() * types.length)];
            this.powerUps.push(new PowerUp(x, y, type));
        }
    }

    handleInput(dt) {
        if (!this.ship || this.state !== 'playing') return;

        // Rotation
        if (this.keys['ArrowLeft']) {
            this.ship.rotation = -1;
        } else if (this.keys['ArrowRight']) {
            this.ship.rotation = 1;
        } else {
            this.ship.rotation = 0;
        }

        // Thrust
        if (this.keys['ArrowUp']) {
            this.ship.thrust = 1;
            if (!this.isThrusting) {
                this.soundEngine.startThrust();
                this.isThrusting = true;
            }
        } else {
            this.ship.thrust = 0;
            if (this.isThrusting) {
                this.soundEngine.stopThrust();
                this.isThrusting = false;
            }
        }

        // Shooting
        if (this.keys[' ']) {
            if (this.ship.shoot()) {
                this.soundEngine.playShoot();
                const newBullets = this.ship.getBullets();
                this.bullets.push(...newBullets);
            }
        }
    }

    updateCombo(dt) {
        if (this.combo > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }
    }

    addCombo() {
        this.combo++;
        this.comboTimer = this.comboTimeout;

        if (this.combo >= 3) {
            this.showComboIndicator();
        }
    }

    showComboIndicator() {
        const now = Date.now();
        if (now - this.lastComboDisplay > 1000) {
            this.lastComboDisplay = now;

            const indicator = document.createElement('div');
            indicator.className = 'combo-indicator';
            indicator.textContent = `${this.combo}x COMBO!`;
            document.getElementById('gameContainer').appendChild(indicator);

            setTimeout(() => {
                indicator.remove();
            }, 1000);
        }
    }

    addScore(baseScore) {
        const multiplier = Math.max(1, this.combo);
        this.score += baseScore * multiplier;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }

        this.updateUI();
    }

    loseLife() {
        if (!this.ship || this.ship.invincible) return;

        // Check for shield
        if (this.ship.shield) {
            this.ship.removeShield();
            this.soundEngine.playExplosion(0.5);
            this.particleSystem.createExplosion(this.ship.x, this.ship.y, 30, '#f0f', 2);
            this.screenShake.shake(8, 0.3);
            return;
        }

        this.lives--;
        this.updateUI();

        if (this.lives > 0) {
            this.soundEngine.playExplosion(1.5);
            this.particleSystem.createExplosion(this.ship.x, this.ship.y, 50, '#0ff', 3);
            this.screenShake.shake(15, 0.5);

            // Respawn ship
            this.ship.x = this.canvas.width / 2;
            this.ship.y = this.canvas.height / 2;
            this.ship.vx = 0;
            this.ship.vy = 0;
            this.ship.angle = -Math.PI / 2;
            this.ship.makeInvincible();
        } else {
            this.soundEngine.playExplosion(2);
            this.particleSystem.createExplosion(this.ship.x, this.ship.y, 100, '#0ff', 4);
            this.screenShake.shake(20, 0.7);
            this.ship = null;
            setTimeout(() => this.gameOver(), 2000);
        }
    }

    checkCollisions() {
        if (!this.ship) return;

        // Ship vs Asteroids
        if (!this.ship.invincible) {
            this.asteroids.forEach(asteroid => {
                if (this.ship && this.ship.collidesWith(asteroid)) {
                    this.loseLife();
                }
            });
        }

        // Ship vs UFO bullets
        if (!this.ship.invincible) {
            this.ufoBullets.forEach(bullet => {
                if (this.ship && this.ship.collidesWith(bullet)) {
                    this.loseLife();
                    bullet.toDelete = true;
                }
            });
        }

        // Bullets vs Asteroids
        this.bullets.forEach(bullet => {
            this.asteroids.forEach(asteroid => {
                if (bullet.collidesWith(asteroid)) {
                    bullet.toDelete = true;
                    asteroid.toDelete = true;

                    this.addScore(asteroid.getScore());
                    this.addCombo();
                    this.soundEngine.playExplosion(asteroid.size * 0.5);
                    this.particleSystem.createExplosion(
                        asteroid.x,
                        asteroid.y,
                        20 * asteroid.size,
                        '#0ff',
                        asteroid.size
                    );
                    this.screenShake.shake(5 * asteroid.size, 0.2);

                    // Split asteroid
                    const newAsteroids = asteroid.split();
                    this.asteroids.push(...newAsteroids);

                    // Spawn power-up
                    if (asteroid.size === 3) {
                        this.spawnPowerUp(asteroid.x, asteroid.y);
                    }
                }
            });
        });

        // Bullets vs UFOs
        this.bullets.forEach(bullet => {
            this.ufos.forEach(ufo => {
                if (bullet.collidesWith(ufo)) {
                    bullet.toDelete = true;

                    if (ufo.hit()) {
                        ufo.toDelete = true;
                        this.addScore(ufo.getScore());
                        this.addCombo();
                        this.soundEngine.playExplosion(1);
                        this.particleSystem.createExplosion(ufo.x, ufo.y, 40, '#f00', 2);
                        this.screenShake.shake(10, 0.3);
                        this.spawnPowerUp(ufo.x, ufo.y);
                    } else {
                        this.soundEngine.playExplosion(0.5);
                        this.particleSystem.createExplosion(ufo.x, ufo.y, 20, '#f00', 1);
                    }
                }
            });
        });

        // Ship vs Power-ups
        if (this.ship) {
            this.powerUps.forEach(powerUp => {
                if (this.ship.collidesWith(powerUp)) {
                    this.ship.activatePowerUp(powerUp.type);
                    this.soundEngine.playPowerUp();
                    this.particleSystem.createPowerUpEffect(powerUp.x, powerUp.y, powerUp.config.color);
                    powerUp.toDelete = true;
                }
            });
        }
    }

    updateGame(dt) {
        // Handle input
        this.handleInput(dt);

        // Update combo
        this.updateCombo(dt);

        // Update ship
        if (this.ship) {
            this.ship.update(dt, this.canvas, this.particleSystem);
        }

        // Update asteroids
        this.asteroids.forEach(asteroid => asteroid.update(dt, this.canvas));
        this.asteroids = this.asteroids.filter(a => !a.toDelete);

        // Update bullets
        this.bullets.forEach(bullet => bullet.update(dt, this.canvas, this.particleSystem));
        this.bullets = this.bullets.filter(b => !b.toDelete);

        // Update UFO bullets
        this.ufoBullets.forEach(bullet => bullet.update(dt, this.canvas, this.particleSystem));
        this.ufoBullets = this.ufoBullets.filter(b => !b.toDelete);

        // Update power-ups
        this.powerUps.forEach(powerUp => powerUp.update(dt, this.canvas));
        this.powerUps = this.powerUps.filter(p => !p.toDelete);

        // Update UFOs
        this.ufos.forEach(ufo => {
            ufo.update(dt, this.canvas, this.ship);
            if (this.ship && ufo.canShoot()) {
                const bullet = ufo.shootAt(this.ship);
                this.ufoBullets.push(bullet);
                this.soundEngine.playShoot();
            }
        });
        this.ufos = this.ufos.filter(u => !u.toDelete);

        // Spawn UFO
        this.ufoSpawnTimer += dt;
        if (this.ufoSpawnTimer > this.ufoSpawnInterval && this.ufos.length === 0) {
            this.ufoSpawnTimer = 0;
            this.spawnUFO();
        }

        // Check collisions
        this.checkCollisions();

        // Level progression
        if (this.asteroids.length === 0 && this.state === 'playing') {
            this.level++;
            this.spawnAsteroids(3 + this.level);
        }

        // Update systems
        this.particleSystem.update(dt);
        this.screenShake.update(dt);

        // Update starfield with parallax
        const shipVx = this.ship ? this.ship.vx : 0;
        const shipVy = this.ship ? this.ship.vy : 0;
        this.starfield.update(dt, shipVx, shipVy);
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply screen shake
        this.ctx.save();
        this.screenShake.apply(this.ctx);

        // Draw starfield
        this.starfield.draw(this.ctx);

        // Draw particles
        this.particleSystem.draw(this.ctx);

        // Draw asteroids
        this.asteroids.forEach(asteroid => asteroid.draw(this.ctx));

        // Draw power-ups
        this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));

        // Draw UFOs
        this.ufos.forEach(ufo => ufo.draw(this.ctx));

        // Draw bullets
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        this.ufoBullets.forEach(bullet => bullet.draw(this.ctx));

        // Draw ship
        if (this.ship) {
            this.ship.draw(this.ctx);
        }

        this.ctx.restore();
    }

    updateUI() {
        document.getElementById('scoreDisplay').textContent = this.score;
        document.getElementById('highScoreDisplay').textContent = this.highScore;

        const livesDisplay = document.getElementById('livesDisplay');
        livesDisplay.innerHTML = '';
        for (let i = 0; i < this.lives; i++) {
            const life = document.createElement('div');
            life.className = 'life-icon';
            livesDisplay.appendChild(life);
        }

        // Update power-up indicators
        this.updatePowerUpUI();
    }

    updatePowerUpUI() {
        const container = document.getElementById('powerupIndicator');
        container.innerHTML = '';

        if (this.ship) {
            if (this.ship.rapidFire) {
                this.addPowerUpIndicator(container, 'Rapid Fire', this.ship.rapidFireTime, 10, '#ff0');
            }
            if (this.ship.multiShot) {
                this.addPowerUpIndicator(container, 'Multi Shot', this.ship.multiShotTime, 10, '#0f0');
            }
            if (this.ship.shield) {
                const item = document.createElement('div');
                item.className = 'powerup-item';
                item.style.borderColor = '#f0f';
                item.style.color = '#f0f';
                item.innerHTML = '<span>Shield Active</span>';
                container.appendChild(item);
            }
        }
    }

    addPowerUpIndicator(container, name, timeLeft, maxTime, color) {
        const item = document.createElement('div');
        item.className = 'powerup-item';
        item.style.borderColor = color;
        item.style.color = color;

        const percent = (timeLeft / maxTime) * 100;

        item.innerHTML = `
            <span>${name}</span>
            <div class="powerup-timer">
                <div class="powerup-timer-fill" style="width: ${percent}%; background: ${color};"></div>
            </div>
        `;

        container.appendChild(item);
    }

    saveHighScore() {
        localStorage.setItem('neonAsteroidsHighScore', this.highScore);
    }

    loadHighScore() {
        return parseInt(localStorage.getItem('neonAsteroidsHighScore')) || 0;
    }

    gameLoop(currentTime) {
        this.requestId = requestAnimationFrame(this.gameLoop);

        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        if (this.state === 'playing') {
            this.updateGame(dt);
        }

        this.render();

        // Update power-up UI
        if (this.state === 'playing' && this.ship) {
            this.updatePowerUpUI();
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});
