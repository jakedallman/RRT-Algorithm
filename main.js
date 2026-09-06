import knn from 'https://cdn.jsdelivr.net/npm/rbush-knn@3.0.1/+esm';
import RBush from 'https://cdn.jsdelivr.net/npm/rbush@4.0.1/+esm';

// Initialize the tree
const tree = new RBush(5);


const canvas = document.getElementById("myCanvas");
const totalCost = document.getElementById("totalCost");
const setupMessage = document.getElementById("setupMessage");
const confirmButton = document.getElementById("confirmButton");
const runControls = document.getElementById("runControls");
const runCount = document.getElementById("runCount");
const runButton = document.getElementById("runButton");

const ctx = canvas.getContext("2d");

const kPathLength = 6; // Maximum distance between nodes

let endNode = null;
let endPoint = null;
let obstacleCorner = null;
let setupPhase = "obstacles";

function drawCircle(x, y, radius, color) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function findAngle(nodeOne, nodeTwo){
    const xChange = nodeTwo.x - nodeOne.x;
    const yChange = nodeTwo.y - nodeOne.y;
    return Math.atan2(yChange, xChange);
}

let obstacles = [];

class boxes{
    constructor(minX, minY, maxX, maxY) {
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
        ctx.fillStyle = "red";
        ctx.fillRect(this.minX, this.minY, this.maxX - this.minX, this.maxY - this.minY);
        obstacles.push(this);
    }
}

class RRTNode {
    constructor(x, y, parent = null, cost){
        this.x = x;
        this.y = y;
        this.parent = parent;
        this.cost = cost;
        this.children = [];

        if (parent) {
            if (this.x != endPoint.x || this.y != endPoint.y){
                const angle = findAngle(parent, this);
                this.x = parent.x + Math.cos(angle) * kPathLength;
                this.y = parent.y + Math.sin(angle) * kPathLength;
            }
            

            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.moveTo(parent.x, parent.y);
            ctx.lineTo(this.x, this.y);
            ctx.strokeStyle = "white";
            ctx.stroke();
        } else{
            drawCircle(this.x, this.y, 4, "green");
        }
        
        drawCircle(this.x, this.y, 1, "blue");

        tree.insert({ minX: this.x, minY: this.y, maxX: this.x, maxY: this.y, node: this });
    }
    tracePathToParent(){
        if (this.parent) {
            ctx.beginPath();
            ctx.moveTo(this.parent.x, this.parent.y);
            ctx.lineTo(this.x, this.y);
            ctx.strokeStyle = "green";
            ctx.lineWidth = 5;
            ctx.stroke();
            this.parent.tracePathToParent();
        }
    }
    addChild(node){
        this.children.push(node);
    }
    eraseChild(node){
        this.children = this.children.filter(child => child !== node);
    }
    updateCosts(node){
        if (node.cost != node.parent.cost+Math.hypot(node.x - node.parent.x, node.y - node.parent.y)){
            node.cost = node.parent.cost+Math.hypot(node.x - node.parent.x, node.y - node.parent.y);
            for (const child of node.children) {
                this.updateCosts(child);
            }
        }


        
    }
}

