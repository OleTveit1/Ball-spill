let tid = document.querySelector('h2');
let canvas = document.querySelector('canvas');
let ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;
let musEllerTastatur;
let baller = [];
let hoved;''
let antallSpist = 0;
let sek = 0;
let timerIntervall;
let vekstIntervall;
let spillStartet = false;
let leggerTilNyeBaller = false;
let areControlsEnabled = false;








document.getElementById('mouse-control').addEventListener('click', function () {
  musEllerTastatur = 'mouse';
  startSpill();
});

document.getElementById('keyboard-control').addEventListener('click', function () {
  musEllerTastatur = 'keyboard';
  startSpill();
});



function sjekkOmAlleBallerErSpist() {
  let alleBallerSpist = true;
  for (let i = 0; i < baller.length; i++) {
    if (baller[i].exists) {
      alleBallerSpist = false;
      break;
    }
  }
  if (alleBallerSpist) {
    spillStartet = false;
    startLagingAvBaller();
  }
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function Shape(x, y, velX, velY, exists) {
  this.x = x;
  this.y = y;
  this.velX = velX;
  this.velY = velY;
  this.exists = exists;
}

function Ball(x, y, velX, velY, exists, color, size) {
  Shape.call(this, x, y, velX, velY, exists);
  this.originalFarge = color;
  this.color = 'darkgreen';
  this.size = size;
  this.invincible = true;
  this.blinking = true;
  this.blinkState = true;
  this.borderColor = 'yellow';

  setTimeout(() => {
    this.invincible = false;
    this.blinking = false;
    this.color = this.originalFarge;
    this.borderColor = 'green';
  }, 5000);

  this.blinkInterval = setInterval(() => {
    this.blinkState = !this.blinkState;
  }, 500);
}

Ball.prototype = Object.create(Shape.prototype);
Ball.prototype.constructor = Ball;

Ball.prototype.draw = function () {
  ctx.beginPath();
  ctx.fillStyle = this.blinking && this.blinkState ? '#8B8000' : this.color;
  ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = this.invincible ? 'yellow' : this.borderColor;
  ctx.stroke();
};

Ball.prototype.update = function () {
  let adjustmentX = 0;
  let adjustmentY = 0;

  if (this.x >= 0 - width * 0.2 && this.x <= width * 1.2 && this.y >= 0 - height * 0.2 && this.y <= height * 1.2) {
    if (hoved.touchingTop) {
      adjustmentY = -hoved.velY;
    } else if (hoved.touchingBottom) {
      adjustmentY = hoved.velY;
    }
    if (hoved.touchingLeft) {
      adjustmentX = -hoved.velX;
    } else if (hoved.touchingRight) {
      adjustmentX = hoved.velX;
    }
  }

  if (this.x >= width * 1.5) {
    this.x = 0 - this.size;
  } else if (this.x <= 0 - width * 0.5) {
    this.x = width + this.size;
  }

  if (this.y >= height * 1.5) {
    this.y = 0 - this.size;
  } else if (this.y <= 0 - height * 0.5) {
    this.y = height + this.size;
  }

  this.x += this.velX - adjustmentX;
  this.y += this.velY - adjustmentY;
};

Ball.prototype.KollisjonSjekk = function () {
  for (let i = 0; i < baller.length; i++) {
    if (this !== baller[i] && baller[i].exists) {
      let dx = this.x - baller[i].x;
      let dy = this.y - baller[i].y;
    }
  }
};

function hovedBall(x, y, exists) {
  Shape.call(this, x, y, 5, 5, exists);
  this.color = 'white';
  this.size = Math.floor((width + height) / 300);
  this.startingSize = Math.floor((width + height) / 300);
  this.eating = false;
  this.ballerSpist = 0;
  this.totalBallsToEat = 0;
}

hovedBall.prototype = Object.create(Shape.prototype);
hovedBall.prototype.constructor = hovedBall;

hovedBall.prototype.draw = function () {
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = this.color;
  ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
  ctx.stroke();
  this.drawArrowToNearestBall();
};

hovedBall.prototype.drawArrowToNearestBall = function () {
  let nearestBall = this.findNearestBall();
  if (nearestBall) {
    let dx = nearestBall.x - this.x;
    let dy = nearestBall.y - this.y;
    let angle = Math.atan2(dy, dx);

    let arrowLength = this.size * 0.75;
    let arrowWidth = this.size * 0.1;

    let arrowX = this.x + Math.cos(angle) * arrowLength;
    let arrowY = this.y + Math.sin(angle) * arrowLength;

    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(arrowX, arrowY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
  }
};

hovedBall.prototype.findNearestBall = function () {
  let nearestBall = null;
  let shortestDistance = Infinity;

  for (let i = 0; i < baller.length; i++) {
    if (baller[i].exists) {
      let dx = this.x - baller[i].x;
      let dy = this.y - baller[i].y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestBall = baller[i];
      }
    }
  }

  return nearestBall;
};


hovedBall.prototype.checkBounds = function () {
  this.touchingTop = false;
  this.touchingBottom = false;
  this.touchingLeft = false;
  this.touchingRight = false;

  if (musEllerTastatur === 'mouse') {
    if ((this.x + this.size / 2) >= width * 0.9) {
      this.touchingRight = true;
    }
    if ((this.x - this.size / 2) <= width * 0.1) {
      this.touchingLeft = true;
    }
    if ((this.y + this.size / 2) >= height * 0.9) {
      this.touchingBottom = true;
    }
    if ((this.y - this.size / 2) <= height * 0.1) {
      this.touchingTop = true;
    }
    if ((this.x + this.size / 2) >= width) {
      this.x = width - this.size / 2;
    }
    if ((this.x - this.size / 2) <= 0) {
      this.x = this.size / 2;
    }
    if ((this.y + this.size / 2) >= height) {
      this.y = height - this.size / 2;
    }
    if ((this.y - this.size / 2) <= 0) {
      this.y = this.size / 2;
    }
  } else if (musEllerTastatur === 'keyboard') {
    if ((this.x + this.size / 2) >= width * 0.9 + 1) {
      this.x = width * 0.9 - this.size / 2;
      this.touchingRight = true;
    }
    if ((this.x - this.size / 2) <= 0 + width * 0.1 - 1) {
      this.x = this.size / 2 + width * 0.1;
      this.touchingLeft = true;
    }
    if ((this.y + this.size / 2) >= height * 0.9 + 1) {
      this.y = height * 0.9 - this.size / 2;
      this.touchingBottom = true;
    }
    if ((this.y - this.size / 2) <= 0 + height * 0.1 - 1) {
      this.y = this.size / 2 + height * 0.1;
      this.touchingTop = true;
    }
  }
};

hovedBall.prototype.setControls = function () {
  const _this = this;
  let keys = {};

  if (musEllerTastatur === 'keyboard') {
    window.onkeydown = function (e) {
      keys[e.keyCode] = true;
    }

    window.onkeyup = function (e) {
      keys[e.keyCode] = false;
    }

    function updatePosition() {
      if (keys[65]) { // A 
        _this.x -= _this.velX;
      }
      if (keys[68]) { // D
        _this.x += _this.velX;
      }
      if (keys[87]) { // W
        _this.y -= _this.velY;
      }
      if (keys[83]) { // S
        _this.y += _this.velY;
      }
      requestAnimationFrame(updatePosition);
    }

    updatePosition();
  }

  if (musEllerTastatur === 'mouse') {
    canvas.addEventListener('mousemove', function (e) {
      if (areControlsEnabled) {
        let rect = canvas.getBoundingClientRect();
        _this.x = e.clientX - rect.left;
        _this.y = e.clientY - rect.top;
      }
    });
  }
}

hovedBall.prototype.KollisjonSjekk = function () {
  for (let i = 0; i < baller.length; i++) {
    if (baller[i].exists) {
      let dx = this.x - baller[i].x;
      let dy = this.y - baller[i].y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (baller[i].size > this.size) {
        if (distance + this.size * 0.75 < baller[i].size && !baller[i].invincible) {
          document.body.classList.remove('skjultMus');
          spillOver(antallSpist, sek);
          return;
        }
      } else {
        if (distance + baller[i].size * 0.75 < this.size) {
          if (!baller[i].invincible) {
            baller[i].exists = false;
            this.size += baller[i].size / 10;
            this.ballerSpist++;

            reduceSizeAllBalls();

            addNewBall();
          }
        }
      }

      if (baller[i].size > this.size) {
        baller[i].borderColor = 'red';
        baller[i].color = 'darkred';
      } else {
        baller[i].borderColor = 'green';
        baller[i].color = 'darkgreen';
      }
    }
  }

  sjekkOmAlleBallerErSpist();
};

function timer() {
  sek++;
  tid.textContent = sek;
}

function startTimer() {
  timerIntervall = setInterval(timer, 1000);
}

function stoppTimer() {
  clearInterval(timerIntervall);
}

function størrelseØkning() {
  if (hoved.size <= (Math.floor(((width + height)) / 200) + Math.floor(((width + height)) / 20)) / 3) {
    hoved.size += 0.05;
  }
}

function startVoksing() {
  vekstIntervall = setInterval(størrelseØkning, 100);
}

function stoppVoksing() {
  clearInterval(vekstIntervall);
}
function loop() {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, width, height);

  areControlsEnabled = true;

  for (let i = 0; i < baller.length; i++) {
    if (baller[i].exists) {
      baller[i].draw();
      baller[i].update();
      baller[i].KollisjonSjekk();
    }
  }

  hoved.draw();
  hoved.checkBounds();
  hoved.KollisjonSjekk();

  animationFrameId = requestAnimationFrame(loop);
}

