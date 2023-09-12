import { vec2 } from "gl-matrix";
import { Content } from "../content";
import { Rect } from "../rect";
import { SpriteRenderer } from "../sprite-renderer";
import { Texture } from "../texture";
import { InputManager } from "../input-manager";
import { CircleCollider } from "../circle-collider";

const PLAYER_SPEED = 0.25
const PLAYER_START_POS = { x: 0.45, y: 0.85 }

export class Player {
  private movementDirection = vec2.create()

  private texture: Texture
  private sourceRect: Rect
  private drawRect: Rect
  readonly collider: CircleCollider = new CircleCollider()

  constructor(private inputManager: InputManager, private bounds: vec2) {
    const playerSprite = Content.sprites["playerShip1_blue"]
    this.texture = playerSprite.texture
    this.sourceRect = playerSprite.sourceRect.copy()
    this.drawRect = playerSprite.drawRect.copy()
    this.drawRect.x = PLAYER_START_POS.x * bounds[0]
    this.drawRect.y = PLAYER_START_POS.y * bounds[1]
  }

  private clampToBounds() {
    if (this.drawRect.x < 0) {
      this.drawRect.x = 0
    } else if (this.drawRect.x > this.bounds[0] - this.drawRect.width) {
      this.drawRect.x = this.bounds[0] - this.drawRect.width
    }

    if (this.drawRect.y < 0) {
      this.drawRect.y = 0
    } else if (this.drawRect.y > this.bounds[1] - this.drawRect.height) {
      this.drawRect.y = this.bounds[1] - this.drawRect.height
    }
  }

  public update(dt: number) {
    this.movementDirection[0] = 0
    this.movementDirection[1] = 0

    if (this.inputManager.isKeyDown('ArrowLeft')) {
      this.movementDirection[0] = -1
    } else if (this.inputManager.isKeyDown('ArrowRight')) {
      this.movementDirection[0] = 1
    }

    if (this.inputManager.isKeyDown('ArrowUp')) {
      this.movementDirection[1] = -1
    } else if (this.inputManager.isKeyDown('ArrowDown')) {
      this.movementDirection[1] = 1
    }

    vec2.normalize(this.movementDirection, this.movementDirection)
    this.drawRect.x += this.movementDirection[0] * PLAYER_SPEED * dt // TODO why direction inverts when multiplied by dt?
    this.drawRect.y += this.movementDirection[1] * PLAYER_SPEED * dt

    this.clampToBounds()

    this.collider.update(this.drawRect)
  }

  public draw(spriteRenderer: SpriteRenderer) {
    spriteRenderer.drawSpriteSource(this.texture, this.drawRect, this.sourceRect)
  }
}