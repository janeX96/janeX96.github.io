var canvas = document.getElementById("battlefield");
var canvas2 = document.getElementById("base");
var ctx = canvas.getContext("2d");
var ctx2 = canvas2.getContext("2d");
ctx.font = "15px Arial";
var hpLabel = document.getElementById("hp");
var bestScore = document.getElementById("bestScore");

//images
const tankImg = new Image();
tankImg.src = "./tank.png";
const bulletImg = new Image();
bulletImg.src = "./bullet.png";

const explosionImgs = [];

function loadExplosionImages() {
  for (let index = 0; index < 7; index++) {
    let explosionImg = new Image();
    explosionImg.src = `./images/explosion/Explosion_${index + 1}.png`;
    explosionImgs.push(explosionImg);
  }
}

//show the best score if there is info in local storage
if (localStorage.getItem("score-kills") != null) {
  bestScore.textContent = ` ${localStorage.getItem(
    "score-kills"
  )} kills in ${localStorage.getItem(
    "score-time-min"
  )} min ${localStorage.getItem("score-time-sec")}sec - ${localStorage.getItem(
    "score-waves"
  )} waves`;
}

var weaponName = "simple gun";
var myDmg = 10;

//score board variables
var myHp = 100;
hpLabel.style.color = "red";
hpLabel.textContent = myHp;
var kills = 0;
var killsLabel = document.getElementById("kills");
killsLabel.textContent = kills;
var timer = document.getElementById("time");
var timeMin = 0;
var timeSec = 0;
var timerInterval = null;

//cannon coords
const cannonX = 1000;
const cannonY = 250;

var enemiesArray = [];
var ammoArray = [1, 1, 1];
var ammoLoadTime = 1000;

var waveCounter = 0;
var waveNumber = document.getElementById("waveNumber");
waveNumber.textContent = waveCounter;
var wave = true;

function drawCannon() {
  ctx.beginPath();
  ctx.ellipse(cannonX, cannonY, 10, 10, Math.PI / 4, 0, 2 * Math.PI);
  ctx.stroke();
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

const Enemy = function (hp, speed, dmg) {
  this.hp = hp;
  this.speed = speed;
  this.dmg = dmg;

  this.x = -10;
  this.y = getRandomInt(0, 500);

  this.width = 50;
  this.height = 40;

  this.shotDown = false;
  this.arrived = false;

  this.clear = () => {
    ctx.clearRect(this.x, this.y - 25, this.width, this.height + 25);
  };

  this.draw = () => {
    this.x += 1;
    // ctx.fillStyle = "grey";
    // ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.drawImage(tankImg, this.x, this.y, this.width, this.height);
    ctx.fillStyle = "#b31212";
    // ctx.fillText(this.hp, this.x, this.y - 10);
    ctx.fillRect(this.x, this.y - 10, this.hp, 5);
  };

  this.start = () => {
    this.interval = setInterval(() => {
      this.clear();
      this.draw();
      if (this.x > 1000) {
        this.arrived = true;
        getDamage(this.dmg);
        this.stop();
      }
    }, this.speed);
  };

  this.hit = (dmg) => {
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.shotDown = true;
      animateExplosion(
        ctx,
        this.x - 20,
        this.y - 20,
        this.width + 50,
        this.height + 50
      );
      this.stop();
      kills += 1;
      killsLabel.textContent = kills;
    }
  };

  this.stop = () => {
    clearInterval(this.interval);
    this.clear();
    this.x = 0;
    this.y = 0;
    this.hp = 0;
  };
};

