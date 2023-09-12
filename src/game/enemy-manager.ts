import { vec2 } from "gl-matrix"
import { Enemy } from "./enemy"
import { EnemyMeteor } from "./enemy-meteor"
import { SpriteRenderer } from "../sprite-renderer"
import { Player } from "./player"
import { ExplosionManager } from "./explosion-manager"
import { BulletManager } from "./bullet-manager"

const SPAWN_INTERVAL = 1000
export class EnemyManager {
  private timeToSpawn = 0
  private pool: Enemy[] = []

  constructor(
    private player: Player,
    private readonly explosionManager: ExplosionManager,
    private readonly bulletManager: BulletManager,
    private bounds: vec2
  ) {
  }

  public spawnEnemy() {
    if (this.timeToSpawn > SPAWN_INTERVAL) {
      this.timeToSpawn = 0
      let enemy = this.pool.find(e => !e.active)

      if (!enemy) {
        enemy = new EnemyMeteor(this.bounds)
        this.pool.push(enemy)
      }

      enemy.active = true
      enemy.drawRect.x = Math.random() * (this.bounds[0] - enemy.drawRect.width)
      enemy.drawRect.y = -enemy.drawRect.height
    }
  }

  public update(dt: number) {
    this.timeToSpawn += dt
    this.spawnEnemy()

    for (const enemy of this.pool) {
      if (enemy.active) {
        enemy.update(dt)

        if (enemy.collider.intersects(this.player.collider)) {
          enemy.active = false
          this.explosionManager.create(enemy.drawRect)
        }

        if (this.bulletManager.intersectsEnemy(enemy)) {
          enemy.active = false
          this.explosionManager.create(enemy.drawRect)
        }

        if (enemy.drawRect.y > this.bounds[1]) {
          enemy.active = false
        }
      }
    }
  }

  public draw(spriteRenderer: SpriteRenderer) {
    for (const enemy of this.pool) {
      if (enemy.active) {
        enemy.draw(spriteRenderer)
      }
    }
  }
}