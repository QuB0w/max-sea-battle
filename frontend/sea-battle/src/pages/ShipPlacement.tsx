import { boardFromShips } from '../lib/board';
import type { Ship } from '../types/game';
import { GameBoard } from '../components/GameBoard';

type Props = {
  ships: Ship[];
  onRandomize: () => void;
  onReady: () => void;
  onBack: () => void;
};

export function ShipPlacement({ ships, onRandomize, onReady, onBack }: Props) {
  const board = boardFromShips(ships);

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl text-ocean-900">Расстановка кораблей</h2>
      <p className="text-sm text-slate-700">Флот: 1x4, 2x3, 3x2, 4x1</p>
      <GameBoard board={board} title="Ваше поле" disabled />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onRandomize}
          className="rounded-xl border border-ocean-700 px-4 py-2 text-ocean-700"
        >
          Случайная расстановка
        </button>
        <button
          type="button"
          onClick={onReady}
          className="rounded-xl bg-ocean-700 px-4 py-2 font-semibold text-white"
        >
          Готов к бою
        </button>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="rounded-lg border border-ocean-300 bg-ocean-50 px-3 py-1 text-sm font-semibold text-ocean-700"
      >
        Назад
      </button>
    </div>
  );
}
