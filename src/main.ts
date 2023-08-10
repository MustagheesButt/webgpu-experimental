import Renderer from "./renderer"
import shaderSource from "./shaders/shader.wgsl?raw"


const renderer = new Renderer()
renderer.init(shaderSource).then(
  () => renderer.draw()
)