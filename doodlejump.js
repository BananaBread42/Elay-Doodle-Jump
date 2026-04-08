//board
let board;
let boardWidth = 500;
let boardHeight = 705;
let context;

//game state
let gameStarted = false;
let gameOver = false;

//doodler
let doodlerWidth = 46;
let doodlerHeight = 46;
let doodlerX = boardWidth/2 - doodlerWidth/2;
let doodlerY = boardHeight*7/8 - doodlerHeight;
let doodlerRightImg;
let doodlerLeftImg;

let doodler = {
    img : null,
    x : doodlerX,
    y : doodlerY,
    width : doodlerWidth,
    height : doodlerHeight
}

//physics
let velocityX = 0;
let velocityY = 0;
let initialVelocitY = -8;
let gravity = 0.4;

//platforms
let platformArray = [];
let platformWidth = 60;
let platformHeight = 18;
let platformImg;

//enemies
let enemyArray = [];
let enemyImg;

//powerups
let springImg;
let jetpackImg;
let jetpackArray = [];

//score
let score = 0;
let highScore = 0;

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    //images
    doodlerRightImg = new Image();
    doodlerRightImg.src = "./doodler-right.png";
    doodler.img = doodlerRightImg;

    doodlerLeftImg = new Image();
    doodlerLeftImg.src = "./doodler-left.png";

    platformImg = new Image();
    platformImg.src = "./platform.png";

    enemyImg = new Image();
    enemyImg.src = "./enemy.png";

    springImg = new Image();
    springImg.src = "./spring.png";

    jetpackImg = new Image();
    jetpackImg.src = "./jetpack.png";

    velocityY = initialVelocitY;
    placePlatforms();

    requestAnimationFrame(update);

    document.addEventListener("keydown", moveDoodler);

    document.addEventListener("keyup", function(e) {
        if (["ArrowLeft","ArrowRight","KeyA","KeyD"].includes(e.code)){
            velocityX = 0;
        }
    });
}

function update() {
    requestAnimationFrame(update);

    if (!gameStarted){
        drawStartScreen();
        return;
    }

    if (gameOver){
        drawGameOver();
        return;
    }

    context.clearRect(0, 0, board.width, board.height);

    //movement
    doodler.x += velocityX;

    if (doodler.x > boardWidth) doodler.x = 0;
    if (doodler.x + doodler.width < 0) doodler.x = boardWidth;

    velocityY += gravity;
    doodler.y += velocityY;

    if (doodler.y > board.height) gameOver = true;

    context.drawImage(doodler.img, doodler.x, doodler.y, doodler.width, doodler.height);

    //platforms
    for (let i = 0; i < platformArray.length; i++){
        let p = platformArray[i];

        if (velocityY < 0 && doodler.y < boardHeight*3/4){
            p.y -= initialVelocitY;
        }

        //breakable
        if (p.breakable && detectCollision(doodler, p) && velocityY >= 0){
            platformArray.splice(i,1);
            i--;
            continue;
        }

        //spring
        if (detectCollision(doodler, p) && velocityY >= 0){
            if (p.hasSpring){
                velocityY = initialVelocitY * 1.8;
            } else {
                velocityY = initialVelocitY;
            }
        }

        context.drawImage(p.img, p.x, p.y, p.width, p.height);

        if (p.hasSpring){
            context.drawImage(springImg, p.x + 15, p.y - 15, 30, 30);
        }
    }

    //enemies
    for (let i = 0; i < enemyArray.length; i++){
        let e = enemyArray[i];

        if (velocityY < 0 && doodler.y < boardHeight*3/4){
            e.y -= initialVelocitY;
        }

        if (detectCollision(doodler, e)){
            gameOver = true;
        }

        context.drawImage(enemyImg, e.x, e.y, e.width, e.height);
    }

    //jetpack
    for (let i = 0; i < jetpackArray.length; i++){
        let j = jetpackArray[i];

        if (velocityY < 0 && doodler.y < boardHeight*3/4){
            j.y -= initialVelocitY;
        }

        if (detectCollision(doodler, j)){
            velocityY = -15; // BOOST 🚀
            jetpackArray.splice(i,1);
            i--;
            continue;
        }

        context.drawImage(jetpackImg, j.x, j.y, j.width, j.height);
    }

    //remove old platforms
    while (platformArray.length > 0 && platformArray[0].y >= boardHeight){
        platformArray.shift();
        newPlatform();
    }

    updateScore();

    context.fillStyle = "black";
    context.font = "16px sans-serif";
    context.fillText("Score: " + score, 5, 20);
    context.fillText("High Score: " + highScore, 5, 40);
}

function drawStartScreen(){
    context.clearRect(0,0,board.width,board.height);
    context.font = "26px sans-serif";
    context.fillText("Doodle Jump", boardWidth/3, boardHeight/2 - 40);
    context.font = "16px sans-serif";
    context.fillText("Press SPACE to Start", boardWidth/3.5, boardHeight/2);
}

function drawGameOver(){
    context.clearRect(0,0,board.width,board.height);
    context.font = "24px sans-serif";
    context.fillText("Game Over", boardWidth/3, boardHeight/2);
    context.font = "16px sans-serif";
    context.fillText("Press SPACE to Restart", boardWidth/3.5, boardHeight/2 + 30);
}

function moveDoodler(e){
    if (e.code == "Space"){
        if (!gameStarted){
            gameStarted = true;
            return;
        }
        if (gameOver){
            resetGame();
        }
    }

    if (e.code == "ArrowRight" || e.code == "KeyD"){
        velocityX = 4;
        doodler.img = doodlerRightImg;
    }
    if (e.code == "ArrowLeft" || e.code == "KeyA"){
        velocityX = -4;
        doodler.img = doodlerLeftImg;
    }
}

function resetGame(){
    doodler.x = doodlerX;
    doodler.y = doodlerY;
    velocityX = 0;
    velocityY = initialVelocitY;

    score = 0;
    gameOver = false;

    placePlatforms();
    enemyArray = [];
    jetpackArray = [];
}

function placePlatforms(){
    platformArray = [];

    for (let i = 0; i < 7; i++){
        newPlatform(i);
    }
}

function newPlatform(i=0){
    let randomX = Math.floor(Math.random() * boardWidth*3/4);

    let platform = {
        img : platformImg,
        x : randomX,
        y : i === 0 ? boardHeight - 50 : -platformHeight,
        width : platformWidth,
        height : platformHeight,
        breakable : Math.random() < 0.2,
        hasSpring : Math.random() < 0.2
    };

    platformArray.push(platform);

    //enemy
    if (Math.random() < 0.2){
        enemyArray.push({
            x: randomX,
            y: platform.y - 40,
            width: 40,
            height: 40
        });
    }

    //jetpack
    if (Math.random() < 0.1){
        jetpackArray.push({
            x: randomX + 10,
            y: platform.y - 80,
            width: 30,
            height: 30
        });
    }
}

function detectCollision(a,b){
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function updateScore(){
    if (velocityY < 0) score++;

    if (score > highScore){
        highScore = score;
    }
}