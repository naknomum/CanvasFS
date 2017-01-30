function CanvasFS(cfsEl) {

    cfsEl.cfsSetData = function(d) {
        if (!(d instanceof Uint8ClampedArray)) {
            console.error('cfsSetData() passed something other than Uint8ClampedArray');
        }
        var prepped = this.cfsPrepArr(d);
        var ctx = this.getContext('2d');
        var s = Math.ceil(Math.sqrt(prepped.byteLength / 4));
        console.log('cfsSetData() using square side length %d', s);
        this.setAttribute('width', s);
        this.setAttribute('height', s);
        var idata = ctx.createImageData(s, s);
        idata.data.set(prepped);
        ctx.putImageData(idata, 0, 0);
        return idata;
    };

    cfsEl.cfsGetData = function() {
        var ctx = this.getContext('2d');
        var idata = ctx.getImageData(0, 0, this.width, this.height);
        return this.cfsUnprepArr(idata.data);
    };


    //this uses a two-byte length encoding in first two bytes... sorry if you want longer. :)
    cfsEl.cfsSetSteg = function(d) {
        if (!(d instanceof Uint8ClampedArray)) {
            console.error('cfsSetSteg() passed something other than Uint8ClampedArray');
        }
        var ctx = this.getContext('2d');
        var idata = ctx.getImageData(0, 0, this.width, this.height);
        var id = 0;
        for (var i = -2 ; i < d.length; i++) {
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
        return new Uint8ClampedArray(arr);
    };

    //this takes "raw" data (Uint8ClampedArray) and pads it out to skip the alpha bytes. it also does some other
    //  work, like puts in the end byte (which has alpha = 0)
    cfsEl.cfsPrepArr = function(arr) {
        if (!(arr instanceof Uint8ClampedArray)) {
            console.error('cfsPrepArr() passed something other than Uint8ClampedArray');
        }
        var a = new Array();
        var b = 0;
        //console.info('%o %d -> %d', arr, arr.length, Math.ceil(arr.length / 4) * 4);
        for (var i = 0 ; i < (Math.ceil(arr.length / 3) * 4) ; i++) {
            if (i % 4 == 3) {  //alpha byte
                a[i] = 255;
                continue;
            }
            a[i] = arr[b] || 0;
            b++;
        }
        a.push(0, 0, 0, 0);
        return new Uint8ClampedArray(a);
    };

    //inverse of above, basically. takes raw pixel data and finds our data
    cfsEl.cfsUnprepArr = function(arr) {
        if (!(arr instanceof Uint8ClampedArray)) {
            console.error('cfsUnrepArr() passed something other than Uint8ClampedArray');
        }
        var a = new Array();
        for (var i = 3 ; i < arr.length ; i += 4) {  //i is the alpha byte: 3, 7, etc..
            if (arr[i] == 0) {  //bail when alpha value is zero
                i = arr.length + 1;
            } else {
                for (var j = 0 ; j < 3 ; j++) { //here is where we may pad out unwanted 0x00 for GB or B bytes on final pixel. :( TODO
                    a.push(arr[i - 3 + j]);
                }
            }
        }
        return new Uint8ClampedArray(a);
    };


///////// some utilities (mostly string conversion)

/* note, there are better (utf8) solutions here: http://stackoverflow.com/q/6965107 (just too lazy to do now) */

    cfsEl.cfsStringToArr = function(str) {
        var a = new Array();
        for (var i = 0 ; i < str.length ; i++) {
            a.push(str.charCodeAt(i));
        }
        return new Uint8ClampedArray(a);
    };

    cfsEl.cfsArrToString = function(buf) {
        return String.fromCharCode.apply(null, new Uint8ClampedArray(buf));
    };


}

