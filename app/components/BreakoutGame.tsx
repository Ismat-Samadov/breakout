// ============================================================
// BreakoutGame.tsx — Root game component
// Composes canvas, HUD, overlays, and mobile controls
// ============================================================
'use client';

import { AnimatePresence } from 'framer-motion';
import { useBreakoutGame } from '@/hooks/useBreakoutGame';
import { GAME_WIDTH, GAME_HEIGHT } from '@/lib/constants';
import GameMenu from './GameMenu';
import GameHUD from './GameHUD';
import GameOverlay from './GameOverlay';
import MobileControls from './MobileControls';

export default function BreakoutGame() {
  const {
    canvasRef,
    gameState,
    score,
    lives,
    level,
    highScore,
    soundEnabled,
    activePowerUps,
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    nextLevel,
    toggleSound,
    launchBall,
    mobileLeft,
    mobileRight,
    mobileStop,
  } = useBreakoutGame();

  const showOverlay =
    gameState === 'paused' ||
    gameState === 'levelComplete' ||
    gameState === 'gameOver' ||
    gameState === 'victory';

  return (
    /*
     * Outer wrapper: fills viewport, dark background, centres the game panel.
     * We use min-h-dvh (dynamic viewport height) to avoid the mobile browser
     * chrome eating into the layout.
     */
    <div className="flex flex-col items-center justify-center min-h-dvh bg-[#02020a] px-0">
      {/*
       * Game panel wrapper.
       * – max-w keeps it from exceeding the natural game size.
       * – aspect-ratio locks the panel to 4:3 so the canvas always fills it.
       * – The canvas is 100% of this container; game coords are mapped via CSS scaling.
       */}
      <div
        className="relative w-full"
        style={{
          maxWidth: GAME_WIDTH,
          /* Maintain 4:3 aspect ratio via padding-top trick */
          paddingTop: `min(${(GAME_HEIGHT / GAME_WIDTH) * 100}%, ${GAME_HEIGHT}px)`,
        }}
      >
        {/* Inner positioned container that fills the padded area */}
        <div className="absolute inset-0">
          {/* Canvas — game is drawn here */}
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            aria-label="Breakout game canvas"
          />

          {/* HUD overlay (only while playing or paused) */}
          {(gameState === 'playing' || gameState === 'paused') && (
            <GameHUD
              score={score}
              lives={lives}
              level={level}
              highScore={highScore}
              soundEnabled={soundEnabled}
              activePowerUps={activePowerUps}
              onToggleSound={toggleSound}
              onPause={pauseGame}
            />
          )}

          {/* Animated overlays: pause / level-clear / game-over / victory */}
          <AnimatePresence>
            {showOverlay && (
              <GameOverlay
                state={gameState}
                score={score}
                highScore={highScore}
                level={level}
                onResume={resumeGame}
                onNextLevel={nextLevel}
                onRestart={restartGame}
              />
            )}
          </AnimatePresence>

          {/* Main menu (rendered inside the canvas panel) */}
          <AnimatePresence>
            {gameState === 'menu' && (
              <GameMenu onStart={startGame} highScore={highScore} />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile on-screen controls — hidden on sm+ via Tailwind */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <MobileControls
          onLeftStart={mobileLeft}
          onRightStart={mobileRight}
          onStop={mobileStop}
          onLaunch={launchBall}
        />
      )}

      {/* Keyboard hint — desktop only, disappears once game starts */}
      {gameState === 'menu' && (
        <p className="hidden sm:block mt-3 text-[11px] text-slate-700 tracking-widest uppercase">
          Arrow Keys · Mouse · Space to launch · P to pause
        </p>
      )}
    </div>
  );
}
