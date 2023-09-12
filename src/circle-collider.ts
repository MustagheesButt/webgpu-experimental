import { Rect } from "./rect"

export class CircleCollider {
  public radius = 0
  public x = 0
  public y = 0

  update(drawRect: Rect) {
    this.radius = drawRect.width / 2
    if (drawRect.height < drawRect.width) {
      this.radius = drawRect.height / 2
    }

    this.x = drawRect.x + this.radius
    this.y = drawRect.y + this.radius
  }

  intersects(other: CircleCollider): boolean {
    const dx = this.x - other.x
    const dy = this.y - other.y
    const d = Math.sqrt(dx * dx + dy * dy)

    const r = this.radius + other.radius
    return d < r
  }
}