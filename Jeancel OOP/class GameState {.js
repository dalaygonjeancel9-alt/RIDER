class GameState {
  constructor() {
    this.currentScreen = 'map'; // 'map' or 'battle'
    this.playerPos = { x: 4, y: 2 };
    this.inBattle = false;
    this.party = {
      warrior: { hp: 230, maxHp: 230, mp: 32, maxMp: 32 },
      mage: { hp: 150, maxHp: 150, mp: 70, maxMp: 70 }
    };
    this.enemy = null;
    this.inventory = {
      potion: 4,
      phoenix: 1,
      elixir: 1
    };
    this.gil = 850;
    this.limitGauge = 0;
  }
}

// Map Generator
class Map {
  constructor(width = 8, height = 5) {
    this.width = width;
    this.height = height;
    this.tiles = this.generateMap();
  }

  generateMap() {
    const tiles = [];
    const tileTypes = ['grass', 'forest', 'water', 'mountain'];
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const random = Math.random();
        let type = 'grass';
        
        if (random > 0.7) type = 'forest';
        if (random > 0.85) type = 'mountain';
        if (random > 0.9) type = 'water';
        
        tiles.push({ x, y, type });
      }
    }
    return tiles;
  }

  getTile(x, y) {
    return this.tiles.find(t => t.x === x && t.y === y);
  }
}

// Battle System
class Battle {
  constructor(enemy) {
    this.enemy = enemy;
    this.turn = 0;
    this.battleLog = [];
  }

  playerAttack(attacker) {
    const damage = Math.floor(Math.random() * 40) + 20;
    this.enemy.hp -= damage;
    this.battleLog.push(`${attacker} dealt ${damage} damage!`);
    return damage;
  }

  enemyAttack() {
    const damage = Math.floor(Math.random() * 30) + 10;
    // Damage to random party member
    this.battleLog.push(`Enemy dealt ${damage} damage!`);
    return damage;
  }

  castSpell(spellType) {
    const damage = spellType === 'fire' ? 60 : 40;
    this.enemy.hp -= damage;
    this.battleLog.push(`Cast ${spellType}! ${damage} damage!`);
    return damage;
  }
}

// Enemy Data
const enemyTypes = {
  goblin: { name: 'Goblin', hp: 86, maxHp: 86, reward: 150 },
  slime: { name: 'Slime', hp: 45, maxHp: 45, reward: 75 },
  orc: { name: 'Orc', hp: 120, maxHp: 120, reward: 250 }
};

// Game Controller
class GameController {
  constructor() {
    this.state = new GameState();
    this.map = new Map();
    this.battle = null;
    this.initEventListeners();
    this.renderMap();
  }

  initEventListeners() {
    document.addEventListener('keydown', (e) => this.handleInput(e));
    document.getElementById('battleAttack').addEventListener('click', () => this.playerAction('attack'));
    document.getElementById('battleMagic').addEventListener('click', () => this.playerAction('magic'));
    document.getElementById('battleItem').addEventListener('click', () => this.playerAction('item'));
    document.getElementById('battleFlee').addEventListener('click', () => this.playerAction('flee'));
    document.getElementById('usePotion').addEventListener('click', () => this.usePotion());
    document.getElementById('closeBtn').addEventListener('click', () => this.closeGame());
  }

  handleInput(e) {
    if (this.state.inBattle) return;

    const { x, y } = this.state.playerPos;
    
    switch(e.key) {
      case 'ArrowUp':
        if (y > 0) this.state.playerPos.y--;
        break;
      case 'ArrowDown':
        if (y < 4) this.state.playerPos.y++;
        break;
      case 'ArrowLeft':
        if (x > 0) this.state.playerPos.x--;
        break;
      case 'ArrowRight':
        if (x < 7) this.state.playerPos.x++;
        break;
    }

    this.checkTile();
    this.renderMap();
  }

  checkTile() {
    const tile = this.map.getTile(this.state.playerPos.x, this.state.playerPos.y);
    
    if (tile.type === 'forest') {
      if (Math.random() > 0.7) {
        this.startBattle();
      }
    }
  }

