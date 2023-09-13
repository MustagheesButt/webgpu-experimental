import { vec2 } from "gl-matrix";
import { Rect } from "../rect";
import { SpriteRenderer } from "../sprite-renderer";
import { Content } from "../content";

const SCROLL_SPEED = 0.25

export class Background {
  private drawRect: Rect
  private drawRect2: Rect

  constructor(private bounds: vec2) {
    this.drawRect = new Rect(0, 0, bounds[0], bounds[1])
    this.drawRect2 = new Rect(0, 0 - bounds[1], bounds[0], bounds[1])
  }

  update(dt: number) {
    this.drawRect.y += SCROLL_SPEED * dt
    if (this.drawRect.y > this.bounds[1]) {
      this.drawRect.y = 0
    }

    this.drawRect2.y = this.drawRect.y - this.drawRect2.height
  }

  draw(spriteRenderer: SpriteRenderer) {
    spriteRenderer.drawSprite(Content.backgroundTexture, this.drawRect)
    spriteRenderer.drawSprite(Content.backgroundTexture, this.drawRect2)
  }
}