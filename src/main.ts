import shaderSource from "./shaders/shader.wgsl?raw"

class Renderer {
  private context!: GPUCanvasContext
  private device!: GPUDevice
  private pipeline!: GPURenderPipeline

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

    this.prepareModel()
  }

  private prepareModel() {
    const shaderModule = this.device.createShaderModule({
      code: shaderSource
    })

    const vertexState: GPUVertexState = {
      module: shaderModule,
      entryPoint: 'vertexMain',
      // buffers: []
    }

    const fragmentState: GPUFragmentState = {
      module: shaderModule,
      entryPoint: 'fragmentMain',
      targets: [
        { format: navigator.gpu.getPreferredCanvasFormat() }
      ]
    }

    this.pipeline = this.device.createRenderPipeline({
      vertex: vertexState,
      fragment: fragmentState,
      primitive: {
        topology: 'triangle-list'
      },
      layout: 'auto'
    })
  }

  public draw() {
    const commandEncoder = this.device.createCommandEncoder()

    const textureView = this.context.getCurrentTexture().createView()

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
          view: textureView,
          loadOp: 'clear',
          storeOp: 'store'
        }
      ]
    }

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)

    // actual drawing here
    passEncoder.setPipeline(this.pipeline)
    passEncoder.draw(3)

    passEncoder.end()

    this.device.queue.submit([commandEncoder.finish()])
  }
}

const renderer = new Renderer()
renderer.init().then(
  () => renderer.draw()
)