type Props = {
  onPlay: () => void;
};

export function MainMenu({ onPlay }: Props) {
  return (
    <div className="animate-fade-in space-y-6 text-center">
      <h1 className="font-heading text-4xl text-ocean-900">Морской Бой</h1>
      <p className="mx-auto max-w-md text-sm text-slate-700">
        Мини-приложение для MAX: играйте в Морской бой против ИИ или онлайн с друзьями.
      </p>
      <button
        type="button"
        onClick={onPlay}
        className="rounded-2xl bg-ocean-700 px-8 py-3 font-semibold text-white shadow-lg transition hover:bg-ocean-900"
      >
        Играть
      </button>
    </div>
  );
}
