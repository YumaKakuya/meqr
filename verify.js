const fs = require('fs');
try {
    const content = fs.readFileSync('index.html', 'utf8');
    // Find main script block (the one with strict mode)
    const marker = '"use strict";';
    const strictPos = content.indexOf(marker);
    if (strictPos === -1) {
        console.error("Could not find 'use strict'; marker.");
        process.exit(1);
    }

    // Backtrack to <script>
    let scriptStart = content.lastIndexOf('<script>', strictPos);
    if (scriptStart === -1) scriptStart = content.lastIndexOf('<script', strictPos); // Maybe attributes

    // Find </script> after marker
    const scriptEnd = content.indexOf('</script>', strictPos);

    if (scriptStart === -1 || scriptEnd === -1) {
        console.error("Could not isolate script block.");
        process.exit(1);
    }

    // Extract inner content
    // Start is roughly scriptStart + tag length.
    // We can just find the first newline after scriptStart?
    const innerStart = content.indexOf('>', scriptStart) + 1;
    const js = content.substring(innerStart, scriptEnd);

    console.log(`Checking syntax of ${js.length} bytes...`);

    try {
        new Function(js);
        console.log("Syntax OK");
    } catch (e) {
        console.error("Syntax Error:", e.message);
        // Try to find line number
        // e.stack might show it relative to function
    }
} catch (err) {
    console.error("File read error:", err.message);
}
