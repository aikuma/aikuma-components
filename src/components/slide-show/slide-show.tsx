import { Component, Element, Method, State, Event, EventEmitter } from '@stencil/core'
import Swiper from 'swiper'
//import { Swiper, Navigation, Lazy, Pagination, Controller, EffectCoverflow } from 'swiper/dist/js/swiper.esm.js'

//Swiper.use([Navigation, Lazy, Pagination, Controller, EffectCoverflow])

export interface Slide {
  imageId?: string
  type?: string
  bg: string
  url?: string
  image?: Blob
  video?: Blob
  videoId?: string
}

export interface SlideShowElement extends HTMLElement, SlideShow {}

@Component({
  tag: 'aikuma-slide-show',
  styleUrls: ['../../../node_modules/swiper/dist/css/swiper.css', 'slide-show.css'],
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
  @State() imagesizes: {width: number, height: number}[] = []

  componentWillLoad() {
    console.log('SlideShow is about to be rendered')
  }

  componentDidLoad() {
    console.log('SlideShow was rendered')
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
    console.log('thumbel', sthumbel)
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
      allowTouchMove: false,
      controller: {
        control: smainctrl
      }
    })
    this.swiper = {
      main: smainctrl,
      thumb: sthumbctrl
    }
    
    this.swiper.main.on('slideChangeTransitionEnd', () => {
      this.slideEvent.emit({type:'end', val: this.getSlideContentSize()})
      this.checkAspectRatio(this.swiper.main.activeIndex)
    })
    const emitResize = () => {
      this.slideSize.emit( {
        content: this.getSlideContentSize(),
        frame: this.getSlideFrameSize()
      })
    }
    this.swiper.main.on('resize', () => {
      emitResize()
    })
    this.swiper.main.on('init', () => {
      this.slideEvent.emit({type:'init', val: this.swiper})
      setTimeout(() => {
        emitResize()
      },100)
    })
  }
  @Method()
  getCurrent(): number {
    return this.swiper.main.activeIndex
  }
  @Method()
  slideTo(idx: number) {
    if (idx === this.swiper.main.activeIndex) {
      return
    }
    this.slideEvent.emit({type:'start', val: {
        from: this.swiper.main.activeIndex, 
        to: idx
      }
    })
    this.swiper.thumb.slideTo(idx)
    this.swiper.main.slideTo(idx)
  }

  @Method()
  loadImages(images: string[]): void {
    console.log('SlideShow loading images', images)
    this.slides = images.map((s) => {
      return {
        url: s,
        bg: 'url(' + s + ')'
      } 
    })
    this.updating = true
  }

  componentDidUpdate() {
    //console.log('SlideShow did update')
    if (this.updating && !this.initialized) {
      this.swiper.main.init()
      this.swiper.thumb.init()
      this.initialized = true
    }
    this.updating = false
  }

  // componentDidUnload() {

  // }

  getSlideContentSize(): DOMRect {
    let slideEl = this.el.shadowRoot.querySelector('.swiper-container.main .swiper-slide.swiper-slide-active img')
    return slideEl.getBoundingClientRect() as DOMRect
  }

  getSlideFrameSize(): DOMRect {
    let slideEl = this.el.shadowRoot.querySelector('.swiper-container.main .swiper-slide.swiper-slide-active')
    return slideEl.getBoundingClientRect() as DOMRect
  }

  handleClick(evt: UIEvent, idx: number) {
    console.log('clicked slide', idx, this.swiper.main.activeIndex)
    this.slideTo(idx)
  }

  checkAspectRatio (idx: number) {
    if (!this.imagesizes[idx]) {
      return false
    }
    let frame = this.getSlideFrameSize()
    let ar_slide = frame.width / frame.height 
    let ar_img = this.imagesizes[idx].width / this.imagesizes[idx].height
    console.log(idx, ar_slide, ar_img)
  }

  render() {
    const getSlideStyle = (bg: string) => {
      return {
        backgroundImage: bg
      }
    }
    const imageLoad = (idx: number) => {
      let img = this.el.shadowRoot.querySelector('.swiper-container.main #i'+idx) as HTMLImageElement
      console.log('index', idx, img.naturalWidth, img.naturalHeight)
      let nis = this.imagesizes.slice()
      nis[idx] = {width: img.naturalWidth, height: img.naturalHeight}
      this.imagesizes = nis
    }
    const higherAspectRatio = (idx: number) => {
      if (!this.imagesizes[idx]) {
        return false
      }
      let frame = this.getSlideFrameSize()
      let ar_slide = frame.width / frame.height 
      let ar_img = this.imagesizes[idx].width / this.imagesizes[idx].height
      console.log(idx, ar_slide, ar_img)
      return ar_img > ar_slide
    }
    return (
<div>
  <div class="swiper-container main">
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
  </div>
  <div class="swiper-container thumb">
    <div class="swiper-wrapper">
      {this.slides.map((slide, index) => 
        <div class="swiper-slide" onClick={ (event: UIEvent) => this.handleClick(event, index)}
          style={getSlideStyle(slide.bg)}></div>
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