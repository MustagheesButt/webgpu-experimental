
export class QuadGeometry {
  public positions: number[]
  public colors: number[]
  public texCoords: number[]
  public indices: number[]

  constructor() {
    this.positions = [
      -0.5, -0.5, // x y
      0.5, -0.5,
      -0.5, 0.5,
      0.5, 0.5,
    ]

    this.colors = [
      1.0, 1.0, 1.0, // r g b
      1.0, 1.0, 1.0,
      1.0, 1.0, 1.0,
      1.0, 1.0, 1.0,
    ]

    this.texCoords = [
      0, 1, // u v
      1, 1,
      0, 0,
      1, 0,
    ]

    this.indices = [
      0, 1, 2,
      1, 2, 3
    ]
  }
}