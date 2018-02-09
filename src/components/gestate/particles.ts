import { randomColor } from 'randomcolor'
import Sketch from 'sketch-js'

export class Particle {
  alive: boolean = true
  radius: number
  wander: number = 0.15
  theta: number
  x: number
  y: number
  vx: number
  vy: number
  drag: number = 0.92
  color: string
  constructor(x: number, y, radius: number, colors: string[], lvec: {lx: number, ly: number, lt: number} = null) {
    this.color = this.randomPick(colors)
    this.radius = radius || 10
    this.theta = Math.random() * Math.PI * 2
    this.x = x || 0.0
    this.y = y || 0.0
    this.wander = this.random( 0.5, 2.0 )
    //this.color = this.that.randomPick( this.COLOURS )
    this.drag = this.random( 0.85, 0.99 )
    let force = this.random( 0.3, 0.6 )
    //let force = this.that.random( 1, 2.5 )
    this.vx = Math.sin( this.theta ) * force
    this.vy = Math.cos( this.theta ) * force
    if (lvec) {
      let af = Math.min(15, lvec.lt) / 15
      let lvx = lvec.lx / 4 * af
      let lvy = lvec.ly / 4 * af
      //console.log(this.vx, lvx, this.vy, lvy, af)
      this.vx += lvx
      this.vy += lvy
    }
  }
  move() {
    this.x += this.vx
    this.y += this.vy
    this.vx *= this.drag
    this.vy *= this.drag
    this.theta += this.random( -0.5, 0.5 ) * this.wander
    this.vx += Math.sin( this.theta ) * 0.1
    this.vy += Math.cos( this.theta ) * 0.1
    this.radius *= 0.91
    this.alive = this.radius > 0.5
  }
  draw( ctx: CanvasRenderingContext2D ) {
    ctx.beginPath()
    ctx.arc( this.x, this.y, this.radius, 0, Math.PI * 2 )
    ctx.fillStyle = this.color
    ctx.fill()
  }
  random( min, max ) {
    return Math.random() * (max - min) + min
  }
  randomPick(array: any[]): any {
    return array[Math.floor(Math.random() * array.length)]
  }
}

export class Particles {
  MAX_PARTICLES: number = 250
  FAST_PARTICLES: number = 250
  SPAWN_MIN: number = 3
  SPAWN_MAX: number = 5
  particles = []
  times: number[] = []
  lastParp: {time: number, particles: number, x: number, y: number} = null
  sketchActive: boolean = false
  colors: string[] 
  sketch: any
  htmlelement: HTMLElement
  width: number
  height: number
  recordMode: boolean = false
  lastSpawn: {x: number, y: number, d: Date} = null
  constructor(htmlElement: HTMLElement) {
    this.htmlelement = htmlElement
    //this.colors = randomColor({count: 10, luminosity: 'dark'})
    this.colors = randomColor({count: 20})
    //this.init()
  }
  
  init(recordMode: boolean = false) {
    this.recordMode = recordMode
    this.width = this.htmlelement.clientWidth
    this.height = this.htmlelement.clientHeight
    this.lastParp = null
    if (this.sketchActive) {
      return
    }
    this.sketch = Sketch.create({
      globals: false,
      container: this.htmlelement,
      eventTarget: this.htmlelement,
      retina: false,
      fullscreen: false,
      autopause: true,
      //interval: recordMode ? 2 : 1,
      width: this.width,
      height: this.height,
      autoclear: false
    })
    console.log('particles create size', this.htmlelement.clientWidth, this.htmlelement.clientHeight)
    this.sketch.globalCompositeOperation  = 'color'
    this.sketch.spawn = ( x: number, y: number, lvec: {lx: number, ly: number, lt: number} = null ) => {
      let mp = recordMode ? this.FAST_PARTICLES : this.MAX_PARTICLES
      if ( this.particles.length >= mp ) {
        this.particles.shift()
      }
      this.particles.push( new Particle(x, y, this.random( 4, 8 ), this.colors, lvec ) )
    }
    this.sketch.update = () => {
      this.sketch.clear()
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
  resize(rect: DOMRect) {
    let cv = this.htmlelement.querySelector('canvas')
    if (!cv) {
      return
    }
    this.width = Math.floor(rect.width)
    this.height = Math.floor(rect.height)
    cv.setAttribute('width', this.width.toString()+'px')
    cv.setAttribute('height', this.height.toString()+'px')
    //cv.style.setProperty('width', this.width.toString()+'px')
    //cv.style.setProperty('height', this.height.toString()+'px')
    cv.style.setProperty('left', Math.floor(rect.left).toString()+'px')
    cv.style.setProperty('right', Math.floor(rect.right).toString()+'px')
  }
  start() {

  }
  stop() {
    let total: number = this.times.reduce((sum, value) => sum + value, 1)
    console.log('sketch fps', Math.round(1000 / (total/this.times.length)))
    this.lastParp = null
    //this.sketch.destroy()
    //this.sketchActive = false
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
  parp(x: number, y: number): void {
    let fx = ~~(this.width*x), fy = ~~(this.height*y)
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
    const spawn = (x: number, y: number, min: number = null, max: number = null) => {
      let lvec = this.lastSpawn ?
        {
          lx: fx - this.lastSpawn.x,
          ly: fy - this.lastSpawn.y,
          lt: new Date().valueOf() - this.lastSpawn.d.valueOf()
        } : null
      
      
      if (!min) {
        this.sketch.spawn(fx, fy, lvec)
      } else {
        let mv = this.lastSpawn 
          ? Math.min(Math.sqrt(Math.pow(lvec.lx,2) + Math.pow(lvec.ly,2)), 10)
          : 0
        let af = ((mv + 2) / 6)
        let smin = ~~(min*af)
        let smax = ~~(max*af)
        for (let x = 0; x < this.getRandomIntInclusive(smin, smax); ++x) {
          this.sketch.spawn(fx, fy, lvec)
        }
      }
    }
    if (this.recordMode) {
      spawn(fx, fy, this.SPAWN_MIN, this.SPAWN_MAX)
    } else {
      // if playback, then interpolate between last update
      let fc = this.getRandomIntInclusive(this.SPAWN_MIN,this.SPAWN_MAX)
      if (this.lastParp) {
        let elT = new Date().valueOf() - this.lastParp.time
        //let tpP = ~~(elT / this.lastParp.particles)
        //console.log('el:',elT, tpP)
        if (elT > 50) {
          console.log('particle: elT > 50, throttling interpolate', elT)
          fc = 1
        }
        // have move so let's interpolate
        let steps = interpolate(this.lastParp.x, this.lastParp.y, x, y, fc)
        for (let s of steps) {
          let px = ~~(this.width*s.x), py = ~~(this.height*s.y)
          //this.sketch.spawn(px, py)
          spawn(px, py)
        }
      } else {
        // no last move
        spawn(fx, fy, this.SPAWN_MIN, this.SPAWN_MAX)
      }
      this.lastParp = {time: new Date().valueOf(), particles: fc, x: x, y: y}
    }
    this.lastSpawn = {
      x: fx,
      y: fy,
      d: new Date()
    }
  }
  endParp() {
    this.lastSpawn = null
  }
  clearLastParp() {
    this.lastParp = null
  }
  destroy() {
    if (this.sketchActive) {
      this.sketch.destroy()
    }
  }
}