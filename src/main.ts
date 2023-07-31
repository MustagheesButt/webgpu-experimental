
class Renderer {
  private context!: GPUCanvasContext
  private device!: GPUDevice

  public async init() {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement

    this.context = canvas.getContext('webgpu')!

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

    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat()
    })
  }

  public draw() {
    const commandEncoder = this.device.createCommandEncoder()

    const textureView = this.context.getCurrentTexture().createView()

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          clearValue: { r: 1.0, g: 0.0, b: 0.0, a: 1.0 },
          view: textureView,
          loadOp: 'clear',
          storeOp: 'store'
        }
      ]
    }

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)

    passEncoder.end()

    this.device.queue.submit([commandEncoder.finish()])
  }
}

const renderer = new Renderer()
renderer.init().then(
  () => renderer.draw()
)