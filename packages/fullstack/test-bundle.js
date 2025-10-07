import fs from 'fs';
import path from 'path';

const distPath = 'examples/basic/dist/client';
const files = fs.readdirSync(path.join(distPath, 'assets'));
console.log('Files in client/assets:', files);

// Check if there are any .css.js files or something similar
const cssRelated = files.filter(f => f.includes('css') || f.includes('Css'));
console.log('CSS-related files:', cssRelated);
