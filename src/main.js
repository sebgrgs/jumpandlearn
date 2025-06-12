let game = null;

export function startPhaserGame() {
  if (game) return; // Prevent multiple instances
  const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 320,
  backgroundColor: '#5DACD8',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: true
    }
  },
  scene: {
    preload,
    create,
    update
  }
};
  game = new Phaser.Game(config);
}

function preload() {
  this.load.image('tileset_spring', 'assets/tilesets/spring_tileset.png');
  this.load.image('tileset_world', 'assets/tilesets/world_tileset.png');
  this.load.tilemapTiledJSON('level1', 'assets/maps/level1.json');
  this.load.spritesheet('player', 'assets/personnage/personnage.png', { frameWidth: 32, frameHeight: 32 });
}

function create() {
  const map = this.make.tilemap({ key: 'level1' });

  const tilesetWorld = map.addTilesetImage('tileset_world', 'tileset_world');
  const tilesetspring = map.addTilesetImage('tileset_spring', 'tileset_spring');

  const background = map.createLayer('ciel', tilesetWorld);
  const collision = map.createLayer('colision', [tilesetWorld, tilesetspring]);
  collision.setCollisionByProperty({ collision: true });

  this.player = this.physics.add.sprite(100, 100, 'player');
  this.player.setCollideWorldBounds(true);
  this.player.setSize(15, 15);
  this.player.setOffset(10, 10);

  this.physics.add.collider(this.player, collision);

  this.anims.create({
    key: 'idle',
    frames: this.anims.generateFrameNumbers('player', { start: 0, end: 8 }),
    frameRate: 5,
    repeat: -1
  })

  this.anims.create({
    key: 'run',
    frames: this.anims.generateFrameNumbers('player', { start: 9, end: 14 }),
    frameRate: 10,
    repeat: -1
  })

  this.anims.create({
    key: 'jump',
    frames: this.anims.generateFrameNumbers('player', { start: 15, end: 15 }),
    frameRate: 1,
    repeat: 0
  })

  this.cursors = this.input.keyboard.createCursorKeys();
  this.cameras.main.startFollow(this.player, true, 0.1, 0.1);


  

}

function update() {
  const player = this.player;
  const cursors = this.cursors;

  if (cursors.left.isDown) {
    console.log('left')
    player.setVelocityX(-160);
    player.anims.play('run', true);
    player.setFlipX(true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);
    player.anims.play('run', true);
    player.setFlipX(false);
  } else {
    player.setVelocityX(0);
    player.anims.play('idle', true);
  }

  if (cursors.up.isDown && player.body.blocked.down) {
    console.log('Jumping');
    player.setVelocityY(-400);
    player.anims.play('jump', true);
  }
}

