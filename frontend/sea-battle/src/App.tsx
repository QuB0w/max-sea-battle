import { useEffect, useMemo, useState } from 'react';
import { MainMenu } from './pages/MainMenu';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { GameModeSelection } from './pages/GameModeSelection';
import { ShipPlacement } from './pages/ShipPlacement';
import { Lobby } from './pages/Lobby';
import { BattleScreen } from './pages/BattleScreen';
import { GameOverScreen } from './pages/GameOverScreen';
import { createEmptyBoard, generateRandomFleet } from './lib/board';
import type { AiDifficulty, AppScreen, Board, GameMode, LeaderboardEntry, Ship, Statistic, UserProfile } from './types/game';
import { getMaxUser, initMaxBridge, openInviteLink, showGameOverAd } from './lib/maxBridge';
import { getHubConnection } from './lib/signalr';
import { getHistory, getLeaderboard, getOnlineSnapshot, getStatistics, playerShootAi, startAiGame } from './lib/api';

function App() {
  const [screen, setScreen] = useState<AppScreen>('mainMenu');
  const [mode, setMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<AiDifficulty>('Normal');
  const [user, setUser] = useState<UserProfile>({ id: 'local', name: 'Player' });

  const [ships, setShips] = useState<Ship[]>(generateRandomFleet());
  const [myBoard, setMyBoard] = useState<Board>(createEmptyBoard());
  const [enemyBoard, setEnemyBoard] = useState<Board>(createEmptyBoard());
  const [message, setMessage] = useState('Подготовка к бою');
  const [winner, setWinner] = useState('');
  const [outcome, setOutcome] = useState<'win' | 'lose'>('lose');
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [currentTurnUserId, setCurrentTurnUserId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [statistics, setStatistics] = useState<Statistic | null>(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [isShooting, setIsShooting] = useState(false);
  const [lockedEnemyShots, setLockedEnemyShots] = useState<Set<string>>(new Set());
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);
  const [enemyFleetRemaining, setEnemyFleetRemaining] = useState<Record<string, number>>({
    '1': 4,
    '2': 3,
    '3': 2,
    '4': 1,
  });

  const inviteLink = useMemo(() => {
    const botName = import.meta.env.VITE_MAX_BOT_NAME ?? 'MySeaBattleBot';
    return `https://max.ru/${botName}?startapp=room_${roomId}`;
  }, [roomId]);

  const enemyBoardForRender = useMemo(() => {
    const board = enemyBoard.map((row) => [...row]);
    lockedEnemyShots.forEach((key) => {
      const [xs, ys] = key.split(':');
      const x = Number(xs);
      const y = Number(ys);
      if (board[y]?.[x] === 'empty') {
        board[y][x] = 'miss';
      }
    });
    return board;
  }, [enemyBoard, lockedEnemyShots]);

  useEffect(() => {
    initMaxBridge();
    setUser(getMaxUser());
  }, []);

  useEffect(() => {
    getStatistics(user.id, user.name).then(setStatistics).catch(() => undefined);
    getHistory(user.id).catch(() => undefined);
  }, [user.id, user.name]);

  useEffect(() => {
    if (screen === 'leaderboard') {
      loadLeaderboard();
    }
  }, [screen]);

  useEffect(() => {
    let active = true;

    getHubConnection()
      .then((connection) => {
        connection.on('RoomCreated', (payload: { roomId: string }) => {
          if (!active) {
            return;
          }

          setRoomId(payload.roomId);
          setIsHost(true);
          setMessage(`Комната ${payload.roomId} создана`);
        });

        connection.on('RoomJoined', (payload: { roomId: string }) => {
          if (!active) {
            return;
          }

          setRoomId(payload.roomId);
          setMessage(`Игрок подключился в комнату ${payload.roomId}`);
          setScreen('shipPlacement');
        });

        connection.on('ShipsPlaced', async (payload: { phase: string; currentTurnUserId: string }) => {
          if (!active) {
            return;
          }

          if (payload.phase === 'Battle') {
            setIsWaitingForOpponent(false);
            setCurrentTurnUserId(payload.currentTurnUserId);

            try {
              const snapshot = await getOnlineSnapshot(roomId, user.id);
              setMyBoard(snapshot.myBoard);
              setEnemyBoard(snapshot.enemyBoard);
              setEnemyFleetRemaining(snapshot.enemyFleetRemaining ?? { '1': 4, '2': 3, '3': 2, '4': 1 });
            } catch {
              // If snapshot failed, battle still starts and state will recover from next shot event.
            }

            setScreen('battleScreen');
            setMessage(payload.currentTurnUserId === user.id ? 'Ваш ход' : 'Ход соперника');
          }
        });

        connection.on(
          'ShotProcessed',
          (payload: {
            userId: string;
            x: number;
            y: number;
            result: {
              isValid: boolean;
              isHit: boolean;
              isGameOver: boolean;
              winnerUserId?: string;
              message: string;
              nextTurnUserId: string;
              shooterBoardPrivate?: Board;
              shooterBoardPublic?: Board;
              targetBoardPrivate?: Board;
              targetBoardPublic?: Board;
            };
          }) => {
            if (!active) {
              return;
            }

            const shotKey = `${payload.x}:${payload.y}`;
            if (payload.userId === user.id) {
              setLockedEnemyShots((prev) => {
                const next = new Set(prev);
                next.delete(shotKey);
                return next;
              });

              if (payload.result.targetBoardPublic) {
                setEnemyBoard(payload.result.targetBoardPublic);
              }

              if (payload.result.shooterBoardPrivate) {
                setMyBoard(payload.result.shooterBoardPrivate);
              }
            } else {
              if (payload.result.targetBoardPrivate) {
                setMyBoard(payload.result.targetBoardPrivate);
              }

              if (payload.result.shooterBoardPublic) {
                setEnemyBoard(payload.result.shooterBoardPublic);
              }
            }

            if (!payload.result.isValid) {
              setMessage(payload.result.message || 'Некорректный ход');
              if (payload.result.nextTurnUserId) {
                setCurrentTurnUserId(payload.result.nextTurnUserId);
              }
              return;
            }

            if (payload.result.nextTurnUserId) {
              setCurrentTurnUserId(payload.result.nextTurnUserId);
            }
            setMessage(payload.result.nextTurnUserId === user.id ? 'Ваш ход' : 'Ход соперника');

            if (payload.result.isGameOver) {
              const winnerUserId = payload.result.winnerUserId || payload.userId;
              handleGameOverByWinnerUserId(winnerUserId);
            }
          },
        );

        connection.on('GameFinished', (payload: { winnerUserId: string }) => {
          if (!active) {
            return;
          }

          handleGameOverByWinnerUserId(payload.winnerUserId);
        });
      })
      .catch(() => {
        setMessage('SignalR недоступен. Проверьте backend.');
      });

    return () => {
      active = false;
    };
  }, [roomId, user.id, user.name]);

  async function handleModeSelection(selectedMode: GameMode) {
    setMode(selectedMode);
    setIsWaitingForOpponent(false);
    if (selectedMode === 'online') {
      setScreen('lobby');
      return;
    }

    setScreen('shipPlacement');
  }

  async function startBattle() {
    setMyBoard(createEmptyBoard());
    setEnemyBoard(createEmptyBoard());

    try {
      if (mode === 'ai') {
        const response = await startAiGame(user.id, user.name, difficulty);
        setSessionId(response.sessionId);
        setMyBoard(response.playerBoard);
        setEnemyBoard(response.enemyBoard);
        setEnemyFleetRemaining(response.enemyFleetRemaining ?? { '1': 4, '2': 3, '3': 2, '4': 1 });
        setScreen('battleScreen');
        setMessage('Ваш ход');
        return;
      }

      const connection = await getHubConnection();
      await connection.invoke('PlaceShips', {
        roomId,
        userId: user.id,
        ships,
      });
      setIsWaitingForOpponent(true);
      setMessage('Ожидаем второго игрока и старт боя');
    } catch (error) {
      setIsWaitingForOpponent(false);
      const messageText = error instanceof Error ? error.message : 'Не удалось начать бой';
      setMessage(messageText);
    }
  }

  async function createRoom() {
    const connection = await getHubConnection();
    await connection.invoke('CreateRoom', { userId: user.id, name: user.name });
  }

  async function joinRoom(nextRoomId: string) {
    const connection = await getHubConnection();
    await connection.invoke('JoinRoom', { roomId: nextRoomId, userId: user.id, name: user.name });
    setRoomId(nextRoomId);
    setIsHost(false);
    setScreen('shipPlacement');
  }

  async function shoot(x: number, y: number) {
    if (screen !== 'battleScreen') {
      return;
    }

    if (isShooting) {
      return;
    }

    if (mode === 'online' && currentTurnUserId !== user.id) {
      setMessage('Сейчас ход соперника');
      return;
    }

    if (enemyBoard[y]?.[x] === 'hit' || enemyBoard[y]?.[x] === 'miss') {
      setMessage('Вы уже стреляли в эту клетку');
      return;
    }

    const shotKey = `${x}:${y}`;
    if (lockedEnemyShots.has(shotKey)) {
      setMessage('Вы уже стреляли в эту клетку');
      return;
    }

    setLockedEnemyShots((prev) => {
      const next = new Set(prev);
      next.add(shotKey);
      return next;
    });

    try {
      if (mode === 'ai') {
        setIsShooting(true);

        // Optimistic lock of selected cell to prevent repeated taps before response.
        setEnemyBoard((prev) => {
          const copy = prev.map((row) => [...row]);
          if (copy[y]?.[x] === 'empty') {
            copy[y][x] = 'miss';
          }
          return copy;
        });

        const response = await playerShootAi(sessionId, x, y);
        setEnemyBoard(response.enemyBoard);
        setEnemyFleetRemaining(response.enemyFleetRemaining ?? enemyFleetRemaining);
        setLockedEnemyShots((prev) => {
          const next = new Set(prev);
          next.delete(shotKey);
          return next;
        });
        setMyBoard(response.playerBoard);
        if (response.gameOver) {
          await handleGameOverByWinnerUserId(response.winnerUserId);
        } else {
          if (response.playerKeepsTurn) {
            setMessage('Попадание! Ваш ход продолжается');
          } else {
            setMessage(response.playerShot.hit ? 'Попадание!' : 'Промах. Ход ИИ завершен, снова ваш ход');
          }
        }

        return;
      }

      const connection = await getHubConnection();
      await connection.invoke('Shoot', { roomId, userId: user.id, x, y });
    } catch (error) {
      setLockedEnemyShots((prev) => {
        const next = new Set(prev);
        next.delete(shotKey);
        return next;
      });
      const messageText = error instanceof Error ? error.message : 'Не удалось выполнить выстрел';
      setMessage(messageText);
    } finally {
      if (mode === 'ai') {
        setIsShooting(false);
      }
    }
  }

  async function handleGameOverByWinnerUserId(winnerUserId: string) {
    const isWinner = winnerUserId === user.id;
    const winnerName = winnerUserId === 'AI' ? 'AI' : isWinner ? user.name : 'Соперник';

    setWinner(winnerName);
    setOutcome(isWinner ? 'win' : 'lose');
    setScreen('gameOver');
    setStatistics(await getStatistics(user.id, user.name));
    await showGameOverAd();
  }

  async function exitWithConfirmation() {
    const ok = window.confirm('Вы точно хотите выйти? Если игра онлайн, это будет засчитано как поражение.');
    if (!ok) {
      return;
    }

    if (mode === 'online' && roomId && screen !== 'mainMenu' && screen !== 'gameOver') {
      try {
        const connection = await getHubConnection();
        await connection.invoke('Surrender', roomId, user.id);
      } catch {
        // fallback to local reset if server is unavailable
      }
    }

    setScreen('mainMenu');
    setRoomId('');
    setCurrentTurnUserId('');
    setIsWaitingForOpponent(false);
    setLockedEnemyShots(new Set());
    setMessage('Подготовка к бою');
  }

  function shareInvite() {
    openInviteLink(inviteLink);
  }

  async function loadLeaderboard() {
    setIsLeaderboardLoading(true);
    try {
      const entries = await getLeaderboard(30);
      setLeaderboardEntries(entries);
    } catch {
      setMessage('Не удалось загрузить таблицу лидеров');
    } finally {
      setIsLeaderboardLoading(false);
    }
  }

  function restart() {
    setShips(generateRandomFleet());
    setMyBoard(createEmptyBoard());
    setEnemyBoard(createEmptyBoard());
    setWinner('');
    setOutcome('lose');
    setCurrentTurnUserId('');
    setSessionId('');
    setLockedEnemyShots(new Set());
    setIsWaitingForOpponent(false);
    setEnemyFleetRemaining({ '1': 4, '2': 3, '3': 2, '4': 1 });
    setScreen('gameModeSelection');
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#d9f0ff,#eef9ff_35%,#f8fbff)] px-4 py-6 font-body text-slate-900">
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-white/70 bg-white/60 p-4 shadow-2xl backdrop-blur-md sm:p-6">
        <header className="mb-6 flex justify-end">
          {screen !== 'mainMenu' && (
            <button
              type="button"
              onClick={exitWithConfirmation}
              className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
            >
              Выйти
            </button>
          )}
        </header>

        {screen === 'mainMenu' && (
          <MainMenu
            onPlay={() => setScreen('gameModeSelection')}
            onLeaderboard={() => setScreen('leaderboard')}
            statistics={statistics}
            userName={user.name}
          />
        )}

        {screen === 'leaderboard' && (
          <LeaderboardPage
            entries={leaderboardEntries}
            loading={isLeaderboardLoading}
            onRefresh={loadLeaderboard}
            onBack={() => setScreen('mainMenu')}
          />
        )}

        {screen === 'gameModeSelection' && (
          <div className="space-y-3">
            <GameModeSelection onSelect={handleModeSelection} onBack={() => setScreen('mainMenu')} />
            <label className="block text-sm text-slate-700">
              Сложность ИИ
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as AiDifficulty)}
                className="mt-1 w-full rounded-lg border border-cyan-200 bg-white p-2"
              >
                <option value="Easy">Easy</option>
                <option value="Normal">Normal</option>
              </select>
            </label>
          </div>
        )}

        {screen === 'lobby' && (
          <Lobby
            roomId={roomId}
            isHost={isHost}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            onBack={() => setScreen('gameModeSelection')}
            onShareInvite={shareInvite}
          />
        )}

        {screen === 'shipPlacement' && (
          <div className="relative">
            <ShipPlacement
              ships={ships}
              onRandomize={() => setShips(generateRandomFleet())}
              onReady={startBattle}
              onBack={() => {
                setIsWaitingForOpponent(false);
                setScreen(mode === 'online' ? 'lobby' : 'gameModeSelection');
              }}
            />

            {mode === 'online' && isWaitingForOpponent && (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-slate-900/60 p-4 backdrop-blur-sm">
                <div className="w-full max-w-sm rounded-2xl border border-cyan-100 bg-white p-5 text-center shadow-2xl">
                  <h3 className="font-heading text-xl text-ocean-900">Ожидание второго игрока</h3>
                  <p className="mt-2 text-sm text-slate-700">
                    Вы готовы к бою. Ждем, когда соперник расставит корабли и нажмет "Готов к бою".
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {screen === 'battleScreen' && (
          <BattleScreen
            myBoard={myBoard}
            enemyBoard={enemyBoardForRender}
            enemyFleetRemaining={enemyFleetRemaining}
            message={message}
            canShoot={mode === 'online' ? currentTurnUserId === user.id : !isShooting}
            onShoot={shoot}
          />
        )}

        {screen === 'gameOver' && (
          <GameOverScreen
            winner={winner}
            outcome={outcome}
            statistics={statistics}
            onRestart={restart}
            onMainMenu={() => setScreen('mainMenu')}
          />
        )}
      </div>
    </main>
  );
}

export default App;
