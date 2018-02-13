import { Component, Element, Watch, Prop, Method } from '@stencil/core'
import { Particles } from './particles'

type Milliseconds = number

export interface Gesture {
  timeOffset: number
  type?: string
  timeLine: {x: number, y: number, t: number}[]
}

export interface GestateElement extends HTMLElement, Gestate {}

@Component({
  tag: 'aikuma-gestate',
  styleUrl: 'gestate.css',
  shadow: true
})
export class Gestate {
  @Element() el: HTMLElement
  @Prop() size: {content: DOMRect, frame: DOMRect}
  @Watch('size')
  watchHandler(size: {content: DOMRect, frame: DOMRect}, oldSize: {content: DOMRect, frame: DOMRect}) {
    if (size.content === oldSize.content && size.frame === oldSize.frame) {
      return
    }
    if (size && this.overlay && size.content && size.frame) {
      console.log('gestate size', size)
      let newsize = size.content
      this.overlay.style.setProperty('width', newsize.width.toString()+'px')
      this.overlay.style.setProperty('height', newsize.height.toString()+'px')
      let offsetx = ((this.el.clientWidth - newsize.width) / 2) 
      let offsety = ((size.frame.height  - newsize.height) / 2) 
      this.overlay.style.setProperty('left', offsetx.toString()+'px')
      this.overlay.style.setProperty('top', offsety.toString()+'px')
      if (this.particles) {
        this.particles.resize(newsize)
      }
    }
  }

  // 
  //  Class Variables
  //
  state: {
    isPlaying: boolean,
    isRecording: boolean
  } = { isPlaying: false, isRecording: false}
  currentGesture: {
    gesture: Gesture,
    type: string
  } = null
  currentRecording: {
    startTime: Date,
    recTimeOffset: number,
    lastElapsed: Milliseconds
  } = null
  currentTouch: {
    movingPos: {x: number, y: number},
    trackTouchIdentifier: number
  } = {
    movingPos: null,
    trackTouchIdentifier: null
  }
  gestures: Gesture[] = []
  overlay: HTMLElement
  particles: Particles
  // 
  // Lifecycle
  //
  componentDidLoad() {
    console.log('gestate did load')
    this.overlay = this.el.shadowRoot.querySelector('.overlay')
    console.log('... and got overlay', this.overlay)
    this.init()
  }
  init() {
    console.log('gestate init particles')
    this.particles = new Particles(this.overlay)
  }
  componentDidUnload() {
    console.log('The view has been removed from the DOM');
    if (this.particles) {
      this.particles.destroy()
    }
  }
  //
  // Logic
  //
  @Method()
  record(gtype: string, time: number): void {
    console.log('gestate start()')
    this.state = {
      isPlaying: false,
      isRecording: true
    }
    this.currentGesture = {gesture: null, type: gtype}
    this.currentRecording = {
      startTime: new Date(),
      recTimeOffset: time,
      lastElapsed: 0
    }
    this.currentTouch = {
      movingPos: null,
      trackTouchIdentifier: null
    }
    this.particles.init(true)
    this.recordTick()
  }
  @Method()
  stopRecord(): void {
    console.log('gestate stop()')
    this.state.isRecording = false
    //this.particles.stop()
    if (this.currentGesture) {
      this.finishCurrentGesture()
    }
  }
  @Method()
  clearAll(): void {
    this.gestures = []
  }
  @Method()
  getGestures(): Gesture[] {
    return this.gestures
  }
  @Method()
  loadGestures(gestures: Gesture[]): void {
    this.gestures = gestures
  }
  @Method()
  playGestures(time: Milliseconds) {
    if (this.state.isRecording) {
      this.stopRecord()
    }
    this.particles.start()
    this.currentRecording = {
      startTime: new Date(),
      recTimeOffset: time,
      lastElapsed: time
    }
    this.currentTouch.movingPos = null
    this.state.isPlaying = true
    this.playTick()
  }
  @Method()
  stopPlay(): void {
    this.state.isPlaying = false
    this.particles.stop()
  }

  playTick() {
    let getCurrentGestureByTime = (nt: number): Gesture => {
      for (let f = this.gestures.length -1 ; f >= 0 ; --f) {
        let st = this.gestures[f].timeOffset 
        let et = st + this.gestures[f].timeLine[this.gestures[f].timeLine.length-1].t
        if (nt >= st && nt <= et) {
          return this.gestures[f]
        }
      }
      return null
    }
    let elapsed = this.getElapsed() + this.currentRecording.recTimeOffset 
    let pGest = getCurrentGestureByTime(elapsed)
    if (pGest) {
      let tt = elapsed - pGest.timeOffset
      let oldt = this.currentRecording.lastElapsed - pGest.timeOffset
      for (let frame of pGest.timeLine) {
        if (frame.t > oldt && frame.t <= tt) {
          this.particles.parp(frame.x, frame.y)
        }
      }
      this.currentRecording.lastElapsed = elapsed
    } else {
      this.particles.clearLastParp() 
    }
    if (this.state.isPlaying) {
      window.requestAnimationFrame(this.playTick.bind(this))
    }
  }

