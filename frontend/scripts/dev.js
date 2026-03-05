const { spawn } = require('child_process');

// ─── ANSI Colors ───
const c = (code, text) => `\x1b[${code}m${text}\x1b[0m`;
const line = '─'.repeat(46);

let bannerPrinted = false;

function printBanner() {
    if (bannerPrinted) return;
    bannerPrinted = true;
    console.log('');
    console.log(`  ${c('35', line)}`);
    console.log(`  ${c('1;35', '  🖼️  GalleryHub Frontend')}`);
    console.log(`  ${c('35', line)}`);
    console.log('');
}

// Spawn react-scripts start
const child = spawn('npx', ['react-scripts', 'start'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env, NODE_OPTIONS: '--no-deprecation', BROWSER: 'none' },
});

child.stdout.on('data', (data) => {
    const text = data.toString();

    // Skip noisy lines
    if (
        text.includes('Starting the development server') ||
        text.includes('Note that the development') ||
        text.includes('To create a production') ||
        text.includes('webpack compiled') ||
        text.includes('You can now view') ||
        text.includes('On Your Network') ||
        text.trim() === ''
    ) {
        // Detect the local URL and print our banner
        const urlMatch = text.match(/Local:\s+(http:\/\/\S+)/);
        if (urlMatch) {
            printBanner();
            console.log(`  ${c('90', 'Status')}   ${c('32', '● Running')}`);
            console.log(`  ${c('90', 'Local')}    ${c('4;35', urlMatch[1])}`);
            console.log('');
            console.log(`  ${c('35', line)}`);
            console.log('');
        }

        if (text.includes('Compiled successfully')) {
            printBanner();
            console.log(`  ${c('32', '✔')} ${c('32', 'Compiled successfully')}`);
        }

        return;
    }

    // Pass through errors and warnings
    process.stdout.write(text);
});

child.stderr.on('data', (data) => {
    const text = data.toString();
    // Skip deprecation noise
    if (text.includes('DeprecationWarning') || text.includes('DEP_WEBPACK')) return;
    process.stderr.write(text);
});

child.on('exit', (code) => process.exit(code));
