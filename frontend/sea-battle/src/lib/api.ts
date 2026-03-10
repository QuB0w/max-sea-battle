import type { AiDifficulty, Ship, Statistic } from '../types/game';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5035';

export async function startAiGame(userId: string, name: string, difficulty: AiDifficulty) {
  const response = await fetch(`${API_URL}/api/game/ai/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, name, difficulty }),
  });

  if (!response.ok) {
    throw new Error('Cannot start AI game');
  }

  return response.json();
}

export async function playerShootAi(sessionId: string, x: number, y: number) {
  const response = await fetch(`${API_URL}/api/game/ai/player-shoot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, x, y }),
  });

  if (!response.ok) {
    throw new Error('Cannot process AI shot');
  }

  return response.json();
}

export async function getHistory(userId: string) {
  const response = await fetch(`${API_URL}/api/game/history/${userId}`);
  if (!response.ok) {
    throw new Error('Cannot load history');
  }

  return response.json();
}

export async function getStatistics(userId: string, name: string): Promise<Statistic> {
  const response = await fetch(
    `${API_URL}/api/game/statistics/${userId}?name=${encodeURIComponent(name)}`,
  );

  if (!response.ok) {
    throw new Error('Cannot load statistics');
  }

  return response.json();
}

export async function getOnlineSnapshot(roomId: string, userId: string) {
  const response = await fetch(
    `${API_URL}/api/game/online/snapshot?roomId=${encodeURIComponent(roomId)}&userId=${encodeURIComponent(userId)}`,
  );

  if (!response.ok) {
    throw new Error('Cannot load online snapshot');
  }

  return response.json();
}

export type PlaceShipsPayload = {
  roomId: string;
  userId: string;
  ships: Ship[];
};

export { API_URL };
