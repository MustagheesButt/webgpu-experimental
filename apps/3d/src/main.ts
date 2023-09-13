import shader from "./shaders.wgsl?raw"

async function init() {
  const canvas = <HTMLCanvasElement> document.querySelector('canvas')
  const context = <GPUCanvasContext> canvas.getContext('webgpu')
  const adapter = await navigator.gpu.requestAdapter()

  if (!adapter) {
    alert("No adapter found!")
    return
  }

  const device = await adapter.requestDevice()
  const format: GPUTextureFormat = "bgra8unorm"

  context.configure({
    device,
    format
  })

  const pipeline = device.createRenderPipeline({
    vertex: {
      module: device.createShaderModule({
        code: shader
      }),
      entryPoint: "vs_main"
    },
    fragment: {
      module: device.createShaderModule({
        code: shader
      }),
      entryPoint: "fs_main",
      targets: [{
        format
      }]
    },
    primitive: {
      topology: "triangle-list"
    },
    layout: "auto"
  })

  const commandEncoder = device.createCommandEncoder()
  const textureView = context.getCurrentTexture().createView()

  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [{
      view: textureView,
      clearValue: {r: 0.5, g: 0, b: 0.25, a: 1},
      loadOp: "clear",
      storeOp: "store"
    }]
  })
  renderPass.setPipeline(pipeline)

  renderPass.draw(3, 1, 0, 0)

  renderPass.end()

  device.queue.submit([commandEncoder.finish()])
}

init()