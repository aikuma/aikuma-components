import { Component, Element, Prop, Method } from '@stencil/core'


@Component({
  tag: 'aikuma-progress',
  styleUrls: ['progress.scss'],
  shadow: true
})
export class Progress {
  @Element() el: HTMLElement
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  container: HTMLElement
  regions: {start: number, end: number}[] = []
  progress: number = 0
  @Prop() height: number = 15
  @Prop() lineWidth: number = 1
  @Prop() progressColor: string = 'green'
  @Prop() completedColor: string = 'brown'
  @Prop() strokeColor: string = 'black'
  //
  // Lifecycle
  //
  componentDidLoad() {
    this.container = this.el.shadowRoot.querySelector('#canvascontainer')
    this.canvas = this.el.shadowRoot.querySelector('#progresscanvas')
    this.context = this.canvas.getContext("2d")
    this.resizeCanvas()
    window.onresize = () => {
      this.resizeCanvas()
      this.renderProgress()
    }
  }
  //
  // Logic
  //
  getContainerSize() {
    return {
      width: this.container.clientWidth,
      height: this.container.clientHeight
    }
  }

  resizeCanvas() {
    let width = this.container.clientWidth 
    this.canvas.width = ~~(width * window.devicePixelRatio)
    this.canvas.height = ~~(this.height * window.devicePixelRatio)
    this.canvas.style.width = width+'px'
    this.canvas.style.height = this.height+'px'
    this.context.scale(window.devicePixelRatio, window.devicePixelRatio)
  }
  //
  // Methods 
  // 
  @Method()
  setProgress(progress: number) {
    if (progress < 0 || progress > 1) {
      throw new Error("setProgress() must be between 0 and 1")
    }
    this.progress = progress
    this.renderProgress()
  }
  setRegions(regions: {start: number, end: number}[]) {
    this.regions = regions
    this.renderProgress()
  }

  renderProgress() {
    let width = this.container.clientWidth 
    this.context.clearRect(0,0, width, this.height)
    this.context.beginPath()
    this.context.lineWidth = this.lineWidth
    this.context.fillStyle = this.completedColor
    this.context.strokeRect(0, 0, width, this.height)
    let highX = 0
    for (let region of this.regions) {
      let x1 = width * region.start
      let x2 = width * region.end
      this.context.fillRect(x1, 0, (x2 - x1), this.height)
      this.context.strokeRect(x1, 0, (x2 - x1), this.height)
      highX = x2
    }
    // do new play
    this.context.fillStyle = this.progressColor
    let x1 = highX
    let x2 = this.progress * width
    this.context.fillRect(x1, 0, (x2 - x1), this.height)
    this.context.strokeRect(x1, 0, (x2 - x1), this.height)
    this.context.closePath()
  }

  render() {
    return (

<div id="canvascontainer">
  <canvas id="progresscanvas"></canvas>
</div>

    )
  }


}