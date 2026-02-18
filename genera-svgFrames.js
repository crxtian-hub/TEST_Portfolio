// genera-svgFrames.js

const fs = require('fs');
const path = require('path');

const folder = './Frame_Logo';
const outputFile = './svgFrames.html';

// Leggi e ordina i file SVG
const files = fs.readdirSync(folder)
.filter(file => file.endsWith('.svg'))
.sort((a, b) => parseInt(a) - parseInt(b)); // Ordine numerico

let outputContent = '';

// Inserisce ogni SVG con classe e ID personalizzati
files.forEach((file, index) => {
    let svgContent = fs.readFileSync(path.join(folder, file), 'utf8');
    
    // Inserisce class e id direttamente nell'elemento <svg>
    svgContent = svgContent.replace(
        /<svg([^>]*)>/,
        `<svg$1 class="frame" id="frame-${index + 1}">`
    );
    
    outputContent += `${svgContent}\n\n`;
});

// Scrive il file finale
fs.writeFileSync(outputFile, outputContent);
console.log(`✅ File generato: ${outputFile}`);
