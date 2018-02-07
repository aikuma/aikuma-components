import { Component, Element, Watch, Prop } from '@stencil/core'
import { Particles } from './particles'

export interface Gesture {
  timeOffset: number
  type?: string
  timeLine: {x: number, y: number, t: number}[]
}

@Component({
  tag: 'aikuma-gestate',
  styleUrl: 'gestate.scss',
  shadow: true
})
export class Gestate {
  @Element() el: HTMLElement
  @Prop() size: DOMRect
  @Watch('size')
  watchHandler(newsize: DOMRect) {
    if (newsize && this.overlay) {
      this.overlay.style.setProperty('width', newsize.width.toString()+'px')
      this.overlay.style.setProperty('height', newsize.height.toString()+'px')
      let offset = ((this.el.clientWidth - newsize.width) / 2) 
      this.overlay.style.setProperty('left', offset.toString()+'px')
    }
  }

  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  gestures: Gesture[] = []
  currentGesture: Gesture = null
  currentGestureType: string = null
  currentGestureId: string = null
  isRecording: boolean = false
  trackTouchIdentifier: number
  isPlaying: boolean = false
  startTime: Date
  recTimeOffset: number
  lastTime: number
  movingPos: {x: number, y: number}
  particles: Particles
  overlayWidth: string
  overlayHeight: string
  slowDevice: boolean = false

  overlay: HTMLElement

  

  componentWillLoad() {
    
  }

  componentDidLoad() {
    console.log('gestate did load')
    this.overlay = this.el.shadowRoot.querySelector('.overlay')
    console.log('... and got overlay', this.overlay)
    this.init()
  }
  init() {

  }

  render() {
    return (
      <div class="overlay">
        Gestate
      </div>
    )
  }
  
}