const Bullet = function (destX, destY) {
  this.lastX = cannonX;
  this.lastY = cannonY;

  this.dmg = myDmg;

  this.size = 3;

  this.clear = () => {
    ctx.clearRect(
      this.lastX - 10,
      this.lastY - 10,
      this.size * 5,
      this.size * 5
    );
  };

  let yDir = cannonY > destY ? -1 : cannonY < destY ? 1 : 0;
  let lenX = cannonX - destX;
  let lenY = cannonY - destY;
  lenY = lenY > -0 ? lenY : lenY * -1;
  let diff = lenX > lenY ? lenY / lenX : lenX / lenY;

  this.nextX = this.lastX; // - 0.1 * 1000;
  this.nextY = this.lastY; //+ 0.1 * 1000 * diff * yDir;

  this.draw = () => {
    ctx.beginPath();
    ctx.ellipse(
      this.nextX,
      this.nextY,
      this.size,
      this.size,
      Math.PI / 4,
      0,
      2 * Math.PI
    );
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.stroke();
    this.lastX = this.nextX;
    this.lastY = this.nextY;
  };

  this.go = () => {
    this.interval = setInterval(() => {
      this.clear();
      this.draw();
      this.checkHit();
      this.nextX = this.lastX - 0.8 * 10;
      this.nextY = this.lastY + 0.8 * 10 * diff * yDir;
      if (this.lastX < 0 || this.lastY < 0 || this.lastY > 500) {
        this.stop();
      }
    }, 10);
  };

  this.checkHit = () => {
    enemiesArray.forEach((e) => {
      var left = e.x;
      var right = e.x + e.width;
      var top = e.y;
      var bottom = e.y + e.height;

      let hit =
        this.lastX >= left &&
        this.lastX <= right &&
        this.lastY >= top &&
        this.lastY <= bottom;

      if (hit) {
        e.hit(this.dmg);
        // this.dmg = 0; //jesli bede chcial zadawac przedzial dmg
        this.stop();
      }
    });
  };

  this.stop = () => {
    clearInterval(this.interval);
    this.clear();
  };
};

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startWave() {
  if (enemiesArray.length == 0 && myHp > 0) {
    //show info about new wave for 5s
    document.getElementById("info").style.display = "grid";
    document.getElementById("info").textContent = `Wave ${waveCounter + 1}`;
    setTimeout(() => {
      document.getElementById("info").style.display = "none";
    }, 5000);

    wave = true;
    waveCounter += 1;
    waveNumber.textContent = waveCounter;
    let waveInterval = setInterval(() => {
      let timeout;
      if (enemiesArray.length == 0) {
        timeout = 1;
      } else {
        timeout = getRandomIntInclusive(2, 5);
      }

      setTimeout(() => {
        if (wave && enemiesArray.length < 10) {
          //get random hp
          let hp = getRandomIntInclusive(1, 25 * waveCounter);
          let dmg;
          let speed;

          if (hp >= 25) {
            dmg = getRandomIntInclusive(4, 20) * waveCounter;
            speed = getRandomIntInclusive(20, 50);
          } else {
            dmg = getRandomIntInclusive(4, 10) * waveCounter;
            speed = getRandomIntInclusive(4, 15);
          }

          var enemy = new Enemy(hp, speed, dmg);
          console.log("new enemy spawned");
          enemiesArray.push(enemy);
          enemy.start();
        }
      }, 1000 * timeout);
    }, 1000);

    setTimeout(() => {
      wave = false;
      clearInterval(waveInterval);

      if (myHp > 0) {
        setTimeout(() => {
          startWave();
        }, 5000);
      }
    }, 20000);
  } else {
    setTimeout(() => {
      let exist = false;
      enemiesArray.forEach((e) => {
        if (e.hp != 0) {
          exist = true;
        }
      });

      if (!exist) {
        enemiesArray = [];
      }
      startWave();
    }, 1000);
  }
}

function start() {
  startWave();
}
// function spawnEnemies() {
//   var e1 = new Enemy(100, 10, 20);
//   var e2 = new Enemy(50, 10, 15);
//   var e3 = new Enemy(80, 60, 10);
//   var e4 = new Enemy(80, 60, 10);
//   var e5 = new Enemy(80, 60, 40);
//   enemiesArray = [e1, e2, e3, e4, e5];
//   enemiesArray.forEach((e) => {
//     e.start();
//   });
// }

