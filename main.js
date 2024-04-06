import * as THREE from 'three';
import * as maze from './maze.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const PI_2 = Math.PI / 2;

var scene;
var camera;
var renderer

var fpsClock;
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


function init(){
    console.log("init start");
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.set( maze.getOffset(1), maze.getOffset(1), maze.getOffset(-2));
    renderer = new THREE.WebGLRenderer( { antialias: true, powerPreference: "high-performance" } );
    renderer.setPixelRatio( Math.min(window.devicePixelRatio, 2) );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.domElement.id = "mainCanvas";
    document.body.appendChild( renderer .domElement );

    fpsClock = new THREE.Clock();
    // timerStart = 0;
    // timerRunning = false;
    
    wallMat = new THREE.MeshLambertMaterial({vertexColors: true});
    blockMat = new THREE.MeshPhongMaterial({color: 'hsl(0, 0%, 10%)'});

    blockGeom = new THREE.InstancedBufferGeometry();
    THREE.BufferGeometry.prototype.copy.call(blockGeom, new THREE.BoxGeometry());
    wallGeom = new THREE.InstancedBufferGeometry();
    console.log("will start creating maze");
    const loader = new GLTFLoader();
    loader.load('wall.glb',
        function (gltf) {
            let wallModel = gltf.scene.getObjectByName('wall');
            THREE.BufferGeometry.prototype.copy.call(wallGeom, wallModel.geometry);
            createMaze(3);
        },
        undefined,
        function (error) {
            console.error('Error loading GLTF model:', error);
        }
    );

    console.log("created maze");
    let localLight = new THREE.PointLight(0xffffff);
    camera.add(localLight);
    scene.add(camera);
    let ambientLight = new THREE.AmbientLight(0x808080);
    scene.add(ambientLight);

    // maze variables
    mazeSize = 3;
    mazeData = null;
    mazeGroup = new THREE.Group();
    scene.add( mazeGroup );
    // checkpoints
    mazeStarted = false;
    mazeFinished = false;
    // save the positions of the entrance and exit of the maze
    startPos = new THREE.Vector3( maze.getOffset(1), maze.getOffset(1), maze.getOffset(1) );
    segments = mazeSize * 2 - 0.5;
    endPos = new THREE.Vector3();
    // collisions
    mazeNear = null; // closer to 0,0,0 (-)
    mazeFar = null;
    console.log("init complete");
}

function animate() {
    requestAnimationFrame(animate);
    console.log("animating");
    //let delta = Math.min(fpsClock.getDelta() , 0.1);
	
	renderer.render(scene, camera);
}

function createMaze(size) {
    mazeData = maze.generateMaze(size);
    mazeStarted = false;
    mazeFinished = false;
    mazeNear = null;
    mazeFar = null;

    segments = size * 2 - 1;
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
                        tempWall.scale.set(maze.blockSize, maze.blockSize, maze.blockSize);
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

init();

animate();