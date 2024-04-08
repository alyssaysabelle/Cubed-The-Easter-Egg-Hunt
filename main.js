import * as THREE from 'three';
import * as maze from './maze.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const PI_2 = Math.PI / 2;

var scene;
var camera;
var renderer

var fpsClock;
var timerStart;
var timerRunning;

var wallMat;
var blockMat;
var wallGeom;
var blockGeom;

var mazeSize;
var mazeData;
var mazeGroup;
var mazeStarted;
var mazeFinished;
var mazeNear;
var mazeFar;
var segments;
var startPos;
var endPos;
var keys = [];
var eggModels = ['bulbasaur_egg.glb', 'paint_egg.glb', 'pink_egg.glb', 'spots_egg.glb', 'stripes_egg.glb', 'heart_egg.glb', 'dragon_egg.glb', 'line_egg.glb'];

// start button
var startButton = document.getElementById('startBtn');
var gameContainer = document.getElementById('start');
var restartButton = document.getElementById('restartBtn');
var quitButton = document.getElementById('quitBtn');
var quitButton2 = document.getElementById('quitBtn2');
var exitScreen = document.getElementById('end');

document.addEventListener('DOMContentLoaded', function() {
    var slider = document.getElementById('mazeSizeSlider');
    var output = document.getElementById('mazeSizeValue');
    output.textContent = slider.value;
    slider.addEventListener('input', function() {
        output.textContent = this.value;
    });
})

document.addEventListener('DOMContentLoaded', function() {
    var slider = document.getElementById('mazeSizeSlider2');
    var output = document.getElementById('mazeSizeValue2');
    output.textContent = slider.value;
    slider.addEventListener('input', function() {
        output.textContent = this.value;
    });
})

startButton.addEventListener('click', function() {
    console.log("start button clicked");
    mazeSize = document.getElementById('mazeSizeValue').textContent;
    console.log("Maze size: " + mazeSize);
    gameContainer.hidden = true;
    init();
    addKeys(mazeSize * 2 - 1);
    animate();
});

quitButton.addEventListener('click', function() {
    console.log("quit button clicked");
    window.close();
});

quitButton2.addEventListener('click', function() {
    console.log("quit button clicked");
    window.close();
});

restartButton.addEventListener('click', function() {
    console.log("restart button clicked");
    exitScreen.hidden = true;
    game.hidden = false;
    mazeSize = document.getElementById('mazeSizeValue2').textContent;
    console.log("Maze size: " + mazeSize);
    newGame();
});

