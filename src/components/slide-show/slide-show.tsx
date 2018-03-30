import { Component, Element, Method, State, Event, EventEmitter } from '@stencil/core'
import Swiper from 'swiper'
import { CacheImage } from './cacheimage'

//import { Swiper, Navigation, Lazy, Pagination, Controller, EffectCoverflow } from 'swiper/dist/js/swiper.esm.js'

//Swiper.use([Navigation, Lazy, Pagination, Controller, EffectCoverflow])

export interface Slide {
  url: string
  width: number
  height: number
  id: string
}

interface State {
  highlight?: number
}

@Component({
  tag: 'aikuma-slide-show',
  styleUrls: ['../../../node_modules/swiper/dist/css/swiper.css', 'slide-show.scss'],
  shadow: true
})
export class SlideShow {
  @Element() el: HTMLElement
  @State() slides: Slide[] = []
  @Event() slideSize: EventEmitter<{content: DOMRect, frame: DOMRect}>;
  @Event() slideEvent: EventEmitter<{type: string, val: any}>;
  swiper: {
    main: Swiper,
    thumb: Swiper
  }
  updating: boolean = false
  initialized: boolean = false
  prevLocked: boolean = false
  transitionTime: number = 300
  changing: boolean = false
  @State() state: State = {highlight: -1}

  componentDidLoad() {
    this.init()
  }

  init() {
    let smainel = this.el.shadowRoot.querySelector('.swiper-container.main')
    let smainctrl = new Swiper(smainel, { 
      init: false,
      loop: false,
      longSwipes: false,
      slidesPerView: 'auto',
      watchSlidesVisibility: true,
      direction: 'horizontal',
      pagination: {
        el: this.el.shadowRoot.querySelector('.swiper-container.main .swiper-pagination'),
        type: 'bullets'
      },
      preloadImages: false,
      lazy: false,
      centeredSlides: true,
      grabCursor: true,
      slideToClickedSlide: false, // other sldes only visible in landscape mode
      spaceBetween: 0,
      effect: 'coverflow',
      coverflow: {
        rotate: 20,
        stretch: 0,
        depth: 100,
        modifier: 2,
        slideShadows: true
      },
      navigation: {
        nextEl: this.el.shadowRoot.querySelector('.swiper-container.main .swiper-button-next'),
        prevEl: this.el.shadowRoot.querySelector('.swiper-container.main .swiper-button-prev')
      },
      autoHeight: false,
      allowTouchMove: false
    })
    let sthumbel = this.el.shadowRoot.querySelector('.swiper-container.thumb')
    let sthumbctrl = new Swiper(sthumbel, {
      init: false,
      loop: false,
      longSwipes: false,
      direction: 'horizontal',
      slidesPerView: 'auto',
      watchSlidesVisibility: true,
      centeredSlides: true, // tying two sliders together is bugged without this
      spaceBetween: 5,
      touchRatio: 0.3,
      slideToClickedSlide: false,
      allowTouchMove: false
    })
    this.swiper = {
      main: smainctrl,
      thumb: sthumbctrl
    }
    // this.swiper.main.on('slideChangeTransitionStart', async () => {
    //   this.slideEvent.emit({type: 'changeslide', val: {slide: this.swiper.main.activeIndex}})
    //   //console.log('slide show emitting changeslide slideChangeTransitionStart')
    // })
    // this.swiper.main.on('slideChangeTransitionEnd', async () => {
    //   //console.log('slide show emitting newslide slideChangeTransitionEnd')
    //   this.slideEvent.emit({type: 'newslide', val: this.swiper.main.activeIndex})
    // })
    this.swiper.main.on('init', () => {
      this.slideEvent.emit({type:'init', val: this.swiper})
    })
    this.swiper.main.on('slideChange', (e) => {
      this.slideEvent.emit({type: 'changestart', val: this.swiper.main.activeIndex})
      this.changing = true
      setTimeout(() => {
        this.slideEvent.emit({type: 'changeend', val: this.swiper.main.activeIndex})
        this.changing = false
      }, this.transitionTime)
    })
  }
  @Method()
  getCurrent(): number {
    return this.swiper.main.activeIndex
  }
  @Method()
  slideTo(idx: number, instant: boolean = false, skipCallback: boolean = false) {
    if (idx === this.swiper.main.activeIndex) {
      return
    }
    if (idx < this.swiper.main.activeIndex && this.prevLocked) {
      return
    }
    this.slideEvent.emit({type:'start', val: {
        from: this.swiper.main.activeIndex, 
        to: idx
      }
    })
    this.swiper.thumb.slideTo(idx, instant ? 0 : this.transitionTime, !skipCallback)
    this.swiper.main.slideTo(idx, instant ? 0 : this.transitionTime, !skipCallback)
  }

  @Method()
  lockPrevious() {
    this.prevLocked = true
  }
  @Method()
  unlockPrevious() {
    this.prevLocked = false
  }

