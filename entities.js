// Game Entity Classes

// Base class for game objects
class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.radius = 20;
    }

    wrapScreen(width, height) {
        if (this.x < -this.radius) this.x = width + this.radius;
        if (this.x > width + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = height + this.radius;
        if (this.y > height + this.radius) this.y = -this.radius;
    }

    checkCollision(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + other.radius;
    }
}

// Player Ship
class Ship extends Entity {
    constructor(x, y) {
        super(x, y);
        this.radius = 15;
        this.rotation = 0;
        this.thrust = 0;
        this.thrustPower = 0.15;
        this.rotationSpeed = 0.08;
        this.friction = 0.99;
        this.maxSpeed = 8;

        // Combat
        this.canShoot = true;
        this.shootCooldown = 0;
        this.shootDelay = 15;

        // Power-ups
        this.hasRapidFire = false;
        this.hasShield = false;
        this.hasMultiShot = false;
        this.rapidFireTimer = 0;
        this.shieldTimer = 0;
        this.multiShotTimer = 0;

        // State
        this.invincible = false;
        this.invincibleTimer = 0;
        this.destroyed = false;
    }

    update(deltaTime, keys, width, height) {
        // Rotation
        if (keys['ArrowLeft']) {
            this.rotation -= this.rotationSpeed;
        }
        if (keys['ArrowRight']) {
            this.rotation += this.rotationSpeed;
        }

        // Thrust
        this.thrust = keys['ArrowUp'] ? 1 : 0;
        if (this.thrust > 0) {
            this.vx += Math.cos(this.rotation) * this.thrustPower;
            this.vy += Math.sin(this.rotation) * this.thrustPower;
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

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around screen
        this.wrapScreen(width, height);

        // Update shoot cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
            if (this.shootCooldown < 0) this.shootCooldown = 0;
        }

        // Update power-up timers
        if (this.hasRapidFire) {
            this.rapidFireTimer -= deltaTime;
            if (this.rapidFireTimer <= 0) {
                this.hasRapidFire = false;
            }
        }

        if (this.hasShield) {
            this.shieldTimer -= deltaTime;
            if (this.shieldTimer <= 0) {
                this.hasShield = false;
            }
        }

        if (this.hasMultiShot) {
            this.multiShotTimer -= deltaTime;
            if (this.multiShotTimer <= 0) {
                this.hasMultiShot = false;
            }
        }

        // Update invincibility
        if (this.invincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
    }

    shoot() {
        const bullets = [];

        if (this.shootCooldown > 0) return bullets;

        const shootDelay = this.hasRapidFire ? 5 : 15;
        this.shootCooldown = shootDelay;

        if (this.hasMultiShot) {
            // Shoot 3 bullets
            const angles = [-0.2, 0, 0.2];
            angles.forEach(offset => {
                const angle = this.rotation + offset;
                const bulletX = this.x + Math.cos(angle) * 20;
                const bulletY = this.y + Math.sin(angle) * 20;
                bullets.push(new Bullet(bulletX, bulletY, angle));
            });
        } else {
            // Shoot 1 bullet
            const bulletX = this.x + Math.cos(this.rotation) * 20;
            const bulletY = this.y + Math.sin(this.rotation) * 20;
            bullets.push(new Bullet(bulletX, bulletY, this.rotation));
        }

        return bullets;
    }

    hyperspace(width, height) {
        // Random teleport with 20% chance of damage
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = 0;
        this.vy = 0;

        return Math.random() < 0.2; // Return true if hyperspace damaged ship
    }

    activatePowerUp(type, duration = 300) {
        if (type === 'rapidFire') {
            this.hasRapidFire = true;
            this.rapidFireTimer = duration;
        } else if (type === 'shield') {
            this.hasShield = true;
            this.shieldTimer = duration;
        } else if (type === 'multiShot') {
            this.hasMultiShot = true;
            this.multiShotTimer = duration;
        }
    }

    draw(ctx, frame) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw shield if active
        if (this.hasShield) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ffff';
            const pulse = Math.sin(frame * 0.1) * 5;
            ctx.beginPath();
            ctx.arc(0, 0, 25 + pulse, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Flashing when invincible
        if (this.invincible && Math.floor(frame / 5) % 2 === 0) {
            ctx.restore();
            return;
        }

        // Draw ship with glow
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ff00';

        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.stroke();

        // Inner detail
        ctx.strokeStyle = '#00aa00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(-5, 0);
        ctx.stroke();

        ctx.restore();
    }
}

// Bullet
class Bullet extends Entity {
    constructor(x, y, angle) {
        super(x, y);
        this.radius = 2;
        this.speed = 10;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.life = 60;
        this.maxLife = 60;
    }

    update(deltaTime, width, height) {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= deltaTime;
        this.wrapScreen(width, height);
    }

