import { vec2 } from "gl-matrix";
import { Rect } from "../rect";
import { SpriteRenderer } from "../sprite-renderer";
import { Texture } from "../texture";
import { Enemy } from "./enemy";
import { Content } from "../content";
import { CircleCollider } from "../circle-collider";

const METEOR_KEYS = [
  "meteorBrown_big1",
  "meteorBrown_big2",
  "meteorBrown_big3",
  "meteorBrown_big4",
  "meteorBrown_med1",
  "meteorBrown_med3",
  "meteorGrey_big1",
  "meteorGrey_big2",
  "meteorGrey_big3",
  "meteorGrey_big4",
  "meteorGrey_med1",
  "meteorGrey_med2",
]

const MAX_SPEED = 0.25
const MIN_SPEED = 0.15

export class EnemyMeteor implements Enemy {
  public active: boolean = true
  public drawRect: Rect
  readonly collider: CircleCollider = new CircleCollider()

  private texture: Texture
  private sourceRect: Rect

  private speed = 0
  private rotation = 0
  private rotationSpeed = 0
  private rotationOrigin = vec2.fromValues(0.5, 0.5)

  constructor(private bounds: vec2) {
    const key = METEOR_KEYS[Math.floor(Math.random() * METEOR_KEYS.length)]

    const meteorSprite = Content.sprites[key]
    this.texture = meteorSprite.texture
    this.sourceRect = meteorSprite.sourceRect.copy()
    this.drawRect = meteorSprite.drawRect.copy()

    this.speed = Math.random() * (MAX_SPEED - MIN_SPEED) + MIN_SPEED
    this.rotationSpeed = (Math.random() - 0.5) * 0.005
  }

  update(dt: number): void {
    this.drawRect.y += this.speed * dt
    this.rotation += this.rotationSpeed * dt

    this.collider.update(this.drawRect)
  }

  draw(spriteRenderer: SpriteRenderer): void {
    spriteRenderer.drawSpriteSource(this.texture, this.drawRect, this.sourceRect, undefined, this.rotation, this.rotationOrigin)
  }
}