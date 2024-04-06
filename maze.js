import * as THREE from 'three';

var blockSize = 2;
var width = blockSize / 32;
var axes = ['x', 'y', 'z'];

function getWidth(){
    return width;
}

function getOffset(n){
    return n / 2 * (blockSize + width);
}

function singleBound(a, bound){
    return a >= 0 && a < 2 * bound + 1;
}

function checkBounds(x, y, z, size){
    return singleBound(x, size[0]) && singleBound(y, size[1]) && singleBound(z, size[2]);
}

function getCoor(x){
    x += width / 2;
    let margin = width / 100;
    let out = Math.floor(x / (blockSize + width) + margin) * 2;
    let diff = x - (out * (blockSize + width) / 2);
    if (Math.abs(diff) < width)
        return out;
    return out + 1;
}

function getPos(pos){
    return new THREE.Vector3(getCoor(pos.x), getCoor(pos.y), getCoor(pos.z));
}

function generateMaze(size){
    let maze = {
        bounds: [size, size, size],
        segments: [0, 0, 0],
        size_string:'${size}'
    }
    let full = [];

    maze.segments = [maze.bounds[0] * 2 + 1, maze.bounds[1] * 2 + 1, maze.bounds[2] * 2 + 1];

    function getNum(x, y, z){
        return x + maze.segments[0] * y + maze.segments[0] * maze.segments[1] * z;
    }

    function getCoor(num){
        let x = num % maze.segments[0];
        let y = Math.floor(num / maze.segments[0]) % maze.segments[1];
        let z = Math.floor(num / (maze.segments[0] * maze.segments[1]));
        return {x: x, y: y, z: z};
    }

    function removeCell(x){
        let i = full.indexOf(x);
        if(i != -1)
            full.splice(i, 1);
        else
            throw Error("Remove Failed: Not in Array");

    }

    function getRandCell(){
        let i = Math.floor(Math.random() * full.length);
        return full[i];
    }

    let board = Array(maze.segments[0]);
    for(let i = 0; i < maze.segments[0]; i++)
    {
        board[i] = Array(maze.segments[1]);
        for(let j = 0; j < maze.segments[1]; j++)
        {
            board[i][j] = Array(maze.segments[2]).fill(0);

            if(i % 2 == 1 && j % 2 == 1)
            {
                for(let k = 1; k < maze.segments[2]; k += 2)
                    full.push(getNum(i, j, k))
            }
        }
    }

    function getDir(n){
        let dir = {x: 0, y: 0, z: 0};
        n -= 3;
        dir[axes[n % 3]] = (n >= 3 ? 1 : -1);
        return dir;
    }

    function emptyCell(n){
        let coor = getCoor(n);
        board[coor.x][coor.y][coor.z] = 1;
        removeCell(n);
    }

    const WALL = 2;
    const exit_dir_axis = Math.floor(Math.random() * 3);
    let exit_dir = getDir(exit_dir_axis + 3);
    let exit_length = 1;
    let exit_bias_pos = [maze.segments[0] - 2, maze.segments[1] - 2, maze.segments[2] - 2];

    board[exit_bias_pos[0]][exit_bias_pos[1]][exit_bias_pos[2]] = WALL;

    removeCell(getNum(...exit_bias_pos));

    while(exit_length < maze.bounds[exit_dir_axis])
    {
        exit_bias_pos[0] += exit_dir.x;
        exit_bias_pos[1] += exit_dir.y;
        exit_bias_pos[2] += exit_dir.z;

        board[exit_bias_pos[0]][exit_bias_pos[1]][exit_bias_pos[2]] = 1;

        exit_bias_pos[0] += exit_dir.x;
        exit_bias_pos[1] += exit_dir.y;
        exit_bias_pos[2] += exit_dir.z;

        board[exit_bias_pos[0]][exit_bias_pos[1]][exit_bias_pos[2]] = WALL;
        removeCell(getNum(...exit_bias_pos));

        exit_length += 1;

        if (Math.random() > 0.33)
            break;
    }
    let exit_dir_entrance_axis = Math.round(Math.random());
    if (exit_dir_axis == 0)
        exit_dir_entrance_axis += 1;
    else if (exit_dir_axis == 1)
        exit_dir_entrance_axis *= 2;

    exit_dir = getDir(exit_dir_entrance_axis + 3);
    exit_bias_pos[0] += exit_dir.x;
    exit_bias_pos[1] += exit_dir.y;
    exit_bias_pos[2] += exit_dir.z;
    board[exit_bias_pos[0]][exit_bias_pos[1]][exit_bias_pos[2]] = 1;

    emptyCell(getRandCell());

    while(full.length > 0){
        let start = getRandCell();
        let startC = getCoor(start);
        let curr = {x: startC.x, y: startC.y, z: startC.z};

        while(board[curr.x][curr.y][curr.z] != 1){
            let dirNum = Math.floor(Math.random() * 6 + 3);
            let dir = getDir(dirNum);
            while (!checkBounds(curr.x + dir.x*2, curr.y + dir.y*2, curr.z + dir.z*2, maze.bounds)|| board[curr.x + dir.x*2][curr.y + dir.y*2][curr.z + dir.z*2] == WALL)
            {
                dirNum = Math.floor(Math.random() * 6 + 3);
                dir = getDir(dirNum);
            }
            board[curr.x][curr.y][curr.z] = dirNum;
            axes.forEach(a => curr[a] += dir[a]*2);
        }
    }

    maze.collision_map = Array(maze.segments[0]);
    for(let i = 0; i < maze.segments[0]; i++)
    {
        maze.collision_map[i] = Array(maze.segments[1]);
        for(let j = 0; j < maze.segments[1]; j++)
        {
            maze.collision_map[i][j] = board[i][j].map((n) => n == 0);
        }
    }

    maze.collision_map[1][1][0] = false;
    maze.collision_map[maze.segments[0] - 2][maze.segments[1] - 2][maze.segments[2] - 1] = false;

    return maze;
}

export{width, blockSize, getWidth, getOffset, generateMaze, getPos}