  recordTick(): void {
    if (this.currentTouch.movingPos) {
      this.particles.parp(this.currentTouch.movingPos.x, this.currentTouch.movingPos.y)
    }
    if (this.state.isRecording) {
      window.requestAnimationFrame(this.recordTick.bind(this))
    }
  }
  
  finishCurrentGesture(): void {
    this.gestures.push(this.currentGesture.gesture)
    this.currentGesture.gesture = null
    this.currentTouch.movingPos = null
    this.particles.endParp()
  }

  getElapsed(): Milliseconds {
    let thisTime = new Date()
    return (thisTime.valueOf() - this.currentRecording.startTime.valueOf())
  }
  touchEvent(e: TouchEvent) {
    const getXYFromTouch = (touch: Touch): {x: number, y: number} => {
      let target = touch.target as Element
      let rect = target.getBoundingClientRect()
      let rx = touch.clientX - rect.left
      let ry = touch.clientY - rect.top
      return {
        x: rx / rect.width,
        y: ry / rect.height
      }
    }
    if (!this.state.isRecording) {
      return
    }
    if (e.type === 'touchstart') {
      console.log('touch start')
      let thisTouch: Touch = e.changedTouches[0]
      this.currentTouch.trackTouchIdentifier = thisTouch.identifier
      let touchPos = getXYFromTouch(thisTouch)
      this.currentGesture.gesture = {
        type: this.currentGesture.type,
        timeOffset: this.currentRecording.recTimeOffset + this.getElapsed(),
        timeLine: [{
          t: 0,
          x: touchPos.x,
          y: touchPos.y
        }]
      }
      this.currentTouch.movingPos = {x: touchPos.x, y: touchPos.y}
    } else if (e.type === 'touchmove') {
      console.log(e.target
      )
      let moveTouch = Array.from(e.changedTouches).find(x => x.identifier === this.currentTouch.trackTouchIdentifier)
      if (moveTouch) {
        let touchPos = getXYFromTouch(moveTouch)
        this.currentGesture.gesture.timeLine.push({
          t: this.currentRecording.recTimeOffset + this.getElapsed() - this.currentGesture.gesture.timeOffset,
          x: touchPos.x,
          y: touchPos.y
        })
        this.currentTouch.movingPos = {x: touchPos.x, y: touchPos.y}
      }
    } else if (e.type === 'touchend') {
      if (this.currentGesture.gesture) {
        
        let fidx = Array.from(e.changedTouches).findIndex(x => x.identifier === this.currentTouch.trackTouchIdentifier)
        if (fidx !== -1) {
          this.finishCurrentGesture()
        }
      }
    }
  }

  mouseEvent(e: MouseEvent) {
    const getXYFromMouse = (me: MouseEvent): {x: number, y: number} => {
      let target = me.target as Element
      let rect = target.getBoundingClientRect()
      let rx = me.clientX - rect.left
      let ry = me.clientY - rect.top
      return {
        x: rx / rect.width,
        y: ry / rect.height
      }
    }
    const mouseUp = () => {
      console.log('mouse up')
      this.finishCurrentGesture()
    }
    if (!this.state.isRecording) {
      return
    }
    if ((e.type === 'mousedown' || e.type === 'mouseenter') && (e.buttons & 1)) {
      console.log('mouse down')
      let mPos = getXYFromMouse(e)
      this.currentGesture.gesture = {
        type: this.currentGesture.type,
        timeOffset: this.currentRecording.recTimeOffset + this.getElapsed(),
        timeLine: [{
          t: 0,
          x: mPos.x,
          y: mPos.y
        }]
      }
      this.currentTouch.movingPos = {x: mPos.x, y: mPos.y}
    } else if (e.type === 'mousemove' && this.currentTouch.movingPos) {
      // if (!(e.buttons & 1)) {
      //   mouseUp()
      //   return
      // }
      let mPos = getXYFromMouse(e)
      this.currentGesture.gesture.timeLine.push({
        t: this.currentRecording.recTimeOffset + this.getElapsed() - this.currentGesture.gesture.timeOffset,
        x: mPos.x,
        y: mPos.y
      })
      this.currentTouch.movingPos = {x: mPos.x, y: mPos.y}
    } else if (e.type === 'mouseup' && (!(e.buttons & 1))) {
      mouseUp()
    } else if (e.type === 'mouseleave' && this.currentTouch.movingPos) {
      mouseUp()
    }
  }
 


  render() {
    return (
      <div class="overlay"
        onTouchStart={this.touchEvent.bind(this)}
        onMouseDown={this.mouseEvent.bind(this)}
        onMouseEnter={this.mouseEvent.bind(this)}
        onTouchMove={this.touchEvent.bind(this)}
        onMouseMove={this.mouseEvent.bind(this)}
        onMouseLeave={this.mouseEvent.bind(this)}
        onTouchEnd={this.touchEvent.bind(this)}
        onMouseUp={this.mouseEvent.bind(this)}>
      </div>
    )
  }
  
}

{/* <div class="overlay"
onTouchStart={this.touchEvent.bind(this)}
onMouseDown={this.mouseEvent.bind(this)}
onTouchMove={this.touchEvent.bind(this)}
onMouseMove={this.mouseEvent.bind(this)}
onTouchEnd={this.touchEvent.bind(this)}
onMouseUp={this.mouseEvent.bind(this)}>
</div> */}