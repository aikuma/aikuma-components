import { Component, Element, Method, State, Event, EventEmitter } from '@stencil/core'
import Swiper from 'swiper'
import { CacheImage } from './cacheimage'
import { Slide, SlideshowSettings } from '../../interface'

//import { Swiper, Navigation, Lazy, Pagination, Controller, EffectCoverflow } from 'swiper/dist/js/swiper.esm.js'

//Swiper.use([Navigation, Lazy, Pagination, Controller, EffectCoverflow])

interface State {
  highlight?: number,
  portrait?: boolean 
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
    main?: Swiper,
    thumb?: Swiper
  } = {}
  updating: boolean = false
  initialized: boolean = false
  prevLocked: boolean = false
  transitionTime: number = 300
  changing: boolean = false
  settings: SlideshowSettings = {
    showThumbs: true,
  }
  orientlistener: any
  @State() state: State = {
    highlight: -1,
    portrait: window.innerHeight > window.innerWidth
  }

  componentDidLoad() {
    //this.initSwiper()
    const orientlistener = () => {
      this.orientationChange()
    }
    this.orientlistener = orientlistener
    window.addEventListener("orientationchange", this.orientlistener)
  }

  orientationChange() {
    this.changeState({portrait: screen.orientation.angle === 0})
  }

  initSwiper(): void {
    // main swiper
    let smainel = this.el.shadowRoot.querySelector('.swiper-container.main')
    this.swiper.main = new Swiper(smainel, { 
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
    // thumb swiper
    let sthumbel = this.el.shadowRoot.querySelector('.swiper-container.thumb')
    if (this.settings.showThumbs) {
      this.swiper.thumb = new Swiper(sthumbel, {
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
      this.initialized = true
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
    console.log('swiper main', this.swiper.main)
  }

  waitMs(ms: number): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, ms)
    })
  }

  @Method()
  async getCurrent(): Promise<number> {
    return this.swiper.main.activeIndex
  }
  @Method()
  async slideTo(idx: number, instant: boolean = false): Promise<void> {

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
    if (this.settings.showThumbs) {
      this.swiper.thumb.slideTo(idx, instant ? 0 : this.transitionTime)
    }
    this.swiper.main.slideTo(idx, instant ? 0 : this.transitionTime)
  }

  @Method()
  async lockPrevious(): Promise<void> {
    this.prevLocked = true
  }
  @Method()
  async unlockPrevious(): Promise<void> {
    this.prevLocked = false
  }

  @Method()
  async loadImages(images: string[], settings: SlideshowSettings = {}): Promise<Slide[]> {
    Object.assign(this.settings, settings)
    this.initSwiper()
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
    this.initSlides(newSlides)
    await this.waitMs(100)
    this.swiper.main.update()
    if (this.settings.showThumbs) {
      this.swiper.thumb.update()
    }
    return this.slides
  }

  @Method()
  async loadSlides(slides: Slide[]): Promise<void> {
    this.initSlides(slides)
  }

  @Method()
  async highlightSlide(idx: number): Promise<void> {
    if (idx > this.slides.length -1) {
      throw new Error('slide out of range')
    }
    this.changeState({highlight: idx})
  }
  @Method()
  async getCurrentImageElement(): Promise<HTMLImageElement> {
    return this.el.shadowRoot.querySelector('.swiper-container.main .swiper-slide.swiper-slide-active img') as HTMLImageElement
  }
  @Method() 
  async isChanging(): Promise<boolean> {
    return this.changing
  }
  @Method()
  async getSwiperInstances(): Promise<{main?: Swiper, thumb?: Swiper}> {
    return this.swiper
  }

  initSlides(slides: Slide[]) {
    this.slides = slides
    this.updating = true // swiper initialized from componentDidUpdate()
  }

  componentDidUpdate() {
    //console.log('slideshow update', this.updating, this.initialized)
    if (this.updating && !this.initialized) {
      this.swiper.main.init()
      if (this.settings.showThumbs) {
        this.swiper.thumb.init()
      }
      
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

  // Lifecycle 
  componentDidUnload() {
    //console.log('unloaded slideshow')
    if (this.swiper.main) {
      this.swiper.main.destroy(true)
    }
    if (this.swiper.thumb) {
      this.swiper.thumb.destroy(true)
    }
    window.removeEventListener("orientationchange", this.orientlistener)
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

  getAspectClass = (s: Slide) => {
    let frame = this.getSlideFrameSize()
    if (!frame) {
      return 'fitheight'
    }
    let ar_slide = frame.width / frame.height 
    let ar_img = s.width / s.height
    return ar_img > ar_slide ? 'fitwidth' : 'fitheight'
  }

  getThumbJSX() {
    if (!this.settings.showThumbs) {
      return ''
    }
    return (
      <div class="swiper-container thumb">
        <div class="swiper-wrapper">
          {this.slides.map((slide, index) => 
            <div class={"swiper-slide" + (this.state.highlight >= index ? ' highlight' : '')}
                onClick={ (event: UIEvent) => this.handleClick(event, index)}>
              <img class={this.getAspectClass(slide)} src={slide.url} />
            </div>
          )}
        </div>
      </div>
    )
  }

  getSlideStyle() {
    let ss = {}
    if (this.state.portrait) {
      ss = this.settings.ssizePortrait ? 
        this.settings.ssizePortrait :
        {}
    } else {
      ss = this.settings.ssizeLandscape ? 
        this.settings.ssizeLandscape :
        {}
    }
    //console.log('slide style', this.state.portrait, ss)
    return ss
  }

  render() {
    return (
<div>
  <div class="swiper-container main">
    <div  class="swiper-wrapper">
      {this.slides.map((slide, index) => 
        <div class={"swiper-slide" + (this.state.highlight === index ? ' highlight' : '')}
            style={this.getSlideStyle()}
            onClick={ (event: UIEvent) => this.handleClick(event, index)}>
          <img class={this.getAspectClass(slide)}  src={slide.url}/>
        </div>
      )}
    </div>
    { this.slides.length > 1 ? <div class="swiper-pagination"></div> : '' }
    { this.slides.length > 1 ? <div class="swiper-button-prev"></div> : '' }
    { this.slides.length > 1 ? <div class="swiper-button-next"></div> : '' }
  </div>
  {this.getThumbJSX()}
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