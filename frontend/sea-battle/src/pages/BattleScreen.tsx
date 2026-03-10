import { GameBoard } from '../components/GameBoard';
import { EnemyFleetStatus } from '../components/EnemyFleetStatus';
import type { Board } from '../types/game';

type Props = {
  myBoard: Board;
  enemyBoard: Board;
  enemyFleetRemaining: Record<string, number>;
  message: string;
  canShoot: boolean;
  onShoot: (x: number, y: number) => void;
};

export function BattleScreen({ myBoard, enemyBoard, enemyFleetRemaining, message, canShoot, onShoot }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl text-ocean-900">BattleScreen</h2>
      <p className="rounded-xl bg-white/90 px-3 py-2 text-sm text-slate-700 shadow">{message}</p>
      <EnemyFleetStatus fleet={enemyFleetRemaining} />
      <div className="grid gap-3 lg:grid-cols-2">
        <GameBoard board={myBoard} title="Ваше поле" disabled />
        <GameBoard board={enemyBoard} title="Поле противника" onCellClick={onShoot} disabled={!canShoot} />
      </div>
    </div>
  );
}