    isDead() {
        return this.life <= 0;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';

        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Asteroid
class Asteroid extends Entity {
    constructor(x, y, size = 'large') {
        super(x, y);
        this.size = size;

        // Set properties based on size
        if (size === 'large') {
            this.radius = 40;
            this.points = 100;
            this.health = 3;
        } else if (size === 'medium') {
            this.radius = 25;
            this.points = 50;
            this.health = 2;
        } else {
            this.radius = 15;
            this.points = 20;
            this.health = 1;
        }

        // Random velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        // Rotation
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.angle = Math.random() * Math.PI * 2;

        // Shape (irregular polygon)
        this.vertices = [];
        const vertexCount = Math.floor(Math.random() * 4) + 8;
        for (let i = 0; i < vertexCount; i++) {
            const angle = (Math.PI * 2 / vertexCount) * i;
            const variation = this.radius * (Math.random() * 0.3 + 0.7);
            this.vertices.push({
                x: Math.cos(angle) * variation,
                y: Math.sin(angle) * variation
            });
        }
    }

    update(deltaTime, width, height) {
        this.x += this.vx;
        this.y += this.vy;
        this.angle += this.rotationSpeed;
        this.wrapScreen(width, height);
    }

    split() {
        const children = [];
        if (this.size === 'large') {
            for (let i = 0; i < 2; i++) {
                const asteroid = new Asteroid(this.x, this.y, 'medium');
                children.push(asteroid);
            }
        } else if (this.size === 'medium') {
            for (let i = 0; i < 2; i++) {
                const asteroid = new Asteroid(this.x, this.y, 'small');
                children.push(asteroid);
            }
        }
        return children;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#888888';

        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }
}

// Power-up
class PowerUp extends Entity {
    constructor(x, y, type) {
        super(x, y);
        this.radius = 12;
        this.type = type; // 'rapidFire', 'shield', 'multiShot'
        this.life = 300; // Disappears after 5 seconds
        this.bobPhase = Math.random() * Math.PI * 2;

        // Set color based on type
        if (type === 'rapidFire') {
            this.color = '#ff0000';
            this.symbol = 'R';
        } else if (type === 'shield') {
            this.color = '#00ffff';
            this.symbol = 'S';
        } else if (type === 'multiShot') {
            this.color = '#ff00ff';
            this.symbol = 'M';
        }
    }

    update(deltaTime, width, height) {
        this.life -= deltaTime;
        this.bobPhase += 0.05;
        this.wrapScreen(width, height);
    }

    isDead() {
        return this.life <= 0;
    }

    draw(ctx) {
        const bob = Math.sin(this.bobPhase) * 5;
        const alpha = this.life < 60 ? this.life / 60 : 1;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y + bob);

        // Outer glow
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.stroke();

        // Symbol
        ctx.fillStyle = this.color;
        ctx.font = 'bold 16px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, 0, 0);

        ctx.restore();
    }
}

// UFO Enemy
class UFO extends Entity {
    constructor(x, y, width, height) {
        super(x, y);
        this.radius = 20;
        this.width = width;
        this.height = height;
        this.speed = 2;
        this.vx = this.speed;
        this.vy = 0;
        this.changeDirectionTimer = 0;
        this.shootTimer = 0;
        this.shootDelay = 60;
        this.points = 200;
    }

    update(deltaTime, playerX, playerY) {
        // Move
        this.x += this.vx;
        this.y += this.vy;

        // Change direction occasionally
        this.changeDirectionTimer -= deltaTime;
        if (this.changeDirectionTimer <= 0) {
            this.changeDirectionTimer = 60 + Math.random() * 60;
            this.vx = (Math.random() - 0.5) * this.speed * 2;
            this.vy = (Math.random() - 0.5) * this.speed * 2;
        }

        // Wrap around screen
        this.wrapScreen(this.width, this.height);

        // Update shoot timer
        this.shootTimer -= deltaTime;
    }

    canShoot() {
        return this.shootTimer <= 0;
    }

    shoot(playerX, playerY) {
        if (!this.canShoot()) return null;

        this.shootTimer = this.shootDelay;

        // Aim at player with some inaccuracy
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.5;

        return new Bullet(this.x, this.y, angle);
    }

    draw(ctx, frame) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // UFO body with glow
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff00ff';

        // Top dome
        ctx.beginPath();
        ctx.arc(0, -5, 8, Math.PI, 0, false);
        ctx.stroke();

        // Middle section
        ctx.beginPath();
        ctx.moveTo(-15, -5);
        ctx.lineTo(-10, 5);
        ctx.lineTo(10, 5);
        ctx.lineTo(15, -5);
        ctx.closePath();
        ctx.stroke();

        // Bottom
        ctx.beginPath();
        ctx.moveTo(-10, 5);
        ctx.lineTo(10, 5);
        ctx.stroke();

        // Lights (blinking)
        if (Math.floor(frame / 10) % 2 === 0) {
            ctx.fillStyle = '#ffff00';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffff00';
            ctx.beginPath();
            ctx.arc(-8, 0, 2, 0, Math.PI * 2);
            ctx.arc(8, 0, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
