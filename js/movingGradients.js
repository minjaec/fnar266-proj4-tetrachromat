//editable parameters
var nColors = 4;
var inertiaFactor = 20;
var movementCoefficient = 0.2;
var drawInterval = 42;
var movementOffsetFactor = 1;
var timeScaleFactor = 0.03;
var resizeCheckInterval = 1000;

//global variables for moving gradients
var maxDist = 0;
var gradientsShuffled = false;
var G = [];
var fillOrder = [];
var mouse = { x: 0, y: 0 }; //mouse.x, mouse.y
var dt = 0;
var useImagePalette = false;
var gradientContext;
var gradientElement;
var initialized = false;
var resized = false;
var rad2deg = 57.2957795131;

//RGBY FOR WHEN nColors = 4
var defaultColors = [['rgba(1,159,98,1)', 'rgba(1,159,98,0)'], ['rgba(255,1,136,1)', 'rgba(255,1,136,0)'], ['rgba(0,201,255,1)', 'rgba(0,201,255,0)'], ['rgba(228,199,0,1)', 'rgba(228,199,0,0)']];
var imagePalette = [];

function initGradients() {
    var i;
    for (i = 0; i < nColors; i++) {
        var g = { x: 0, y: 0, dx: 0, dy: 0, r: 0, sx: 0, sy: 0, trig: null };
        G.push(g);
    }
};

function updateMovingGradients() {
    gradientElement.width = window.innerWidth;
    gradientElement.height = window.innerHeight;
    maxDist = Math.max(gradientElement.width, gradientElement.height);
    G.forEach(updateGradientParams);
    gradientsShuffled = false;
    dt = 0;
};

function resizeCanvas() {
    resized = true;
};

function updateGradientParams(g) {
    g.dx = randomOffset(0, maxDist / 4);
    g.dy = randomOffset(0, maxDist / 4);
    g.r = randomOffset(maxDist, maxDist / 3);
    g.sx = randomSign() * movementCoefficient;
    g.sy = randomSign() * movementCoefficient;
    g.trig = randomTrig();
    g.trig = randomTrig();
};

function updateGradientParamsOnResize() {
    if(resized) {
        gradientElement.width = window.innerWidth;
        gradientElement.height = window.innerHeight;
        maxDist = Math.max(gradientElement.width, gradientElement.height);
        G.forEach(function(item) {
            item.dx = randomOffset(0, maxDist / 4);
            item.dy = randomOffset(0, maxDist / 4);
            item.r = randomOffset(maxDist, maxDist / 4);
        });
        dt = 0;
        resized = false;
    }
};

function mousemove(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
};

function followMouse(g) {
    //1. find distance X , distance Y
    var distX = mouse.x - g.x + g.dx + g.sx * g.trig(dt) * g.r * movementOffsetFactor;
    var distY = mouse.y - g.y + g.dy + g.sy * g.trig(dt) * g.r * movementOffsetFactor;
    //Easing motion
    g.x += distX / inertiaFactor;
    g.y += distY / inertiaFactor;
};

function draw() {
    gradientContext.clearRect(0, 0, gradientElement.width, gradientElement.height);
    //context.createRadialGradient(x0,y0,r0,x1,y1,r1);
    G.forEach(followMouse);
    dt += timeScaleFactor;
    var gradients = [];

    var i;
    for (i = 0; i < nColors; i++) {
        var radgrad = gradientContext.createRadialGradient(G[i].x, G[i].y, 1, G[i].x, G[i].y, G[i].r);
        radgrad.addColorStop(0, getColor(i)[0]);
        radgrad.addColorStop(1, getColor(i)[1]);
        gradients.push(radgrad);
    };

    if (!gradientsShuffled) {
        var i;
        for (i = 0; i < gradients.length; i++) {
            fillOrder[i] = i;
        }
        shuffleArray(fillOrder);
        gradientsShuffled = true;
    }
    gradientContext.fillStyle = "#FFFFFF";
    gradientContext.fillRect(0, 0, gradientElement.width, gradientElement.height);

    fillOrder.forEach(function (item) {
        gradientContext.fillStyle = gradients[item];
        gradientContext.fillRect(0, 0, gradientElement.width, gradientElement.height);
    })
};