function runAlgorithm(iterations) {
const root = new RRTNode(100, 100, null, 0);
for (let i = 0; i < iterations; i++){
    const sample = { x: Math.random() * canvas.width, y: Math.random() * canvas.height };
    let nearestItem = knn(tree, sample.x, sample.y, 1)[0];
    const angle = findAngle(nearestItem.node, sample);
    const newNodeX = nearestItem.node.x + Math.cos(angle) * kPathLength;
    const newNodeY = nearestItem.node.y + Math.sin(angle) * kPathLength;

 // This is a corner case to make sure that the path between two nodes doesn't travel through an obstacle.


    let nearby = tree.search({ minX: newNodeX - kPathLength, minY: newNodeY - kPathLength, maxX: newNodeX + kPathLength, maxY: newNodeY + kPathLength });

    let lowestCost = null;
    for (const item of nearby) {
        const proposedCost = item.node.cost + Math.sqrt(Math.pow(newNodeX - item.node.x, 2) + Math.pow(newNodeY - item.node.y, 2));
        if (proposedCost < (nearestItem.cost+kPathLength)) {
            if (lowestCost && proposedCost < lowestCost.cost)
            {
                lowestCost = { node: item.node, cost: proposedCost };
            } else if (!lowestCost) {
                lowestCost = { node: item.node, cost: proposedCost };
            }
        }
    }
    
    if (lowestCost){
        nearestItem = lowestCost;
    }
    const newNodeXHalf = nearestItem.node.x + Math.cos(angle) * kPathLength/2;
    const newNodeYHalf = nearestItem.node.y + Math.sin(angle) * kPathLength/2;

    let collides = false;
    for (const box of obstacles)
    {
        if (newNodeX > box.minX && newNodeX < box.maxX && newNodeY > box.minY && newNodeY < box.maxY) {
            collides = true;
            break;
        }
        ///See above comment
        if (newNodeXHalf > box.minX && newNodeXHalf < box.maxX && newNodeYHalf > box.minY && newNodeYHalf < box.maxY) {
            collides = true;
            break;
        }
    }
    if (lowestCost && !collides){
        for (const item of nearby) {
            if (item.node.cost > nearestItem.cost+ Math.sqrt(Math.pow(item.node.x-nearestItem.x,2) + Math.pow(item.node.y-nearestItem.y,2))) {
                item.node.parent.eraseChild(item.node);
                item.node.parent = nearestItem.node;
                nearestItem.node.addChild(item.node);
                item.node.updateCosts(item.node);
                item.node.cost = nearestItem.node.cost + Math.sqrt(Math.pow(item.node.x-nearestItem.node.x,2) + Math.pow(item.node.y-nearestItem.node.y,2));
                ctx.beginPath();
                ctx.moveTo(item.node.parent.x, item.node.parent.y);
                ctx.lineTo(item.node.x, item.node.y);
                ctx.strokeStyle = "white";
                ctx.stroke();
            }
        }
    }
    if (!collides){
        nearestItem.node.addChild(new RRTNode(newNodeX, newNodeY, nearestItem.node, nearestItem.node.cost + kPathLength));
    }
    if (Math.hypot((newNodeX - endPoint.x), (newNodeY - endPoint.y)) <= kPathLength && !collides) {
        if (endNode && endNode.cost > nearestItem.node.cost + Math.hypot(newNodeX - endPoint.x, newNodeY - endPoint.y))
        {
            endNode.cost = nearestItem.node.cost + Math.hypot(newNodeX - endPoint.x, newNodeY - endPoint.y);
            endNode.parent = nearestItem.node;
            nearestItem.node.addChild(endNode);
        } else{
            endNode =new RRTNode(endPoint.x, endPoint.y, nearestItem.node, nearestItem.node.cost + Math.hypot(newNodeX - endPoint.x, newNodeY - endPoint.y));
            nearestItem.node.addChild(endNode);
        }
    }
    
}
drawCircle(endPoint.x, endPoint.y, 4, "green");
drawCircle(100, 100, 4, "green");
if (endNode){
    totalCost.textContent = 'Total cost: '+Math.round(endNode.cost)
    endNode.tracePathToParent();
}
}

function canvasPoint(event) {
    const bounds = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - bounds.left) * canvas.width / bounds.width,
        y: (event.clientY - bounds.top) * canvas.height / bounds.height
    };
}

canvas.addEventListener("click", (event) => {
    const point = canvasPoint(event);

    if (setupPhase === "obstacles") {
        if (!obstacleCorner) {
            obstacleCorner = point;
            setupMessage.value = "Click the bottom-right corner of the obstacle.";
            return;
        }

        new boxes(
            Math.min(obstacleCorner.x, point.x),
            Math.min(obstacleCorner.y, point.y),
            Math.max(obstacleCorner.x, point.x),
            Math.max(obstacleCorner.y, point.y)
        );
        obstacleCorner = null;
        setupMessage.value = "Obstacle added. Add another or confirm obstacles.";
    } else if (setupPhase === "endpoint") {
        endPoint = point;
        drawCircle(endPoint.x, endPoint.y, 4, "green");
        runControls.hidden = false;
        setupMessage.value = "Endpoint selected. Choose the number of runs.";
        canvas.style.cursor = "default";
    }
});

confirmButton.addEventListener("click", () => {
    if (obstacleCorner) {
        setupMessage.value = "Finish the obstacle by clicking its bottom-right corner.";
        return;
    }
    setupPhase = "endpoint";
    confirmButton.disabled = true;
    setupMessage.value = "Click the canvas to place the endpoint.";
    canvas.style.cursor = "crosshair";
});

runButton.addEventListener("click", () => {
    const iterations = Number(runCount.value);
    if (!endPoint || !Number.isInteger(iterations) || iterations < 1 || iterations > 60000) {
        setupMessage.value = "Choose an endpoint and enter between 1 and 30,000 runs.";
        return;
    }
    runButton.disabled = true;
    runCount.disabled = true;
    setupMessage.value = `Running ${iterations.toLocaleString()} iterations...`;
    runAlgorithm(iterations);
    setupMessage.value = "Run complete.";
});


