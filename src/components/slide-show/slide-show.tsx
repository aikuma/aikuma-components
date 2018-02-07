import { Component, Element, Prop, Method, State } from '@stencil/core'
//import Swiper from 'swiper'
import { Swiper, Navigation, Lazy, Pagination, Controller } from 'swiper/dist/js/swiper.esm.js'

Swiper.use([Navigation, Lazy, Pagination, Controller])

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
  styleUrls: ['../../../node_modules/swiper/dist/css/swiper.css', 'slide-show.scss'],
  shadow: true
})
export class SlideShow {
  @Element() el: HTMLElement
  @State() slideSize: {x: number, y: number} = {x: 0, y: 0}
  @State() slides: Slide[] = []

  swiper: {
    main: Swiper,
    thumb: Swiper
  }
  updating: boolean = false
  initialized: boolean = false
  handlers: any[] = [] // used for removing event handlers on destroy
  orientation: string // 'landscape' or 'portrait'

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
      slidesPerView: 'auto',
      watchSlidesVisibility: true,
      direction: 'horizontal',
      pagination: {
        el: this.el.shadowRoot.querySelector('.swiper-container.main .swiper-pagination'),
        type: 'bullets'
      },
      preloadImages: false,
      lazy: true,
      centeredSlides: true,
      grabCursor: true,
      slideToClickedSlide: true, // other sldes only visible in landscape mode
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
      autoHeight: false
    })
    let sthumbel = this.el.shadowRoot.querySelector('.swiper-container.thumb')
    console.log('thumbel', sthumbel)
    let sthumbctrl = new Swiper(sthumbel, {
      init: false,
      loop: false,
      longSwipes: false,
      direction: 'horizontal',
      slidesPerView: 'auto',
      centeredSlides: true, // tying two sliders together is bugged without this
      spaceBetween: 5,
      touchRatio: 0.3,
      slideToClickedSlide: true,
      navigation: {
        nextEl: this.el.shadowRoot.querySelector('.swiper-container.thumb .swiper-button-next'),
        prevEl: this.el.shadowRoot.querySelector('.swiper-container.thumb .swiper-button-prev')
      },
      controller: {
        control: smainctrl
      }
    })
    this.swiper = {
      main: smainctrl,
      thumb: sthumbctrl
    }
    console.log('main swipr', smainctrl)
    function listen(element, type, handler) {
      element.addEventListener(type, handler);
      return function() {
        element.removeEventListener(type, handler);
      }
    }
    this.handlers.push(listen(window, 'resize', (event) => {
      let height = event.currentTarget['innerHeight']
      let width = event.currentTarget['innerWidth']
      this.orientation = width > height ? 'landscape' : 'portrait'
      console.log('orientation', this.orientation)
      if (this.initialized) {
        let spv = height > width ? 1 : 'auto'
        if (spv !== this.swiper.main.slidesPerView) {
          console.log('changing', spv)
          this.swiper.main.slidesPerView = spv
          this.swiper.main.update()
        }
      }
    }))
    this.swiper.main.on('slideChange', () => {
      console.log('slideChange')
      
    })
    this.swiper.main.on('slideChangeTransitionEnd', () => {
      console.log('slideChangeTransitionEnd')
      this.calculateSlideSize()
    })
    this.swiper.main.on('lazyImageReady', () => {
      console.log('lazyImageReady')
      this.calculateSlideSize()
    })
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
    console.log('SlideShow did update')
    if (this.updating && !this.initialized) {
      this.swiper.main.init()
      this.swiper.thumb.init()
      this.initialized = true
    }
    this.updating = false
  }

  componentDidUnload() {
    for (let unsub of this.handlers) {
      unsub()
    }
  }

  calculateSlideSize() {
    let slideEl = this.el.shadowRoot.querySelector('.swiper-container.main .swiper-slide.swiper-slide-active .image-wrapper')
    console.log('el', slideEl.clientWidth, slideEl.clientHeight)
    if (slideEl.clientWidth) {
      this.slideSize = {
        x: slideEl.clientWidth,
        y: slideEl.clientHeight
      }
    }
  }

  render() {
    const getSlideStyle = (bg: string) => {
      return {
        backgroundImage: bg
      }
    }
    return (
<div>
  IGV
  <div class="swiper-container main">
    <div class="swiper-wrapper">

      {this.slides.map((slide) => 
        <div class="swiper-slide">
          <div class="image-wrapper">
            <img data-src={slide.url} class="swiper-lazy"/>
            <div class="swiper-lazy-preloader"></div>
          </div>
        </div>
      )}
    </div>
    <div class="swiper-pagination"></div>
    <div class="swiper-button-prev"></div>
    <div class="swiper-button-next"></div>
    <aikuma-gestate size={this.slideSize}></aikuma-gestate>
  </div>
  <div class="swiper-container thumb">
    <div class="swiper-wrapper">
      {this.slides.map((slide) => 
        <div class="swiper-slide" style={getSlideStyle(slide.bg)}></div>
      )}
    </div>
    <div class="swiper-button-prev"></div>
    <div class="swiper-button-next"></div>
  </div>
</div>
    )
  }
}

// {this.slides.map((slide) => 
//   <div class="swiper-slide" style={getSlideStyle(slide.bg)}></div>
// )}