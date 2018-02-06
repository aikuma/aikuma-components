import { randomColor } from 'randomcolor'
import Sketch from 'sketch-js'

export class Particle {
  alive: boolean
  radius: number
  wander: number
  theta: number
  x: number
  y: number
  vx: number
  vy: number
  drag: number
  that: any
  color: string
  constructor( that: any, x: number, y, radius: number, colors: string[]) {
    this.color = that.randomPick(colors)
    this.alive = true
    this.radius = radius || 10
    this.wander = 0.15
    this.theta = Math.random() * Math.PI * 2
    this.drag = 0.92
    this.x = x || 0.0
    this.y = y || 0.0
    this.that = that
    this.wander = this.that.random( 0.5, 2.0 )
    //this.color = this.that.randomPick( this.COLOURS )
    this.drag = this.that.random( 0.9, 0.99 )
    let force = this.that.random( 0.5, 1.5 )
    //let force = this.that.random( 1, 2.5 )
    this.vx = Math.sin( this.theta ) * force
    this.vy = Math.cos( this.theta ) * force
  }
  move() {
    this.x += this.vx
    this.y += this.vy
    this.vx *= this.drag
    this.vy *= this.drag
    this.theta += this.that.random( -0.5, 0.5 ) * this.wander
    this.vx += Math.sin( this.theta ) * 0.1
    this.vy += Math.cos( this.theta ) * 0.1
    this.radius *= 0.91
    this.alive = this.radius > 0.5
  }
  draw( ctx ) {
    ctx.beginPath()
    ctx.arc( this.x, this.y, this.radius, 0, Math.PI * 2 )
    ctx.fillStyle = this.color
    ctx.fill()
  }
}

export class Particles {
  MAX_PARTICLES: number = 100
  FAST_PARTICLES: number = 25
  particles = []
  times: number[] = []
  lastPaaaaarp: {time: number, particles: number, x: number, y: number}
  sketchActive: boolean = false
  colors: string[] 

  sketch: any
  htmlelement: HTMLElement
  width: number
  height: number
  recordMode: boolean = false
  constructor(htmlElement: any) {
    this.htmlelement = htmlElement
    this.colors = randomColor({count: 10, luminosity: 'light'})
  }
  resize(width: number, height: number) {
    this.width = width
    this.height = height
  }
  start(recordMode: boolean = false) {
    this.recordMode = recordMode
    this.sketch = Sketch.create({
      globals: false,
      container: this.htmlelement,
      eventTarget: this.htmlelement,
      retina: false,
      fullscreen: false,
      autopause: false,
      interval: recordMode ? 2 : 1,
      width: this.width,
      height: this.height
    })
    this.sketch.globalCompositeOperation  = 'lighten'
    this.sketch.spawn = ( x: number, y: number ) => {
      let mp = recordMode ? this.FAST_PARTICLES : this.MAX_PARTICLES
      if ( this.particles.length >= mp ) {
        this.particles.shift()
      }
      let particle = new Particle(this, x, y, this.random( 6, 12 ), this.colors )
      this.particles.push( particle )
    }
    this.sketch.update = () => {
      let lp = []
      for ( let p of this.particles ) {
        p.move()
        if (p.alive) {
          lp.push(p)
        }
      }
      this.particles = lp
      //this.times.push(this.sketch.dt)
    }
    this.sketch.draw = () => {
      for (let p of this.particles) {
        p.draw(this.sketch)
      }
      this.times.push(this.sketch.dt)
    }
    this.sketchActive = true
  }
  stop() {
    let total: number = this.times.reduce((sum, value) => sum + value, 1)
    console.log('sketch fps', Math.round(1000 / (total/this.times.length)))
    this.lastPaaaaarp = null
    this.sketch.destroy()
    this.sketchActive = false
  }
  random( min, max ) {
    return Math.random() * (max - min) + min
  }
  randomPick(array: any[]): any {
    return array[Math.floor(Math.random() * array.length)]
  }
  getRandomIntInclusive(min: number, max: number) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
  // pttoooooey paaaaaaarp ptweeeeee!!!!
  paaaaarp(x: number, y: number): void {
    const interpolate = (x1, y1, x2, y2, steps) => {
      let dx = ((x2 - x1) / steps), dy =((y2 - y1) / steps)
      let res = []
      for (let i = 1; i <= steps; ++i) {
        res.push({
          x: x1 + dx * i,
          y: y1 + dy * i
        })
      }
      return res
    }
    let fx = ~~(this.width*x), fy = ~~(this.height*y)
    if (this.recordMode) {
      this.sketch.spawn(fx, fy)
      return
    }
    // if playback, then interpolate between last update
    let fc = this.getRandomIntInclusive(1,4)
    if (this.lastPaaaaarp) {
      let elT = new Date().valueOf() - this.lastPaaaaarp.time
      //let tpP = ~~(elT / this.lastPaaaaarp.particles)
      //console.log('el:',elT, tpP)
      if (elT > 50) {
        console.log('particle: elT > 50, throttling interpolate')
        fc = 1
      }
      // have move so let's interpolate
      let steps = interpolate(this.lastPaaaaarp.x, this.lastPaaaaarp.y, x, y, fc)
      for (let s of steps) {
        let px = ~~(this.width*s.x), py = ~~(this.height*s.y)
        this.sketch.spawn(px, py)
      }
    } else {
      // no last move
      for (let i = 0; i < fc ; ++i) {
        this.sketch.spawn(fx, fy)
      }
    }
    this.lastPaaaaarp = {time: new Date().valueOf(), particles: fc, x: x, y: y}
  }
  clearLastPaaaaarp() {
    this.lastPaaaaarp = null
  }
  destroy() {
    if (this.sketchActive) {
      this.sketch.destroy()
    }
  }
}