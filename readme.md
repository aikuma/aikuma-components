![Built With Stencil](https://img.shields.io/badge/-Built%20With%20Stencil-16161d.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI%2BCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI%2BCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU%2BCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik00MjQuNywzNzMuOWMwLDM3LjYtNTUuMSw2OC42LTkyLjcsNjguNkgxODAuNGMtMzcuOSwwLTkyLjctMzAuNy05Mi43LTY4LjZ2LTMuNmgzMzYuOVYzNzMuOXoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQyNC43LDI5Mi4xSDE4MC40Yy0zNy42LDAtOTIuNy0zMS05Mi43LTY4LjZ2LTMuNkgzMzJjMzcuNiwwLDkyLjcsMzEsOTIuNyw2OC42VjI5Mi4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDI0LjcsMTQxLjdIODcuN3YtMy42YzAtMzcuNiw1NC44LTY4LjYsOTIuNy02OC42SDMzMmMzNy45LDAsOTIuNywzMC43LDkyLjcsNjguNlYxNDEuN3oiLz4KPC9zdmc%2BCg%3D%3D&colorA=16161d&style=flat-square)

# Aikuma Web Components

This repo is a Web Component based port of the image, gesture, voice (IGV) activity in the Zahwa mobile app.
Instead of using Angular and Ionic, these package is a collection of standard Web Components compiled by Ionic's amazing StencilJS.

This is a work in progress, but it's looking good.

## Components

* aikuma-image-gesture-voice
* aikuma-translate-igv (wip)
* aikuma-slide-show
* aikuma-buttony
* aikuma-modal

The first two components are higher order components that implement entire activities.
Both use the the gestate gesture record/playback component and the slow-show component wrapper for Swiper.

## Dependencies

* @aikuma/webaudio microphone web-audio player library 
* @aikuma/gestate gesture recording library

## Using aikuma-image-gesture-voice

<aikuma-image-gesture-voice></aikuma-image-gesture-voice>

```let igv = document.querySelector('aikuma-image-gesture-voice')
igv.loadFromImageURLs(['http://...pic.jpg', 'http://...pic.jpg'...])
igv.waitForComplete().then((igvdata) => {
  if (igvdata) {
    console.log('aikuma-image-gesture-voice returned',igvdata)
  } else {
    console.log('aikuma-image-gesture-voice cancelled')
  }
})
```
## Demo

Simply `npm start`

See src/index.html

# Why?

This is part of Mat Bettinson's PhD research. Specifically, an investigation into a suitable architecture and implementation pattern for reusable software components for language-related apps.

Web Components are where it's at. Seriously.

