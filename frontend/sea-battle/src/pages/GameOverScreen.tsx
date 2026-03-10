import type { Statistic } from '../types/game';

type Props = {
  winner: string;
  outcome: 'win' | 'lose';
  statistics: Statistic | null;
  onRestart: () => void;
  onMainMenu: () => void;
};

export function GameOverScreen({ winner, outcome, statistics, onRestart, onMainMenu }: Props) {
  const isWin = outcome === 'win';

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl text-ocean-900">Игра завершена</h2>
      <div
        className={`rounded-2xl border p-5 shadow-lg ${
          isWin ? 'border-emerald-200 bg-emerald-50/90' : 'border-rose-200 bg-rose-50/90'
        }`}
      >
        <p className="text-sm text-slate-600">Результат</p>
        <p className={`font-heading text-2xl ${isWin ? 'text-emerald-700' : 'text-rose-700'}`}>
          {isWin ? 'Победа' : 'Поражение'}
        </p>
        <p className="mt-1 text-sm text-slate-700">Победитель: {winner}</p>
      </div>

      <div className="rounded-xl border border-cyan-200 bg-white/90 p-4 shadow">
        <p className="mb-2 text-sm text-slate-600">Статистика</p>
        <p>Побед: {statistics?.wins ?? 0}</p>
        <p>Поражений: {statistics?.losses ?? 0}</p>
        <p>Игр: {statistics?.gamesPlayed ?? 0}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button type="button" onClick={onRestart} className="rounded-xl bg-ocean-700 px-4 py-2 text-white">
          Сыграть еще раз
        </button>
        <button type="button" onClick={onMainMenu} className="rounded-xl border border-ocean-700 px-4 py-2 text-ocean-700">
          В главное меню
        </button>
      </div>
    </div>
  );
}
