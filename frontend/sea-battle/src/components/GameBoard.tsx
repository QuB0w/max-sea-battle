import type { Board, CellState } from '../types/game';

type Props = {
  board: Board;
  title: string;
  onCellClick?: (x: number, y: number) => void;
  disabled?: boolean;
};

const stateClass: Record<CellState, string> = {
  empty: 'bg-cyan-100/80',
  ship: 'bg-ocean-700',
  hit: 'bg-red-500',
  miss: 'bg-slate-300',
};

export function GameBoard({ board, title, onCellClick, disabled }: Props) {
  return (
    <section className="animate-fade-in rounded-2xl border border-cyan-200 bg-white/80 p-3 shadow-lg backdrop-blur-sm">
      <h3 className="mb-2 font-heading text-lg text-ocean-900">{title}</h3>
      <div className="grid grid-cols-10 gap-1">
        {board.map((row, y) =>
          row.map((cell, x) => (
            <button
              key={`${x}-${y}`}
              type="button"
              disabled={disabled || cell === 'hit' || cell === 'miss'}
              onClick={() => onCellClick?.(x, y)}
              className={`aspect-square w-full rounded-md border border-cyan-300 transition ${stateClass[cell]} ${
                disabled || cell === 'hit' || cell === 'miss'
                  ? 'cursor-not-allowed opacity-90'
                  : 'hover:scale-105'
              }`}
            />
          )),
        )}
      </div>
    </section>
  );
}
