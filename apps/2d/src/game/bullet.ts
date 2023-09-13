import { CircleCollider } from "../circle-collider";
import { Content } from "../content";
import { Rect } from "../rect";
import { SpriteRenderer } from "../sprite-renderer";
import { Texture } from "../texture";
import { Player } from "./player";

const BULLET_SPEED = 0.75

export class Bullet {
  public readonly drawRect: Rect
  private sourceRect: Rect
  private texture: Texture

  public active = true
  public collider = new CircleCollider()

  constructor() {
    const sprite = Content.sprites["laserBlue01"]
    this.drawRect = sprite.drawRect.copy()
    this.sourceRect = sprite.sourceRect.copy()
    this.texture = sprite.texture
  }

  public spawnL(player: Player) {
    this.active = true
    this.drawRect.x = player.drawRect.x
    this.drawRect.y = player.drawRect.y
  }

  public spawnR(player: Player) {
    this.active = true
    this.drawRect.x = player.drawRect.x + player.drawRect.width - 8
    this.drawRect.y = player.drawRect.y
  }

  public update(dt: number) {
    this.drawRect.y -= BULLET_SPEED * dt
    this.collider.update(this.drawRect)

    if (this.drawRect.y + this.drawRect.height < 0) {
      this.active = false
    }
  }

  public draw(spriteRenderer: SpriteRenderer) {
    if (this.active) {
      spriteRenderer.drawSpriteSource(this.texture, this.drawRect, this.sourceRect)
    }
  }
}