
import fs from 'fs';

const files = [
    'c:/edoy/shoes/frontend/src/components/Checkout.js',
    'c:/edoy/shoes/frontend/src/components/CustomerDashboard.js',
    'c:/edoy/shoes/frontend/src/components/Header.js'
];

files.forEach(file => {
    console.log(`Checking ${file}...`);
    const content = fs.readFileSync(file, 'utf8');
    let balance = 0;
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
        const opens = (line.match(/\{/g) || []).length;
        const closes = (line.match(/\}/g) || []).length;
        balance += opens;
        balance -= closes;
        if (balance < 0) {
            console.log(`  Balance went negative at line ${idx + 1}: ${line.trim()}`);
            balance = 0; // reset for further search
        }
    });
    console.log(`  Final balance: ${balance}`);
});
