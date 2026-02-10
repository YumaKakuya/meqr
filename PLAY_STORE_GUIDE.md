# Google Play ストア 公開準備ガイド

このドキュメントは、MeQR を Google Play に公開する際に必要なアプリ情報・アセットの仕様と文案をまとめたものです。

---

## 1. アプリ情報

### 1.1 アプリ名（30文字以内）

| 言語 | テキスト | 文字数 |
|------|----------|--------|
| 日本語 | MeQR - シンプルなデジタル名刺 | 18 |
| 英語 | MeQR - Digital Business Card | 28 |

### 1.2 短い説明（80文字以内）

| 言語 | テキスト | 文字数 |
|------|----------|--------|
| 日本語 | プライバシー重視の名刺アプリ。データは端末内のみ保存。QRコードで簡単共有。 | 43 |
| 英語 | Privacy-first business card app. All data stays local. Share via QR code. | 62 |

---

## 2. 詳細な説明（4000文字以内）

### 2.1 日本語（約1,800文字）

```
MeQR（ミーキューアール）は、プライバシーを最優先にしたデジタル名刺アプリです。

【アプリの特徴】

・データは端末内のみに保存
  名前・連絡先・会社名・SNSリンクなど、すべての情報はあなたのスマートフォンやタブレット内にのみ保存されます。サーバーへ送信することは一切ありません。

・QRコードでかんたん共有
  相手にQRコードを見せるだけで、vCard形式の連絡先を渡せます。名刺入れ不要で、スピーディに情報交換ができます。

・複数名刺の切り替え
  仕事用・プライベート用など、複数の名刺を作成して使い分けできます。プロフィール写真の登録にも対応しています。

・PDF・PNGで名刺を書き出し
  印刷用の名刺データをPDFまたはPNGでダウンロードできます。オフラインでも利用可能なPWA対応です。

・オフラインでも利用可能
  一度開けば、ネットに繋がっていなくても名刺の表示・QRコードの表示が可能です（要：初回読み込み済み）。

【プライバシーへのこだわり】

MeQRは「データを預けない」設計です。
・入力した名前・メール・電話番号・会社名・URL・写真は、すべて端末のローカルストレージにのみ保存されます。
・開発者や第三者サーバーへデータが送られることはありません。
・広告配信やトラッキングのための外部送信も行いません。

安心してご利用ください。

【無料版と有料版（Premium）の違い】

■ 無料版
・名刺の作成・編集・複数名刺の管理
・QRコードの表示・共有・保存
・vCard（.vcf）のダウンロード
・名刺のPDF/PNG書き出し（プレビューに「MeQR」のウォーターマークが入ります）
・オフライン利用（PWA）

■ Premium（有料）
・ウォーターマークなしで名刺をPDF/PNG書き出し
・今後追加予定の全テンプレートを利用可能
・アプリの継続的な開発をサポート

【使い方（3ステップ）】

1. 名前と連絡先を入力
   「編集」タブで、姓・名、メールアドレスまたは電話番号を入力します。会社名・役職・URL・SNSリンクは任意です。

2. 保存してQRを表示
   「保存してQRを更新」をタップすると、名刺が保存され、表示画面にQRコード付きの名刺が表示されます。

3. 相手にQRを見せる or ダウンロード
   相手にスマホの画面を見せてQRを読み取ってもらうか、名刺をPDF/PNGでダウンロードして印刷・共有できます。メニューから「.vcf」で連絡先ファイルを保存することもできます。

【よくある質問（FAQ）】

Q. データはどこに保存されますか？
A. 端末のブラウザ（ローカルストレージ）内のみです。サーバーには一切送信されません。

Q. 機種変更やアプリ削除後はどうなりますか？
A. 端末内のデータは削除されます。大切な名刺は「ファイルで保存(.vcf)」や「名刺をダウンロード(PDF/PNG)」でバックアップすることをおすすめします。

Q. オフラインで使えますか？
A. はい。一度アプリを開いて読み込んでおけば、オフラインでも名刺の表示・QRコードの表示が可能です（PWAとしてインストール推奨）。

Q. 複数名刺は何枚まで作れますか？
A. 端末の保存容量の範囲内で、複数枚作成・切り替えが可能です。

Q. Premiumはいつ課金されますか？
A. ご利用のプラン（月額等）に応じて、ストアの課金ポリシーに従います。購入の復元は設定メニューから行えます。
```

