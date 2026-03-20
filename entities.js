// Base Entity class
class Entity {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = 0;
        this.vy = 0;
        this.toDelete = false;
    }

    update(dt, canvas) {
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;

        // Screen wrapping
        if (this.x < -this.radius) this.x = canvas.width + this.radius;
        if (this.x > canvas.width + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = canvas.height + this.radius;
        if (this.y > canvas.height + this.radius) this.y = -this.radius;
    }

    collidesWith(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + other.radius;
    }
}

// Player ship
class Ship extends Entity {
    constructor(x, y) {
        super(x, y, 15);
        this.angle = -Math.PI / 2;
        this.thrust = 0;
        this.rotation = 0;
        this.shooting = false;
        this.shootCooldown = 0;
        this.invincible = false;
        this.invincibleTime = 0;
        this.blinkTimer = 0;

        // Power-ups
        this.rapidFire = false;
        this.rapidFireTime = 0;
        this.shield = false;
        this.multiShot = false;
        this.multiShotTime = 0;

        this.maxSpeed = 8;
        this.thrustPower = 0.3;
        this.rotationSpeed = 0.08;
        this.friction = 0.99;
    }

    update(dt, canvas, particleSystem) {
        // Rotation
        this.angle += this.rotation * this.rotationSpeed;

        // Thrust
        if (this.thrust > 0) {
            this.vx += Math.cos(this.angle) * this.thrustPower;
            this.vy += Math.sin(this.angle) * this.thrustPower;

            // Create thrust particles
            if (Math.random() < 0.5) {
                const offsetDist = 12;
                const particleX = this.x - Math.cos(this.angle) * offsetDist;
                const particleY = this.y - Math.sin(this.angle) * offsetDist;
                particleSystem.createThrustParticle(
                    particleX,
                    particleY,
                    this.angle,
                    { x: this.vx, y: this.vy }
                );
            }
        }

        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Limit speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }

