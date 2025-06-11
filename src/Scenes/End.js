class End extends Phaser.Scene {
    constructor() { super('endScene'); }

    init(data) {          // data is optional – send whatever you like
        this.score = data?.score ?? 0;
    }

    create() {
        const cx = this.scale.width  * 0.5;
        const cy = this.scale.height * 0.5;

        this.add.text(cx, cy - 40, '🎉  You made it!  🎉', {
            fontSize: '42px'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 40, 'Press  R  to play again', {
            fontSize: '22px'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-R', () => {
            this.scene.start('platformerScene');
        });
    }
}