function init(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.set( maze.getOffset(1), maze.getOffset(1), maze.getOffset(-2));
    renderer = new THREE.WebGLRenderer( { antialias: true, powerPreference: "high-performance" } );
    renderer.setPixelRatio( Math.min(window.devicePixelRatio, 2) );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.domElement.id = "gameCanvas";
    document.getElementById('game').appendChild( renderer.domElement );

    fpsClock = new THREE.Clock();
    timerStart = 0;
    timerRunning = false;
    
    wallMat = new THREE.MeshLambertMaterial({vertexColors: true});
    blockMat = new THREE.MeshPhongMaterial({color: 'hsl(0, 0%, 10%)'});

    blockGeom = new THREE.InstancedBufferGeometry();
    THREE.BufferGeometry.prototype.copy.call(blockGeom, new THREE.BoxGeometry());
    wallGeom = new THREE.InstancedBufferGeometry();
    var loader = new GLTFLoader();
    loader.load('wall.glb',
        function (gltf) {
            let wallModel = gltf.scene.getObjectByName('wall');
            THREE.BufferGeometry.prototype.copy.call(wallGeom, wallModel.geometry);
            createMaze();
        },
        undefined,
        function (error) {
            console.error('Error loading GLTF model:', error);
        }
    );

    loader.load('start.glb',
        function (gltf) {
            let startModel = gltf.scene.getObjectByName('Start');
            let start = startModel.clone();
            start.position.set(2, 1, -1);
            start.rotateZ(179.05);
            scene.add(start);
        },
        undefined,
        function (error) {
            console.error('Error loading GLTF model:', error);
        }
    );

    loader.load('exit.glb',
        function (gltf) {
            let exitModel = gltf.scene.getObjectByName('Exit');
            let exit = exitModel.clone();
            exit.position.set(5.85 * mazeSize/3, maze.getOffset(mazeSize * 2 - 1), 7 * mazeSize/3);
            console.log("Exit: " + exit.position.x + ", " + exit.position.y + ", " + exit.position.z);
            exit.rotateZ(179.05);
            scene.add(exit);
        },
        undefined,
        function (error) {
            console.error('Error loading GLTF model:', error);
        }
    );

    let localLight = new THREE.PointLight(0xffffff);
    camera.add(localLight);
    scene.add(camera);
    let ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    //mazeSize = 3;
    mazeData = null;
    mazeGroup = new THREE.Group();
    scene.add( mazeGroup );
    mazeStarted = false;
    mazeFinished = false;
    startPos = new THREE.Vector3( maze.getOffset(1), maze.getOffset(1), maze.getOffset(1) );
    segments = mazeSize * 2 - 0.5;
    endPos = new THREE.Vector3();
    mazeFar = null;

    let controls = new PointerLockControls(camera, renderer.domElement);
    let element = document.body;
    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
    element.requestPointerLock();
    scene.add(controls.getObject());
    controls.lock();

    if(timerRunning == false){
        timerRunning = true;
        timerStart = Date.now();
    }

    document.addEventListener('mousemove', function(event) {
        // if (controls.isLocked) {
        //     let movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        //     let movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        //     this.tmpVector.set( - movementY, - movementX, 0 );
        //     scope.applyRotation( scope.tmpVector, 0.01 );
        //     scope.dispatchEvent( changeEvent );
        // }
    }); 
}


function animate() {
    requestAnimationFrame(animate);
    let delta = Math.min(fpsClock.getDelta() , 0.1);
    collisionCheck();
    checkObtainedKeys();	
	renderer.render(scene, camera);
}

function createMaze(size = mazeSize) {
    mazeSize = size;
    mazeData = maze.generateMaze(size);
    mazeStarted = false;
    mazeFinished = false;
    mazeNear = null;
    mazeFar = null;

    segments = mazeSize * 2 - 1;
    endPos.set(maze.getOffset(segments), maze.getOffset(segments), maze.getOffset(segments + 2));
    camera.position.set( maze.getOffset(1), maze.getOffset(1), maze.getOffset(-2));
    camera.lookAt(maze.getOffset(1), maze.getOffset(1), 0);
    mazeGroup.remove(...mazeGroup.children);

    let tempWall = new THREE.Object3D;
    let wallColor = [];
    let walls = [];
    let blocks = [];

    for (let i = 0; i < mazeData.collision_map.length; i++) 
    {
        for (let j = 0; j < mazeData.collision_map[i].length; j++) 
        {
            for (let k = 0; k < mazeData.collision_map[i][j].length; k++) 
            {
                if(mazeData.collision_map[i][j][k] == 0)
                    continue;
                if(i!=0 && j!=0 && k!=0 && i%2==0 && j%2==0 && k%2==0 && i!=mazeData.bounds[0]*2 && j!=mazeData.bounds[1]*2 && j!=mazeData.bounds[2]*2)
                    continue;
                let iWidth = maze.getWidth(i);
                let jWidth = maze.getWidth(j);
                let kWidth = maze.getWidth(k);
                let colored = false;
                if(iWidth + jWidth + kWidth >= 2 * maze.blockSize + maze.width)
                    colored = true;

                if(colored)
                {  
                    tempWall.scale.set(maze.blockSize, maze.width, maze.blockSize);
                    tempWall.position.set(maze.getOffset(i), maze.getOffset(j), maze.getOffset(k));
                    if(iWidth == maze.width)
                        tempWall.rotation.z = PI_2;
                    else if(kWidth == maze.width)
                        tempWall.rotation.x = PI_2;
                    tempWall.updateMatrix();
                    tempWall.rotation.set(0, 0, 0);
                    walls.push(tempWall.matrix.clone());
                    wallColor.push(
                        //TODO: Change Colors
                        0.15 + 0.7 * (i-1)/(mazeData.segments[0]),
                        0.15 + 0.7 * (j-1)/(mazeData.segments[1]),
                        0.15 + 0.7 * (k-1)/(mazeData.segments[2])
                    );
                } 
                else 
                {
                    tempWall.scale.set(iWidth, jWidth, kWidth);
                    tempWall.position.set(maze.getOffset(i), maze.getOffset(j), maze.getOffset(k));
                    tempWall.updateMatrix();
                    blocks.push(tempWall.matrix.clone());
                }
            }
        }
    }
    wallGeom.setAttribute('color', new THREE.InstancedBufferAttribute(new Float32Array(wallColor), 3));
    let wallMesh = new THREE.InstancedMesh(wallGeom, wallMat, walls.length);
    let i = 0;
    walls.forEach((mat) => wallMesh.setMatrixAt(i++, mat));
    wallMesh.needsUpdate = true;
    mazeGroup.add(wallMesh);
    let blockMesh = new THREE.InstancedMesh(blockGeom, blockMat, blocks.length);
    i = 0;
    blocks.forEach((mat) => blockMesh.setMatrixAt(i++, mat));
    blockMesh.needsUpdate = true;
    mazeGroup.add(blockMesh);

    timerRunning = false;
}

