// ============================================================
// MobileControls.tsx — On-screen buttons for touch devices
// Renders below the game canvas on small screens
// ============================================================
'use client';

interface Props {
  onLeftStart: () => void;
  onRightStart: () => void;
  onStop: () => void;
  onLaunch: () => void;
}

/** Shared style for a large directional button */
const dirBtnClass =
  'flex-1 h-14 rounded-xl border-2 border-slate-700 bg-slate-800/70 ' +
  'text-slate-300 text-2xl font-black active:bg-cyan-900/50 active:border-cyan-600 ' +
  'active:text-cyan-300 transition-all duration-75 select-none touch-none ' +
  'flex items-center justify-center';

export default function MobileControls({
  onLeftStart,
  onRightStart,
  onStop,
  onLaunch,
}: Props) {
  return (
    <div className="flex gap-3 px-4 pt-3 pb-4 sm:hidden w-full">
      {/* Left */}
      <button
        className={dirBtnClass}
        onTouchStart={(e) => {
          e.preventDefault();
          onLeftStart();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          onStop();
        }}
        onMouseDown={onLeftStart}
        onMouseUp={onStop}
        onMouseLeave={onStop}
      >
        ◀
      </button>

      {/* Launch / fire */}
      <button
        className="w-16 h-14 rounded-xl border-2 border-cyan-600 bg-cyan-900/40
                   text-cyan-300 text-xl font-black
                   active:bg-cyan-600/50 active:border-cyan-400
                   transition-all duration-75 select-none touch-none
                   flex items-center justify-center"
        onTouchStart={(e) => {
          e.preventDefault();
          onLaunch();
        }}
        onMouseDown={onLaunch}
      >
        ●
      </button>

      {/* Right */}
      <button
        className={dirBtnClass}
        onTouchStart={(e) => {
          e.preventDefault();
          onRightStart();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          onStop();
        }}
        onMouseDown={onRightStart}
        onMouseUp={onStop}
        onMouseLeave={onStop}
      >
        ▶
      </button>
    </div>
  );
}
