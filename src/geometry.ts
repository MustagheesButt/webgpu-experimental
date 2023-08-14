
export class QuadGeometry {
  public vertices: number[]
  public indices: number[]

  constructor() {
    const x = 100
    const y = 100
    const w = 400
    const h = 400

    this.vertices = [
      // x y         u v      r g b
      x, y,          0, 0,    1.0, 1.0, 1.0, // top left
      x + w, y,      1, 0,    1.0, 1.0, 1.0, // top right
      x + w, y + h,  1, 1,    1.0, 1.0, 1.0, // bottom right
      x, y + h,      0, 1,    1.0, 1.0, 1.0, // bottom left
    ]

    this.indices = [
      0, 1, 2,
      2, 3, 0
    ]
  }
}