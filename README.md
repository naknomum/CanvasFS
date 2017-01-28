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
Data input/output is a [`Uint8ClampedArray`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray), so you will need to manipulate this to suit your needs.  Bytes are stored only the the **RGB** bytes of the canvas, as I experienced some inconsistent behavior with how the alpha byte persisted in some situations, such as conversion to PNG, which varied by browser, etc.

The current implementation resizes the canvas to the **nearest square image** that will fit all the data.  This could easily be extended to accommodate constraints such as specified aspect ratios, width/height, etc.  Unless the canvas is set to be a *single pixel wide* (or high), there is likely going to be the case that there will be unused pixels.  Used pixels have the **alpha byte set to 255** and for unused it is set to 0.

Note also that since each pixel represents three bytes of data (RGB in the RGBA data for the pixel), data will always be stored on a boundary of 3, so there may be some padded 0x00 bytes in the final pixel.  I have plans to solve this by setting the alpha value of this last pixel to denote how many bytes to use.

## Example
 ![there is data in here](//i.imgur.com/GYpBEGg.png)
You can try out manipulating canvas data with [example.html](example.html).

For kicks, I added some **steganographic functionality**. This expects the canvas to be loaded with an image, and then attempts to "hide" the data in the image.  It does so by manipulating the *least-significant bit* of the RGB values for existing pixels in the image.  Eight consecutive such bits (*i.e.* 2-2/3 pixels) will store one byte of input data.  The first two bytes stored this way represent the length of bytes of actual data stored.  This functionality is available using `canv.cfsSetSteg(data)` and `canv.cfsGetSteg()`.

I have added `canv.cfsStringToArr()` and `canv.cfsArrToString()` to attempt to convert text strings to/from Uint8ClampedArray.  These do not hold up well under UTF-8, so ymmv.

