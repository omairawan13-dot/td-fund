(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,41887,(e,t,n)=>{t.exports=function(){return"function"==typeof Promise&&Promise.prototype&&Promise.prototype.then}},33683,(e,t,n)=>{let r,i=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];n.getSymbolSize=function(e){if(!e)throw Error('"version" cannot be null or undefined');if(e<1||e>40)throw Error('"version" should be in range from 1 to 40');return 4*e+17},n.getSymbolTotalCodewords=function(e){return i[e]},n.getBCHDigit=function(e){let t=0;for(;0!==e;)t++,e>>>=1;return t},n.setToSJISFunction=function(e){if("function"!=typeof e)throw Error('"toSJISFunc" is not a valid function.');r=e},n.isKanjiModeEnabled=function(){return void 0!==r},n.toSJIS=function(e){return r(e)}},46752,(e,t,n)=>{n.L={bit:1},n.M={bit:0},n.Q={bit:3},n.H={bit:2},n.isValid=function(e){return e&&void 0!==e.bit&&e.bit>=0&&e.bit<4},n.from=function(e,t){if(n.isValid(e))return e;try{if("string"!=typeof e)throw Error("Param is not a string");switch(e.toLowerCase()){case"l":case"low":return n.L;case"m":case"medium":return n.M;case"q":case"quartile":return n.Q;case"h":case"high":return n.H;default:throw Error("Unknown EC Level: "+e)}}catch(e){return t}}},2034,(e,t,n)=>{function r(){this.buffer=[],this.length=0}r.prototype={get:function(e){let t=Math.floor(e/8);return(this.buffer[t]>>>7-e%8&1)==1},put:function(e,t){for(let n=0;n<t;n++)this.putBit((e>>>t-n-1&1)==1)},getLengthInBits:function(){return this.length},putBit:function(e){let t=Math.floor(this.length/8);this.buffer.length<=t&&this.buffer.push(0),e&&(this.buffer[t]|=128>>>this.length%8),this.length++}},t.exports=r},82883,(e,t,n)=>{function r(e){if(!e||e<1)throw Error("BitMatrix size must be defined and greater than 0");this.size=e,this.data=new Uint8Array(e*e),this.reservedBit=new Uint8Array(e*e)}r.prototype.set=function(e,t,n,r){let i=e*this.size+t;this.data[i]=n,r&&(this.reservedBit[i]=!0)},r.prototype.get=function(e,t){return this.data[e*this.size+t]},r.prototype.xor=function(e,t,n){this.data[e*this.size+t]^=n},r.prototype.isReserved=function(e,t){return this.reservedBit[e*this.size+t]},t.exports=r},58789,(e,t,n)=>{let r=e.r(33683).getSymbolSize;n.getRowColCoords=function(e){if(1===e)return[];let t=Math.floor(e/7)+2,n=r(e),i=145===n?26:2*Math.ceil((n-13)/(2*t-2)),o=[n-7];for(let e=1;e<t-1;e++)o[e]=o[e-1]-i;return o.push(6),o.reverse()},n.getPositions=function(e){let t=[],r=n.getRowColCoords(e),i=r.length;for(let e=0;e<i;e++)for(let n=0;n<i;n++)(0!==e||0!==n)&&(0!==e||n!==i-1)&&(e!==i-1||0!==n)&&t.push([r[e],r[n]]);return t}},43073,(e,t,n)=>{let r=e.r(33683).getSymbolSize;n.getPositions=function(e){let t=r(e);return[[0,0],[t-7,0],[0,t-7]]}},87772,(e,t,n)=>{n.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};n.isValid=function(e){return null!=e&&""!==e&&!isNaN(e)&&e>=0&&e<=7},n.from=function(e){return n.isValid(e)?parseInt(e,10):void 0},n.getPenaltyN1=function(e){let t=e.size,n=0,r=0,i=0,o=null,a=null;for(let s=0;s<t;s++){r=i=0,o=a=null;for(let l=0;l<t;l++){let t=e.get(s,l);t===o?r++:(r>=5&&(n+=3+(r-5)),o=t,r=1),(t=e.get(l,s))===a?i++:(i>=5&&(n+=3+(i-5)),a=t,i=1)}r>=5&&(n+=3+(r-5)),i>=5&&(n+=3+(i-5))}return n},n.getPenaltyN2=function(e){let t=e.size,n=0;for(let r=0;r<t-1;r++)for(let i=0;i<t-1;i++){let t=e.get(r,i)+e.get(r,i+1)+e.get(r+1,i)+e.get(r+1,i+1);(4===t||0===t)&&n++}return 3*n},n.getPenaltyN3=function(e){let t=e.size,n=0,r=0,i=0;for(let o=0;o<t;o++){r=i=0;for(let a=0;a<t;a++)r=r<<1&2047|e.get(o,a),a>=10&&(1488===r||93===r)&&n++,i=i<<1&2047|e.get(a,o),a>=10&&(1488===i||93===i)&&n++}return 40*n},n.getPenaltyN4=function(e){let t=0,n=e.data.length;for(let r=0;r<n;r++)t+=e.data[r];return 10*Math.abs(Math.ceil(100*t/n/5)-10)},n.applyMask=function(e,t){let r=t.size;for(let i=0;i<r;i++)for(let o=0;o<r;o++)t.isReserved(o,i)||t.xor(o,i,function(e,t,r){switch(e){case n.Patterns.PATTERN000:return(t+r)%2==0;case n.Patterns.PATTERN001:return t%2==0;case n.Patterns.PATTERN010:return r%3==0;case n.Patterns.PATTERN011:return(t+r)%3==0;case n.Patterns.PATTERN100:return(Math.floor(t/2)+Math.floor(r/3))%2==0;case n.Patterns.PATTERN101:return t*r%2+t*r%3==0;case n.Patterns.PATTERN110:return(t*r%2+t*r%3)%2==0;case n.Patterns.PATTERN111:return(t*r%3+(t+r)%2)%2==0;default:throw Error("bad maskPattern:"+e)}}(e,o,i))},n.getBestMask=function(e,t){let r=Object.keys(n.Patterns).length,i=0,o=1/0;for(let a=0;a<r;a++){t(a),n.applyMask(a,e);let r=n.getPenaltyN1(e)+n.getPenaltyN2(e)+n.getPenaltyN3(e)+n.getPenaltyN4(e);n.applyMask(a,e),r<o&&(o=r,i=a)}return i}},36772,(e,t,n)=>{let r=e.r(46752),i=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],o=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];n.getBlocksCount=function(e,t){switch(t){case r.L:return i[(e-1)*4+0];case r.M:return i[(e-1)*4+1];case r.Q:return i[(e-1)*4+2];case r.H:return i[(e-1)*4+3];default:return}},n.getTotalCodewordsCount=function(e,t){switch(t){case r.L:return o[(e-1)*4+0];case r.M:return o[(e-1)*4+1];case r.Q:return o[(e-1)*4+2];case r.H:return o[(e-1)*4+3];default:return}}},10657,(e,t,n)=>{let r=new Uint8Array(512),i=new Uint8Array(256),o=1;for(let e=0;e<255;e++)r[e]=o,i[o]=e,256&(o<<=1)&&(o^=285);for(let e=255;e<512;e++)r[e]=r[e-255];n.log=function(e){if(e<1)throw Error("log("+e+")");return i[e]},n.exp=function(e){return r[e]},n.mul=function(e,t){return 0===e||0===t?0:r[i[e]+i[t]]}},14942,(e,t,n)=>{let r=e.r(10657);n.mul=function(e,t){let n=new Uint8Array(e.length+t.length-1);for(let i=0;i<e.length;i++)for(let o=0;o<t.length;o++)n[i+o]^=r.mul(e[i],t[o]);return n},n.mod=function(e,t){let n=new Uint8Array(e);for(;n.length-t.length>=0;){let e=n[0];for(let i=0;i<t.length;i++)n[i]^=r.mul(t[i],e);let i=0;for(;i<n.length&&0===n[i];)i++;n=n.slice(i)}return n},n.generateECPolynomial=function(e){let t=new Uint8Array([1]);for(let i=0;i<e;i++)t=n.mul(t,new Uint8Array([1,r.exp(i)]));return t}},17767,(e,t,n)=>{let r=e.r(14942);function i(e){this.genPoly=void 0,this.degree=e,this.degree&&this.initialize(this.degree)}i.prototype.initialize=function(e){this.degree=e,this.genPoly=r.generateECPolynomial(this.degree)},i.prototype.encode=function(e){if(!this.genPoly)throw Error("Encoder not initialized");let t=new Uint8Array(e.length+this.degree);t.set(e);let n=r.mod(t,this.genPoly),i=this.degree-n.length;if(i>0){let e=new Uint8Array(this.degree);return e.set(n,i),e}return n},t.exports=i},48197,(e,t,n)=>{n.isValid=function(e){return!isNaN(e)&&e>=1&&e<=40}},63745,(e,t,n)=>{let r="[0-9]+",i="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+",o="(?:(?![A-Z0-9 $%*+\\-./:]|"+(i=i.replace(/u/g,"\\u"))+")(?:.|[\r\n]))+";n.KANJI=RegExp(i,"g"),n.BYTE_KANJI=RegExp("[^A-Z0-9 $%*+\\-./:]+","g"),n.BYTE=RegExp(o,"g"),n.NUMERIC=RegExp(r,"g"),n.ALPHANUMERIC=RegExp("[A-Z $%*+\\-./:]+","g");let a=RegExp("^"+i+"$"),s=RegExp("^"+r+"$"),l=RegExp("^[A-Z0-9 $%*+\\-./:]+$");n.testKanji=function(e){return a.test(e)},n.testNumeric=function(e){return s.test(e)},n.testAlphanumeric=function(e){return l.test(e)}},18665,(e,t,n)=>{let r=e.r(48197),i=e.r(63745);n.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]},n.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]},n.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]},n.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]},n.MIXED={bit:-1},n.getCharCountIndicator=function(e,t){if(!e.ccBits)throw Error("Invalid mode: "+e);if(!r.isValid(t))throw Error("Invalid version: "+t);return t>=1&&t<10?e.ccBits[0]:t<27?e.ccBits[1]:e.ccBits[2]},n.getBestModeForData=function(e){return i.testNumeric(e)?n.NUMERIC:i.testAlphanumeric(e)?n.ALPHANUMERIC:i.testKanji(e)?n.KANJI:n.BYTE},n.toString=function(e){if(e&&e.id)return e.id;throw Error("Invalid mode")},n.isValid=function(e){return e&&e.bit&&e.ccBits},n.from=function(e,t){if(n.isValid(e))return e;try{if("string"!=typeof e)throw Error("Param is not a string");switch(e.toLowerCase()){case"numeric":return n.NUMERIC;case"alphanumeric":return n.ALPHANUMERIC;case"kanji":return n.KANJI;case"byte":return n.BYTE;default:throw Error("Unknown mode: "+e)}}catch(e){return t}}},78880,(e,t,n)=>{let r=e.r(33683),i=e.r(36772),o=e.r(46752),a=e.r(18665),s=e.r(48197),l=r.getBCHDigit(7973);function u(e,t){return a.getCharCountIndicator(e,t)+4}n.from=function(e,t){return s.isValid(e)?parseInt(e,10):t},n.getCapacity=function(e,t,n){if(!s.isValid(e))throw Error("Invalid QR Code version");void 0===n&&(n=a.BYTE);let o=(r.getSymbolTotalCodewords(e)-i.getTotalCodewordsCount(e,t))*8;if(n===a.MIXED)return o;let l=o-u(n,e);switch(n){case a.NUMERIC:return Math.floor(l/10*3);case a.ALPHANUMERIC:return Math.floor(l/11*2);case a.KANJI:return Math.floor(l/13);case a.BYTE:default:return Math.floor(l/8)}},n.getBestVersionForData=function(e,t){let r,i=o.from(t,o.M);if(Array.isArray(e)){if(e.length>1){for(let t=1;t<=40;t++)if(function(e,t){let n=0;return e.forEach(function(e){let r=u(e.mode,t);n+=r+e.getBitsLength()}),n}(e,t)<=n.getCapacity(t,i,a.MIXED))return t;return}if(0===e.length)return 1;r=e[0]}else r=e;return function(e,t,r){for(let i=1;i<=40;i++)if(t<=n.getCapacity(i,r,e))return i}(r.mode,r.getLength(),i)},n.getEncodedBits=function(e){if(!s.isValid(e)||e<7)throw Error("Invalid QR Code version");let t=e<<12;for(;r.getBCHDigit(t)-l>=0;)t^=7973<<r.getBCHDigit(t)-l;return e<<12|t}},31401,(e,t,n)=>{let r=e.r(33683),i=r.getBCHDigit(1335);n.getEncodedBits=function(e,t){let n=e.bit<<3|t,o=n<<10;for(;r.getBCHDigit(o)-i>=0;)o^=1335<<r.getBCHDigit(o)-i;return(n<<10|o)^21522}},60238,(e,t,n)=>{let r=e.r(18665);function i(e){this.mode=r.NUMERIC,this.data=e.toString()}i.getBitsLength=function(e){return 10*Math.floor(e/3)+(e%3?e%3*3+1:0)},i.prototype.getLength=function(){return this.data.length},i.prototype.getBitsLength=function(){return i.getBitsLength(this.data.length)},i.prototype.write=function(e){let t,n;for(t=0;t+3<=this.data.length;t+=3)n=parseInt(this.data.substr(t,3),10),e.put(n,10);let r=this.data.length-t;r>0&&(n=parseInt(this.data.substr(t),10),e.put(n,3*r+1))},t.exports=i},8112,(e,t,n)=>{let r=e.r(18665),i=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function o(e){this.mode=r.ALPHANUMERIC,this.data=e}o.getBitsLength=function(e){return 11*Math.floor(e/2)+e%2*6},o.prototype.getLength=function(){return this.data.length},o.prototype.getBitsLength=function(){return o.getBitsLength(this.data.length)},o.prototype.write=function(e){let t;for(t=0;t+2<=this.data.length;t+=2){let n=45*i.indexOf(this.data[t]);n+=i.indexOf(this.data[t+1]),e.put(n,11)}this.data.length%2&&e.put(i.indexOf(this.data[t]),6)},t.exports=o},33442,(e,t,n)=>{let r=e.r(18665);function i(e){this.mode=r.BYTE,"string"==typeof e?this.data=new TextEncoder().encode(e):this.data=new Uint8Array(e)}i.getBitsLength=function(e){return 8*e},i.prototype.getLength=function(){return this.data.length},i.prototype.getBitsLength=function(){return i.getBitsLength(this.data.length)},i.prototype.write=function(e){for(let t=0,n=this.data.length;t<n;t++)e.put(this.data[t],8)},t.exports=i},26389,(e,t,n)=>{let r=e.r(18665),i=e.r(33683);function o(e){this.mode=r.KANJI,this.data=e}o.getBitsLength=function(e){return 13*e},o.prototype.getLength=function(){return this.data.length},o.prototype.getBitsLength=function(){return o.getBitsLength(this.data.length)},o.prototype.write=function(e){let t;for(t=0;t<this.data.length;t++){let n=i.toSJIS(this.data[t]);if(n>=33088&&n<=40956)n-=33088;else if(n>=57408&&n<=60351)n-=49472;else throw Error("Invalid SJIS character: "+this.data[t]+"\nMake sure your charset is UTF-8");n=(n>>>8&255)*192+(255&n),e.put(n,13)}},t.exports=o},6015,(e,t,n)=>{"use strict";var r={single_source_shortest_paths:function(e,t,n){var i,o,a,s,l,u,d,c={},h={};h[t]=0;var g=r.PriorityQueue.make();for(g.push(t,0);!g.empty();)for(a in o=(i=g.pop()).value,s=i.cost,l=e[o]||{})l.hasOwnProperty(a)&&(u=s+l[a],d=h[a],(void 0===h[a]||d>u)&&(h[a]=u,g.push(a,u),c[a]=o));if(void 0!==n&&void 0===h[n])throw Error("Could not find a path from "+t+" to "+n+".");return c},extract_shortest_path_from_predecessor_list:function(e,t){for(var n=[],r=t;r;)n.push(r),e[r],r=e[r];return n.reverse(),n},find_path:function(e,t,n){var i=r.single_source_shortest_paths(e,t,n);return r.extract_shortest_path_from_predecessor_list(i,n)},PriorityQueue:{make:function(e){var t,n=r.PriorityQueue,i={};for(t in e=e||{},n)n.hasOwnProperty(t)&&(i[t]=n[t]);return i.queue=[],i.sorter=e.sorter||n.default_sorter,i},default_sorter:function(e,t){return e.cost-t.cost},push:function(e,t){this.queue.push({value:e,cost:t}),this.queue.sort(this.sorter)},pop:function(){return this.queue.shift()},empty:function(){return 0===this.queue.length}}};t.exports=r},36410,(e,t,n)=>{let r=e.r(18665),i=e.r(60238),o=e.r(8112),a=e.r(33442),s=e.r(26389),l=e.r(63745),u=e.r(33683),d=e.r(6015);function c(e){return unescape(encodeURIComponent(e)).length}function h(e,t,n){let r,i=[];for(;null!==(r=e.exec(n));)i.push({data:r[0],index:r.index,mode:t,length:r[0].length});return i}function g(e){let t,n,i=h(l.NUMERIC,r.NUMERIC,e),o=h(l.ALPHANUMERIC,r.ALPHANUMERIC,e);return u.isKanjiModeEnabled()?(t=h(l.BYTE,r.BYTE,e),n=h(l.KANJI,r.KANJI,e)):(t=h(l.BYTE_KANJI,r.BYTE,e),n=[]),i.concat(o,t,n).sort(function(e,t){return e.index-t.index}).map(function(e){return{data:e.data,mode:e.mode,length:e.length}})}function f(e,t){switch(t){case r.NUMERIC:return i.getBitsLength(e);case r.ALPHANUMERIC:return o.getBitsLength(e);case r.KANJI:return s.getBitsLength(e);case r.BYTE:return a.getBitsLength(e)}}function p(e,t){let n,l=r.getBestModeForData(e);if((n=r.from(t,l))!==r.BYTE&&n.bit<l.bit)throw Error('"'+e+'" cannot be encoded with mode '+r.toString(n)+".\n Suggested mode is: "+r.toString(l));switch(n===r.KANJI&&!u.isKanjiModeEnabled()&&(n=r.BYTE),n){case r.NUMERIC:return new i(e);case r.ALPHANUMERIC:return new o(e);case r.KANJI:return new s(e);case r.BYTE:return new a(e)}}n.fromArray=function(e){return e.reduce(function(e,t){return"string"==typeof t?e.push(p(t,null)):t.data&&e.push(p(t.data,t.mode)),e},[])},n.fromString=function(e,t){let i=function(e,t){let n={},i={start:{}},o=["start"];for(let a=0;a<e.length;a++){let s=e[a],l=[];for(let e=0;e<s.length;e++){let u=s[e],d=""+a+e;l.push(d),n[d]={node:u,lastCount:0},i[d]={};for(let e=0;e<o.length;e++){let a=o[e];n[a]&&n[a].node.mode===u.mode?(i[a][d]=f(n[a].lastCount+u.length,u.mode)-f(n[a].lastCount,u.mode),n[a].lastCount+=u.length):(n[a]&&(n[a].lastCount=u.length),i[a][d]=f(u.length,u.mode)+4+r.getCharCountIndicator(u.mode,t))}}o=l}for(let e=0;e<o.length;e++)i[o[e]].end=0;return{map:i,table:n}}(function(e){let t=[];for(let n=0;n<e.length;n++){let i=e[n];switch(i.mode){case r.NUMERIC:t.push([i,{data:i.data,mode:r.ALPHANUMERIC,length:i.length},{data:i.data,mode:r.BYTE,length:i.length}]);break;case r.ALPHANUMERIC:t.push([i,{data:i.data,mode:r.BYTE,length:i.length}]);break;case r.KANJI:t.push([i,{data:i.data,mode:r.BYTE,length:c(i.data)}]);break;case r.BYTE:t.push([{data:i.data,mode:r.BYTE,length:c(i.data)}])}}return t}(g(e,u.isKanjiModeEnabled())),t),o=d.find_path(i.map,"start","end"),a=[];for(let e=1;e<o.length-1;e++)a.push(i.table[o[e]].node);return n.fromArray(a.reduce(function(e,t){let n=e.length-1>=0?e[e.length-1]:null;return n&&n.mode===t.mode?e[e.length-1].data+=t.data:e.push(t),e},[]))},n.rawSplit=function(e){return n.fromArray(g(e,u.isKanjiModeEnabled()))}},38321,(e,t,n)=>{let r=e.r(33683),i=e.r(46752),o=e.r(2034),a=e.r(82883),s=e.r(58789),l=e.r(43073),u=e.r(87772),d=e.r(36772),c=e.r(17767),h=e.r(78880),g=e.r(31401),f=e.r(18665),p=e.r(36410);function m(e,t,n){let r,i,o=e.size,a=g.getEncodedBits(t,n);for(r=0;r<15;r++)i=(a>>r&1)==1,r<6?e.set(r,8,i,!0):r<8?e.set(r+1,8,i,!0):e.set(o-15+r,8,i,!0),r<8?e.set(8,o-r-1,i,!0):r<9?e.set(8,15-r-1+1,i,!0):e.set(8,15-r-1,i,!0);e.set(o-8,8,1,!0)}n.create=function(e,t){let n,g;if(void 0===e||""===e)throw Error("No input text");let y=i.M;return void 0!==t&&(y=i.from(t.errorCorrectionLevel,i.M),n=h.from(t.version),g=u.from(t.maskPattern),t.toSJISFunc&&r.setToSJISFunction(t.toSJISFunc)),function(e,t,n,i){let g;if(Array.isArray(e))g=p.fromArray(e);else if("string"==typeof e){let r=t;if(!r){let t=p.rawSplit(e);r=h.getBestVersionForData(t,n)}g=p.fromString(e,r||40)}else throw Error("Invalid data");let y=h.getBestVersionForData(g,n);if(!y)throw Error("The amount of data is too big to be stored in a QR Code");if(t){if(t<y)throw Error("\nThe chosen QR Code version cannot contain this amount of data.\nMinimum version required to store current data is: "+y+".\n")}else t=y;let b=function(e,t,n){let i=new o;n.forEach(function(t){i.put(t.mode.bit,4),i.put(t.getLength(),f.getCharCountIndicator(t.mode,e)),t.write(i)});let a=(r.getSymbolTotalCodewords(e)-d.getTotalCodewordsCount(e,t))*8;for(i.getLengthInBits()+4<=a&&i.put(0,4);i.getLengthInBits()%8!=0;)i.putBit(0);let s=(a-i.getLengthInBits())/8;for(let e=0;e<s;e++)i.put(e%2?17:236,8);return function(e,t,n){let i,o,a=r.getSymbolTotalCodewords(t),s=a-d.getTotalCodewordsCount(t,n),l=d.getBlocksCount(t,n),u=a%l,h=l-u,g=Math.floor(a/l),f=Math.floor(s/l),p=f+1,m=g-f,y=new c(m),b=0,x=Array(l),E=Array(l),w=0,v=new Uint8Array(e.buffer);for(let e=0;e<l;e++){let t=e<h?f:p;x[e]=v.slice(b,b+t),E[e]=y.encode(x[e]),b+=t,w=Math.max(w,t)}let A=new Uint8Array(a),T=0;for(i=0;i<w;i++)for(o=0;o<l;o++)i<x[o].length&&(A[T++]=x[o][i]);for(i=0;i<m;i++)for(o=0;o<l;o++)A[T++]=E[o][i];return A}(i,e,t)}(t,n,g),x=new a(r.getSymbolSize(t));!function(e,t){let n=e.size,r=l.getPositions(t);for(let t=0;t<r.length;t++){let i=r[t][0],o=r[t][1];for(let t=-1;t<=7;t++)if(!(i+t<=-1)&&!(n<=i+t))for(let r=-1;r<=7;r++)o+r<=-1||n<=o+r||(t>=0&&t<=6&&(0===r||6===r)||r>=0&&r<=6&&(0===t||6===t)||t>=2&&t<=4&&r>=2&&r<=4?e.set(i+t,o+r,!0,!0):e.set(i+t,o+r,!1,!0))}}(x,t);let E=x.size;for(let e=8;e<E-8;e++){let t=e%2==0;x.set(e,6,t,!0),x.set(6,e,t,!0)}return!function(e,t){let n=s.getPositions(t);for(let t=0;t<n.length;t++){let r=n[t][0],i=n[t][1];for(let t=-2;t<=2;t++)for(let n=-2;n<=2;n++)-2===t||2===t||-2===n||2===n||0===t&&0===n?e.set(r+t,i+n,!0,!0):e.set(r+t,i+n,!1,!0)}}(x,t),m(x,n,0),t>=7&&function(e,t){let n,r,i,o=e.size,a=h.getEncodedBits(t);for(let t=0;t<18;t++)n=Math.floor(t/3),r=t%3+o-8-3,i=(a>>t&1)==1,e.set(n,r,i,!0),e.set(r,n,i,!0)}(x,t),!function(e,t){let n=e.size,r=-1,i=n-1,o=7,a=0;for(let s=n-1;s>0;s-=2)for(6===s&&s--;;){for(let n=0;n<2;n++)if(!e.isReserved(i,s-n)){let r=!1;a<t.length&&(r=(t[a]>>>o&1)==1),e.set(i,s-n,r),-1==--o&&(a++,o=7)}if((i+=r)<0||n<=i){i-=r,r=-r;break}}}(x,b),isNaN(i)&&(i=u.getBestMask(x,m.bind(null,x,n))),u.applyMask(i,x),m(x,n,i),{modules:x,version:t,errorCorrectionLevel:n,maskPattern:i,segments:g}}(e,n,y,g)}},38671,(e,t,n)=>{function r(e){if("number"==typeof e&&(e=e.toString()),"string"!=typeof e)throw Error("Color should be defined as hex string");let t=e.slice().replace("#","").split("");if(t.length<3||5===t.length||t.length>8)throw Error("Invalid hex color: "+e);(3===t.length||4===t.length)&&(t=Array.prototype.concat.apply([],t.map(function(e){return[e,e]}))),6===t.length&&t.push("F","F");let n=parseInt(t.join(""),16);return{r:n>>24&255,g:n>>16&255,b:n>>8&255,a:255&n,hex:"#"+t.slice(0,6).join("")}}n.getOptions=function(e){e||(e={}),e.color||(e.color={});let t=void 0===e.margin||null===e.margin||e.margin<0?4:e.margin,n=e.width&&e.width>=21?e.width:void 0,i=e.scale||4;return{width:n,scale:n?4:i,margin:t,color:{dark:r(e.color.dark||"#000000ff"),light:r(e.color.light||"#ffffffff")},type:e.type,rendererOpts:e.rendererOpts||{}}},n.getScale=function(e,t){return t.width&&t.width>=e+2*t.margin?t.width/(e+2*t.margin):t.scale},n.getImageWidth=function(e,t){let r=n.getScale(e,t);return Math.floor((e+2*t.margin)*r)},n.qrToImageData=function(e,t,r){let i=t.modules.size,o=t.modules.data,a=n.getScale(i,r),s=Math.floor((i+2*r.margin)*a),l=r.margin*a,u=[r.color.light,r.color.dark];for(let t=0;t<s;t++)for(let n=0;n<s;n++){let d=(t*s+n)*4,c=r.color.light;t>=l&&n>=l&&t<s-l&&n<s-l&&(c=u[+!!o[Math.floor((t-l)/a)*i+Math.floor((n-l)/a)]]),e[d++]=c.r,e[d++]=c.g,e[d++]=c.b,e[d]=c.a}}},25897,(e,t,n)=>{let r=e.r(38671);n.render=function(e,t,n){var i;let o=n,a=t;void 0!==o||t&&t.getContext||(o=t,t=void 0),t||(a=function(){try{return document.createElement("canvas")}catch(e){throw Error("You need to specify a canvas element")}}()),o=r.getOptions(o);let s=r.getImageWidth(e.modules.size,o),l=a.getContext("2d"),u=l.createImageData(s,s);return r.qrToImageData(u.data,e,o),i=a,l.clearRect(0,0,i.width,i.height),i.style||(i.style={}),i.height=s,i.width=s,i.style.height=s+"px",i.style.width=s+"px",l.putImageData(u,0,0),a},n.renderToDataURL=function(e,t,r){let i=r;void 0!==i||t&&t.getContext||(i=t,t=void 0),i||(i={});let o=n.render(e,t,i),a=i.type||"image/png",s=i.rendererOpts||{};return o.toDataURL(a,s.quality)}},61993,(e,t,n)=>{let r=e.r(38671);function i(e,t){let n=e.a/255,r=t+'="'+e.hex+'"';return n<1?r+" "+t+'-opacity="'+n.toFixed(2).slice(1)+'"':r}function o(e,t,n){let r=e+t;return void 0!==n&&(r+=" "+n),r}n.render=function(e,t,n){let a=r.getOptions(t),s=e.modules.size,l=e.modules.data,u=s+2*a.margin,d=a.color.light.a?"<path "+i(a.color.light,"fill")+' d="M0 0h'+u+"v"+u+'H0z"/>':"",c="<path "+i(a.color.dark,"stroke")+' d="'+function(e,t,n){let r="",i=0,a=!1,s=0;for(let l=0;l<e.length;l++){let u=Math.floor(l%t),d=Math.floor(l/t);u||a||(a=!0),e[l]?(s++,l>0&&u>0&&e[l-1]||(r+=a?o("M",u+n,.5+d+n):o("m",i,0),i=0,a=!1),u+1<t&&e[l+1]||(r+=o("h",s),s=0)):i++}return r}(l,s,a.margin)+'"/>',h='<svg xmlns="http://www.w3.org/2000/svg" '+(a.width?'width="'+a.width+'" height="'+a.width+'" ':"")+('viewBox="0 0 '+u+" ")+u+'" shape-rendering="crispEdges">'+d+c+"</svg>\n";return"function"==typeof n&&n(null,h),h}},19624,(e,t,n)=>{let r=e.r(41887),i=e.r(38321),o=e.r(25897),a=e.r(61993);function s(e,t,n,o,a){let s=[].slice.call(arguments,1),l=s.length,u="function"==typeof s[l-1];if(!u&&!r())throw Error("Callback required as last argument");if(u){if(l<2)throw Error("Too few arguments provided");2===l?(a=n,n=t,t=o=void 0):3===l&&(t.getContext&&void 0===a?(a=o,o=void 0):(a=o,o=n,n=t,t=void 0))}else{if(l<1)throw Error("Too few arguments provided");return 1===l?(n=t,t=o=void 0):2!==l||t.getContext||(o=n,n=t,t=void 0),new Promise(function(r,a){try{let a=i.create(n,o);r(e(a,t,o))}catch(e){a(e)}})}try{let r=i.create(n,o);a(null,e(r,t,o))}catch(e){a(e)}}n.create=i.create,n.toCanvas=s.bind(null,o.render),n.toDataURL=s.bind(null,o.renderToDataURL),n.toString=s.bind(null,function(e,t,n){return a.render(e,n)})},69185,e=>{"use strict";var t=e.i(14204),n=Object.defineProperty,r=Object.defineProperties,i=Object.getOwnPropertyDescriptors,o=Object.getOwnPropertySymbols,a=Object.prototype.hasOwnProperty,s=Object.prototype.propertyIsEnumerable,l=(e,t,r)=>t in e?n(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,u=(e,t)=>{for(var n in t||(t={}))a.call(t,n)&&l(e,n,t[n]);if(o)for(var n of o(t))s.call(t,n)&&l(e,n,t[n]);return e},d=(e,t,n)=>new Promise((r,i)=>{var o=e=>{try{s(n.next(e))}catch(e){i(e)}},a=e=>{try{s(n.throw(e))}catch(e){i(e)}},s=e=>e.done?r(e.value):Promise.resolve(e.value).then(o,a);s((n=n.apply(e,t)).next())}),c=class{constructor(e){this.resend=e}create(e){return d(this,arguments,function*(e,t={}){return yield this.resend.post("/api-keys",e,t)})}list(){return d(this,null,function*(){return yield this.resend.get("/api-keys")})}remove(e){return d(this,null,function*(){return yield this.resend.delete(`/api-keys/${e}`)})}},h=class{constructor(e){this.resend=e}create(e){return d(this,arguments,function*(e,t={}){return yield this.resend.post("/audiences",e,t)})}list(){return d(this,null,function*(){return yield this.resend.get("/audiences")})}get(e){return d(this,null,function*(){return yield this.resend.get(`/audiences/${e}`)})}remove(e){return d(this,null,function*(){return yield this.resend.delete(`/audiences/${e}`)})}};function g(e){var t;return{attachments:null==(t=e.attachments)?void 0:t.map(e=>({content:e.content,filename:e.filename,path:e.path,content_type:e.contentType,inline_content_id:e.inlineContentId})),bcc:e.bcc,cc:e.cc,from:e.from,headers:e.headers,html:e.html,reply_to:e.replyTo,scheduled_at:e.scheduledAt,subject:e.subject,tags:e.tags,text:e.text,to:e.to}}var f=class{constructor(e){this.resend=e}send(e){return d(this,arguments,function*(e,t={}){return this.create(e,t)})}create(t){return d(this,arguments,function*(t,n={}){let r=[];for(let n of t){if(n.react){if(!this.renderAsync)try{let{renderAsync:t}=yield e.A(29126);this.renderAsync=t}catch(e){throw Error("Failed to render React component. Make sure to install `@react-email/render`")}n.html=yield this.renderAsync(n.react),n.react=void 0}r.push(g(n))}return yield this.resend.post("/emails/batch",r,n)})}},p=class{constructor(e){this.resend=e}create(t){return d(this,arguments,function*(t,n={}){if(t.react){if(!this.renderAsync)try{let{renderAsync:t}=yield e.A(29126);this.renderAsync=t}catch(e){throw Error("Failed to render React component. Make sure to install `@react-email/render`")}t.html=yield this.renderAsync(t.react)}return yield this.resend.post("/broadcasts",{name:t.name,audience_id:t.audienceId,preview_text:t.previewText,from:t.from,html:t.html,reply_to:t.replyTo,subject:t.subject,text:t.text},n)})}send(e,t){return d(this,null,function*(){return yield this.resend.post(`/broadcasts/${e}/send`,{scheduled_at:null==t?void 0:t.scheduledAt})})}list(){return d(this,null,function*(){return yield this.resend.get("/broadcasts")})}get(e){return d(this,null,function*(){return yield this.resend.get(`/broadcasts/${e}`)})}remove(e){return d(this,null,function*(){return yield this.resend.delete(`/broadcasts/${e}`)})}update(e,t){return d(this,null,function*(){return yield this.resend.patch(`/broadcasts/${e}`,{name:t.name,audience_id:t.audienceId,from:t.from,html:t.html,text:t.text,subject:t.subject,reply_to:t.replyTo,preview_text:t.previewText})})}},m=class{constructor(e){this.resend=e}create(e){return d(this,arguments,function*(e,t={}){return yield this.resend.post(`/audiences/${e.audienceId}/contacts`,{unsubscribed:e.unsubscribed,email:e.email,first_name:e.firstName,last_name:e.lastName},t)})}list(e){return d(this,null,function*(){return yield this.resend.get(`/audiences/${e.audienceId}/contacts`)})}get(e){return d(this,null,function*(){return e.id||e.email?yield this.resend.get(`/audiences/${e.audienceId}/contacts/${(null==e?void 0:e.email)?null==e?void 0:e.email:null==e?void 0:e.id}`):{data:null,error:{message:"Missing `id` or `email` field.",name:"missing_required_field"}}})}update(e){return d(this,null,function*(){return e.id||e.email?yield this.resend.patch(`/audiences/${e.audienceId}/contacts/${(null==e?void 0:e.email)?null==e?void 0:e.email:null==e?void 0:e.id}`,{unsubscribed:e.unsubscribed,first_name:e.firstName,last_name:e.lastName}):{data:null,error:{message:"Missing `id` or `email` field.",name:"missing_required_field"}}})}remove(e){return d(this,null,function*(){return e.id||e.email?yield this.resend.delete(`/audiences/${e.audienceId}/contacts/${(null==e?void 0:e.email)?null==e?void 0:e.email:null==e?void 0:e.id}`):{data:null,error:{message:"Missing `id` or `email` field.",name:"missing_required_field"}}})}},y=class{constructor(e){this.resend=e}create(e){return d(this,arguments,function*(e,t={}){return yield this.resend.post("/domains",{name:e.name,region:e.region,custom_return_path:e.customReturnPath},t)})}list(){return d(this,null,function*(){return yield this.resend.get("/domains")})}get(e){return d(this,null,function*(){return yield this.resend.get(`/domains/${e}`)})}update(e){return d(this,null,function*(){return yield this.resend.patch(`/domains/${e.id}`,{click_tracking:e.clickTracking,open_tracking:e.openTracking,tls:e.tls})})}remove(e){return d(this,null,function*(){return yield this.resend.delete(`/domains/${e}`)})}verify(e){return d(this,null,function*(){return yield this.resend.post(`/domains/${e}/verify`)})}},b=class{constructor(e){this.resend=e}send(e){return d(this,arguments,function*(e,t={}){return this.create(e,t)})}create(t){return d(this,arguments,function*(t,n={}){if(t.react){if(!this.renderAsync)try{let{renderAsync:t}=yield e.A(29126);this.renderAsync=t}catch(e){throw Error("Failed to render React component. Make sure to install `@react-email/render`")}t.html=yield this.renderAsync(t.react)}return yield this.resend.post("/emails",g(t),n)})}get(e){return d(this,null,function*(){return yield this.resend.get(`/emails/${e}`)})}update(e){return d(this,null,function*(){return yield this.resend.patch(`/emails/${e.id}`,{scheduled_at:e.scheduledAt})})}cancel(e){return d(this,null,function*(){return yield this.resend.post(`/emails/${e}/cancel`)})}},x=void 0!==t.default&&t.default.env&&t.default.env.RESEND_BASE_URL||"https://api.resend.com",E=void 0!==t.default&&t.default.env&&t.default.env.RESEND_USER_AGENT||"resend-node:4.8.0",w=class{constructor(e){if(this.key=e,this.apiKeys=new c(this),this.audiences=new h(this),this.batch=new f(this),this.broadcasts=new p(this),this.contacts=new m(this),this.domains=new y(this),this.emails=new b(this),!e&&(void 0!==t.default&&t.default.env&&(this.key=t.default.env.RESEND_API_KEY),!this.key))throw Error('Missing API key. Pass it to the constructor `new Resend("re_123")`');this.headers=new Headers({Authorization:`Bearer ${this.key}`,"User-Agent":E,"Content-Type":"application/json"})}fetchRequest(e){return d(this,arguments,function*(e,t={}){try{let n=yield fetch(`${x}${e}`,t);if(!n.ok)try{let e=yield n.text();return{data:null,error:JSON.parse(e)}}catch(t){if(t instanceof SyntaxError)return{data:null,error:{name:"application_error",message:"Internal server error. We are unable to process your request right now, please try again later."}};let e={message:n.statusText,name:"application_error"};if(t instanceof Error){let n,o;return{data:null,error:(n=u({},e),o={message:t.message},r(n,i(o)))}}return{data:null,error:e}}return{data:yield n.json(),error:null}}catch(e){return{data:null,error:{name:"application_error",message:"Unable to fetch data. The request could not be resolved."}}}})}post(e,t){return d(this,arguments,function*(e,t,n={}){let r=new Headers(this.headers);n.idempotencyKey&&r.set("Idempotency-Key",n.idempotencyKey);let i=u({method:"POST",headers:r,body:JSON.stringify(t)},n);return this.fetchRequest(e,i)})}get(e){return d(this,arguments,function*(e,t={}){let n=u({method:"GET",headers:this.headers},t);return this.fetchRequest(e,n)})}put(e,t){return d(this,arguments,function*(e,t,n={}){let r=u({method:"PUT",headers:this.headers,body:JSON.stringify(t)},n);return this.fetchRequest(e,r)})}patch(e,t){return d(this,arguments,function*(e,t,n={}){let r=u({method:"PATCH",headers:this.headers,body:JSON.stringify(t)},n);return this.fetchRequest(e,r)})}delete(e,t){return d(this,null,function*(){let n={method:"DELETE",headers:this.headers,body:JSON.stringify(t)};return this.fetchRequest(e,n)})}},v=e.i(19624),A=e.i(47018),T=e.i(63483);let I=null,B=t.default.env.EMAIL_FROM||"noreply@td-fund.com";async function M(e,n){try{let r=(0,A.generateEPCQRCodeData)(e),i=await v.default.toBuffer(r,{width:300,margin:2,color:{dark:"#000000",light:"#FFFFFF"}}),o="https://zotifjywwbpglvslnkfq.supabase.co",a=t.default.env.SUPABASE_SERVICE_ROLE_KEY;if(!o||!a)return"";let s=(0,T.createClient)(o,a,{auth:{autoRefreshToken:!1,persistSession:!1}}),l=`qr-codes/${n}-${Date.now()}.png`,u=new Blob([i],{type:"image/png"}),{data:d,error:c}=await s.storage.from("images").upload(l,u,{contentType:"image/png",cacheControl:"3600",upsert:!1});if(c)return"";let{data:h}=s.storage.from("images").getPublicUrl(l);return h.publicUrl}catch(e){return""}}async function N(e,n,r,i){try{if(!t.default.env.RESEND_API_KEY)return console.error("RESEND_API_KEY is not set"),{success:!1,error:"Email service not configured"};let o=function(){if(!I){let e=t.default.env.RESEND_API_KEY;if(!e)throw Error("RESEND_API_KEY is not set");I=new w(e)}return I}(),{data:a,error:s}=await o.emails.send({from:B,to:e,subject:n,html:r,text:i||r.replace(/<[^>]*>/g,"")});if(s)return console.error("Error sending email:",s),{success:!1,error:s.message};return{success:!0,messageId:a?.id}}catch(e){return console.error("Exception sending email:",e),{success:!1,error:e instanceof Error?e.message:"Unknown error"}}}async function S(e){let t=Math.abs(e.balance),n=(0,A.getDefaultSEPADetails)(),r={amount:t,memberId:e.mitgliedsnummer,sepaDetails:n},i=await M(r,e.id),o=i?`<img src="${i}" alt="QR Code f\xfcr Zahlung" style="max-width: 300px; height: auto; display: block; margin: 20px auto;" />`:"";return{subject:"Warnung: Negativer Kontostand seit 30 Tagen - TD Fund",html:`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .balance { font-size: 24px; font-weight: bold; color: #dc2626; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TD Fund - Wichtige Mitteilung</h1>
        </div>
        <div class="content">
          <p>Sehr geehrte/r ${e.name},</p>
          
          <div class="warning">
            <h2>⚠️ Warnung: Negativer Kontostand</h2>
            <p>Ihr Kontostand ist seit <strong>30 Tagen</strong> negativ.</p>
            <p class="balance">Aktueller Kontostand: ${e.balance.toFixed(2)} €</p>
          </div>
          
          <p>Wir m\xf6chten Sie darauf hinweisen, dass:</p>
          <ul>
            <li>Ihr Kontostand seit <strong>30 Tagen</strong> negativ ist</li>
            <li>Wenn Ihr Kontostand weiterhin negativ bleibt, werden Sie nach <strong>90 Tagen</strong> automatisch als inaktiv markiert</li>
            <li>Bitte \xfcberweisen Sie den ausstehenden Betrag, um Ihre Mitgliedschaft aktiv zu halten</li>
          </ul>
          
          <p><strong>Mitgliedsnummer:</strong> ${e.mitgliedsnummer}</p>
          
          <div style="background-color: #ffffff; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="margin-top: 0; color: #1f2937;">Zahlungsdetails</h3>
            
            <div style="margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>Betrag:</strong> <span style="color: #dc2626; font-size: 18px; font-weight: bold;">${t.toFixed(2)} €</span></p>
              <p style="margin: 5px 0;"><strong>Empf\xe4nger:</strong> ${n.name}</p>
              <p style="margin: 5px 0;"><strong>IBAN:</strong> <span style="font-family: monospace; font-size: 14px;">${n.iban}</span></p>
              ${n.bic?`<p style="margin: 5px 0;"><strong>BIC:</strong> <span style="font-family: monospace;">${n.bic}</span></p>`:""}
              <p style="margin: 5px 0;"><strong>Verwendungszweck:</strong> Mitgliedsnummer: ${e.mitgliedsnummer}</p>
            </div>
            
            ${o?`
            <div style="text-align: center; margin: 20px 0;">
              <p style="font-weight: 600; margin-bottom: 10px;">QR-Code zum Bezahlen:</p>
              ${o}
              <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">Scannen Sie diesen Code mit Ihrer Banking-App</p>
            </div>
            `:""}
          </div>
          
          <p>Bitte kontaktieren Sie uns, wenn Sie Fragen haben oder Hilfe ben\xf6tigen.</p>
          
          <p>Mit freundlichen Gr\xfc\xdfen,<br>TD Fund Team</p>
        </div>
        <div class="footer">
          <p>Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
        </div>
      </div>
    </body>
    </html>
  `,text:`
TD Fund - Wichtige Mitteilung

Sehr geehrte/r ${e.name},

⚠️ WARNUNG: NEGATIVER KONTOSTAND

Ihr Kontostand ist seit 30 Tagen negativ.

Aktueller Kontostand: ${e.balance.toFixed(2)} €

Wir m\xf6chten Sie darauf hinweisen, dass:
- Ihr Kontostand seit 30 Tagen negativ ist
- Wenn Ihr Kontostand weiterhin negativ bleibt, werden Sie nach 90 Tagen automatisch als inaktiv markiert
- Bitte \xfcberweisen Sie den ausstehenden Betrag, um Ihre Mitgliedschaft aktiv zu halten

Mitgliedsnummer: ${e.mitgliedsnummer}

Bitte kontaktieren Sie uns, wenn Sie Fragen haben oder Hilfe ben\xf6tigen.

Mit freundlichen Gr\xfc\xdfen,
TD Fund Team

---
Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht direkt auf diese E-Mail.
  `}}async function C(e){let t=Math.abs(e.balance),n=(0,A.getDefaultSEPADetails)(),r={amount:t,memberId:e.mitgliedsnummer,sepaDetails:n},i=await M(r,e.id),o=i?`<img src="${i}" alt="QR Code f\xfcr Zahlung" style="max-width: 300px; height: auto; display: block; margin: 20px auto;" />`:"";return{subject:"Dringend: Negativer Kontostand seit 90 Tagen - TD Fund",html:`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .urgent { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
        .balance { font-size: 24px; font-weight: bold; color: #dc2626; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TD Fund - Dringende Mitteilung</h1>
        </div>
        <div class="content">
          <p>Sehr geehrte/r ${e.name},</p>
          
          <div class="urgent">
            <h2>🚨 Dringend: Letzte Warnung</h2>
            <p>Ihr Kontostand ist seit <strong>90 Tagen</strong> negativ.</p>
            <p class="balance">Aktueller Kontostand: ${e.balance.toFixed(2)} €</p>
          </div>
          
          <p><strong>Dies ist Ihre letzte Warnung!</strong></p>
          
          <p>Wenn Sie nicht innerhalb kurzer Zeit den ausstehenden Betrag \xfcberweisen, werden Sie automatisch als <strong>inaktiv</strong> markiert.</p>
          
          <p>Als inaktives Mitglied verlieren Sie Zugang zu allen Mitgliedervorteilen und Services.</p>
          
          <p><strong>Mitgliedsnummer:</strong> ${e.mitgliedsnummer}</p>
          
          <div style="background-color: #ffffff; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="margin-top: 0; color: #1f2937;">Zahlungsdetails</h3>
            
            <div style="margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>Betrag:</strong> <span style="color: #dc2626; font-size: 18px; font-weight: bold;">${t.toFixed(2)} €</span></p>
              <p style="margin: 5px 0;"><strong>Empf\xe4nger:</strong> ${n.name}</p>
              <p style="margin: 5px 0;"><strong>IBAN:</strong> <span style="font-family: monospace; font-size: 14px;">${n.iban}</span></p>
              ${n.bic?`<p style="margin: 5px 0;"><strong>BIC:</strong> <span style="font-family: monospace;">${n.bic}</span></p>`:""}
              <p style="margin: 5px 0;"><strong>Verwendungszweck:</strong> Mitgliedsnummer: ${e.mitgliedsnummer}</p>
            </div>
            
            ${o?`
            <div style="text-align: center; margin: 20px 0;">
              <p style="font-weight: 600; margin-bottom: 10px;">QR-Code zum Bezahlen:</p>
              ${o}
              <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">Scannen Sie diesen Code mit Ihrer Banking-App</p>
            </div>
            `:""}
          </div>
          
          <p>Bitte kontaktieren Sie uns <strong>sofort</strong>, wenn Sie Fragen haben oder Hilfe ben\xf6tigen.</p>
          
          <p>Mit freundlichen Gr\xfc\xdfen,<br>TD Fund Team</p>
        </div>
        <div class="footer">
          <p>Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
        </div>
      </div>
    </body>
    </html>
  `,text:`
TD Fund - Dringende Mitteilung

Sehr geehrte/r ${e.name},

🚨 DRINGEND: LETZTE WARNUNG

Ihr Kontostand ist seit 90 Tagen negativ.

Aktueller Kontostand: ${e.balance.toFixed(2)} €

DIES IST IHRE LETZTE WARNUNG!

Wenn Sie nicht innerhalb kurzer Zeit den ausstehenden Betrag \xfcberweisen, werden Sie automatisch als INAKTIV markiert.

Als inaktives Mitglied verlieren Sie Zugang zu allen Mitgliedervorteilen und Services.

Mitgliedsnummer: ${e.mitgliedsnummer}

ZAHLUNGSDETAILS:
Betrag: ${t.toFixed(2)} €
Empf\xe4nger: ${n.name}
IBAN: ${n.iban}
${n.bic?`BIC: ${n.bic}
`:""}Verwendungszweck: Mitgliedsnummer: ${e.mitgliedsnummer}

Bitte kontaktieren Sie uns SOFORT, wenn Sie Fragen haben oder Hilfe ben\xf6tigen.

Mit freundlichen Gr\xfc\xdfen,
TD Fund Team

---
Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht direkt auf diese E-Mail.
  `}}async function k(e,t){let n=Math.abs(e.balance),r=(0,A.getDefaultSEPADetails)(),i={amount:n,memberId:e.mitgliedsnummer,sepaDetails:r},o=await M(i,e.id),a=o?`<img src="${o}" alt="QR Code f\xfcr Zahlung" style="max-width: 300px; height: auto; display: block; margin: 20px auto;" />`:"";return{subject:"Erinnerung: Negativer Kontostand - TD Fund",html:`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .info { background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
        .balance { font-size: 24px; font-weight: bold; color: #dc2626; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TD Fund - Erinnerung</h1>
        </div>
        <div class="content">
          <p>Sehr geehrte/r ${e.name},</p>
          
          <div class="info">
            <h2>Erinnerung: Negativer Kontostand</h2>
            <p class="balance">Aktueller Kontostand: ${e.balance.toFixed(2)} €</p>
            ${e.daysInNegative?`<p>Ihr Kontostand ist seit <strong>${e.daysInNegative} Tagen</strong> negativ.</p>`:""}
          </div>
          
          ${t?`<p><strong>Zus\xe4tzliche Nachricht:</strong></p><p>${t}</p>`:""}
          
          <p>Bitte \xfcberweisen Sie den ausstehenden Betrag, um Ihre Mitgliedschaft aktiv zu halten.</p>
          
          <p><strong>Mitgliedsnummer:</strong> ${e.mitgliedsnummer}</p>
          
          <div style="background-color: #ffffff; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="margin-top: 0; color: #1f2937;">Zahlungsdetails</h3>
            
            <div style="margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>Betrag:</strong> <span style="color: #dc2626; font-size: 18px; font-weight: bold;">${n.toFixed(2)} €</span></p>
              <p style="margin: 5px 0;"><strong>Empf\xe4nger:</strong> ${r.name}</p>
              <p style="margin: 5px 0;"><strong>IBAN:</strong> <span style="font-family: monospace; font-size: 14px;">${r.iban}</span></p>
              ${r.bic?`<p style="margin: 5px 0;"><strong>BIC:</strong> <span style="font-family: monospace;">${r.bic}</span></p>`:""}
              <p style="margin: 5px 0;"><strong>Verwendungszweck:</strong> Mitgliedsnummer: ${e.mitgliedsnummer}</p>
            </div>
            
            ${a?`
            <div style="text-align: center; margin: 20px 0;">
              <p style="font-weight: 600; margin-bottom: 10px;">QR-Code zum Bezahlen:</p>
              ${a}
              <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">Scannen Sie diesen Code mit Ihrer Banking-App</p>
            </div>
            `:""}
          </div>
          
          <p>Bei Fragen stehen wir Ihnen gerne zur Verf\xfcgung.</p>
          
          <p>Mit freundlichen Gr\xfc\xdfen,<br>TD Fund Team</p>
        </div>
        <div class="footer">
          <p>Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
        </div>
      </div>
    </body>
    </html>
  `,text:`
TD Fund - Erinnerung

Sehr geehrte/r ${e.name},

ERINNERUNG: NEGATIVER KONTOSTAND

Aktueller Kontostand: ${e.balance.toFixed(2)} €
${e.daysInNegative?`Ihr Kontostand ist seit ${e.daysInNegative} Tagen negativ.`:""}

${t?`
Zus\xe4tzliche Nachricht:
${t}
`:""}

Bitte \xfcberweisen Sie den ausstehenden Betrag, um Ihre Mitgliedschaft aktiv zu halten.

Mitgliedsnummer: ${e.mitgliedsnummer}

ZAHLUNGSDETAILS:
Betrag: ${n.toFixed(2)} €
Empf\xe4nger: ${r.name}
IBAN: ${r.iban}
${r.bic?`BIC: ${r.bic}
`:""}Verwendungszweck: Mitgliedsnummer: ${e.mitgliedsnummer}

Bei Fragen stehen wir Ihnen gerne zur Verf\xfcgung.

Mit freundlichen Gr\xfc\xdfen,
TD Fund Team

---
Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht direkt auf diese E-Mail.
  `}}async function R(e){let t=await S(e);return N(e.email,t.subject,t.html,t.text)}async function P(e){let t=await C(e);return N(e.email,t.subject,t.html,t.text)}async function $(e,t){let n=await k(e,t);return N(e.email,n.subject,n.html,n.text)}e.s(["get30DayWarningEmail",()=>S,"get90DayWarningEmail",()=>C,"getManualReminderEmail",()=>k,"send30DayWarning",()=>R,"send90DayWarning",()=>P,"sendEmail",()=>N,"sendManualReminder",()=>$],69185)}]);