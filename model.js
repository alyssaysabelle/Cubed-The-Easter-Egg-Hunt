import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

camera.position.z = 15;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 15);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(0, 0, 10);
    scene.add(light);

    const maze = generateMaze(10, 10);
    createMazeWalls(maze);

    const character = createCharacter();
    handlePlayerMovement(character);
    animate();

    window.addEventListener('resize', onWindowResize);
}

// generate random (TEMPORARY)
function generateMaze(width, height) {
    const maze = [];
    for (let y = 0; y < height; y++) {
        maze[y] = [];
        for (let x = 0; x < width; x++) {
            maze[y][x] = Math.round(Math.random());
        }
    }

    maze[0][0] = 0;
    maze[height - 1][width - 1] = 0;

    return maze;
}

// load wall model
function createWall(x, y, z) {
    const loader = new GLTFLoader();
    loader.load('wall.glb',
        function (gltf) {
            if (z !== 0) {
                gltf.scene.rotation.y = Math.PI / 2;
            }
                gltf.scene.position.set(x, y, z);
                scene.add(gltf.scene);
        },
        undefined,
        function (error) {
            console.error('Error loading GLTF model:', error);
        }
    );
}

function createMazeWalls(maze) {
    const wallGeometry = new THREE.BoxGeometry(1, 1, 1);
    const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });

    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 1) {
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                wall.position.set(x, y, 0);
                scene.add(wall);
            }
        }
    }
}

function createCharacter() {
    const characterGeometry = new THREE.BoxGeometry(0.5, 0.5, 1);
    const characterMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const character = new THREE.Mesh(characterGeometry, characterMaterial);
    character.position.set(0, 0, 0);
    scene.add(character);

    return character;
}

function handlePlayerMovement(character) {
    const moveDistance = 0.1;

    window.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'w':
                character.position.y += moveDistance;
                break;
            case 's':
                character.position.y -= moveDistance;
                break;
            case 'a':
                character.position.x -= moveDistance;
                break;
            case 'd':
                character.position.x += moveDistance;
                break;
        }
    });
}

window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            camera.rotation.x += 0.1;
            break;
        case 'ArrowDown':
            camera.rotation.x -= 0.1;
            break;
        case 'ArrowLeft':
            camera.rotation.y += 0.1;
            break;
        case 'ArrowRight':
            camera.rotation.y -= 0.1;
            break;
    }
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

const maze = generateMaze(10, 10);
createMazeWalls(maze);

const character = createCharacter();
handlePlayerMovement(character);

animate();
init();