function getImageColors(sourceImage) {
    imagePalette = [];
    var colorThief = new ColorThief();
    var colorthief_palette = colorThief.getPalette(sourceImage, nColors);
    for (var i = 0; i < colorthief_palette.length; i++) {
        var r = colorthief_palette[i][0];
        var g = colorthief_palette[i][1];
        var b = colorthief_palette[i][2];
        var colors = ['rgba(' + r + ',' + g + ',' + b + ',' + 1 + ')', 'rgba(' + r + ',' + g + ',' + b + ',' + 0 + ')'];
        imagePalette.push(colors);
    }
    useImagePalette = true;
}

function useDefaultColors() {
    useImagePalette = false;
    imagePalette = [];
}

//color related functions
function getColor(index) {
    if (useImagePalette) {
        return imagePalette[index];
    } else {
        imagePalette = [];
        return defaultColors[index];
    }
};

// functions for random movement and offset
function randomSign() {
    return Math.sign(0.5 - Math.random());
};

function randomTrig() {
    if (Math.random() < 0.5) {
        return Math.sin;
    } else {
        return Math.cos;
    };
};

function randomOffset(center, alpha) {
    return center + alpha * 2 * (0.5 - Math.random());
};

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
};

function getCSSLinearGradient(rect) {
    var angle = 90 - Math.floor(rad2deg * Math.atan(rect.width / rect.height));
    var topLeftColor, bottomRightColor;
    if(rect.top < 0 || rect.left < 0) topLeftColor = [255, 255, 255, 1];
    else topLeftColor = gradientContext.getImageData(rect.left, rect.top, 1, 1).data;
    if(rect.right > window.width || rect.bottom > window.height) bottomRightColor = [255, 255, 255, 1];
    else bottomRightColor = gradientContext.getImageData(rect.right, rect.bottom, 1, 1).data;
    topLeftColor[3] = 1;
    bottomRightColor[3] = 1;
    return '-webkit-linear-gradient(' + angle + 'deg, ' + 'rgb(' + topLeftColor + '), rgb(' + bottomRightColor + ')';
}

//initializer
(function movingGradients() {
    if (initialized) updateMovingGradients();
    gradientElement = document.createElement('canvas');
    gradientElement.id = 'gradientCanvas';
    gradientElement.setAttribute("style","z-index:-1; overflow: hidden; position: fixed;")
    document.body.appendChild(gradientElement);
    gradientContext = gradientElement.getContext('2d', {alpha: false});
    window.addEventListener('resize', resizeCanvas, false);
    //gradientElement.addEventListener('mouseenter', mousemove, false);
    document.addEventListener('mousemove', mousemove, false);
    initGradients();
    updateMovingGradients();
    setInterval(draw, 30);
    setInterval(updateGradientParamsOnResize, resizeCheckInterval);
    initialized = true;
})();


/*
 * Color Thief v2.0
 * by Lokesh Dhakar - http://www.lokeshdhakar.com
 *
 * Thanks
 * ------
 * Nick Rabinowitz - For creating quantize.js.
 * John Schulz - For clean up and optimization. @JFSIII
 * Nathan Spady - For adding drag and drop support to the demo page.
 *
 * License
 * -------
 * Copyright 2011, 2015 Lokesh Dhakar
 * Released under the MIT license
 * https://raw.githubusercontent.com/lokesh/color-thief/master/LICENSE
 *
 * @license
 */
var CanvasImage=function(a){this.canvas=document.createElement("canvas"),this.context=this.canvas.getContext("2d"),document.body.appendChild(this.canvas),this.width=this.canvas.width=a.width,this.height=this.canvas.height=a.height,this.context.drawImage(a,0,0,this.width,this.height)};CanvasImage.prototype.clear=function(){this.context.clearRect(0,0,this.width,this.height)},CanvasImage.prototype.update=function(a){this.context.putImageData(a,0,0)},CanvasImage.prototype.getPixelCount=function(){return this.width*this.height},CanvasImage.prototype.getImageData=function(){return this.context.getImageData(0,0,this.width,this.height)},CanvasImage.prototype.removeCanvas=function(){this.canvas.parentNode.removeChild(this.canvas)};var ColorThief=function(){};/*!
 * quantize.js Copyright 2008 Nick Rabinowitz.
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 * @license
 */
