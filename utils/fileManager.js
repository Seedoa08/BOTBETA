const fs = require('fs');
const path = require('path');

function ensureFile(filePath, defaultContent = '[]') {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, defaultContent, 'utf8');
}

function readJson(filePath, defaultContent = '[]') {
    ensureFile(filePath, defaultContent);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
    ensureFile(filePath);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
}

module.exports = { ensureFile, readJson, writeJson }; 