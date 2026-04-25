
import fs from 'fs';
const content = fs.readFileSync('c:/edoy/shoes/frontend/src/components/Checkout.js', 'utf8');
const lines = content.split('\n');
const line1147 = lines[1146]; // 0-indexed
console.log('Line 1147 length:', line1147.length);
console.log('Line 1147 content (hex):', Buffer.from(line1147).toString('hex'));