const collisionThreshold = 0.25;
var axes = {x: 0, y: 1, z: 2};
function checkCollisionAxis(axis, axis1, axis2, pos, newPos, otherPos, s){
    let min1 = Math.min(pos[axis1], otherPos[axis1]);
    let min2 = Math.min(pos[axis2], otherPos[axis2]);
    let max1 = Math.max(pos[axis1], otherPos[axis1]);
    let max2 = Math.max(pos[axis2], otherPos[axis2]);
    let collide = false;
    let check = pos[axis] + s;
    let i = Array(3);
    i[axes[axis]] = check;
    function getData(i1, i2){
        i[axes[axis1]] = i1;
        i[axes[axis2]] = i2;
        return mazeData.collision_map[i[0]][i[1]][i[2]];
    } 
    for(let j = Math.max(min1, 0); j <= Math.min(mazeData.bounds[axes[axis1]]*2, max1); j++)
    {
        for(let k = Math.max(min2, 0); k <= Math.min(mazeData.bounds[axes[axis2]]*2, max2); k++)
        {
            if(check <= mazeData.bounds[axes[axis]]*2 && check >= 0 && getData(j,k)){
                collide = true;
                break;
            }
        }
        if(collide == true)
            break;
    }

    if(collide == true){
        camera.position[axis] = maze.getOffset(pos[axis]+s) - s * (collisionThreshold + maze.width / 2);
        newPos[axis] = pos[axis];
    } else {
        pos[axis] += s;
    }
}

function collisionCheck(){
    let near = new THREE.Vector3();
    let far = new THREE.Vector3();
    near.copy(camera.position);
    near.addScalar(-collisionThreshold);
    far.copy(camera.position);
    far.addScalar(collisionThreshold);
    let newNearPos = maze.getPos(near);
    let newFarPos = maze.getPos(far);
    if(mazeNear == null && mazeFar == null){
        mazeNear = newNearPos;
        mazeFar = newFarPos;
    }

    if(newNearPos.distanceToSquared(mazeNear) != 0)
    {
        if(newNearPos.x - mazeNear.x < 0)
            checkCollisionAxis('x', 'y', 'z', mazeNear, newNearPos, mazeFar, -1);
        if(newNearPos.y - mazeNear.y < 0)
            checkCollisionAxis('y', 'x', 'z', mazeNear, newNearPos, mazeFar, -1);
        if(newNearPos.z - mazeNear.z < 0)
            checkCollisionAxis('z', 'y', 'x', mazeNear, newNearPos, mazeFar, -1);
    }

    if(newFarPos.distanceToSquared(mazeFar) != 0)
    {
        if(newFarPos.x - mazeFar.x > 0)
            checkCollisionAxis('x', 'y', 'z', mazeFar, newFarPos, mazeNear, 1);
        if(newFarPos.y - mazeFar.y > 0)
            checkCollisionAxis('y', 'x', 'z', mazeFar, newFarPos, mazeNear, 1);
        if(newFarPos.z - mazeFar.z > 0)
            checkCollisionAxis('z', 'y', 'x', mazeFar, newFarPos, mazeNear, 1);
    }

    mazeNear = newNearPos;
    mazeFar = newFarPos;

    if(mazeFar.z == -1 && mazeStarted == true)
        mazeStarted = false;
    else if(mazeStarted == false && mazeFar.z == 1 && mazeFar.x == 1 && mazeFar.y == 1)
        mazeStarted = true;
    else if(mazeStarted == true && mazeFinished == false && mazeFar.z == mazeData.bounds[2] * 2 + 1 && keys.length == 0)
    {
        if(keys.length == 0)
            completed();
        else
            //PUT INC KEYS HERE
            console.log("Incomplete Keys: ", keys.length, " more to find");
    }
}

