
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
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

const game = new Phaser.Game(config);

function preload() {
  // Images des tilesets
  this.load.image('phasertuilespring', 'assets/tilesets/spring_tileset.png');
  this.load.image('phasertuileback', 'assets/tilesets/world_tileset.png');

  // Sprite joueur
  this.load.image('player', 'assets/personnage/personnage.png');

  // Map Tiled exportée en JSON
  this.load.tilemapTiledJSON('map', 'assets/maps/level1.json');
}

function create() {
  // Chargement de la map
  const carteniveau = this.add.tilemap('map');

  // Chargement des tilesets selon leur nom dans Tiled
  const tilesetSpring = carteniveau.addTilesetImage('spring_tileset', 'phasertuilespring');
  const tilesetBack = carteniveau.addTilesetImage('world_tileset', 'phasertuileback');

  // Création des calques
  const calque_background = carteniveau.createLayer('backgrould ciel', tilesetBack);
  const calque_backgrounddecor = carteniveau.createLayer('backgrand dans lniveau', tilesetBack);
  const calque_collisions = carteniveau.createLayer('colision', tilesetSpring);

  // Activer les collisions
  calque_collisions.setCollisionByProperty({ colides: true });

  // Créer le joueur
  const player = this.physics.add.sprite(100, 100, 'player');
  player.setCollideWorldBounds(true);

  // Collisions joueur / décor
  this.physics.add.collider(player, calque_collisions);
}

function update() {
  // Tu pourras gérer les contrôles ici (ex: this.cursors.left.isDown etc.)
}