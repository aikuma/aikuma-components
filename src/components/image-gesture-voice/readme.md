# aikuma-image-gesture-voice



<!-- Auto Generated Below -->


## Events

| Event       | Description | Type                  |
| ----------- | ----------- | --------------------- |
| `aikumaIGV` |             | `CustomEvent<string>` |


## Methods

### `loadFromImageURLs(images: string[], opts?: IGVOptions) => Promise<any>`



#### Returns

Type: `Promise<any>`



### `restoreFromIGVData(igvd: IGVData) => Promise<void>`



#### Returns

Type: `Promise<void>`



### `waitForComplete() => Promise<IGVData>`



#### Returns

Type: `Promise<IGVData>`




## Dependencies

### Depends on

- [aikuma-buttony](..\buttony)
- [aikuma-modal](..\modal)
- [aikuma-slide-show](..\slide-show)

### Graph
```mermaid
graph TD;
  aikuma-image-gesture-voice --> aikuma-buttony
  aikuma-image-gesture-voice --> aikuma-modal
  aikuma-image-gesture-voice --> aikuma-slide-show
  style aikuma-image-gesture-voice fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
