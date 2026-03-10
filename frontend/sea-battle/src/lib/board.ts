import type { Board, CellState, Ship } from '../types/game';

export const BOARD_SIZE = 10;
export const FLEET: number[] = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => 'empty' as CellState),
  );
}

export function generateRandomFleet(): Ship[] {
  const ships: Ship[] = [];
  const occupied = new Set<string>();

  for (const length of FLEET) {
    let placed = false;
    while (!placed) {
      const isHorizontal = Math.random() > 0.5;
      const x = Math.floor(Math.random() * BOARD_SIZE);
      const y = Math.floor(Math.random() * BOARD_SIZE);
      const ship: Ship = { x, y, length, isHorizontal };
      const cells = getShipCells(ship);

      if (!cells) {
        continue;
      }

      const touches = cells.some(([cx, cy]) => {
        for (let dx = -1; dx <= 1; dx += 1) {
          for (let dy = -1; dy <= 1; dy += 1) {
            const key = `${cx + dx}:${cy + dy}`;
            if (occupied.has(key)) {
              return true;
            }
          }
        }

        return false;
      });

      if (touches) {
        continue;
      }

      for (const [cx, cy] of cells) {
        occupied.add(`${cx}:${cy}`);
      }

      ships.push(ship);
      placed = true;
    }
  }

  return ships;
}

export function boardFromShips(ships: Ship[]): Board {
  const board = createEmptyBoard();
  ships.forEach((ship) => {
    const cells = getShipCells(ship);
    if (!cells) {
      return;
    }

    cells.forEach(([x, y]) => {
      board[y][x] = 'ship';
    });
  });

  return board;
}

function getShipCells(ship: Ship): [number, number][] | null {
  const cells: [number, number][] = [];
  for (let i = 0; i < ship.length; i += 1) {
    const x = ship.isHorizontal ? ship.x + i : ship.x;
    const y = ship.isHorizontal ? ship.y : ship.y + i;
    if (x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE) {
      return null;
    }

    cells.push([x, y]);
  }

  return cells;
}
