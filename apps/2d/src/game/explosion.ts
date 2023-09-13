import { Content } from "../content"
import { Rect } from "../rect"
import { SpriteRenderer } from "../sprite-renderer"

const TIME_TO_NEXT_FRAME = 1000/30

export class Explosion {
  public playing = false
  private timeToNextFrame = 0

  private sourceRect: Rect
  private drawRect: Rect

  private currCol = 0
  private currRow = 0

  private readonly cols = 4
  private readonly rows = 4

  constructor() {
    this.sourceRect = new Rect(0, 0, 32, 32)
    this.drawRect = new Rect(0, 0, 32, 32)
  }

  public play(drawRect: Rect) {
    this.playing = true
    this.timeToNextFrame = 0
    this.currCol = 0
    this.currRow = 0
    this.drawRect = drawRect.copy()
  }

  public update(dt: number) {
    if (this.playing) {
      this.timeToNextFrame += dt

      if (this.timeToNextFrame > TIME_TO_NEXT_FRAME) {
        this.timeToNextFrame = 0
        this.currCol++

        if (this.currCol >= this.cols) {
          this.currCol = 0
          this.currRow++

          if (this.currRow >= this.rows) {
            this.playing = false
            this.currRow = 0
          }
        }
      }
    }
  }

  public draw(spriteRenderer: SpriteRenderer) {
    this.sourceRect.x = this.currCol * this.sourceRect.width
    this.sourceRect.y = this.currRow * this.sourceRect.height

    spriteRenderer.drawSpriteSource(Content.explosionTexture, this.drawRect, this.sourceRect)
  }
}