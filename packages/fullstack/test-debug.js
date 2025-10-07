import fs from 'fs';
const code = fs.readFileSync('examples/basic/dist/ssr/index.js', 'utf-8');
console.log('First 500 chars of server bundle:');
console.log(code.substring(0, 500));
