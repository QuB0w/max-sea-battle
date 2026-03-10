import { GameBoard } from '../components/GameBoard';
import { EnemyFleetStatus } from '../components/EnemyFleetStatus';
import type { Board } from '../types/game';

type Props = {
  myBoard: Board;
  enemyBoard: Board;
  enemyFleetRemaining: Record<string, number>;
  message: string;
  isMyTurn: boolean;
  canShoot: boolean;
  onShoot: (x: number, y: number) => void;
};

export function BattleScreen({ myBoard, enemyBoard, enemyFleetRemaining, message, isMyTurn, canShoot, onShoot }: Props) {
  const turnClasses = isMyTurn
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : 'border-rose-200 bg-rose-50 text-rose-800';

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl text-ocean-900">BattleScreen</h2>
      <EnemyFleetStatus fleet={enemyFleetRemaining} />

      <div className="space-y-3 lg:hidden">
        <GameBoard board={myBoard} title="Ваше поле" disabled />
        <p className={`rounded-xl border px-3 py-2 text-center text-sm font-semibold shadow ${turnClasses}`}>{message}</p>
        <GameBoard board={enemyBoard} title="Поле противника" onCellClick={onShoot} disabled={!canShoot} />
      </div>

      <div className="hidden gap-3 lg:grid lg:grid-cols-2">
        <GameBoard board={myBoard} title="Ваше поле" disabled />
        <GameBoard board={enemyBoard} title="Поле противника" onCellClick={onShoot} disabled={!canShoot} />
      </div>

      <p className={`hidden rounded-xl border px-3 py-2 text-sm font-semibold shadow lg:block ${turnClasses}`}>{message}</p>
    </div>
  );
}
