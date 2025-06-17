import Level1Scene from './level1scene.js';
import Level2Scene from './level2scene.js';

async function getUserProgress() {
  const token = localStorage.getItem('token');
  const res = await fetch('http://localhost:5000/api/v1/progress/', {
      headers: { 'Authorization': 'Bearer ' + token }
  });
  if (res.ok) {
      const data = await res.json();
      return data.level; // numéro de la map à charger
  }
  return 1; // Par défaut, map 1
}

export async function saveUserProgress(level) {
  const token = localStorage.getItem('token');
  await fetch('http://localhost:5000/api/v1/progress/', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ level })
  });
}

const level = await getUserProgress();
const config = {
  type: Phaser.AUTO,
  scale: {
    parent: 'game-container',
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 600,
    height: 320,
  },
  pixelArt: true,
  backgroundColor: '#5DACD8',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: true
    }
  },
  scene: [
    Level1Scene,
    Level2Scene,
    ]
};

 const game = new Phaser.Game(config);



 if (level === 1) {
  game.scene.start('Level1Scene', { level: 1 });
} else if (level === 2) {
  game.scene.start('Level2Scene', { level: 2 });
}