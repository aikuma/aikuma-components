import { Particles } from './particles'

export type Milliseconds = number

export interface Gesture {
  timeOffset: number
  type?: string
  timeLine: {x: number, y: number, t: number}[]
}

export class Gestate {
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
  canvas: HTMLCanvasElement
  particles: Particles
  sourceElement: HTMLElement
  debug: boolean = false
  constructor(config: any) {
    this.debug = config && config.debug
    this.init()
  }
  // 
  // Lifecycle
  //
   init() {
    //console.log('gestate init particles')
    this.canvas = document.createElement('canvas')
    this.canvas.classList.add('gestateoverlay')
    let style = "position: absolute; z-index: 100; user-select: none; -moz-user-select: none; -webkit-user-select: none;"
    if (this.debug) {
      style += " border: 1px solid red; box-sizing: border-box;"
    }
    this.canvas.setAttribute("style", style)
    this.canvas.addEventListener('touchstart', this.touchEvent.bind(this))
    this.canvas.addEventListener('touchmove', this.touchEvent.bind(this))
    this.canvas.addEventListener('touchend', this.touchEvent.bind(this))
    this.canvas.addEventListener('mousedown', this.mouseEvent.bind(this))
    this.canvas.addEventListener('mouseenter', this.mouseEvent.bind(this))
    this.canvas.addEventListener('mousemove', this.mouseEvent.bind(this))
    this.canvas.addEventListener('mouseleave', this.mouseEvent.bind(this))
    this.canvas.addEventListener('mouseup', this.mouseEvent.bind(this))
    let body = document.querySelector('body')
    body.appendChild(this.canvas)
    this.particles = new Particles(this.canvas)
    window.addEventListener('resize', () => {
      this.resizeCanvas()
    })
  }

  destroy() {
    this.canvas.remove()
  }
 
  //
  // Logic
  //
  record(element: HTMLElement, gtype: string, time: number): void {
    console.log('gestate start()')
    this.sourceElement = element
    this.resizeCanvas()
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
    this.particles.begin(true)
    this.recordTick()
  }

  stopRecord(): void {
    console.log('gestate stop()')
    this.state.isRecording = false
    this.particles.stop()
    if (this.currentGesture) {
      this.finishCurrentGesture()
    }
  }
 
  clearAll(): void {
    this.gestures = []
  }
 
  getGestures(): Gesture[] {
    return this.gestures
  }
 
  loadGestures(gestures: Gesture[]): void {
    this.gestures = gestures
  }
 
  playGestures(time: Milliseconds) {
    if (this.state.isRecording) {
      this.stopRecord()
    }
    this.particles.begin()
    this.currentRecording = {
      startTime: new Date(),
      recTimeOffset: time,
      lastElapsed: time
    }
    this.currentTouch.movingPos = null
    this.state.isPlaying = true
    this.playTick()
  }

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
  
  resizeCanvas() {
    if (this.sourceElement) {
      let rect = this.sourceElement.getBoundingClientRect() as DOMRect
      let crct = this.canvas.getBoundingClientRect() as DOMRect
      if (rect.width !== crct.width || 
          rect.height !== crct.height ||
          rect.top !== crct.top ||
          rect.left !== crct.left
        ) {
          console.log('gestate resizing canvas', rect)
          this.canvas.style.setProperty('width', rect.width.toString()+'px')
          this.canvas.style.setProperty('height', rect.height.toString()+'px')
          this.canvas.style.setProperty('top', rect.top.toString()+'px')
          this.canvas.style.setProperty('left', rect.left.toString()+'px')
          this.particles.resize(rect)
      }
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
   
}
