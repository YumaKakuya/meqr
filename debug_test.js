const { chromium } = require('playwright');
(async () => {
  console.log('--- 診断開始 ---');
  const browser = await chromium.launch({
    headless: false, // 画面は出す
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });
  const page = await browser.newPage();

  // ★ここが重要：ブラウザ内のエラーをPowerShellに転送する
  page.on('console', msg => console.log('Browser Log:', msg.text()));
  page.on('pageerror', err => console.log('Browser Error:', err.message));
  page.on('requestfailed', request => console.log('Load Failed:', request.url(), request.failure().errorText));

  // ファイルを開く
  const target = 'file:///C:/Users/USER/OneDrive/デスクトップ/Meqr/index.html';
  console.log('Opening:', target);
  
  try {
    await page.goto(target);
    // 5秒待って、エラーが出尽くすのを待つ
    await page.waitForTimeout(5000);
  } catch (e) {
    console.log('Launch Error:', e);
  }
  
  console.log('--- 診断終了 (ウィンドウは閉じます) ---');
  await browser.close();
})();
