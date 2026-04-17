import type { GroundCell, ObjectCell } from './types';

export class Grid {
  private readonly _ground: GroundCell[][];
  private readonly _objects: (ObjectCell | null)[][];

  constructor(
    public readonly width: number,
    public readonly height: number,
    ground: GroundCell[][],
    objects: (ObjectCell | null)[][],
  ) {
    this._ground = ground;
    this._objects = objects;
  }

  static createEmpty(width: number, height: number): Grid {
    const ground: GroundCell[][] = [];
    const objects: (ObjectCell | null)[][] = [];
    for (let y = 0; y < height; y++) {
      const groundRow: GroundCell[] = [];
      const objectRow: (ObjectCell | null)[] = [];
      for (let x = 0; x < width; x++) {
        groundRow.push({ type: 'floor' });
        objectRow.push(null);
      }
      ground.push(groundRow);
      objects.push(objectRow);
    }
    return new Grid(width, height, ground, objects);
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  getGround(x: number, y: number): GroundCell {
    return this._ground[y][x];
  }

  setGround(x: number, y: number, cell: GroundCell): void {
    this._ground[y][x] = cell;
  }

  getObject(x: number, y: number): ObjectCell | null {
    return this._objects[y][x];
  }

  setObject(x: number, y: number, cell: ObjectCell | null): void {
    this._objects[y][x] = cell;
  }

  clone(): Grid {
    const ground = this._ground.map(row => row.map(cell => ({ ...cell })));
    const objects = this._objects.map(row =>
      row.map(cell => (cell === null ? null : { ...cell } as ObjectCell)),
    );
    return new Grid(this.width, this.height, ground, objects);
  }
}
