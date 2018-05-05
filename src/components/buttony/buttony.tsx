import { Component, Element, Prop, Event, EventEmitter } from '@stencil/core'

export interface ButtonyElement extends HTMLElement, Buttony {}

@Component({
  tag: 'aikuma-buttony',
  styleUrl: 'buttony.scss'
})
export class Buttony {
  @Element() el: HTMLElement
  @Prop() color: string
  @Prop() disabled: boolean
  @Prop() size: string = '50'
  @Prop() id: string = null
  @Prop() clear: boolean = false
  @Event() clickEvent: EventEmitter<{id: string, type: string}>

  // watchHandler(size: {content: DOMRect, frame: DOMRect}) {
   
  // }

  // 
  //  Class Variables
  //
  wrapper: HTMLElement
  trackTouchIdentifier: number = null
  mouseDown: boolean = false
  // 
  // Lifecycle
  //
  componentDidLoad() {
    this.wrapper = this.el.querySelector('.wrapper')
  }

  // Logic
  //
  doRipple(xp: number, yp: number) {
    let pos  = this.wrapper.getBoundingClientRect()
    let rippler  = document.createElement('span')
    let size = this.wrapper.offsetWidth
    let x = xp - pos.left - (size / 2)
    let y = yp - pos.top  - (size / 2)
    let style = 'top:' + y + 'px; left:' + x + 'px; height: '
            + size + 'px; width: ' + size + 'px;'
    rippler.setAttribute('style', style)
    rippler.classList.add('ripple')
    this.wrapper.appendChild(rippler)
    setTimeout(() => {
      rippler.remove()
    }, 250)
  }
  touchEvent(evt: TouchEvent) {
    if (this.disabled) {
      return
    }
    let touch = evt.changedTouches[0]
    if (evt.type === 'touchstart' && !this.trackTouchIdentifier) {
      console.log('t down')
      evt.preventDefault()
      this.sendEvent('down')
      this.doRipple(touch.pageX,touch.pageY)
      this.trackTouchIdentifier = touch.identifier
    } else if (evt.type === 'touchend') {
      console.log('t up')
      let fTouch = Array.from(evt.changedTouches).find(x => x.identifier === this.trackTouchIdentifier)
      if (fTouch) {
        evt.preventDefault()
        this.sendEvent('up')
        this.trackTouchIdentifier = null
      }
    }
  }
  mouseEvent(evt: MouseEvent) {
    if (this.disabled) {
      return
    }
    if (evt.type === 'mousedown') {
      evt.preventDefault()
      this.sendEvent('down')
      this.mouseDown = true
      this.doRipple(evt.pageX, evt.pageY)
    } else if (evt.type === 'mouseup' && this.mouseDown) {
      evt.preventDefault()
      this.sendEvent('up')
      this.mouseDown = false
    } else if (evt.type === 'mouseleave' && 
        (evt.buttons & 1) && // mouse is down
        this.mouseDown // only trigger up if we moused down on this element
      ) {
      this.sendEvent('up')
      this.mouseDown = false
    }
  }
  sendEvent(type: string) {
    this.clickEvent.emit({id: this.id, type: type})
  }

  render() {
    return (
<div 
  onTouchStart={this.touchEvent.bind(this)}
  onTouchEnd={this.touchEvent.bind(this)}
  onMouseDown={this.mouseEvent.bind(this)}
  onMouseUp={this.mouseEvent.bind(this)}
  onMouseLeave={this.mouseEvent.bind(this)}
  style={{ 
    width: this.size+'px',
    height: this.size+'px'
  }}
  class={
    'wrapper ' +
    (this.disabled ? 'disabled ' : '') 
  }>
  { 
    !this.clear ?
      <div class="background"
        style={
          this.color && !this.disabled ? {backgroundColor: this.color} : {}
        }>
      </div> :
      null
  }
  <div class={'contents ' + (this.clear ? 'clear' : '')}
    style={
      this.clear && !this.disabled ? {color: this.color} : {}
    }>
    <slot />
  </div>
</div>   
    )
  }
}
