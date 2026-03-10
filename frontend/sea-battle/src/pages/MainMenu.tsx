import type { Statistic } from '../types/game';

type Props = {
  onPlay: () => void;
  onLeaderboard: () => void;
  statistics: Statistic | null;
  userName: string;
};

export function MainMenu({ onPlay, onLeaderboard, statistics, userName }: Props) {
  return (
    <div className="animate-fade-in space-y-5">
      <section className="overflow-hidden rounded-3xl border border-cyan-100 bg-[linear-gradient(135deg,#062d57,#0f4e93_60%,#2a9df4)] p-5 text-white shadow-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">MAX mini app</p>
        <h1 className="mt-2 font-heading text-4xl leading-tight">Морской Бой</h1>
        <p className="mt-3 max-w-md text-sm text-cyan-50">
          {userName}, поднимайтесь по званиям, сражайтесь с ИИ или друзьями и закрепляйтесь в таблице лидеров.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-cyan-100 bg-white/90 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Уровень</p>
          <p className="mt-1 font-heading text-3xl text-ocean-900">{statistics?.level ?? 1}</p>
        </div>
        <div className="rounded-2xl border border-cyan-100 bg-white/90 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Опыт</p>
          <p className="mt-1 font-heading text-3xl text-ocean-900">{statistics?.experience ?? 0}</p>
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
