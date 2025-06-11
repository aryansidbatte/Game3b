class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 1000;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -400;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.maxVelocity = 200; // max velocity for player sprite

        this.WALL_SLIDE_SPEED   = 80;   // ↓ max fall speed while hugging wall
        this.WALL_JUMP_VEL_X    = 50;  // → / ← kick-off force
        this.WALL_JUMP_VEL_Y    = -350; // ↑ vertical boost
        this.wallJumpLockMs     = 200;  // short lock-out so you can’t spam-jump
        this._nextWallJumpTime  = 0;    // timestamp helper

        this.gameStarted = false;       // blocks update() until overlay closed
        this.overlay     = null;        // will hold the UI container
    }

    create() {
        // Create a new tilemap game object which uses 16x16 pixel tiles, and is
        // 100 tiles wide and 45 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 16, 16, 100, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        this.physics.world.setBounds(
                0, 0,
                this.map.widthInPixels,      // full pixel width of the map
                this.map.heightInPixels      // full pixel height of the map
            );


        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });


        my.sprite.player = this.physics.add.sprite(
            70,
            165,
            'player_45'          //   <──────── default texture
        ).setCollideWorldBounds(true);
        
        this.physics.world.setBoundsCollision(true, true, true, false);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // movement vfx

        my.vfx.walking = this.add.particles(0, 6, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            // TODO: Try: add random: true
            scale: {start: 0.03, end: 0.01},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            alpha: {start: 0.5, end: 0.1},
            gravtityY: -400 
        });

        my.vfx.walking.stop();

        this.physics.world.drawDebug   = false;

        

        // camera setup
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 1, 1); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
        
        this.cameras.main.setRoundPixels(true);

        this.jumpSfx = this.sound.add("jump_sfx", {
            volume: 0.4,   // tweak to taste
        });

        // ----- (A) Blur the whole canvas ----------------------------------------
        //this.game.canvas.style.filter = 'blur(4px)';

        // ----- (B) Overlay UI ----------------------------------------------------
        const { width, height } = this.scale;
        this.overlay = this.add.container(0, 0).setDepth(999);   // sits on top of everything

        // Semi-transparent veil that ignores camera scroll
        const veil = this.add.rectangle(0, 0, width, height, 0x000000, 0.45)
            .setOrigin(0)
            .setScrollFactor(0);
        this.overlay.add(veil);

        // Title text
        const title = this.add.text(width * 0.5, height * 0.4, 'Cubey Platformer', {
            fontSize: '48px',
            fontFamily: 'sans-serif'
        }).setOrigin(0.5).setScrollFactor(0);
        this.overlay.add(title);

        // Clickable “Start” button
        const startBtn = this.add.text(width * 0.5, height * 0.6, '▶  Start', {
            fontSize: '32px',
            fontFamily: 'sans-serif',
            backgroundColor: '#fcdfcd',
            padding: { left: 24, right: 24, top: 12, bottom: 12 }
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true });

        startBtn.on('pointerup', () => {
            this.overlay.destroy();            // remove UI
            this.game.canvas.style.filter = ''; // clear blur
            this.gameStarted = true;           // enable gameplay in update()
        });

        this.overlay.add(startBtn);

    }

    update() {

        const onGround     = my.sprite.player.body.blocked.down;
        const onLeftWall   = my.sprite.player.body.blocked.left;
        const onRightWall  = my.sprite.player.body.blocked.right;
        const onAnyWall    = (onLeftWall || onRightWall) && !onGround;

        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);

            if (my.sprite.player.body.velocity.x < -this.maxVelocity) {
                my.sprite.player.body.setVelocityX(-this.maxVelocity);
            }

            // particle following
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);

            if (my.sprite.player.body.velocity.x > this.maxVelocity) {
                my.sprite.player.body.setVelocityX(this.maxVelocity);
            }
            
            // particle following
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            
            // vfx stop
            my.vfx.walking.stop();
        }

        if (onAnyWall && my.sprite.player.body.velocity.y > this.WALL_SLIDE_SPEED) {
            my.sprite.player.body.setVelocityY(this.WALL_SLIDE_SPEED);
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if (Phaser.Input.Keyboard.JustDown(cursors.up)) {

        // 4-A Ground jump  ───────────────────────────────
        if (onGround) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.jumpSfx.play();
            return;
        }

        // 4-B Wall jump  ────────────────────────────────
        const now = this.time.now;
        if (onAnyWall && now >= this._nextWallJumpTime) {

            // vertical
            my.sprite.player.body.setVelocityY(this.WALL_JUMP_VEL_Y);

            // horizontal (push opposite to wall)
            if (onLeftWall)  { my.sprite.player.body.setVelocityX(this.WALL_JUMP_VEL_X);  }
            if (onRightWall) { my.sprite.player.body.setVelocityX(-this.WALL_JUMP_VEL_X); }

            this._nextWallJumpTime = now + this.wallJumpLockMs;  // lock-out timer
            this.jumpSfx.play();
        }
}

        // ─── bottom → top wrap ───
        if (my.sprite.player.y > this.physics.world.bounds.bottom) {
            my.sprite.player.y = this.physics.world.bounds.top + 2;  // re-enter at top
            my.sprite.player.body.setVelocityY(0);                    // stop the fall
        }
        if (my.sprite.player.x >= this.physics.world.bounds.right - 16) {
        // Optional: freeze player so they stop sliding on last frame
        my.sprite.player.body.setVelocity(0, 0);
        my.sprite.player.body.setAcceleration(0, 0);

        this.scene.start('endScene', { /* you can pass score/time here */ });
    }
        
    }
}