### 2.2 英語（Full description, English）

```
MeQR is a privacy-first digital business card app.

【Features】

• Data stays on your device only
  Your name, contact info, company, SNS links, and photo are stored only on your phone or tablet. Nothing is sent to any server.

• Share easily with a QR code
  Show your QR code to share your contact as a vCard. No need for paper cards—exchange info in seconds.

• Multiple cards
  Create and switch between work and personal cards. You can add a profile photo to each card.

• Export as PDF or PNG
  Download your card as PDF or PNG for printing. The app works as a PWA and can be used offline after the first load.

• Works offline
  Once loaded, you can view and share your card and QR code without an internet connection (PWA support).

【Privacy】

MeQR is designed so we never hold your data.
• All entered data is stored only in your device’s local storage.
• No data is sent to the developer or any third-party server.
• No ads or tracking.

【Free vs Premium】

Free:
• Create, edit, and manage multiple cards
• Show, share, and save QR code
• Download vCard (.vcf)
• Export card as PDF/PNG (with a small “MeQR” watermark on the preview)
• Offline use (PWA)

Premium:
• Export card as PDF/PNG without watermark
• Access to all future templates
• Support continued development

【How to use (3 steps)】

1. Enter your name and contact
   Tap “Edit” and fill in your name and email or phone. Company, title, URL, and SNS are optional.

2. Save and show QR
   Tap “Save and update QR” to save your card. The view screen will show your card with a QR code.

3. Share or download
   Let others scan your QR, or download your card as PDF/PNG. You can also save your contact as a .vcf file from the menu.

【FAQ】

Q. Where is my data stored?
A. Only in your device’s browser (local storage). Nothing is sent to any server.

Q. What happens if I change devices or uninstall?
A. Data on the device will be lost. We recommend backing up via “Save as .vcf” or “Download card (PDF/PNG)”.

Q. Can I use it offline?
A. Yes. After loading the app once, you can view and share your card offline (install as PWA for best experience).

Q. How many cards can I create?
A. You can create and switch between multiple cards within your device’s storage limits.

Q. When am I charged for Premium?
A. According to your plan (e.g. monthly) and the store’s billing policy. You can restore purchases from Settings.
```

---

## 3. スクリーンショット

### 3.1 仕様

| 項目 | 内容 |
|------|------|
| 必要枚数 | 最低 2 枚、推奨 8 枚 |
| サイズ | **1080px × 1920px**（縦長・9:16） |
| 形式 | PNG または JPEG |
| 対象 | スマートフォン（電話機） |

### 3.2 撮影内容チェックリスト

| # | 画面内容 | 撮影のポイント |
|---|----------|----------------|
| 1 | メイン画面（QRコード表示） | 表示モードで、QR・名前・会社・連絡先が映るようにする |
| 2 | 名刺テンプレート選択画面 | 名刺を選ぶ or プレビュー部分が分かる画面（現状は Minimal のみの場合はプレビュー＋タイトルで対応可） |
| 3 | 編集画面 | 編集モードで、姓・名・電話・メール・会社・役職など入力欄が映るようにする |
| 4 | プレビュー画面 | 名刺デザインプレビュー（Minimal）が映る部分 |
| 5 | Premium機能の説明 | 設定内の「Premiumにアップグレード」やプラン説明が映る画面 |
| 6 | プライバシー重視の説明 | このアプリについて or オンボーディングの「プライバシー第一」スライド |
| 7 | ダウンロード画面 | 名刺をダウンロード（PDF/PNG）モーダル or .vcf 保存の流れ |
| 8 | 設定画面 | 設定メニュー（QRサイズ・言語・Premium など） |

