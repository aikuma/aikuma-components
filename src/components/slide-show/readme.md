# aikuma-slide-show



<!-- Auto Generated Below -->


## Events

| Event        | Description | Type                                              |
| ------------ | ----------- | ------------------------------------------------- |
| `slideEvent` |             | `CustomEvent<{type: string, val: any}>`           |
| `slideSize`  |             | `CustomEvent<{content: DOMRect, frame: DOMRect}>` |


## Methods

### `getCurrent() => Promise<number>`



#### Returns

Type: `Promise<number>`



### `getCurrentImageElement() => Promise<HTMLImageElement>`



#### Returns

Type: `Promise<HTMLImageElement>`



### `getSwiperInstances() => Promise<{ main?: any; thumb?: any; }>`



#### Returns

Type: `Promise<{ main?: any; thumb?: any; }>`



### `highlightSlide(idx: number) => Promise<void>`



#### Parameters

| Name  | Type     | Description |
| ----- | -------- | ----------- |
| `idx` | `number` |             |

#### Returns

Type: `Promise<void>`



### `isChanging() => Promise<boolean>`



#### Returns

Type: `Promise<boolean>`



### `loadImages(images: string[], settings?: SlideshowSettings) => Promise<Slide[]>`



#### Parameters

| Name       | Type                | Description |
| ---------- | ------------------- | ----------- |
| `images`   | `string[]`          |             |
| `settings` | `SlideshowSettings` |             |

#### Returns

Type: `Promise<Slide[]>`



### `loadSlides(slides: Slide[]) => Promise<void>`



#### Parameters

| Name     | Type      | Description |
| -------- | --------- | ----------- |
| `slides` | `Slide[]` |             |

#### Returns

Type: `Promise<void>`



### `lockPrevious() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `slideTo(idx: number, instant?: boolean) => Promise<void>`



#### Parameters

| Name      | Type      | Description |
| --------- | --------- | ----------- |
| `idx`     | `number`  |             |
| `instant` | `boolean` |             |

#### Returns

Type: `Promise<void>`



### `unlockPrevious() => Promise<void>`



#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
