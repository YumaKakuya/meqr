const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    const browserPath = path.join(process.env.USERPROFILE, '.cache', 'ms-playwright', 'chromium-1208', 'chrome-win', 'chrome.exe');
    console.log(`Using browser at: ${browserPath}`);

    const browser = await chromium.launch({
        executablePath: fs.existsSync(browserPath) ? browserPath : undefined,
        headless: true
    });

    const context = await browser.newContext({
        viewport: { width: 500, height: 800 },
        permissions: ['camera']
    });
    const page = await context.newPage();

    const fileUrl = `file://${path.resolve(__dirname, '../index.html').replace(/\\/g, '/')}`;
    await page.goto(fileUrl);
    await page.waitForLoadState('networkidle');

    // Onboarding skip
    const skipBtn = await page.$('#btn-onboarding-skip');
    if (skipBtn) {
        await skipBtn.click();
        console.log('Skipped onboarding');
    }

    // 1. View Mode (Init)
    await page.screenshot({ path: 'verify_01_view.png' });
    console.log('Saved: verify_01_view.png');

    // 2. Edit Mode
    await page.click('#btn-edit-mode');
    await page.fill('#lastName', '山田');
    await page.fill('#firstName', '太郎');
    await page.screenshot({ path: 'verify_02_edit.png' });
    console.log('Saved: verify_02_edit.png');

    // 3. PDF (Check Toast)
    await page.click('#btn-export-pdf');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'verify_03_pdf.png' });
    console.log('Saved: verify_03_pdf.png');

    // 4. Scan Mode (Open)
    await page.click('#btn-scan-qr');
    await page.waitForTimeout(1000); // Give time for transition
    await page.screenshot({ path: 'verify_04_scan.png' });
    console.log('Saved: verify_04_scan.png');

    // 5. Back
    await page.evaluate(() => window.history.back());
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'verify_05_final.png' });
    console.log('Saved: verify_05_final.png');

    await browser.close();
    console.log('Done.');
})().catch(err => {
    console.error(err);
    process.exit(1);
});
