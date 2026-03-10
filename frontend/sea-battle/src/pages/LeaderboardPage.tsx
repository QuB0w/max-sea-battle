import type { LeaderboardEntry } from '../types/game';

type Props = {
  entries: LeaderboardEntry[];
  loading: boolean;
  onBack: () => void;
  onRefresh: () => void;
};

export function LeaderboardPage({ entries, loading, onBack, onRefresh }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl text-ocean-900">Таблица лидеров</h2>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1 text-sm font-semibold text-ocean-700"
        >
          Обновить
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-cyan-200 bg-white/90 shadow">
        <div className="grid grid-cols-[44px_1fr_72px_72px] gap-2 border-b border-cyan-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>#</span>
          <span>Игрок</span>
          <span>Уровень</span>
          <span>XP</span>
        </div>

        {loading && <p className="px-3 py-4 text-sm text-slate-600">Загрузка...</p>}

        {!loading && entries.length === 0 && <p className="px-3 py-4 text-sm text-slate-600">Пока нет данных.</p>}

        {!loading &&
          entries.map((entry, index) => (
            <div
              key={entry.userId + index}
              className="grid grid-cols-[44px_1fr_72px_72px] gap-2 border-b border-cyan-50 px-3 py-2 text-sm last:border-b-0"
            >
              <span className="font-semibold text-ocean-700">{index + 1}</span>
              <span className="truncate text-slate-800">{entry.name}</span>
              <span className="font-semibold text-ocean-900">{entry.level}</span>
              <span className="text-slate-700">{entry.experience}</span>
            </div>
          ))}
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
