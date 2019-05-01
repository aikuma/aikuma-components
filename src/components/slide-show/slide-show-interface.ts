export interface Slide {
  url: string
  width: number
  height: number
  id: string
}

export interface SlideshowSettings {
  showThumbs?: boolean
  ssizeLandscape?: {width: string, height: string}
  ssizePortrait?: {width: string, height: string}
}
