const fs = require('fs');
try {
    const code = fs.readFileSync('script.js', 'utf-8');
    const vm = require('vm');
    new vm.Script(code);
    console.log("Syntax is valid!");
} catch (e) {
    console.error("Syntax Error:", e);
    process.exit(1);
}