### 3.3 撮影用テストデータ

アプリ内で **メニュー → 設定 → 「スクリーンショット用デモを読み込む」** をタップすると、サンプル名刺データが読み込まれます。  
同じ内容でスクリーンショットを撮ると、ストア用に統一された見た目にできます。

- 想定サンプル：会社名「株式会社サンプル」、名前「山田 太郎」、電話・メール・役職・URL などを適度に設定したデータです。

---

## 4. プロモーション画像（Feature Graphic）

### 4.1 仕様

| 項目 | 内容 |
|------|------|
| サイズ | **1024px × 500px** |
| 形式 | PNG または JPEG（32bit PNG 非推奨） |
| 用途 | ストアの上部バナー等 |

### 4.2 内容の目安

- **アプリ名**: MeQR - シンプルなデジタル名刺（または英語表記）
- **キャッチコピー例**  
  日本語：「データは端末だけ。プライバシー重視のデジタル名刺。」  
  英語：「Your data stays on your device. Privacy-first digital business card.」
- **ビジュアル**: アプリアイコン ＋ スマホ画面のスクリーンショット（メイン画面など）を配置したレイアウト

### 4.3 作成のヒント

- 背景はアプリのテーマカラー（#1e293b など）やグラデーションで統一すると認識しやすいです。
- 文字は大きく・少なめにし、視認性を優先してください。

---

## 5. アプリアイコン

### 5.1 仕様

| 項目 | 内容 |
|------|------|
| サイズ | **512px × 512px** |
| 形式 | **PNG（透過なし）** |
| 内容 | シンプルなQRコードモチーフ ＋ "MeQR" ロゴ |

### 5.2 デザインの方向性

- 既存の `icons/icon-192.svg` や `icon-512.svg` をベースに、Google Play 用に **透過なし・角丸なし** の 512×512 PNG を書き出しても構いません。
- QRコードを抽象化したモチーフ（四角のパターン）＋「MeQR」のテキストで、小さいサイズでも判別しやすいデザインにすると良いです。
- 背景は単色（例：#1e293b や #0f172a）にすると、ストアの様々な背景でもはっきり見えます。

### 5.3 既存アイコンからの書き出し

- 現在は SVG（`icons/icon-192.svg`, `icons/icon-512.svg`）があります。
- 画像編集ソフトやコマンド（例：Inkscape、ImageMagick、Sharp 等）で **背景を不透明にして 512×512 PNG にエクスポート** したものを Play 用アイコンとして使用できます。

---

## 6. アセット作成・準備の流れ

1. **テストデータの読み込み**  
   アプリで「スクリーンショット用デモを読み込む」を実行し、表示・編集・設定を確認する。

2. **スクリーンショット**  
   実機またはエミュレータで 1080×1920 になるようキャプチャ（デバイス設定で解像度を合わせるか、キャプチャ後にリサイズ）。

3. **プロモーション画像**  
   1024×500 のキャンバスで、アプリ名・キャッチコピー・スクショを配置して作成。

4. **アプリアイコン**  
   SVG から 512×512 PNG（透過なし）を書き出し、ストア用アイコンとして登録。

5. **ストアコンソール入力**  
   上記の「アプリ名」「短い説明」「詳細な説明」をコピーして、Google Play Console の該当欄に貼り付け。

---

## 7. 参考リンク

- [Google Play のアプリの説明を作成する](https://support.google.com/googleplay/android-developer/answer/9859152)
- [グラフィック アセットの仕様](https://support.google.com/googleplay/android-developer/answer/9866151)
- [アプリアイコンの仕様](https://support.google.com/googleplay/android-developer/answer/9859152#zippy=%2F%E3%82%A2%E3%83%97%E3%83%AA%E3%82%A2%E3%82%A4%E3%82%B3%E3%83%B3)

---

*このガイドは MeQR の Google Play 公開準備用です。ストアの仕様変更は公式ドキュメントでご確認ください。*
