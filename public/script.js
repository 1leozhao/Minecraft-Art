import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCJOY2SPw2-wkKzMPIbZLh254Hpjl4_0V4",
    authDomain: "minecraft-art.firebaseapp.com",
    projectId: "minecraft-art",
    storageBucket: "minecraft-art.appspot.com",
    messagingSenderId: "221521888787",
    appId: "1:221521888787:web:8ba24bd5787fc569fba1e6"
  };
initializeApp(firebaseConfig)
const db = getFirestore()

const imageInput = document.getElementById('imageInput');
const sketchButton = document.getElementById('sketchButton');
const hdButton = document.getElementById('hdButton');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageCounter = document.getElementById('imageCounter');
const counterDocRef = doc(db, 'data', 'xqco1Mb9SRotWddn2inX')

let highlightedX = 0;
let highlightedY = 0;
let blockSize = 8;
let imageData;
let scaleFactor = 1;
let imagesGenerated = 0;
let isImageCounted = 0;

updateImageCounter();

// get and increment total images generated
async function getCounter() {
    const docSnap = await getDoc(counterDocRef);
    if (docSnap.exists()) {
        imagesGenerated = docSnap.data().imagesGenerated;
        updateImageCounter();
    } else {
        await setDoc(counterDocRef, { imagesGenerated: 0 });
        imagesGenerated = 0;
        updateImageCounter();
    }
}
getCounter();

async function incrementCounter() {
    imagesGenerated++;
    await updateDoc(counterDocRef, { imagesGenerated: imagesGenerated });
    updateImageCounter();
}

// Map of color values to minecraft blocks
const minecraftWoolBlocks = [
    { color: [221, 221, 221], block: 'minecraft_assets/white_wool.png' },
    { color: [219, 125, 62], block: 'minecraft_assets/orange_wool.png' },
    { color: [179, 80, 188], block: 'minecraft_assets/magenta_wool.png' },
    { color: [107, 138, 201], block: 'minecraft_assets/light_blue_wool.png' },
    { color: [177, 166, 39], block: 'minecraft_assets/yellow_wool.png' },
    { color: [65, 174, 56], block: 'minecraft_assets/lime_wool.png' },
    { color: [208, 132, 153], block: 'minecraft_assets/pink_wool.png' },
    { color: [64, 64, 64], block: 'minecraft_assets/gray_wool.png' },
    { color: [154, 161, 161], block: 'minecraft_assets/light_gray_wool.png' },
    { color: [46, 110, 137], block: 'minecraft_assets/cyan_wool.png' },
    { color: [126, 61, 181], block: 'minecraft_assets/purple_wool.png' },
    { color: [46, 56, 141], block: 'minecraft_assets/blue_wool.png' },
    { color: [79, 50, 31], block: 'minecraft_assets/brown_wool.png' },
    { color: [53, 70, 27], block: 'minecraft_assets/green_wool.png' },
    { color: [150, 52, 48], block: 'minecraft_assets/red_wool.png' },
    { color: [25, 22, 22], block: 'minecraft_assets/black_wool.png' },
];

// Event listeners
sketchButton.addEventListener('click', () => {
    blockSize = 8;
    handleImageUpload();
});
hdButton.addEventListener('click', () => {
    blockSize = 4;
    handleImageUpload();
});
canvas.addEventListener('mousemove', highlightGridBox);
canvas.addEventListener('click', showPopup);

// Image upload
imageInput.addEventListener('change', () => {
    isImageCounted = false; // Reset the flag when a new image is selected
    handleImageUpload();
});

function handleImageUpload() {
    const file = imageInput.files[0];
    if (!file) return;
    if (!isImageCounted) {
        incrementCounter();
        isImageCounted = true;
    }

    updateImageCounter();

    const img = new Image();
    img.onload = () => {
        const maxCanvasWidth = window.innerWidth * 0.8;
        const maxCanvasHeight = window.innerHeight * 0.8;
        scaleFactor = Math.min(maxCanvasWidth / img.width, maxCanvasHeight / img.height);
        const adjustedWidth = Math.floor((img.width * scaleFactor) / blockSize) * blockSize;
        const adjustedHeight = Math.floor((img.height * scaleFactor) / blockSize) * blockSize;
        canvas.width = adjustedWidth;
        canvas.height = adjustedHeight;
        ctx.drawImage(img, 0, 0, adjustedWidth, adjustedHeight);

        // Process the image to display unicolor grid boxes
        imageData = ctx.getImageData(0, 0, adjustedWidth, adjustedHeight);
        processImage();
        const gridDimensions = document.getElementById('gridDimensions');
        gridDimensions.textContent = `${adjustedWidth / blockSize} x ${adjustedHeight / blockSize} Blocks`;
    };

    img.src = URL.createObjectURL(file);
}