function completed(){
    mazeFinished = true;
    updateInfo(``);
    document.getElementById('game').innerHTML = '';
    let seconds = ((Date.now() - timerStart) / 1000).toFixed(2);
    console.log(seconds);
    document.getElementById('time').textContent = seconds + " seconds";
    exitScreen.hidden = false;
}

//TODO: CONTROLS-KEYBOARD
window.addEventListener('keydown', (event) => {
    const direction = new THREE.Vector3();
    const rotation = camera.rotation;
    direction.set(0, 0, -0.05).applyEuler(rotation);
    const right = new THREE.Vector3();
    right.crossVectors(direction, camera.up);

    switch (event.key) {
        case 'w':
            camera.position.add(direction);
            break;
        case 'a':
            camera.position.sub(right);
            break;
        case 's':
            camera.position.sub(direction);
            break;
        case 'd':
            camera.position.add(right);
            break;
        case ' ':
            camera.position.y += 0.05;
            break;
        case 'Shift':
            camera.position.y -= 0.05;
            break;
    }
});

function addKeys(num) {
    let placed = new Set();

    for (let i = 0; i < num; i++) {
        const randomFilename = eggModels[Math.floor(Math.random() * eggModels.length)];
        const loader = new GLTFLoader();
        loader.load(randomFilename, (gltf) => {
            let eggModel = gltf.scene.clone();
            eggModel.scale.set(0.15, 0.15, 0.15);
            let x, y, z;
            do {
                x = randomOddInteger(segments);
                y = randomOddInteger(segments);
                z = randomOddInteger(segments);
            } while (placed.has(`${x},${y},${z}`));

            placed.add(`${x},${y},${z}`);

            eggModel.position.set(maze.getOffset(x), maze.getOffset(y), maze.getOffset(z));
            scene.add(eggModel);
            keys.push(eggModel);
        });
    }
}


function checkObtainedKeys(){
    if (keys.length != 0)
        console.log("Remaining Keys: ", keys.length);
    updateInfo(`Eggs Left: ${keys.length}, Eggs Found: ${(mazeSize * 2 - 1) - keys.length}`);
    for(let i = 0; i < keys.length; i++){
        if(camera.position.distanceToSquared(keys[i].position) <= 0.05)
        {
            keys[i].removeFromParent();
            keys.splice(i, 1);
        }
    }
}

function updateInfo(text) {
    const infoDiv = document.getElementById('info');
    infoDiv.textContent = text;
}

function randomOddInteger(max) {
    // Generate a random integer within the specified range
    let num = Math.floor(Math.random() * (max+1));
    
    // Make sure the number is odd
    if (num % 2 === 0 && num != 0) {
        // If it's even, add 1 to make it odd
        num--;
    }
    else if(num == 0){
        num = 1;
    }
    
    return num;
}

function newGame(){
    init();
    mazeSize = document.getElementById('mazeSizeValue2').textContent;
    console.log(mazeSize);
    addKeys(mazeSize * 2 - 1);
}
