import { useState } from 'react';

type Props = {
  roomId: string;
  isHost: boolean;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
  onBack: () => void;
  onShareInvite: () => void;
};

export function Lobby({ roomId, isHost, onCreateRoom, onJoinRoom, onBack, onShareInvite }: Props) {
  const [joinCode, setJoinCode] = useState('');

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

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            placeholder="КОД КОМНАТЫ"
            className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm uppercase tracking-wide text-slate-800"
          />
          <button
            type="button"
            onClick={() => {
              if (!joinCode.trim()) {
                return;
              }

              onJoinRoom(joinCode.trim().toUpperCase());
            }}
            className="rounded-xl border border-ocean-700 px-4 py-2 text-ocean-700"
          >
            Войти
          </button>
        </div>
      </div>

      {roomId && (
        <button type="button" onClick={onShareInvite} className="w-full rounded-xl border border-cyan-300 px-4 py-2">
          Поделиться приглашением
        </button>
      )}

      <p className="text-xs text-slate-500">Роль: {isHost ? 'создатель комнаты' : 'участник'}</p>

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