/*!
 * Block below copied from Protovis: http://mbostock.github.com/protovis/
 * Copyright 2010 Stanford Visualization Group
 * Licensed under the BSD License: http://www.opensource.org/licenses/bsd-license.php
 * @license
 */
if(ColorThief.prototype.getColor=function(a,b){var c=this.getPalette(a,5,b),d=c[0];return d},ColorThief.prototype.getPalette=function(a,b,c){"undefined"==typeof b&&(b=10),("undefined"==typeof c||c<1)&&(c=10);for(var d,e,f,g,h,i=new CanvasImage(a),j=i.getImageData(),k=j.data,l=i.getPixelCount(),m=[],n=0;n<l;n+=c)d=4*n,e=k[d+0],f=k[d+1],g=k[d+2],h=k[d+3],h>=125&&(e>250&&f>250&&g>250||m.push([e,f,g]));var o=MMCQ.quantize(m,b),p=o?o.palette():null;return i.removeCanvas(),p},!pv)var pv={map:function(a,b){var c={};return b?a.map(function(a,d){return c.index=d,b.call(c,a)}):a.slice()},naturalOrder:function(a,b){return a<b?-1:a>b?1:0},sum:function(a,b){var c={};return a.reduce(b?function(a,d,e){return c.index=e,a+b.call(c,d)}:function(a,b){return a+b},0)},max:function(a,b){return Math.max.apply(null,b?pv.map(a,b):a)}};var MMCQ=function(){function a(a,b,c){return(a<<2*i)+(b<<i)+c}function b(a){function b(){c.sort(a),d=!0}var c=[],d=!1;return{push:function(a){c.push(a),d=!1},peek:function(a){return d||b(),void 0===a&&(a=c.length-1),c[a]},pop:function(){return d||b(),c.pop()},size:function(){return c.length},map:function(a){return c.map(a)},debug:function(){return d||b(),c}}}function c(a,b,c,d,e,f,g){var h=this;h.r1=a,h.r2=b,h.g1=c,h.g2=d,h.b1=e,h.b2=f,h.histo=g}function d(){this.vboxes=new b(function(a,b){return pv.naturalOrder(a.vbox.count()*a.vbox.volume(),b.vbox.count()*b.vbox.volume())})}function e(b){var c,d,e,f,g=1<<3*i,h=new Array(g);return b.forEach(function(b){d=b[0]>>j,e=b[1]>>j,f=b[2]>>j,c=a(d,e,f),h[c]=(h[c]||0)+1}),h}function f(a,b){var d,e,f,g=1e6,h=0,i=1e6,k=0,l=1e6,m=0;return a.forEach(function(a){d=a[0]>>j,e=a[1]>>j,f=a[2]>>j,d<g?g=d:d>h&&(h=d),e<i?i=e:e>k&&(k=e),f<l?l=f:f>m&&(m=f)}),new c(g,h,i,k,l,m,b)}function g(b,c){function d(a){var b,d,e,f,g,h=a+"1",j=a+"2",k=0;for(i=c[h];i<=c[j];i++)if(o[i]>n/2){for(e=c.copy(),f=c.copy(),b=i-c[h],d=c[j]-i,g=b<=d?Math.min(c[j]-1,~~(i+d/2)):Math.max(c[h],~~(i-1-b/2));!o[g];)g++;for(k=p[g];!k&&o[g-1];)k=p[--g];return e[j]=g,f[h]=e[j]+1,[e,f]}}if(c.count()){var e=c.r2-c.r1+1,f=c.g2-c.g1+1,g=c.b2-c.b1+1,h=pv.max([e,f,g]);if(1==c.count())return[c.copy()];var i,j,k,l,m,n=0,o=[],p=[];if(h==e)for(i=c.r1;i<=c.r2;i++){for(l=0,j=c.g1;j<=c.g2;j++)for(k=c.b1;k<=c.b2;k++)m=a(i,j,k),l+=b[m]||0;n+=l,o[i]=n}else if(h==f)for(i=c.g1;i<=c.g2;i++){for(l=0,j=c.r1;j<=c.r2;j++)for(k=c.b1;k<=c.b2;k++)m=a(j,i,k),l+=b[m]||0;n+=l,o[i]=n}else for(i=c.b1;i<=c.b2;i++){for(l=0,j=c.r1;j<=c.r2;j++)for(k=c.g1;k<=c.g2;k++)m=a(j,k,i),l+=b[m]||0;n+=l,o[i]=n}return o.forEach(function(a,b){p[b]=n-a}),d(h==e?"r":h==f?"g":"b")}}function h(a,c){function h(a,b){for(var c,d=1,e=0;e<k;)if(c=a.pop(),c.count()){var f=g(i,c),h=f[0],j=f[1];if(!h)return;if(a.push(h),j&&(a.push(j),d++),d>=b)return;if(e++>k)return}else a.push(c),e++}if(!a.length||c<2||c>256)return!1;var i=e(a),j=0;i.forEach(function(){j++});var m=f(a,i),n=new b(function(a,b){return pv.naturalOrder(a.count(),b.count())});n.push(m),h(n,l*c);for(var o=new b(function(a,b){return pv.naturalOrder(a.count()*a.volume(),b.count()*b.volume())});n.size();)o.push(n.pop());h(o,c-o.size());for(var p=new d;o.size();)p.push(o.pop());return p}var i=5,j=8-i,k=1e3,l=.75;return c.prototype={volume:function(a){var b=this;return b._volume&&!a||(b._volume=(b.r2-b.r1+1)*(b.g2-b.g1+1)*(b.b2-b.b1+1)),b._volume},count:function(b){var c=this,d=c.histo;if(!c._count_set||b){var e,f,g,h=0;for(e=c.r1;e<=c.r2;e++)for(f=c.g1;f<=c.g2;f++)for(g=c.b1;g<=c.b2;g++)index=a(e,f,g),h+=d[index]||0;c._count=h,c._count_set=!0}return c._count},copy:function(){var a=this;return new c(a.r1,a.r2,a.g1,a.g2,a.b1,a.b2,a.histo)},avg:function(b){var c=this,d=c.histo;if(!c._avg||b){var e,f,g,h,j,k=0,l=1<<8-i,m=0,n=0,o=0;for(f=c.r1;f<=c.r2;f++)for(g=c.g1;g<=c.g2;g++)for(h=c.b1;h<=c.b2;h++)j=a(f,g,h),e=d[j]||0,k+=e,m+=e*(f+.5)*l,n+=e*(g+.5)*l,o+=e*(h+.5)*l;k?c._avg=[~~(m/k),~~(n/k),~~(o/k)]:c._avg=[~~(l*(c.r1+c.r2+1)/2),~~(l*(c.g1+c.g2+1)/2),~~(l*(c.b1+c.b2+1)/2)]}return c._avg},contains:function(a){var b=this,c=a[0]>>j;return gval=a[1]>>j,bval=a[2]>>j,c>=b.r1&&c<=b.r2&&gval>=b.g1&&gval<=b.g2&&bval>=b.b1&&bval<=b.b2}},d.prototype={push:function(a){this.vboxes.push({vbox:a,color:a.avg()})},palette:function(){return this.vboxes.map(function(a){return a.color})},size:function(){return this.vboxes.size()},map:function(a){for(var b=this.vboxes,c=0;c<b.size();c++)if(b.peek(c).vbox.contains(a))return b.peek(c).color;return this.nearest(a)},nearest:function(a){for(var b,c,d,e=this.vboxes,f=0;f<e.size();f++)c=Math.sqrt(Math.pow(a[0]-e.peek(f).color[0],2)+Math.pow(a[1]-e.peek(f).color[1],2)+Math.pow(a[2]-e.peek(f).color[2],2)),(c<b||void 0===b)&&(b=c,d=e.peek(f).color);return d},forcebw:function(){var a=this.vboxes;a.sort(function(a,b){return pv.naturalOrder(pv.sum(a.color),pv.sum(b.color))});var b=a[0].color;b[0]<5&&b[1]<5&&b[2]<5&&(a[0].color=[0,0,0]);var c=a.length-1,d=a[c].color;d[0]>251&&d[1]>251&&d[2]>251&&(a[c].color=[255,255,255])}},{quantize:h}}();