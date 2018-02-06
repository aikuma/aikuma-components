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
  @Prop() element: HTMLElement
  @Watch('element')
  watchHandler(newValue: HTMLElement) {
    if (newValue) {

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

  componentWillLoad() {
    console.log('Gestate will render elwl', this.element)
  }

  componentDidLoad() {
    console.log('Gestate did  render eldl', this.element)
    this.init()
  }

  
  

  init() {

  }

  render() {
    return (
      <div>
        Gestate
      </div>
    )
  }
  
}