  @Method()
  async loadImages(images: string[]){
    //console.log('SlideShow loading images', images)
    let cache = new CacheImage()
    let sizes: {width: number, height: number}[]
    try {
      sizes = await cache.cacheImages(images)
    } catch(e) {
      throw new Error('Could not cache images '+ e)
    }
    let newSlides: Slide[] = []
    for (let i = 0; i < images.length; ++i) {
      newSlides.push({
        width: sizes[i].width,
        height: sizes[i].height,
        url: images[i],
        id: this.makeShortId()
      })
    }
    this.slides = newSlides
    this.updating = true
    return this.slides
  }

  @Method()
  highlightSlide(idx: number) {
    if (idx > this.slides.length -1) {
      throw new Error('slide out of range')
    }
    this.changeState({highlight: idx})
  }
  @Method()
  getCurrentImageElement(): HTMLImageElement {
    return this.el.shadowRoot.querySelector('.swiper-container.main .swiper-slide.swiper-slide-active img')
  }
  @Method() 
  isChanging(): boolean {
    return this.changing
  }

  componentDidUpdate() {
    if (this.updating && !this.initialized) {
      this.swiper.main.init()
      this.swiper.thumb.init()
      this.initialized = true
    }
    this.updating = false
  }

  getSlideContentSize(): Promise<DOMRect> {
    return new Promise((resolve, reject) => {
      let slideEl:HTMLImageElement = this.el.shadowRoot.querySelector('.swiper-container.main .swiper-slide.swiper-slide-active img')
      let i = 0
      let wait = setInterval(function() {
        let w = slideEl.naturalWidth,
            h = slideEl.naturalHeight
        if (w && h) {
          clearInterval(wait)
          resolve(slideEl.getBoundingClientRect() as DOMRect)
        }
        if (i === 100) {
          clearInterval(wait)
          reject()
        }
        ++i
      }, 30)
    })
  }

  getSlideFrameSize(): DOMRect {
    let slideEl = this.el.shadowRoot.querySelector('.swiper-container.main .swiper-slide.swiper-slide-active')
    return slideEl ? slideEl.getBoundingClientRect() as DOMRect : null
  }

  //
  // Util
  //
  makeShortId(): string {
    return Math.random().toString(36).substr(2, 9);
  }  
  changeState(newStates: State) {
    let s = Object.assign({}, this.state)
    Object.assign(s, newStates)
    this.state = s
  }

  handleClick(evt: UIEvent, idx: number) {
    this.slideTo(idx)
  }

  render() {
    const getAspectClass = (s: Slide) => {
      let frame = this.getSlideFrameSize()
      if (!frame) {
        return 'fitheight'
      }
      let ar_slide = frame.width / frame.height 
      let ar_img = s.width / s.height
      return ar_img > ar_slide ? 'fitwidth' : 'fitheight'
    }
    return (
<div>
  <div class="swiper-container main">
    <div  class="swiper-wrapper">
      {this.slides.map((slide, index) => 
        <div class={"swiper-slide" + (this.state.highlight === index ? ' highlight' : '')}
            onClick={ (event: UIEvent) => this.handleClick(event, index)}>
          <img class={getAspectClass(slide)}  src={slide.url}/>
        </div>
      )}
    </div>
    <div class="swiper-pagination"></div>
    <div class="swiper-button-prev"></div>
    <div class="swiper-button-next"></div>
  </div>
  <div class="swiper-container thumb">
    <div class="swiper-wrapper">
      {this.slides.map((slide, index) => 
        <div class={"swiper-slide" + (this.state.highlight >= index ? ' highlight' : '')}
            onClick={ (event: UIEvent) => this.handleClick(event, index)}>
          <img class={getAspectClass(slide)} src={slide.url} />
        </div>
      )}
    </div>
  </div>
</div>
    )
  }
}

// {this.slides.map((slide) => 
//   <div class="swiper-slide" style={getSlideStyle(slide.bg)}></div>
// )}

// {this.slides.map((slide, index) => 
//   <div class="swiper-slide" onClick={ (event: UIEvent) => this.handleClick(event, index)}>
//     {/* <div class="image-wrapper"> */}
//       <div class="imgdiv" onClick={ (event: UIEvent) => this.handleClick(event, index)}
//         style={getSlideStyle(slide.bg)}></div>
//     {/* </div> */}
//   </div>
// )}

{/* <div class="swiper-container main">
<div  class="swiper-wrapper">
  {this.slides.map((slide, index) => 
    <div class="swiper-slide" 
        onClick={ (event: UIEvent) => this.handleClick(event, index)}
        >
      <img class={higherAspectRatio(index) ? 'fitwidth' : 'fitheight'} onLoad={() => imageLoad(index)} id={'i'+index.toString()} src={slide.url}/>
    </div>
  )}
</div>
<div class="swiper-pagination"></div>
<div class="swiper-button-prev"></div>
<div class="swiper-button-next"></div>
</div> */}