function reduceSizeAllBalls() {
  let number = Math.floor((width + height) / 25 * 2);
  for (let i = 0; i < baller.length; i++) {
    baller[i].size = baller[i].size - baller[i].size *  0.5/number;
    if (baller[i].size <= 0) {
      baller[i].exists = false;
    }
  }
  if (hoved.size >= Math.floor(((width + height)) / 200) + Math.floor(((width + height)) / 20) / 3)
    hoved.size = Math.floor(((width + height)) / 200) + Math.floor(((width + height)) / 20) / 3;
}

function addNewBall() {
  reduceSizeAllBalls();
  let number = Math.floor((width + height) / 25);
  let size = random(Math.floor(((width + height)) / 200), Math.floor(((width + height)) / 20));
  let ball = new Ball(
    random(0 + size, width - size),
    random(0 + size, height - size),
    random((-125 / size), (125 / size)),
    random((-125 / size), (125 / size)),
    true,
    'darkgreen',
    size
  );
  baller.push(ball);
}

function startLagingAvBaller() {
  if (!spillStartet && !leggerTilNyeBaller) {
    leggerTilNyeBaller = true;

    let number = Math.floor((width + height) / 25);
    hoved.totalBallsToEat = Math.floor(number / 3);
    let i = 0;
    let addBallInterval = setInterval(function () {
      if (i < number) {
        let size = random(Math.floor(((width + height)) / 200), Math.floor(((width + height)) / 20));
        let ball = new Ball(
          random(0 + size, width - size),
          random(0 + size, height - size),
          random((-125 / size), (125 / size)),
          random((-125 / size), (125 / size)),
          true,
          'darkgreen',
          size
        );

        baller.push(ball);
        i++;
      } else {
        clearInterval(addBallInterval);
        leggerTilNyeBaller = false;
      }
    }, Math.floor((1000000) / (width + height)));

    spillStartet = true;
  }
}




