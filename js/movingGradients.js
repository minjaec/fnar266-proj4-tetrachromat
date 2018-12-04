//editable parameters
var nColors = 4;
var inertiaFactor = 20;
var movementCoefficient = 0.2;
var drawInterval = 30;
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
            item.r = randomOffset(maxDist, maxDist / 3);
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

    fillOrder.forEach(function (item) {
        gradientContext.fillStyle = gradients[item];
        gradientContext.fillRect(0, 0, gradientElement.width, gradientElement.height);
    })
};

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
    var topLeftColor = gradientContext.getImageData(rect.left, rect.top, 1, 1).data;
    var bottomRightColor = gradientContext.getImageData(rect.right, rect.bottom, 1, 1).data;
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
    gradientContext = gradientElement.getContext('2d');
    window.addEventListener('resize', resizeCanvas, false);
    //gradientElement.addEventListener('mouseenter', mousemove, false);
    document.addEventListener('mousemove', mousemove, false);
    initGradients();
    updateMovingGradients();
    setInterval(draw, 30);
    setInterval(updateGradientParamsOnResize, resizeCheckInterval);
    initialized = true;
})();