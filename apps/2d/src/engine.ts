import { vec2 } from "gl-matrix"
import { Content } from "./content"
import { InputManager } from "./input-manager"
import { SpriteRenderer } from "./sprite-renderer"

class Engine {
  private canvas!: HTMLCanvasElement
  private context!: GPUCanvasContext
  private device!: GPUDevice

  private passEncoder!: GPURenderPassEncoder
  public spriteRenderer!: SpriteRenderer

  public inputManager = new InputManager()
  private lastTime = 0
  public bounds = vec2.create()

  public onUpdate(_dt: number) {}
  public onDraw() {}

  public async init() {
    this.canvas = document.querySelector('canvas') as HTMLCanvasElement

    this.context = this.canvas.getContext('webgpu')!

    this.bounds = vec2.fromValues(this.canvas.width, this.canvas.height)

    if (!this.context) {
      alert("WebGPU is not supported!")
      return
    }

    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'low-power'
    })

    if (!adapter) {
      alert("No adapter found!")
      return
    }

    this.device = await adapter.requestDevice()

    await Content.init(this.device)

    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat()
    })

    this.spriteRenderer = new SpriteRenderer(this.device, this.canvas.width, this.canvas.height)
    this.spriteRenderer.init()
  }

  public draw() {
    const now = performance.now()
    const dt =  now - this.lastTime
    this.lastTime = now

    this.onUpdate(dt)

    const commandEncoder = this.device.createCommandEncoder()

    const textureView = this.context.getCurrentTexture().createView()
    const bgColor: GPUColor = { r: 0.5, g: 0.5, b: 0.5, a: 1.0 }

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          clearValue: bgColor,
          view: textureView,
          loadOp: 'clear',
          storeOp: 'store'
        }
      ]
    }

    this.passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)

    this.spriteRenderer.framePass(this.passEncoder)

    // DRAW START

    this.onDraw()

    // DRAW END
    this.spriteRenderer.frameEnd()

    this.passEncoder.end()

    this.device.queue.submit([commandEncoder.finish()])

    window.requestAnimationFrame(() => this.draw())
  }
}

export default Engine