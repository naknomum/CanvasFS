function CanvasFS(cfsEl) {
    cfsEl.cfsSetData = function(d) {
        if (!(d instanceof Uint8ClampedArray)) {
            console.error('cfsSetData() passed something other than string or Uint8ClampedArray');
        }
        var ctx = this.getContext('2d');
        var s = Math.ceil(Math.sqrt(d.byteLength / 4));
console.log('cfsSetData() using square side length %d', s);
        this.setAttribute('width', s);
        this.setAttribute('height', s);
        var idata = ctx.createImageData(s, s);
        idata.data.set(d);
        ctx.putImageData(idata, 0, 0);
        return idata;
    };

    cfsEl.cfsGetData = function() {
        var ctx = this.getContext('2d');
        var idata = ctx.getImageData(0, 0, this.width, this.height);
        var raw = idata.data;
        var arr = new Array();
        for (var i = 3 ; i < raw.length ; i += 4) {
            if (raw[i] == 0) {  //bail when alpha value is zero
                i = raw.length + 1;
            } else {
                for (var j = 0 ; j < 3 ; j++) {
                    arr.push(raw[i - 3 + j]);
                }
            }
        }
        return new Uint8ClampedArray(arr);
    };


		//this uses a two-byte length encoding in first two bytes... sorry if you want longer. :)
    cfsEl.cfsSetSteg = function(d) {
        if (!(d instanceof Uint8ClampedArray)) {
            console.error('cfsSetSteg() passed something other than string or Uint8ClampedArray');
        }
        var ctx = this.getContext('2d');
        var idata = ctx.getImageData(0, 0, this.width, this.height);
				var id = 0;
				for (var i = -2 ; i < d.length; i++) {
					//for (var b = 0 ; b < 8 ; b++) {
					for (var b = 7 ; b >= 0 ; b--) {
						if (id >= idata.data.length) {
							console.warn('cfsSetSteg(): ran out of space in image, truncated input at i=' + i);
							ctx.putImageData(idata, 0, 0);
							return i;
						} else {
							var by;
							if (i == -2) {
								by = d.length >> 8;
							} else if (i == -1) {
								by = d.length & 0x00FF;
							} else {
								by = d[i];
							}
							if (by & (1 << b)) {
								idata.data[id] = idata.data[id] | 1;
							} else {
								idata.data[id] = idata.data[id] & 0xFE;
							}
//console.info('d[%d] => %d   %d.%d => %d', i, by, id, b, idata.data[id]);
							id++;
							if (id % 4 == 3) id++;  //skip alpha
						}
					}
				}
				ctx.putImageData(idata, 0, 0);
				console.info('cfsSetSteg() wrote %d bytes into %d bytes of imagedata', d.length, id);
				return d.length;
    };

    cfsEl.cfsGetSteg = function() {
				var arr = new Array()
				var len = 0;
        var ctx = this.getContext('2d');
        var idata = ctx.getImageData(0, 0, this.width, this.height);
        var raw = idata.data;
				var b = 7;
				var by = 0;
				var byteCount = -2;
				for (var i = 0 ; i < raw.length ; i++) {
					if ((byteCount > 0) && (byteCount > len - 1)) {
console.info('cfsGetSteg() successfully reached len=%d', len);
//console.info('reached len=%d, arr => %o', len, arr);
        		return new Uint8ClampedArray(arr);
					}
					if (i % 4 == 3) continue;
					by = by | ((raw[i] & 1) << b);
//console.info('[%i>%i] by[%d/%d]=%o (raw[i] & 1 = %o)', i, raw[i], byteCount, len, by, (raw[i] & 1));
					b--;
					if (b < 0) {
//console.log('[%d/%d] got all bits to make by=%o', byteCount, len, by);
						if (byteCount == -2) {
							len = by << 8;
console.info('  len[0] -> %d', len);
						} else if (byteCount == -1) {
							len = len | by;
console.info('  len[1] -> %d', len);
						} else {
							arr.push(by);
						}
						by = 0;
						b = 7;
						byteCount++;
					}
				}
				console.warn('cfsGetSteg() fell thru to bottom of cfsGetSteg(); possible weird length problem');
//console.info('arr => %o', arr);
        return new Uint8ClampedArray(arr);
    };


///////// some utilities (mostly string conversion)

/* note, there are better (utf8) solutions here: http://stackoverflow.com/q/6965107 (just too lazy to do now) */
    cfsEl.cfsStringToArr = function(str, padAlpha) {
        var a = new Array();
        var len = str.length;
        if (len % 3) len += (3 - len % 3);
        for (var i = 0 ; i < len ; i++) {
//console.log(str.charCodeAt(i));
            if (i < str.length) {
                a.push(str.charCodeAt(i));
            } else {
                a.push(0);
            }
            if (padAlpha && (i % 3 == 2)) a.push(255);  // alpha value
        }
//console.info('a => %o', a);
        return new Uint8ClampedArray(a);
    };

    cfsEl.cfsArrToString = function(buf) {
        return String.fromCharCode.apply(null, new Uint8ClampedArray(buf));
    };


}

