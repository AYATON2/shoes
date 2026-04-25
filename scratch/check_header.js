
import fs from 'fs';
const content = fs.readFileSync('c:/edoy/shoes/frontend/src/components/Header.js', 'utf8');
let balance = 0;
content.split('\n').forEach((line, idx) => {
    for (let char of line) {
        if (char === '{') balance++;
        if (char === '}') balance--;
    }
    if (balance < 0) {
        console.log(`Balance negative at line ${idx + 1}: ${line}`);
        balance = 0;
    }
});
console.log('Final balance:', balance);