function getDamage(dmg) {
  animateExplosion(ctx2, 30, getRandomInt(10, 490), 100, 100);
  myHp -= dmg;
  hpLabel.textContent = myHp;

  if (myHp <= 0) {
    myHp = 0;
    hpLabel.textContent = 0;
    death();
  }
}

function drawAmmo() {
  let y = 400;

  ammoArray
    .slice()
    .reverse()
    .forEach((element) => {
      // ctx2.fillStyle = "grey";
      // ctx2.fillRect(40, y, 50, 20);
      // ctx2.clearRect(20, y, 100, 70);
      if (element === 1) {
        // ctx2.fillStyle = "blue";
        // ctx2.fillRect(40, y, 50, 20);
        ctx2.drawImage(bulletImg, 20, y, 100, 70);
      } else {
        ctx2.clearRect(20, y, 100, 70);
      }
      y += 25;
    });
}

function startTimer() {
  timerInterval = setInterval(() => {
    timeSec += 1;
    if (timeSec === 60) {
      timeMin += 1;
      timeSec = 0;
    }
    let minutes = timeMin > 10 ? timeMin : `0${timeMin}`;
    let seconds = timeSec > 10 ? timeSec : `0${timeSec}`;
    timer.textContent = `${minutes}:${seconds}`;
  }, 1000);
}

canvas.addEventListener(
  "click",
  function (e) {
    let ammoIndex = ammoArray.lastIndexOf(1);
    console.log(ammoIndex);
    if (ammoIndex >= 0) {
      ammoArray[ammoIndex] = 0;

      var b = new Bullet(e.offsetX, e.offsetY);
      b.go();
    }
    drawAmmo();
  },
  false
);

canvas.addEventListener(
  "mousemove",
  function (e) {
    drawCannon();
  },
  false
);

function death() {
  wave = false;
  clearInterval(timerInterval);
  enemiesArray.forEach((e) => {
    e.stop();
  });
  ctx.fillStyle = "green";
  ctx.fillRect(150, 100, 700, 300);

  ctx.fillStyle = "red";
  ctx.font = "35px Arial";
  ctx.fillText(
    `SCORE: ${kills}kills in ${timeMin}min ${timeSec}sec (${waveCounter} waves)`,
    200,
    200
  );

  // if (localStorage.getItem("user") == null) {
  //   document.getElementById("summary").style.display = "grid";
  // } else {
  saveScore(false);
  // }
  document.getElementById("reloadButton").style.display = "grid";
}

setInterval(() => {
  ammoArray[ammoArray.indexOf(0)] = 1;
  drawAmmo();
}, ammoLoadTime);

function saveScore(isNew = true) {
  // if (isNew) {
  //   let userName = document.getElementById("nickname").value;
  //   localStorage.setItem("user", userName);
  // }

  if (
    isNew ||
    localStorage.getItem("score-waves") < waveCounter ||
    (localStorage.getItem("score-waves") == waveCounter &&
      localStorage.getItem("score-kills") < kills)
  ) {
    localStorage.setItem("score-kills", kills);
    localStorage.setItem("score-time-min", timeMin);
    localStorage.setItem("score-time-sec", timeSec);
    localStorage.setItem("score-waves", waveCounter);
  }
}

function drawWeaponParams() {
  ctx2.font = "16px Arial";
  ctx2.fillStyle = "blue";
  ctx2.fillText(weaponName, 20, 20);
  ctx2.fillStyle = "red";
  ctx2.fillText(`dmg: ${myDmg}`, 20, 40);
}

function reloadGame() {
  window.location.reload();
}

function animateExplosion(ctx, x, y, w, h) {
  let n = 0;

  let animationInterval = setInterval(() => {
    if (n < 7) {
      ctx.clearRect(x, y, w, h);
      ctx.drawImage(explosionImgs[n], x, y, w, h);
      n++;
      w += 3;
      h += 3;
    } else {
      ctx.clearRect(x, y, w, h);
      clearInterval(animationInterval);
    }
  }, 100);
}

loadExplosionImages();
startTimer();
drawCannon();
// spawnEnemies();
start();
drawAmmo();
drawWeaponParams();
console.log(explosionImgs);