// Update the image counter
function updateImageCounter() {
    imageCounter.textContent = `Images generated for ${imagesGenerated} users!`;
}

// Image processing
function processImage() {
    if (!imageData) return;
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    for (let y = 0; y < height; y += blockSize) {
        for (let x = 0; x < width; x += blockSize) {
            const [r, g, b] = getAverageColor(data, x, y, width, blockSize);
            const closestBlock = findClosestBlock(r, g, b);
            if (closestBlock) {
                ctx.fillStyle = `rgb(${closestBlock.color[0]},${closestBlock.color[1]},${closestBlock.color[2]})`;
                ctx.fillRect(x, y, blockSize, blockSize);
            }
        }
    }

    drawGrid(width, height, blockSize);
}

// Return the average color to create unicolor grids
function getAverageColor(data, startX, startY, width, blockSize) {
    let r = 0, g = 0, b = 0, count = 0;
    for (let y = startY; y < startY + blockSize; y++) {
        for (let x = startX; x < startX + blockSize; x++) {
            if (x < width && y < width) {
                const index = (y * width + x) * 4;
                r += data[index];
                g += data[index + 1];
                b += data[index + 2];
                count++;
            }
        }
    }
    return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
}

// Draw grids
function drawGrid(width, height, blockSize) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 2;

    for (let x = 0; x <= width; x += blockSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    for (let y = 0; y <= height; y += blockSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

// Highlight grids
function highlightGridBox(event) {
    if (!imageData) return;
    const rect = canvas.getBoundingClientRect();
    highlightedX = Math.floor((event.clientX - rect.left) / blockSize);
    highlightedY = Math.floor((event.clientY - rect.top) / blockSize);
    drawHighlightBox();
}

// Draw highlight box
function drawHighlightBox() {
    const pixelX = highlightedX * blockSize;
    const pixelY = highlightedY * blockSize;
    processImage();
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.fillRect(pixelX, pixelY, blockSize, blockSize);
    ctx.strokeStyle = 'rgba(0, 255, 0, 1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(pixelX, pixelY, blockSize, blockSize);
}

// Show popups
function showPopup(event) {
    if (!imageData) return;
    const rect = canvas.getBoundingClientRect();
    const gridX = Math.floor((event.clientX - rect.left) / blockSize);
    const gridY = Math.floor((event.clientY - rect.top) / blockSize);
    const pixelX = gridX * blockSize;
    const pixelY = gridY * blockSize;
    const [r, g, b] = getAverageColor(imageData.data, pixelX, pixelY, canvas.width, blockSize);
    const closestBlock = findClosestBlock(r, g, b);
    const popup = document.createElement('div');
    popup.style.position = 'absolute';
    popup.style.left = `${rect.left + pixelX + blockSize + 5}px`;
    popup.style.top = `${rect.top + pixelY}px`;
    popup.style.padding = '5px';
    popup.style.backgroundColor = 'white';
    popup.style.border = '1px solid black';
    popup.style.zIndex = 1000;
    popup.style.width = '100px';
    popup.style.textAlign = 'center';
    popup.style.fontSize = '12px';
    const locationText = document.createElement('p');
    locationText.textContent = `Block: (${gridX}, ${gridY})`;
    locationText.style.margin = '0';

    popup.appendChild(locationText);
    if (closestBlock) {
        const imgElement = document.createElement('img');
        imgElement.src = closestBlock.block;
        imgElement.style.width = '50px';
        imgElement.style.height = '50px';
        popup.appendChild(imgElement);

        const blockNameText = document.createElement('p');
        blockNameText.textContent = formatBlockName(closestBlock.block);
        blockNameText.style.margin = '5px 0 0 0';
        popup.appendChild(blockNameText);
    } else {
        console.error(`No closest block found for color: (${r}, ${g}, ${b})`);
    }

    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.marginTop = '5px';
    closeButton.style.fontSize = '10px';
    closeButton.style.padding = '2px 5px';
    closeButton.onclick = () => {
        document.body.removeChild(popup);
    };
    popup.appendChild(closeButton);

    document.body.appendChild(popup);
}

// Assign colored grids to a minecraft block
function findClosestBlock(r, g, b) {
    let closestBlock = null;
    let minDistance = Infinity;

    minecraftWoolBlocks.forEach(block => {
        const [blockR, blockG, blockB] = block.color;
        const distance = Math.sqrt(
            Math.pow(r - blockR, 2) +
            Math.pow(g - blockG, 2) +
            Math.pow(b - blockB, 2)
        );

        if (distance < minDistance) {
            minDistance = distance;
            closestBlock = block;
        }
    });

    return closestBlock || minecraftWoolBlocks[0];
}

// Format each minecraft block name
function formatBlockName(blockPath) {
    return blockPath
        .split('/').pop()
        .replace(/_/g, ' ')
        .replace('.png', '')
        .replace('wool', 'Wool')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}