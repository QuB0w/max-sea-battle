import type { Statistic } from '../types/game';

type Props = {
  onPlay: () => void;
  onLeaderboard: () => void;
  statistics: Statistic | null;
  userName: string;
  playerRank: number | null;
  isRankLoading: boolean;
};

export function MainMenu({ onPlay, onLeaderboard, statistics, userName, playerRank, isRankLoading }: Props) {
  const experience = statistics?.experience ?? 0;
  const level = statistics?.level ?? 1;
  const progressInLevel = experience % 100;
  const progressPercent = Math.max(0, Math.min(100, progressInLevel));
  const toNextLevel = 100 - progressInLevel;
  const rankLabel = isRankLoading
    ? 'Определяем вашу позицию в рейтинге...'
    : playerRank !== null
      ? `Вы входите в топ-${playerRank}`
      : 'Вы пока вне топ-100';

  return (
    <div className="animate-fade-in space-y-5">
      <section className="overflow-hidden rounded-3xl border border-cyan-100 bg-[linear-gradient(135deg,#062d57,#0f4e93_60%,#2a9df4)] p-5 text-white shadow-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">LUMINARY</p>
        <h1 className="mt-2 font-heading text-4xl leading-tight">Морской Бой</h1>
        <p className="mt-3 max-w-md text-sm text-cyan-50">
          {userName}, поднимайтесь по званиям, сражайтесь с ИИ или друзьями и закрепляйтесь в таблице лидеров.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 shadow-sm sm:col-span-3">
          <p className="text-xs uppercase tracking-wide text-amber-700">Рейтинг игрока</p>
          <p className="mt-1 font-heading text-2xl text-amber-900">{rankLabel}</p>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-white/90 p-4 shadow-sm sm:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Уровень</p>
              <p className="mt-1 font-heading text-3xl text-ocean-900">{level}</p>
            </div>
            <p className="text-right text-xs font-semibold text-slate-600">До следующего уровня {toNextLevel} опыта</p>
          </div>

          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-cyan-100">
            <div className="h-full rounded-full bg-ocean-700 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>

          <p className="mt-2 text-xs text-slate-600">{progressInLevel} / 100 XP</p>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-white/90 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Процент побед</p>
          <p className="mt-1 font-heading text-3xl text-ocean-900">
            {statistics && statistics.gamesPlayed > 0
              ? Math.round((statistics.wins / statistics.gamesPlayed) * 100)
              : 0}
            %
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-white/90 p-4 shadow-sm sm:col-span-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Сводка</p>
          <p className="mt-1 text-sm text-slate-700">
            Побед: <span className="font-semibold text-ocean-900">{statistics?.wins ?? 0}</span> · Поражений:{' '}
            <span className="font-semibold text-ocean-900">{statistics?.losses ?? 0}</span> · Игр:{' '}
            <span className="font-semibold text-ocean-900">{statistics?.gamesPlayed ?? 0}</span>
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onPlay}
          className="rounded-2xl bg-ocean-700 px-8 py-3 font-semibold text-white shadow-lg transition hover:bg-ocean-900"
        >
          Играть
        </button>
        <button
          type="button"
          onClick={onLeaderboard}
          className="rounded-2xl border border-cyan-300 bg-cyan-50 px-8 py-3 font-semibold text-ocean-700 shadow transition hover:bg-cyan-100"
        >
          Таблица лидеров
        </button>
      </section>
    </div>
  );
}
