## 0.1.0

* Revive project, update Stencil.
* Adopt Ionic's shared interface scheme
* Add camera component

## 0.1.1

* IGV record button - tweak style, set colours properly.

## 0.1.2

* IGV calls Gestate destroy() on exit.
* slideshow has settings, init moved to loadImages(), thumbnails are now optional (in settings)
* Migrated @Methods to async (stencil change, shrug)
* Update Stencil to 0.18

## 0.2.0

* Added IGV playback component
* Added slide show settings for slide size

## 0.2.1

* Camera improvements --- adapts to parent container size, ready() promise etc.
* Remove color attributes from buttony, now use css vars button-color, app-primary-color and button-disabled-color, app-disabled-color
* IGV updated to use css vars, implements record-color, play-color and others.

## 0.2.2

* Buttons are now full frame (absolute) positioned and larger to suit mobile devices
* Slideshow slide frame background lightened
* simplified IGV's JSX

## 0.3.0

* Migrated to Stencil 1.0 --- many breaking changes
* start/test code in index.html changed to start IGV