        // Update shooting cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown -= dt;
        }

        // Update invincibility
        if (this.invincible) {
            this.invincibleTime -= dt;
            this.blinkTimer += dt;
            if (this.invincibleTime <= 0) {
                this.invincible = false;
            }
        }

        // Update power-ups
        if (this.rapidFire) {
            this.rapidFireTime -= dt;
            if (this.rapidFireTime <= 0) {
                this.rapidFire = false;
            }
        }

        if (this.multiShot) {
            this.multiShotTime -= dt;
            if (this.multiShotTime <= 0) {
                this.multiShot = false;
            }
        }

        super.update(dt, canvas);
    }

    shoot() {
        const cooldown = this.rapidFire ? 0.1 : 0.25;
        if (this.shootCooldown <= 0) {
            this.shootCooldown = cooldown;
            return true;
        }
        return false;
    }

    getBullets() {
        const bullets = [];
        const speed = 10;
        const offsetDist = 20;

        if (this.multiShot) {
            // Fire 3 bullets in a spread
            const angles = [this.angle - 0.2, this.angle, this.angle + 0.2];
            angles.forEach(angle => {
                const x = this.x + Math.cos(angle) * offsetDist;
                const y = this.y + Math.sin(angle) * offsetDist;
                const vx = Math.cos(angle) * speed + this.vx;
                const vy = Math.sin(angle) * speed + this.vy;
                bullets.push(new Bullet(x, y, vx, vy));
            });
        } else {
            const x = this.x + Math.cos(this.angle) * offsetDist;
            const y = this.y + Math.sin(this.angle) * offsetDist;
            const vx = Math.cos(this.angle) * speed + this.vx;
            const vy = Math.sin(this.angle) * speed + this.vy;
            bullets.push(new Bullet(x, y, vx, vy));
        }

        return bullets;
    }

    draw(ctx) {
        // Don't draw if invincible and blinking
        if (this.invincible && Math.floor(this.blinkTimer * 10) % 2 === 0) {
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw shield
        if (this.shield) {
            ctx.strokeStyle = '#f0f';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#f0f';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw ship
        ctx.strokeStyle = '#0ff';
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#0ff';

        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, -8);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw thrust flame
        if (this.thrust > 0) {
            const flameLength = 10 + Math.random() * 5;
            ctx.fillStyle = '#0ff';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#0ff';
            ctx.beginPath();
            ctx.moveTo(-6, -4);
            ctx.lineTo(-6 - flameLength, 0);
            ctx.lineTo(-6, 4);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    makeInvincible(duration = 3) {
        this.invincible = true;
        this.invincibleTime = duration;
        this.blinkTimer = 0;
    }

    activatePowerUp(type) {
        switch (type) {
            case 'rapidFire':
                this.rapidFire = true;
                this.rapidFireTime = 10;
                break;
            case 'shield':
                this.shield = true;
                break;
            case 'multiShot':
                this.multiShot = true;
                this.multiShotTime = 10;
                break;
        }
    }

    removeShield() {
        this.shield = false;
    }

    hyperspace(canvas) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = 0;
        this.vy = 0;

        // 20% chance of taking damage
        return Math.random() < 0.2;
    }
}

// Bullet
class Bullet extends Entity {
    constructor(x, y, vx, vy) {
        super(x, y, 3);
        this.vx = vx;
        this.vy = vy;
        this.life = 1.5;
        this.age = 0;
    }

    update(dt, canvas, particleSystem) {
        super.update(dt, canvas);
        this.age += dt;

        // Create trail
        if (Math.random() < 0.3) {
            particleSystem.createBulletTrail(this.x, this.y, this.vx, this.vy);
        }

        if (this.age > this.life) {
            this.toDelete = true;
        }
    }

    draw(ctx) {
        const alpha = 1 - (this.age / this.life) * 0.5;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#0ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Asteroid
class Asteroid extends Entity {
    constructor(x, y, size = 3) {
        const radii = { 3: 40, 2: 25, 1: 15 };
        super(x, y, radii[size]);
        this.size = size;

        // Random velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = (4 - size) * 0.5 + Math.random() * 0.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        // Random rotation
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;

        // Random shape
        this.points = [];
        const numPoints = 8 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numPoints; i++) {
            const angle = (Math.PI * 2 * i) / numPoints;
            const variance = 0.3 + Math.random() * 0.4;
            this.points.push({
                angle: angle,
                distance: this.radius * variance
            });
        }
    }

    update(dt, canvas) {
        super.update(dt, canvas);
        this.angle += this.rotationSpeed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0ff';

        ctx.beginPath();
        this.points.forEach((point, i) => {
            const x = Math.cos(point.angle) * (this.radius + point.distance);
            const y = Math.sin(point.angle) * (this.radius + point.distance);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }

    split() {
        if (this.size > 1) {
            const newAsteroids = [];
            for (let i = 0; i < 2; i++) {
                const asteroid = new Asteroid(this.x, this.y, this.size - 1);
                // Give them a bit of separation
                const angle = Math.random() * Math.PI * 2;
                asteroid.vx += Math.cos(angle) * 2;
                asteroid.vy += Math.sin(angle) * 2;
                newAsteroids.push(asteroid);
            }
            return newAsteroids;
        }
        return [];
    }

    getScore() {
        return [100, 50, 20][this.size - 1];
    }
}

// Power-up
class PowerUp extends Entity {
    constructor(x, y, type) {
        super(x, y, 12);
        this.type = type;
        this.life = 10;
        this.age = 0;
        this.pulseTimer = 0;

        // Slow drift
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * 0.5;
        this.vy = Math.sin(angle) * 0.5;

        // Power-up colors and symbols
        this.config = {
            rapidFire: { color: '#ff0', symbol: 'R' },
            shield: { color: '#f0f', symbol: 'S' },
            multiShot: { color: '#0f0', symbol: 'M' }
        }[type];
    }

    update(dt, canvas) {
        super.update(dt, canvas);
        this.age += dt;
        this.pulseTimer += dt;

        if (this.age > this.life) {
            this.toDelete = true;
        }
    }

    draw(ctx) {
        const pulse = Math.sin(this.pulseTimer * 5) * 0.3 + 0.7;
        const alpha = Math.max(0, 1 - (this.age / this.life) * 0.5);

        ctx.save();
        ctx.globalAlpha = alpha;

        // Outer glow
        ctx.strokeStyle = this.config.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20 * pulse;
        ctx.shadowColor = this.config.color;

        // Draw hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const x = this.x + Math.cos(angle) * this.radius * pulse;
            const y = this.y + Math.sin(angle) * this.radius * pulse;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();

        // Draw symbol
        ctx.fillStyle = this.config.color;
        ctx.font = 'bold 16px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 10;
        ctx.fillText(this.config.symbol, this.x, this.y);

        ctx.restore();
    }
}

// UFO Enemy
class UFO extends Entity {
    constructor(x, y, canvas) {
        super(x, y, 20);
        this.canvas = canvas;
        this.targetX = Math.random() * canvas.width;
        this.targetY = Math.random() * canvas.height;
        this.speed = 2;
        this.shootCooldown = 0;
        this.shootInterval = 2;
        this.direction = Math.random() < 0.5 ? -1 : 1;
        this.changeDirectionTimer = 0;
        this.health = 2;
    }

    update(dt, canvas, ship) {
        // Change direction periodically
        this.changeDirectionTimer += dt;
        if (this.changeDirectionTimer > 2) {
            this.changeDirectionTimer = 0;
            this.targetX = Math.random() * canvas.width;
            this.targetY = Math.random() * canvas.height;
        }

        // Move towards target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            this.vx = (dx / distance) * this.speed;
            this.vy = (dy / distance) * this.speed;
        }

        // Shooting
        this.shootCooldown -= dt;

        super.update(dt, canvas);
    }

    canShoot() {
        if (this.shootCooldown <= 0) {
            this.shootCooldown = this.shootInterval;
            return true;
        }
        return false;
    }

    shootAt(ship) {
        const dx = ship.x - this.x;
        const dy = ship.y - this.y;
        const angle = Math.atan2(dy, dx);

        // Add some inaccuracy
        const inaccuracy = (Math.random() - 0.5) * 0.3;
        const finalAngle = angle + inaccuracy;

        const speed = 6;
        const vx = Math.cos(finalAngle) * speed;
        const vy = Math.sin(finalAngle) * speed;

        return new UFOBullet(this.x, this.y, vx, vy);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw UFO body
        ctx.strokeStyle = '#f00';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#f00';

        // Top dome
        ctx.beginPath();
        ctx.arc(0, -5, 8, 0, Math.PI, true);
        ctx.stroke();

        // Middle section
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(-8, -5);
        ctx.lineTo(8, -5);
        ctx.lineTo(15, 0);
        ctx.lineTo(8, 5);
        ctx.lineTo(-8, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Bottom dome
        ctx.beginPath();
        ctx.arc(0, 5, 8, 0, Math.PI);
        ctx.stroke();

        ctx.restore();
    }

    hit() {
        this.health--;
        return this.health <= 0;
    }

    getScore() {
        return 200;
    }
}

// UFO Bullet
class UFOBullet extends Entity {
    constructor(x, y, vx, vy) {
        super(x, y, 3);
        this.vx = vx;
        this.vy = vy;
        this.life = 2;
        this.age = 0;
    }

    update(dt, canvas, particleSystem) {
        super.update(dt, canvas);
        this.age += dt;

        if (this.age > this.life) {
            this.toDelete = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#f00';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
