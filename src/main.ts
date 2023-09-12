import Engine from "./engine"
import { Background } from "./game/background"
import { EnemyManager } from "./game/enemy-manager"
import { ExplosionManager } from "./game/explosion-manager"
import { Player } from "./game/player"


const engine = new Engine()
engine.init().then(() => {
  const player = new Player(engine.inputManager, engine.bounds)
  const background = new Background(engine.bounds)
  const explosionManager = new ExplosionManager()
  const enemyManager = new EnemyManager(player, explosionManager, engine.bounds)

  engine.onUpdate = (dt: number) => {
    background.update(dt)
    player.update(dt)
    enemyManager.update(dt)
    explosionManager.update(dt)
  }

  engine.onDraw = () => {
    background.draw(engine.spriteRenderer)
    player.draw(engine.spriteRenderer)
    enemyManager.draw(engine.spriteRenderer)
    explosionManager.draw(engine.spriteRenderer)
  }

  engine.draw()
})