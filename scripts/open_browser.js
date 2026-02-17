const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    const browserPath = path.join(process.env.USERPROFILE, '.cache', 'ms-playwright', 'chromium-1208', 'chrome-win', 'chrome.exe');

    console.log('Starting browser in HEADED mode (visible window)...');
    const browser = await chromium.launch({
        executablePath: fs.existsSync(browserPath) ? browserPath : undefined,
        headless: false,  // ブラウザウィンドウを表示
        slowMo: 500       // 操作を見やすくするため少し遅く
    });

    const context = await browser.newContext({
        viewport: { width: 1200, height: 900 }
    });
    const page = await context.newPage();

    const fileUrl = `file://${path.resolve(__dirname, '../index.html').replace(/\\/g, '/')}`;
    console.log(`Opening: ${fileUrl}`);

    await page.goto(fileUrl);
    await page.waitForLoadState('networkidle');

    console.log('Application opened successfully!');
    console.log('The browser window will stay open for 30 seconds for you to inspect.');
    console.log('Press Ctrl+C to close earlier if needed.');

    // 30秒間ブラウザを開いたままにする
    await page.waitForTimeout(30000);

    await browser.close();
    console.log('Browser closed.');
})().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
