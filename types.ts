
export interface Vector {
  x: number;
  y: number;
}

export interface Entity {
  pos: Vector;
  vel: Vector;
  width: number;
  height: number;
}

export interface Player extends Entity {
  onGround: boolean;
  canDoubleJump: boolean;
  facing: 'left' | 'right';
  animFrame: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'stone' | 'wood' | 'moving';
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  answer: number; // Index of correct option
}

export interface Collectible {
  x: number;
  y: number;
  collected: boolean;
  type: 'star' | 'snitch';
}

export interface Enemy extends Entity {
  type: 'dementor' | 'spider';
  patrolRange: number;
  startPos: number;
}

export interface Particle {
  pos: Vector;
  vel: Vector;
  life: number;
  color: string;
}

export interface GameState {
  player: Player;
  platforms: Platform[];
  collectibles: Collectible[];
  enemies: Enemy[];
  particles: Particle[];
  cameraX: number;
  score: number;
  status: 'start' | 'playing' | 'quiz' | 'gameover' | 'won';
  activeQuestion?: Question;
  activeCollectibleIndex?: number;
}
