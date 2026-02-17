const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// ターゲットのフォルダ（デスクトップのMeqr）
const rootDir = path.join(process.env.USERPROFILE, 'OneDrive', 'デスクトップ', 'Meqr');
const port = 3000;

// 簡易Webサーバー（セキュリティ回避用）
const server = http.createServer((req, res) => {
  // URLからファイルパスを決定
  const safeUrl = req.url === '/' ? 'index.html' : req.url;
  const filePath = path.join(rootDir, safeUrl);
  
  // 拡張子に応じたContentType
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  if (extname === '.js') contentType = 'text/javascript';
  if (extname === '.css') contentType = 'text/css';
  if (extname === '.png') contentType = 'image/png';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if(error.code == 'ENOENT'){
        console.log(`404 Not Found: ${filePath}`);
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server Error: '+error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, async () => {
  console.log(`★簡易サーバー起動: http://localhost:${port}`);
  
  // ブラウザ起動
  console.log('検証用ブラウザを起動します...');
  const browser = await chromium.launch({
    headless: false, // 画面を表示
    args: [
      '--use-fake-ui-for-media-stream', 
      '--use-fake-device-for-media-stream'
    ]
  });
  
  const context = await browser.newContext({ permissions: ['camera'] });
  const page = await context.newPage();

  // ログ監視
  page.on('console', msg => console.log('Browser Log:', msg.text()));
  page.on('pageerror', err => console.log('Browser Error:', err.message));

  try {
    // サーバー経由でアクセス
    await page.goto(`http://localhost:${port}`);
    console.log('★起動成功！画面を確認してください。');
    
    // 5分間待機
    await page.waitForTimeout(300000);
  } catch (e) {
    console.error('実行エラー:', e);
  }

  console.log('終了します...');
  await browser.close();
  server.close();
});
