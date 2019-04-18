# aikuma-slide-show



<!-- Auto Generated Below -->


## Events

| Event        | Description | Type                                              |
| ------------ | ----------- | ------------------------------------------------- |
| `slideEvent` |             | `CustomEvent<{type: string, val: any}>`           |
| `slideSize`  |             | `CustomEvent<{content: DOMRect, frame: DOMRect}>` |


## Methods

### `getCurrent() => number`



#### Returns

Type: `number`



### `getCurrentImageElement() => HTMLImageElement`



#### Returns

Type: `HTMLImageElement`



### `getSwiperInstances() => { main: any; thumb: any; }`



#### Returns

Type: `{ main: any; thumb: any; }`



### `highlightSlide(idx: number) => void`



#### Parameters

| Name  | Type     | Description |
| ----- | -------- | ----------- |
| `idx` | `number` |             |

#### Returns

Type: `void`



### `isChanging() => boolean`



#### Returns

Type: `boolean`



### `loadImages(images: string[]) => Promise<Slide[]>`



#### Parameters

| Name     | Type       | Description |
| -------- | ---------- | ----------- |
| `images` | `string[]` |             |

#### Returns

Type: `Promise<Slide[]>`



### `loadSlides(slides: Slide[]) => void`



#### Parameters

| Name     | Type      | Description |
| -------- | --------- | ----------- |
| `slides` | `Slide[]` |             |

#### Returns

Type: `void`



### `lockPrevious() => void`



#### Returns

Type: `void`



### `slideTo(idx: number, instant?: boolean) => void`



#### Parameters

| Name      | Type      | Description |
| --------- | --------- | ----------- |
| `idx`     | `number`  |             |
| `instant` | `boolean` |             |

#### Returns

Type: `void`



### `unlockPrevious() => void`



#### Returns

Type: `void`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