  startBattle() {
    const enemyKey = Object.keys(enemyTypes)[Math.floor(Math.random() * 3)];
    const enemyData = JSON.parse(JSON.stringify(enemyTypes[enemyKey]));
    
    this.battle = new Battle(enemyData);
    this.state.inBattle = true;
    
    document.getElementById('mapView').style.display = 'none';
    document.getElementById('battleView').style.display = 'block';
    document.getElementById('battleEnemyName').textContent = `🐉 ${enemyData.name.toUpperCase()}`;
    document.getElementById('battleEnemyHp').textContent = `HP: ${enemyData.hp}/${enemyData.maxHp}`;
    document.getElementById('globalMessage').textContent = `A wild ${enemyData.name} appeared!`;
  }

  playerAction(action) {
    if (!this.battle) return;

    let message = '';
    
    switch(action) {
      case 'attack':
        const damage = this.battle.playerAttack('Warrior');
        message = `Warrior attacks for ${damage} damage!`;
        break;
      case 'magic':
        const spellDamage = this.battle.castSpell('fire');
        message = `Mage casts Fire for ${spellDamage} damage!`;
        break;
      case 'item':
        message = 'Used item!';
        break;
      case 'flee':
        this.endBattle(false);
        return;
    }

    if (this.battle.enemy.hp <= 0) {
      this.endBattle(true);
      return;
    }

    // Enemy attacks back
    const enemyDamage = this.battle.enemyAttack();
    message += ` Enemy counters for ${enemyDamage} damage!`;

    document.getElementById('globalMessage').textContent = message;
    this.updateBattleUI();
  }

  endBattle(won) {
    if (won) {
      this.state.gil += this.battle.enemy.reward;
      document.getElementById('globalMessage').textContent = `Victory! Gained ${this.battle.enemy.reward}G`;
    } else {
      document.getElementById('globalMessage').textContent = 'Escaped from battle!';
    }

    this.state.inBattle = false;
    this.battle = null;
    
    document.getElementById('mapView').style.display = 'block';
    document.getElementById('battleView').style.display = 'none';
    this.updateUI();
  }

  usePotion() {
    if (this.state.inventory.potion > 0) {
      this.state.party.warrior.hp = Math.min(
        this.state.party.warrior.hp + 50,
        this.state.party.warrior.maxHp
      );
      this.state.inventory.potion--;
      document.getElementById('globalMessage').textContent = 'Used Potion! +50 HP';
      this.updateUI();
    }
  }

  updateBattleUI() {
    document.getElementById('battleEnemyHp').textContent = 
      `HP: ${Math.max(0, this.battle.enemy.hp)}/${this.battle.enemy.maxHp}`;
    document.getElementById('battleWarriorHp').textContent = 
      `${this.state.party.warrior.hp}/${this.state.party.warrior.maxHp}`;
  }

  updateUI() {
    document.getElementById('warriorHp').textContent = 
      `${this.state.party.warrior.hp}/${this.state.party.warrior.maxHp}`;
    document.getElementById('mageHp').textContent = 
      `${this.state.party.mage.hp}/${this.state.party.mage.maxHp}`;
    document.getElementById('gilValue').textContent = this.state.gil;
    document.getElementById('potionQty').textContent = this.state.inventory.potion;
  }

  renderMap() {
    const grid = document.getElementById('mapGrid');
    grid.innerHTML = '';

    this.map.tiles.forEach(tile => {
      const div = document.createElement('div');
      div.className = `map-tile ${tile.type}`;
      
      if (tile.x === this.state.playerPos.x && tile.y === this.state.playerPos.y) {
        div.classList.add('player-tile');
        div.textContent = '⚔️';
      } else {
        div.textContent = this.getTileEmoji(tile.type);
      }
      
      grid.appendChild(div);
    });
  }

  getTileEmoji(type) {
    const emojis = {
      grass: '🌾',
      forest: '🌲',
      water: '💧',
      mountain: '⛰️'
    };
    return emojis[type];
  }

  closeGame() {
    document.getElementById('globalMessage').textContent = '🌍 Move with arrow keys. Step into grass for battle.';
  }
}

// Initialize Game
window.addEventListener('DOMContentLoaded', () => {
  new GameController();
});