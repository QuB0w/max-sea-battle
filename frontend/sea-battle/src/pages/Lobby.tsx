import { useState } from 'react';
import type { OpenRoom } from '../types/game';

type Props = {
  roomId: string;
  isHost: boolean;
  myUserId: string;
  openRooms: OpenRoom[];
  roomsLoading: boolean;
  onCreateRoom: () => void;
  onJoinRandom: () => void;
  onJoinRoom: (roomId: string) => void;
  onRefreshRooms: () => void;
  onBack: () => void;
  onShareInvite: () => void;
};

export function Lobby({
  roomId,
  isHost,
  myUserId,
  openRooms,
  roomsLoading,
  onCreateRoom,
  onJoinRandom,
  onJoinRoom,
  onRefreshRooms,
  onBack,
  onShareInvite,
}: Props) {
  const [joinCode, setJoinCode] = useState('');

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl text-ocean-900">Лобби</h2>
      <p className="text-sm text-slate-700">Создайте комнату или присоединитесь по коду.</p>

      <div className="rounded-xl border border-cyan-200 bg-white/90 p-4 shadow">
        <p className="text-xs uppercase tracking-wide text-slate-500">Код комнаты</p>
        <p className="font-heading text-2xl text-ocean-900">{roomId || '---'}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <button type="button" onClick={onCreateRoom} className="rounded-xl bg-ocean-700 px-4 py-2 text-white">
          Создать комнату
        </button>

        <button
          type="button"
          onClick={onJoinRandom}
          className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 font-semibold text-emerald-700"
        >
          Случайный соперник
        </button>

        <div className="grid grid-cols-[1fr_auto] gap-2 sm:col-span-1">
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

      <section className="rounded-2xl border border-cyan-200 bg-white/90 p-4 shadow">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-heading text-lg text-ocean-900">Открытые комнаты</h3>
          <button
            type="button"
            onClick={onRefreshRooms}
            className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1 text-xs font-semibold text-ocean-700"
          >
            Обновить
          </button>
        </div>

        {roomsLoading && <p className="text-sm text-slate-600">Загружаем список...</p>}

        {!roomsLoading && openRooms.length === 0 && (
          <p className="text-sm text-slate-600">Пока нет свободных комнат. Создайте свою и пригласите друга.</p>
        )}

        {!roomsLoading && openRooms.length > 0 && (
          <div className="space-y-2">
            {openRooms.map((room) => {
              const isOwnRoom = room.hostUserId === myUserId;
              return (
              <button
                type="button"
                key={room.roomId}
                onClick={() => {
                  if (!isOwnRoom) {
                    onJoinRoom(room.roomId);
                  }
                }}
                className={`grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                  isOwnRoom
                    ? 'cursor-not-allowed border-amber-200 bg-amber-50/70'
                    : 'border-cyan-100 bg-cyan-50/60 hover:bg-cyan-100/70'
                }`}
              >
                <span>
                  <span className="block text-xs uppercase tracking-wide text-slate-500">{room.roomId}</span>
                  <span className="block text-sm font-semibold text-ocean-900">
                    Имя: {room.hostName}
                    {isOwnRoom ? ' (ваша комната)' : ''}
                  </span>
                  <span className="block text-xs text-slate-600">Уровень: {room.hostLevel ?? 1}</span>
                </span>
                <span className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-ocean-700">
                  {isOwnRoom ? 'Недоступно' : 'Войти'}
                </span>
              </button>
              );
            })}
          </div>
        )}
      </section>

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
