![Built With Stencil](https://img.shields.io/badge/-Built%20With%20Stencil-16161d.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI%2BCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI%2BCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU%2BCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik00MjQuNywzNzMuOWMwLDM3LjYtNTUuMSw2OC42LTkyLjcsNjguNkgxODAuNGMtMzcuOSwwLTkyLjctMzAuNy05Mi43LTY4LjZ2LTMuNmgzMzYuOVYzNzMuOXoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQyNC43LDI5Mi4xSDE4MC40Yy0zNy42LDAtOTIuNy0zMS05Mi43LTY4LjZ2LTMuNkgzMzJjMzcuNiwwLDkyLjcsMzEsOTIuNyw2OC42VjI5Mi4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDI0LjcsMTQxLjdIODcuN3YtMy42YzAtMzcuNiw1NC44LTY4LjYsOTIuNy02OC42SDMzMmMzNy45LDAsOTIuNywzMC43LDkyLjcsNjguNlYxNDEuN3oiLz4KPC9zdmc%2BCg%3D%3D&colorA=16161d&style=flat-square)

# Aikuma Web Components

The repo is a library of reusable Web Components for knowledge preservation apps. 

We offer an implementation of the Image Gesture Voice (IGV) method, as described in [Image-Gesture-Voice: a Web Component for Eliciting Speech](http://lrec-conf.org/workshops/lrec2018/W26/summaries/22_W26.html). IGV was previously developed as the key activity in the [Zahwa](https://zahwa.aikuma.org) mobile app implemented with Ionic (and Angular).
The web component ports are built with Ionic's [StencilJS](http://www.stenciljs.com).

## Components

* aikuma-image-gesture-voice
* aikuma-translate-igv (wip)
* aikuma-slide-show
* aikuma-buttony
* aikuma-modal

The first two components are higher order components that implement entire activities. Both use the the [@aikuma/gestate](https://github.com/aikuma/gestate) gesture record/playback library and [@aikuma/webaudio](https://github.com/aikuma/webaudio) web audio library.

The aikuma-slide-show component is a web component wrapper of [Swiper](http://idangero.us/swiper/). 

aikuma-buttony and aikuma-modal are low-level UI elements we intend to replace with components from the upcoming web component-implemented Ionic framework.

## Consuming Web Components as APIs

A common way of interacting with custom components is via attribute properties. For example; `<custom-tag prop={{data}}>`. JavaScript frameworks allow binding of data to properties with differences in syntax. This method is supported in WebComponents by watching for attribute value changes. We believe this is sub-optimal because implementations vary across JavaScript frameworks, there's a risk of degraded performance, and finally, this pattern differs from the pattern of consuming JavaScript module APIs at large.

Instead, these web components offer JavaScript APIs consisting of public methods which are exposed directly upon the custom component in the DOM. For example, we include a custom component on a web page:

`<aikuma-image-gesture-voice></aikuma-image-gesture-voice>`

And then we get the instance of this component with: `let igv = document.querySelector('aikuma-image-gesture-voice')`
The API for the component is now available on the `igv` object, such as `igv.loadFromImageURLs()`.

Another motivation for this pattern is that web components in this domain will need to be initialized from different contexts. In one context, the component is initialized with raw data such as images. In another context, we need to launch the component with the data that enables restoration of a previous working state. With a JavaScript API we support this via alternative initialisation methods.

## General pattern

Aikuma Web Components library adopts TypeScript, and for the purpose of this document, we assume that parent also uses TypeScript and/or modern ES6+ JavaScript features. The examples here use the `await` keyword for clarity, rather than the Promise pattern. This requires that the calling function is an async function.

## Image Gesture Voice (IGV)

IGV is a process whereby we import a series of image prompts and then record a spoken description of the images and any touch or mouse gestures on the images as the operator speaks. IGV was designed as a method to document procedural discourse (how-to knowledge) but is flexible enough to be deployed in other contexts. 

The IGV Translate component, documented in the next section, provides the means to record a step-by-step spoken translation of an IGV session.

### Example

```
let igv = document.querySelector('aikuma-image-gesture-voice')
await igv.componentOnReady()
igv.loadFromImageURLs(['http://...pic.jpg', 'http://...pic.jpg'...])
igv.waitForComplete().then((igvdata) => {
  if (igvdata) {
    console.log('aikuma-image-gesture-voice returned',igvdata)
  } else {
    console.log('aikuma-image-gesture-voice cancelled')
  }
})
```

See also src/index.html for the demo source.

### Demo

`npm start`

### API

`loadFromImageURLs(images: string[], opts?: <b>IGVOptions</b>): Promise<any>`

Initialize the component from an array of URLs (strings). The order will be preserved as slides. Returns a promise that resolves once the images have been loaded. May also pass an optional object with valid <b>IGVOptions</b> properties.

`waitForComplete(): Promise<IGVData>`

Returns a promise that resolves with <b>IGVData</b> or `null` if the action was cancelled.

`restoreFromIGVData(data: <b>IGVData</b>): Promise<any>`

Restore the component from previous <b>IGVData</b>. Returns a Promise that resolves when loaded.

### Types

<b>IGVData</b>
```
{
  segments: IGVSegment[]
  audio: Blob
  length: {ms: number, frames: number}
}
```
An IGVData object represents complete IGV data, consisting of an array of IGVSegments, a binary audio Blob (wav file) of the audio recording in the process, and a length object that specifies milliseconds and frames (samples). We can infer a virtual IGV timeline based on the length, which is always the length of the audio file. IGVSegments are aligned to this timeline so that they specify a start position that must be less than the total length.

<b>IGVSegment</b>
```
{
  prompt: IGVPrompt,
  startMs: number,
  endMs?: number
  gestures?: Gesture[]
}
```
An IGVSegment object describes the utilisation of an IGVPrompt on the IGV time line. The prompt property is an IGVPrompt, and startMs represents the millisecond offset from the start of the time line, e.g. the time at which this prompt was displayed. An optional endMs property describes the end of the prompt display. The optional gestures property is an array of <b>Gesture</b> objects as defined in the `@aikuma/gestate` library, but duplicated in the Types heading below for convenience.

<b>IGVPrompt</b>
```
{
  id: string,
  type: string,
  image?: Slide
}
```
An IGVPrompt object contains a unique id string property, and an optional binary image Blob that represents this prompt. The type property describes the type of prompt, which is always 'image' for IGV. The optional image property is of type <b>Slide</b> from the `slide-show` component.

<b>IGVOptions</b>
```
{
  debug: boolean
}
```
IGVOptions is an object that describes a set of options for the component, currently consisting of only the debug boolean property flag.

<b>Slide</b>
```
{
  url: string
  width: number
  height: number
  id: string
}
```
Defined by slide-show component, Slide is a description of a unique image. The properties consist of a url to the image (string), and numerical dimensions of the width, height properties and a unique id. The ids are created for the first time when the IGV compnent loads from raw images, e.g. `loadFromImageURLs() method.

<b>Gesture</b>
```
{
  timeOffset: number
  type?: string
  timeLine: {x: number, y: number, t: number}[]
}
```
Defined by @aikuma/gestate, a Gesture object is a description of a gesture consisting of a timeoffset value in milliseconds of the start of the gesture for the current prompt, <em>not</em> since the beginning of the IGV timeline. The timeLine property is an array of objects which have relative floats of touch/mouse position x and y, ranging from 0 to 1, and t represents a millisecond offset from the start of the gesture, e.g. the first one will be 0.

### Dependencies

* @aikuma/webaudio microphone web-audio player library 
* @aikuma/gestate gesture recording library

## Translate IGV

Translate IGV is typically called with data resulting from the Image Gesture Voice component. The operator may record a spoken translation of an IGV session, or perhaps respeak an IGV session more clearly for second language learners.

The component offers a step-by-step translation procedure similar to the earlier Aikuma Android app. The component produces data that consists of a new audio recording and a timeline map which describes the alignment of segments of the translated audio against segments of the source audio.

### Example

```
let tigv = document.querySelector('aikuma-igv-translate')
await tigv.componentOnReady()
let igvData = ... previous IGVData
tigv.loadIGVData(igvData)
tigv.waitForComplete().then((tigvdata) => {
  if (tigvdata) {
    console.log('aikuma-igv-translate returned', tigvdata)
  } else {
    console.log('aikuma-igv-translate cancelled')
  }
})
```

### API

`loadIGVData(data: IGVData, opts?: <b>IGVOptions</b>): Promise<any>`

Initialize the component from IGVData, e.g. the data object returned by the Image Gesture Voice component's waveForComplete() method. Returns a promise that resolves once the iIGVData has loaded. May also pass an optional object with valid <b>IGVOptions</b> properties.

`waitForComplete(): Promise<IGVTranslation>`

Returns a promise that resolves with <b>IGVTranslation</b> or `null` if the action was cancelled.

### Types

<b>IGVTranslation</b>
```
{
  segments: IGVSegment[]
  audio: Blob
  length: {ms: number, frames: number}
}
```
An IGVTranslation object represents a complete IGV translation. A binary `audio` Blob (wav file) of the audio recording in the process, and a `length` object that specifies milliseconds and frames (samples) properties.

### Dependencies

* @aikuma/webaudio microphone web-audio player library 
* @aikuma/gestate gesture recording library


## Slide Show

Slide Show is a wrapper around the Swiper JavaScript module.

### Example

```
let ss = document.querySelector('aikuma-slide-show')
await ss.componentOnReady()
let slides = await ss.loadImages(['http://...image1.jpg', 'http://...image2.jpg' ...])
})
```

### API

`loadImages(images: string[]): Promise<Slide[]>`

Initializes by taking an array of url strings for the slide images and returns a Promise that resolves with a Slide array. The Slide objects are useful because they add dimensions and a unique id for the image. 

`loadSlides(slides: Slide[]): Promise<any>`

Initializes by being passed an array of Slide objects, generated from loadImages, e.g. restoring a session. The returned Promise resolves when complete.

`getCurrent(): number`

Returns current slide index.

`slideTo(idx: number, instant: boolean = false, skipCallback: boolean = false)`

Transition the slide show to the current idx index. Optional boolean instant argument specifies if the transition should be instantaneous and the skipCallback boolean flag specifies if callbacks should be disabled. If they are, Slide Show will not emit slide transition events.

`lockPrevious()`

Stops the Slide Show from being navigated to the previous slide. Useful when recording IGV.

`unlockPrevious()`

Allows Slide Show to navigate backwards.

`highlightSlide(idx: number)`

Highlights the idx slide, as specified as an index of the current slides.

`getCurrentImageElement(): HTMLImageElement`

Obtains the actual image element for the currently displayed slide. Useful if we wish to, say, resize an overlay to the real dimensions of the image element.

`isChanging(): boolean`

Returns true if there is a transition underway. Useful to check for debouncing actions.

`getSwiperInstances(): {main: Swiper, thumb: Swiper}`

Returns an object with the main and thumbnail Swiper instances if direct control of Swiper is desired.
Note that the thumb Swiper is not slaved to the main Swiper (because that's buggy), so operations will often need to be performed on both instances.

### Dependencies

* Swiper JavaScript module

# Why?

This project is motivated by the need to improve development productivity of knowledge preservation apps. Generally speaking, the environment of this genre is seriously resource constrained. We can ill afford continual cycles of reinventing the wheel. Reusing prior work is essential. Thematically we focus on knowledge preservation methods and applications which are intended to be operated by ordinary people rather than experts.

This is part of Mat Bettinson's PhD research investigating suitable architecture and implementation pattern for reusable software components for language-related apps.

