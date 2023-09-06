import Engine from "./engine"
import { Player } from "./game/player"


const engine = new Engine()
engine.init().then(() => {
  const player = new Player(engine.inputManager, engine.bounds)

  engine.onUpdate = (dt: number) => {
    player.update(dt)
  }

  engine.onDraw = () => {
    player.draw(engine.spriteRenderer)
  }

  engine.draw()
})