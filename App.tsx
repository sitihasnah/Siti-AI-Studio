
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Player, Platform, Collectible, Enemy, Particle, Question } from './types';
import { 
  GAME_WIDTH, 
  GAME_HEIGHT, 
  GRAVITY, 
  JUMP_FORCE, 
  MAX_SPEED, 
  ACCELERATION, 
  FRICTION,
  LEVEL_LAYOUT,
  COLORS,
  QUIZ_DATA,
  TECHNICAL_REFERENCE
} from './constants';

// Direct Image Links converted from User provided freeimage IDs
const PLAYER_SPRITE_URL = 'https://iili.io/fp3Yy8X.png';
const ENEMY_SPRITE_URL = 'https://iili.io/fp3n2ZF.png';
const MENU_BG_URL = 'https://iili.io/fp2aWLQ.png';
const LEVEL_BG_URL = 'https://iili.io/fp3Yy8X.png'; // User requested the same link as character

const App: React.FC = () => {
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const enemySpriteRef = useRef<HTMLImageElement | null>(null);
  const menuBgRef = useRef<HTMLImageElement | null>(null);
  const levelBgRef = useRef<HTMLImageElement | null>(null);
  
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const stateRef = useRef<GameState>({
    player: {
      pos: { x: 50, y: 400 },
      vel: { x: 0, y: 0 },
      width: 64,
      height: 64,
      onGround: false,
      canDoubleJump: true,
      facing: 'right',
      animFrame: 0
    },
    platforms: LEVEL_LAYOUT.platforms.map(p => ({ ...p, type: p.type as any })),
    collectibles: [
      ...LEVEL_LAYOUT.stars.map(s => ({ ...s, collected: false, type: 'star' as const })),
      { ...LEVEL_LAYOUT.snitch, collected: false, type: 'snitch' as const }
    ],
    enemies: LEVEL_LAYOUT.enemies.map(e => ({
      pos: { x: e.x, y: e.y },
      vel: { x: 1.5, y: 0 },
      width: 64,
      height: 64,
      type: 'dementor',
      patrolRange: e.range,
      startPos: e.x
    })),
    particles: [],
    cameraX: 0,
    score: 0,
    status: 'start'
  });

  const [renderState, setRenderState] = useState<GameState>(stateRef.current);
  const [showHint, setShowHint] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef<{ [key: string]: boolean }>({});
  const lastJumpPress = useRef<boolean>(false);
  const requestRef = useRef<number>();
  const lastOnGroundTime = useRef<number>(0);

  // Asset Loading with Cross-Origin support to ensure canvas rendering
  useEffect(() => {
    let loaded = 0;
    const total = 4;

    const onAssetLoad = () => {
      loaded++;
      setLoadProgress(Math.floor((loaded / total) * 100));
      if (loaded === total) setAssetsLoaded(true);
    };

    const loadImage = (url: string, ref: React.MutableRefObject<HTMLImageElement | null>) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => {
        ref.current = img;
        onAssetLoad();
      };
      img.onerror = () => {
        console.error("Error loading asset:", url);
        onAssetLoad(); 
      };
    };

    loadImage(PLAYER_SPRITE_URL, spriteRef);
    loadImage(ENEMY_SPRITE_URL, enemySpriteRef);
    loadImage(MENU_BG_URL, menuBgRef);
    loadImage(LEVEL_BG_URL, levelBgRef);
  }, []);

  const resetGame = () => {
    stateRef.current = {
      ...stateRef.current,
      player: {
        pos: { x: 50, y: 400 },
        vel: { x: 0, y: 0 },
        width: 64,
        height: 64,
        onGround: false,
        canDoubleJump: true,
        facing: 'right',
        animFrame: 0
      },
      collectibles: [
        ...LEVEL_LAYOUT.stars.map(s => ({ ...s, collected: false, type: 'star' as const })),
        { ...LEVEL_LAYOUT.snitch, collected: false, type: 'snitch' as const }
      ],
      particles: [],
      cameraX: 0,
      score: 0,
      status: 'playing'
    };
    setShowHint(false);
    setRenderState(stateRef.current);
  };

  const createParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      stateRef.current.particles.push({
        pos: { x, y },
        vel: { x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 6 },
        life: 1.0,
        color
      });
    }
  };

  const handleQuizAnswer = (index: number) => {
    const state = stateRef.current;
    if (index === state.activeQuestion?.answer) {
      if (state.activeCollectibleIndex !== undefined) {
        const item = state.collectibles[state.activeCollectibleIndex];
        item.collected = true;
        state.score += 500;
        createParticles(item.x, item.y, COLORS.GRYFFINDOR_GOLD, 40);
      }
      state.status = 'playing';
    } else {
      state.player.vel.x = -15;
      state.player.vel.y = -5;
      state.status = 'playing';
      createParticles(state.player.pos.x, state.player.pos.y, COLORS.GRYFFINDOR_RED, 20);
    }
  };

  const update = () => {
    const state = stateRef.current;
    if (state.status !== 'playing') return;

    const { player, platforms, collectibles, enemies, particles } = state;

    const moveRight = keys.current['ArrowRight'] || keys.current['KeyD'];
    const moveLeft = keys.current['ArrowLeft'] || keys.current['KeyA'];

    if (moveRight) {
      player.vel.x += ACCELERATION;
      player.facing = 'right';
    } else if (moveLeft) {
      player.vel.x -= ACCELERATION;
      player.facing = 'left';
    } else {
      player.vel.x *= FRICTION;
    }

    if (player.vel.x > MAX_SPEED) player.vel.x = MAX_SPEED;
    if (player.vel.x < -MAX_SPEED) player.vel.x = -MAX_SPEED;

    const currentTime = Date.now();
    const canJump = player.onGround || (currentTime - lastOnGroundTime.current < 150);
    const jumpKey = keys.current['Space'] || keys.current['ArrowUp'] || keys.current['KeyW'];

    if (jumpKey && !lastJumpPress.current) {
      if (canJump) {
        player.vel.y = JUMP_FORCE;
        player.onGround = false;
        player.canDoubleJump = true;
        lastOnGroundTime.current = 0;
      } else if (player.canDoubleJump) {
        player.vel.y = JUMP_FORCE * 0.9;
        player.canDoubleJump = false;
        createParticles(player.pos.x + player.width / 2, player.pos.y + player.height / 2, '#fff', 5);
      }
    }
    lastJumpPress.current = jumpKey;

    player.vel.y += GRAVITY;
    player.pos.x += player.vel.x;
    player.pos.y += player.vel.y;

    if (player.pos.x < 0) player.pos.x = 0;

    player.onGround = false;
    platforms.forEach(p => {
      if (player.pos.x < p.x + p.width && player.pos.x + player.width > p.x &&
          player.pos.y < p.y + p.height && player.pos.y + player.height > p.y) {
        if (player.vel.y > 0 && player.pos.y + player.height - player.vel.y <= p.y + 10) {
          player.pos.y = p.y - player.height;
          player.vel.y = 0;
          player.onGround = true;
          player.canDoubleJump = true;
          lastOnGroundTime.current = Date.now();
        } else if (player.vel.y < 0 && player.pos.y - player.vel.y >= p.y + p.height - 10) {
          player.pos.y = p.y + p.height;
          player.vel.y = 0;
        } else if (player.vel.x > 0) {
          player.pos.x = p.x - player.width;
        } else if (player.vel.x < 0) {
          player.pos.x = p.x + p.width;
        }
      }
    });

    collectibles.forEach((c, idx) => {
      if (!c.collected && 
          player.pos.x < c.x + 30 && player.pos.x + player.width > c.x &&
          player.pos.y < c.y + 30 && player.pos.y + player.height > c.y) {
        
        if (c.type === 'snitch') {
          state.status = 'won';
          state.score += 5000;
        } else {
          state.status = 'quiz';
          state.activeQuestion = QUIZ_DATA[Math.floor(Math.random() * QUIZ_DATA.length)];
          state.activeCollectibleIndex = idx;
        }
      }
    });

    enemies.forEach(e => {
      e.pos.x += e.vel.x;
      if (Math.abs(e.pos.x - e.startPos) > e.patrolRange) e.vel.x *= -1;
      if (player.pos.x < e.pos.x + e.width - 20 && player.pos.x + player.width > e.pos.x + 20 &&
          player.pos.y < e.pos.y + e.height - 20 && player.pos.y + player.height > e.pos.y + 20) {
        state.status = 'gameover';
      }
    });

    if (player.pos.y > GAME_HEIGHT) state.status = 'gameover';

    state.particles = particles.filter(p => {
      p.pos.x += p.vel.x;
      p.pos.y += p.vel.y;
      p.life -= 0.02;
      return p.life > 0;
    });

    const targetCam = player.pos.x - GAME_WIDTH / 3;
    state.cameraX += (targetCam - state.cameraX) * 0.1;
    if (state.cameraX < 0) state.cameraX = 0;

    // Animation frames logic for 4x2 spritesheet
    const moveSpeed = Math.abs(player.vel.x);
    if (!player.onGround) {
      player.animFrame = 3; 
    } else if (moveSpeed > 0.1) {
      player.animFrame += (moveSpeed * 0.05) + 0.1;
    } else {
      player.animFrame += 0.06;
    }
    
    setRenderState({ ...state });
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw Level Background if assets are loaded
    if (assetsLoaded && levelBgRef.current) {
      // Parallax-ish background tiling
      const bg = levelBgRef.current;
      const bgScale = GAME_HEIGHT / bg.height;
      const scaledWidth = bg.width * bgScale;
      
      // Calculate start position for tiling
      let xOffset = -(state.cameraX * 0.5) % scaledWidth;
      if (xOffset > 0) xOffset -= scaledWidth;
      
      for (let x = xOffset; x < GAME_WIDTH; x += scaledWidth) {
        ctx.drawImage(bg, x, 0, scaledWidth, GAME_HEIGHT);
      }
    } else {
      const sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      sky.addColorStop(0, '#020210');
      sky.addColorStop(1, '#0c0c28');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    ctx.save();
    ctx.translate(-state.cameraX, 0);

    // Platforms
    state.platforms.forEach(p => {
      ctx.fillStyle = COLORS.PLATFORM;
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x, p.y, p.width, p.height);
    });

    // Particles
    state.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Collectibles
    state.collectibles.forEach(c => {
      if (!c.collected) {
        const bounce = Math.sin(Date.now() / 200) * 8;
        ctx.save();
        ctx.shadowBlur = 15;
        if (c.type === 'star') {
          ctx.shadowColor = COLORS.GRYFFINDOR_RED;
          ctx.fillStyle = COLORS.STAR;
          ctx.beginPath();
          ctx.arc(c.x + 15, c.y + 15 + bounce, 12, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.shadowColor = COLORS.GRYFFINDOR_GOLD;
          ctx.fillStyle = COLORS.GRYFFINDOR_GOLD;
          ctx.beginPath();
          ctx.arc(c.x + 15, c.y + 15 + bounce, 10, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    });

    // Enemies
    state.enemies.forEach(e => {
      if (enemySpriteRef.current && assetsLoaded) {
        const hover = Math.sin(Date.now() / 300) * 6;
        ctx.drawImage(enemySpriteRef.current, e.pos.x, e.pos.y + hover, e.width, e.height);
      } else {
        ctx.fillStyle = COLORS.DEMENTOR;
        ctx.fillRect(e.pos.x, e.pos.y, e.width, e.height);
      }
    });

    // Character Rendering
    const p = state.player;
    ctx.save();
    ctx.translate(p.pos.x + p.width / 2, p.pos.y + p.height / 2);
    if (p.facing === 'left') ctx.scale(-1, 1);
    
    if (spriteRef.current && assetsLoaded) {
      const sprite = spriteRef.current;
      const cols = 4;
      const rows = 2;
      const sw = sprite.width / cols;
      const sh = sprite.height / rows;
      
      const isWalking = Math.abs(p.vel.x) > 0.1 || !p.onGround;
      const row = isWalking ? 0 : 1;
      const col = Math.floor(p.animFrame) % cols;

      ctx.drawImage(
        sprite,
        col * sw, row * sh, sw, sh,
        -p.width / 2, -p.height / 2, p.width, p.height
      );
    } else {
      ctx.fillStyle = '#f00';
      ctx.fillRect(-p.width/2, -p.height/2, p.width, p.height);
    }
    ctx.restore();

    ctx.restore();
  }, [assetsLoaded]);

  const gameLoop = () => {
    update();
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx, stateRef.current);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keys.current[e.code] = true;
    const handleKeyUp = (e: KeyboardEvent) => keys.current[e.code] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [assetsLoaded]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-950 overflow-hidden relative">
      <div className="absolute top-4 w-full px-8 flex justify-between items-center z-10">
        <div className="flex space-x-4">
          <div className="bg-slate-900/90 border-2 border-amber-500/30 px-6 py-2 rounded-full backdrop-blur-md shadow-2xl">
            <span className="text-amber-400 font-wizard text-2xl uppercase tracking-widest">Score: {renderState.score}</span>
          </div>
          <div className="bg-slate-900/90 border-2 border-blue-500/30 px-6 py-2 rounded-full backdrop-blur-md shadow-2xl">
            <span className="text-blue-300 font-medium text-lg">✨ Stars: {renderState.collectibles.filter(c => c.collected && c.type === 'star').length} / {LEVEL_LAYOUT.stars.length}</span>
          </div>
        </div>

        <button 
          onClick={() => setShowHint(true)}
          className="bg-slate-900/90 border-2 border-amber-500/50 hover:border-amber-400 p-4 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 group"
        >
          <svg className="w-8 h-8 text-amber-500 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        </button>
      </div>

      <div className="relative border-8 border-slate-900 rounded-3xl shadow-2xl overflow-hidden bg-black ring-4 ring-amber-500/10">
        <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} style={{ imageRendering: 'pixelated' }} />

        {renderState.status === 'start' && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-cover bg-center transition-opacity duration-700"
            style={{ 
              backgroundImage: assetsLoaded && menuBgRef.current 
                ? `linear-gradient(rgba(10, 10, 26, 0.6), rgba(10, 10, 26, 0.9)), url(${MENU_BG_URL})` 
                : 'linear-gradient(rgba(10, 10, 26, 0.95), rgba(10, 10, 26, 0.95))'
            }}
          >
            <div className="mb-6 animate-bounce">
              <div className="bg-amber-950/80 px-10 py-3 rounded-full border-2 border-amber-400/50 backdrop-blur-xl inline-block shadow-2xl">
                <span className="text-amber-400 font-wizard text-xl uppercase tracking-[0.5em]">Level 1: The Chamber of Databases</span>
              </div>
            </div>
            
            <h1 className="text-8xl text-amber-500 font-wizard mb-10 drop-shadow-[0_0_35px_rgba(245,158,11,0.7)]">Wizard Quest</h1>
            
            {!assetsLoaded ? (
              <div className="flex flex-col items-center">
                <div className="w-80 h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${loadProgress}%` }} />
                </div>
                <p className="text-amber-500/80 text-sm mt-4 font-mono uppercase tracking-widest animate-pulse">Brewing the Assets...</p>
              </div>
            ) : (
              <div className="space-y-12">
                <button 
                  onClick={resetGame} 
                  className="bg-amber-700 hover:bg-amber-600 text-white font-wizard text-5xl px-24 py-8 rounded-full transition-all hover:scale-110 hover:-translate-y-2 shadow-[0_0_60px_rgba(217,119,6,0.6)] border-4 border-amber-400/40 group relative"
                >
                  <span className="relative z-10">Cast "Enter"</span>
                  <div className="absolute inset-0 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                </button>
              </div>
            )}
          </div>
        )}

        {renderState.status === 'quiz' && (
          <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-8 backdrop-blur-lg">
            <div className="bg-[#f4e4bc] w-[650px] p-12 rounded-xl shadow-[0_0_100px_rgba(0,0,0,0.9)] border-x-[16px] border-[#c19a6b] relative animate-in zoom-in duration-300">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#740001] text-white font-wizard px-12 py-4 rounded-lg border-2 border-amber-500 shadow-2xl rotate-2">
                Database Curse!
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-12 font-serif leading-tight mt-6">
                {renderState.activeQuestion?.question}
              </h2>
              <div className="space-y-4">
                {renderState.activeQuestion?.options.map((opt, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleQuizAnswer(i)}
                    className="w-full text-left bg-white/40 hover:bg-white p-6 rounded-lg border-2 border-slate-400 transition-all text-slate-900 font-bold shadow-md hover:translate-x-6 hover:border-amber-600 hover:bg-amber-50"
                  >
                    <span className="text-amber-800 font-bold mr-4 text-2xl">{String.fromCharCode(65 + i)}.</span> {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {(renderState.status === 'gameover' || renderState.status === 'won') && (
          <div className="absolute inset-0 bg-slate-950/98 flex flex-col items-center justify-center backdrop-blur-3xl p-10">
            <h2 className={`text-9xl font-wizard mb-12 ${renderState.status === 'won' ? 'text-green-400 animate-pulse drop-shadow-[0_0_40px_rgba(74,222,128,0.5)]' : 'text-red-700 drop-shadow-[0_0_40px_rgba(185,28,28,0.5)]'}`}>
              {renderState.status === 'won' ? 'LEGEND!' : 'CURSED'}
            </h2>
            <div className="bg-slate-900/50 p-12 rounded-3xl border-2 border-amber-500/20 mb-16 text-center backdrop-blur-xl">
              <p className="text-amber-400 font-wizard text-8xl">{renderState.score}</p>
              <p className="text-blue-300 uppercase tracking-[0.7em] text-sm mt-6">Wizarding Rank Achieved</p>
            </div>
            <button onClick={resetGame} className="bg-white text-slate-950 font-wizard text-4xl px-28 py-10 rounded-full transition-all hover:scale-110 active:scale-90 shadow-2xl shadow-white/20">
              Return to Entrance
            </button>
          </div>
        )}

        {showHint && (
          <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-8 backdrop-blur-3xl z-50 animate-in fade-in duration-500">
            <div className="bg-[#f2e2ba] max-w-4xl w-full p-14 rounded shadow-[0_0_100px_rgba(0,0,0,0.9)] border-y-[16px] border-[#d4bc82] overflow-y-auto max-h-[90%] scrollbar-hide">
              <div className="flex justify-between items-center mb-10 border-b-4 border-slate-400 pb-8">
                <h2 className="text-6xl font-wizard text-slate-900">Scroll of SQL Secrets</h2>
                <button onClick={() => setShowHint(false)} className="text-red-900 hover:rotate-90 transition-transform duration-300">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div className="space-y-12 font-serif text-slate-900 text-xl leading-relaxed">
                <section className="bg-white/40 p-8 rounded-2xl border-2 border-slate-300 shadow-inner">
                  <h3 className="text-3xl font-bold mb-6 text-amber-900 font-wizard">The Connection Ritual</h3>
                  <pre className="bg-black/95 p-8 rounded-xl font-mono text-green-400 text-base overflow-x-auto shadow-2xl border-l-8 border-green-500">
                    {TECHNICAL_REFERENCE.connection}
                  </pre>
                </section>
                <section className="bg-white/40 p-8 rounded-2xl border-2 border-slate-300 shadow-inner">
                  <h3 className="text-3xl font-bold mb-6 text-amber-900 font-wizard">Sacred Incantations</h3>
                  <div className="grid grid-cols-2 gap-8">
                    {TECHNICAL_REFERENCE.commands.map((c, i) => (
                      <div key={i} className="flex flex-col p-6 bg-white/60 rounded-xl border-2 border-slate-300 hover:bg-amber-50 transition-colors shadow-sm">
                        <span className="font-bold text-blue-900 font-mono text-2xl mb-2">{c.cmd}</span>
                        <span className="text-base italic text-slate-700">{c.desc}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <div className="mt-16 pt-10 border-t-4 border-slate-400 text-center">
                <button onClick={() => setShowHint(false)} className="bg-amber-950 text-white font-wizard px-16 py-5 rounded-full text-3xl hover:bg-amber-900 transition-all shadow-2xl hover:scale-105 active:scale-95">
                  Roll Up Scroll
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
