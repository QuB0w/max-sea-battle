import type { GameMode } from '../types/game';

type Props = {
  onSelect: (mode: GameMode) => void;
  onBack: () => void;
};

export function GameModeSelection({ onSelect, onBack }: Props) {
  return (
    <div className="animate-fade-in space-y-4">
      <h2 className="font-heading text-2xl text-ocean-900">Выбор режима</h2>
      <button
        type="button"
        onClick={() => onSelect('ai')}
        className="w-full rounded-2xl border border-cyan-200 bg-white/90 p-4 text-left shadow"
      >
        Против ИИ
      </button>
      <button
        type="button"
        onClick={() => onSelect('online')}
        className="w-full rounded-2xl border border-cyan-200 bg-white/90 p-4 text-left shadow"
      >
        Онлайн с другом
      </button>
      <button type="button" onClick={onBack} className="text-sm text-ocean-700 underline">
        Назад
      </button>
    </div>
  );
}
