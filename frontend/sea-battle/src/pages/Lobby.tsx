type Props = {
  roomId: string;
  isHost: boolean;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
  onBack: () => void;
  onShareInvite: () => void;
};

export function Lobby({ roomId, isHost, onCreateRoom, onJoinRoom, onBack, onShareInvite }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl text-ocean-900">Лобби</h2>
      <p className="text-sm text-slate-700">Создайте комнату или присоединитесь по коду.</p>

      <div className="rounded-xl border border-cyan-200 bg-white/90 p-4 shadow">
        <p className="text-xs uppercase tracking-wide text-slate-500">Код комнаты</p>
        <p className="font-heading text-2xl text-ocean-900">{roomId || '---'}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={onCreateRoom} className="rounded-xl bg-ocean-700 px-4 py-2 text-white">
          Создать комнату
        </button>
        <button
          type="button"
          onClick={() => {
            const code = window.prompt('Введите код комнаты');
            if (code) {
              onJoinRoom(code.toUpperCase());
            }
          }}
          className="rounded-xl border border-ocean-700 px-4 py-2 text-ocean-700"
        >
          Войти в комнату
        </button>
      </div>

      {roomId && (
        <button type="button" onClick={onShareInvite} className="w-full rounded-xl border border-cyan-300 px-4 py-2">
          Поделиться приглашением
        </button>
      )}

      <p className="text-xs text-slate-500">Роль: {isHost ? 'создатель комнаты' : 'участник'}</p>

      <button type="button" onClick={onBack} className="text-sm text-ocean-700 underline">
        Назад
      </button>
    </div>
  );
}
