import Engine from "./engine"
import { Background } from "./game/background"
import { BulletManager } from "./game/bullet-manager"
import { EnemyManager } from "./game/enemy-manager"
import { ExplosionManager } from "./game/explosion-manager"
import { Player } from "./game/player"


const engine = new Engine()
engine.init().then(() => {
  const player = new Player(engine.inputManager, engine.bounds)
  const background = new Background(engine.bounds)
  const explosionManager = new ExplosionManager()
  const bulletManager = new BulletManager(player)
  const enemyManager = new EnemyManager(player, explosionManager, bulletManager, engine.bounds)

  engine.onUpdate = (dt: number) => {
    background.update(dt)
    player.update(dt)
    enemyManager.update(dt)
    explosionManager.update(dt)
    bulletManager.update(dt)
  }

  engine.onDraw = () => {
    background.draw(engine.spriteRenderer)
    player.draw(engine.spriteRenderer)
    enemyManager.draw(engine.spriteRenderer)
    explosionManager.draw(engine.spriteRenderer)
    bulletManager.draw(engine.spriteRenderer)
  }

  engine.draw()
})