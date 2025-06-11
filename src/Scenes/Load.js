class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet
        // this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");

        // Load tilemap information
        this.load.image("tilemap_tiles", "tilemap_packed.png");                         // Packed tilemap
        this.load.tilemapTiledJSON("platformer-level-1", "platformer-level-1.tmj");   // Tilemap in JSON

        // Load the tilemap as a spritesheet
        this.load.spritesheet("tilemap_sheet", "tilemap_packed.png", {
            frameWidth: 16,
            frameHeight: 16,
            
        });

        this.load.image('player_45', 'tile_0045.png');   // idle frame
        this.load.image('player_46', 'tile_0046.png');   // walk / jump frame

        // Oooh, fancy. A multi atlas is a texture atlas which has the textures spread
        // across multiple png files, so as to keep their size small for use with
        // lower resource devices (like mobile phones).
        // kenny-particles.json internally has a list of the png files
        // The multiatlas was created using TexturePacker and the Kenny
        // Particle Pack asset pack.
        this.load.multiatlas("kenny-particles", "kenny-particles.json");

        this.load.audio("jump_sfx", "jump.wav");
    }

    create() {
        this.anims.create({
            key: 'walk',
            frames: [
                { key: 'player_45' },
                { key: 'player_46' }
            ],
            frameRate: 10,
            repeat: -1            // loop forever
        });

        this.anims.create({
            key: 'idle',
            frames: [{ key: 'player_45' }],
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            frames: [{ key: 'player_46' }]
        });


         // ...and pass to the next Scene
         this.scene.start("platformerScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}