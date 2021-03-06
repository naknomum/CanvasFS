# CanvasFS

**CanvasFS** is a simple utility for storing binary data in a JavaScript `canvas` element. In particular, it stores the bytes as the pixel RGB values in the canvas. 

## Why?
As a sort of *experiment*, basically. Arbitrary data can be put into the canvas and then stored as a PNG using `.toDataURL("image/png")`, for example.  Since the binary data is arbitrary, it could contain encrypted data, block file systems (hence the name... kind of joking?), etc.

## How?
```javascript
var canv = document.getElementById('some-canvas');
CanvasFS(canv);
var data = new Uint8ClampedArray(...);
canv.cfsSetData(data);
var out = canv.cfsGetData();
```

## Details
Data input/output is a [`Uint8ClampedArray`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray), so you will need to manipulate this to suit your needs.  Data is stored only in the **RGB** bytes of the canvas, as I experienced some inconsistent behavior with how the alpha byte persisted in some situations, such as conversion to PNG, which varied by browser, etc.

The current implementation resizes the canvas to the **nearest square image** that will fit all the data.  This could easily be extended to accommodate constraints such as specified aspect ratios, width/height, etc.  Unless the canvas is set to be a *single pixel wide* (or high), there is likely going to be the case that there will be *unused pixels*.  Unused pixels have the **alpha byte set to 0** (and data-carrying pixels have it set to 255).

Note also that since each pixel represents three bytes of data (RGB in the RGBA data for the pixel), data will always be stored on a boundary of 3, so there may be some padded 0x00 bytes in the final pixel.  I have plans to solve this by setting the alpha value of this last pixel to denote how many bytes to use.  (Or possibly set the first few bytes to be length... but classic problem of how many???)

## Example
 ![there is data in here](https://i.imgur.com/GYpBEGg.png)

You can try out manipulating canvas data with `example.html` or via [this demo](https://naknomum.github.io/CanvasFS/).

For kicks, I added some **steganographic functionality**. This expects the canvas to be loaded with an image, and then attempts to "hide" the data in the image.  It does so by manipulating the *least-significant bit* of the RGB values for existing pixels in the image.  Eight consecutive such bits (*i.e.* 2-2/3 pixels) will store one byte of input data.  The first two bytes stored this way represent the length of bytes of actual data stored.  This functionality is available using `canv.cfsSetSteg(data)` and `canv.cfsGetSteg()`.

I have added `canv.cfsStringToArr()` and `canv.cfsArrToString()` to attempt to convert text strings to/from Uint8ClampedArray.  These do not hold up well under UTF-8, so ymmv.


##Notes

Using [this post](http://stackoverflow.com/a/11585939) as a guideline, it looks like most decent desktop browsers (Chrome, Firefox, Safari) can handle *approximately* 300m pixels in a single canvas.  Since CanvasFS utilizes the RGB bytes per pixel, this means the canvas could store almost a billion bytes of data!  I have my suspicions that for large blobs of data, CanvasFS would be unusuably slow, but it might be an interesting excercize to write more efficient seek, read, and write algorithms that use low-level canvas pixel calls.