let animationFrameId; 

document.getElementById('spillIgjenKnapp').addEventListener('click', function () {
  document.getElementById('spillOverSkjerm').style.display = 'none';
  resetSpill();
  startSpill();
});

function resetSpill() {
  clearInterval(timerIntervall);
  clearInterval(vekstIntervall);
  cancelAnimationFrame(animationFrameId);
  

  baller = [];
  antallSpist = 0;
  sek = 0;
  hoved = null;
  spillStartet = false;
  leggerTilNyeBaller = false;
  areControlsEnabled = false;


  tid.textContent = sek;
  document.body.classList.remove('skjultMus');
}

function startSpill() {

  resetSpill();
  

  document.getElementById('control-selection').style.display = 'none';
  

  hoved = new hovedBall(
    width / 2,
    height / 2,
    true
  );

  hoved.setControls();
  document.body.classList.add('skjultMus');

  startTimer();
  startVoksing();
  startLagingAvBaller();
  loop();
}

function spillOver(antallSpist, sek) {
  baller = [];
  stoppTimer();
  stoppVoksing();

  let ballerSpistElement = document.getElementById('ballerSpist');
  let tidILiveElement = document.getElementById('tidILive');
  let scoreElement = document.getElementById('score');
  let highScoreElement = document.getElementById('highScore');

  ballerSpistElement.textContent = hoved.ballerSpist;
  tidILiveElement.textContent = sek + " sekunder";
  scoreElement.textContent = sek * hoved.ballerSpist;

  if(!localStorage.highScore){
    localStorage.highScore = 0;
    highScoreElement.textContent = localStorage.highScore;
  }
  if (sek * hoved.ballerSpist + 1 > localStorage.highScore) {
    localStorage.highScore = sek * hoved.ballerSpist;
  }
  highScoreElement.textContent = localStorage.highScore;

  document.body.classList.remove('skjultMus');


  document.getElementById('spillOverSkjerm').style.display = 'block';
}