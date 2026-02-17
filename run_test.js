const { chromium } = require('playwright');
(async () => {
  console.log('起動準備中...');
  // 1. ブラウザを目視モード(headless:false)で起動
  // カメラ権限を自動許可し、フェイク映像(砂嵐ではなくテストパターン)を流す設定
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--use-fake-ui-for-media-stream', 
      '--use-fake-device-for-media-stream'
    ]
  });
  const context = await browser.newContext({ permissions: ['camera'] });
  const page = await context.newPage();

  // 2. 特定したファイルを直接開く
  const target = 'file:///C:/Users/USER/OneDrive/デスクトップ/Meqr/index.html';
  console.log('開いています: ' + target);
  
  try {
    await page.goto(target);
    console.log('★起動成功！画面を確認してください。');
    console.log('（このウィンドウは5分間開きっぱなしにします）');
    
    // 3. 証拠写真を撮る
    await page.screenshot({ path: 'evidence_start.png' });
    
    // 4. そのまま待機（あなたが手動でボタンを押して試せるように）
    await page.waitForTimeout(300000); 
  } catch (e) {
    console.error('エラー発生:', e);
  }
  await browser.close();
})();
