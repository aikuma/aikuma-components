import { randomColor } from 'randomcolor'

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
    this.radius *= 0.93
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
  MAX_PARTICLES: number = 500
  FAST_PARTICLES: number = 500
  SPAWN_MIN: number = 3
  SPAWN_MAX: number = 5
  particles = []
  times: number[] = []
  lastParp: {time: number, particles: number, x: number, y: number} = null
  colors: string[] 
  width: number
  height: number
  recordMode: boolean = false
  lastSpawn: {x: number, y: number, d: Date} = null
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  running: boolean = false
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = this.canvas.getContext('2d')
    this.ctx.globalCompositeOperation  = 'color'
    this.colors = randomColor({count: 20})
  }
  
  begin(recordMode: boolean = false) {
    this.recordMode = recordMode
    this.lastParp = null
    this.running = true
    this.renderTick()
  }

  renderTick() {
    this.drawParticles()
    this.moveParticles()
    if (this.running) {
      window.requestAnimationFrame(() => {
        this.renderTick()
      })
    } 
  }

  drawParticles() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    for (let p of this.particles) {
      p.draw(this.ctx)
    }
  }

  moveParticles() {
    let lp = []
    for ( let p of this.particles ) {
      p.move()
      if (p.alive) {
        lp.push(p)
      }
    }
    this.particles = lp
  }

  spawnParticles(x: number, y: number, lvec: {lx: number, ly: number, lt: number} = null ) {
    let mp = this.recordMode ? this.FAST_PARTICLES : this.MAX_PARTICLES
    if ( this.particles.length >= mp ) {
      this.particles.shift()
    }
    this.particles.push( new Particle(x, y, this.random( 4, 8 ), this.colors, lvec ) )
  }

  resize(rect: DOMRect) {
    this.width = rect.width
    this.height = rect.height
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.canvas.style.setProperty('width', this.width.toString()+'px')
    this.canvas.style.setProperty('height', this.height.toString()+'px')
    this.canvas.style.setProperty('left', rect.left.toString()+'px')
    this.canvas.style.setProperty('right', rect.right.toString()+'px')
  }
 
  stop() {
    this.lastParp = null
    this.running = false
    this.particles = []
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
        this.spawnParticles(fx, fy, lvec)
      } else {
        let mv = this.lastSpawn 
          ? Math.min(Math.sqrt(Math.pow(lvec.lx,2) + Math.pow(lvec.ly,2)), 10)
          : 0
        let af = ((mv + 2) / 6)
        let smin = ~~(min*af)
        let smax = ~~(max*af)
        for (let x = 0; x < this.getRandomIntInclusive(smin, smax); ++x) {
          this.spawnParticles(fx, fy, lvec)
        }
      }
    }
    if (this.recordMode) {
      spawn(fx, fy, this.SPAWN_MIN, this.SPAWN_MAX)
    } else {
      // if playback, then interpolate between last update
      let fc: number
      if (this.lastParp) {
        let elT = new Date().valueOf() - this.lastParp.time
        fc = 1 + ~~(60 / (1000/elT)) // scale steps to current frmme rate
        let steps = interpolate(this.lastParp.x, this.lastParp.y, x, y, fc)
        for (let s of steps) {
          let px = ~~(this.width*s.x), py = ~~(this.height*s.y)
          spawn(px, py, this.SPAWN_MIN, this.SPAWN_MAX)
        }
      } else {
        fc = 1
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

}