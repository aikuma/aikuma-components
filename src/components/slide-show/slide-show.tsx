import { Component, Element, Prop, State } from '@stencil/core'
import { Microphone } from 'aikumic'
import Swiper from 'swiper'

export interface Slide {
  imageId: string
  type: string
  bg: string
  image?: Blob
  video?: Blob
  videoId?: string
}

@Component({
  tag: 'aikuma-slide-show',
  styleUrls: ['../../../node_modules/swiper/dist/css/swiper.css', 'slide-show.scss'],
  shadow: true
})
export class SlideShow {
  @Element() el: HTMLElement
  @Prop() first: string
  @Prop() last: string
  @State() slideSize: {x: number, y: number}
  @State() slides: Slide[] = []

  mic: Microphone = new Microphone()
  swiper: {
    main: {
      el: HTMLElement,
      ctrl: any
    },
    thumb: {
      el: HTMLElement,
      ctrl: any
    }
  }
  swiperEl: HTMLElement
  swiperElt: HTMLElement
  mySwiper: any

  componentWillLoad() {
    console.log('SlideShow is about to be rendered')
  }

  componentDidLoad() {
    console.log('SlideShow was rendered');
    this.swiper.main.el = this.el.shadowRoot.querySelector('.swiper-container,.main')
    this.swiper.thumb.el = this.el.shadowRoot.querySelector('.swiper-container,.thumb')
    this.mySwiper = new Swiper(this.swiperEl, { 
      initialSlide: 0,
      watchSlidesVisibility: true,
      slidesPerView: 'auto',
      direction: 'horizontal',
      pagination: {
        el: '.swiper-pagination',
        type: 'bullets'
      },
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
      }
     })
    this.init()
  }



  init() {
    this.mic.connect()
  }

  render() {
    const getSlideStyle = (bg: string) => {
      return {
        backgroundImage: bg
      }
    }
    return (
<div>
  Hello, World! I'm {this.first} {this.last}
  <div class="swiper-container main">
    <div class="swiper-wrapper">
      {this.slides.map((slide) => 
        <div class="swiper-slide" style={getSlideStyle(slide.bg)}></div>
      )}
      <div class="swiper-slide">Slide 1</div>
      <div class="swiper-slide">Slide 2</div>
      <div class="swiper-slide">Slide 3</div>
    </div>
    <div class="swiper-pagination"></div>
    <div class="swiper-button-prev"></div>
    <div class="swiper-button-next"></div>
    <div class="swiper-scrollbar"></div>
    <gestate-component element={this.s.swiperWrapEl}></gestate-component>
  </div>
  <div class="swiper-container thumb">
    <div class="swiper-wrapper">
      {this.slides.map((slide) => 
        <div  class="swiper-slide" style={getSlideStyle(slide.bg)}></div>
      )}
    </div>
  </div>
</div>
    )
  }
}
