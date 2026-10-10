# 神楽笛 旋律・リピート暗記帖（learn-kagura-fue）開発ドキュメント

## 1. アプリ概要
楽譜のないお祭りの神楽笛（全33節）を、反復構造・同一フレーズの視覚的グルーピングによって効率的に暗記・反復練習するためのWeb学習ナビゲーションアプリ。

- **本番公開URL**: [https://bamboo-flute.koty.dev](https://bamboo-flute.koty.dev)
- **Pages URL**: [https://learn-kagura-fue.pages.dev](https://learn-kagura-fue.pages.dev)
- **リポジトリ**: `koty/learn-kagura-fue` (GitHub)

---

## 2. 技術スタック

### フロントエンド
- **フレームワーク**: React 18 (`react`, `react-dom`)
- **ビルドツール**: Vite 5 (`vite`, `@vitejs/plugin-react`)
- **言語**: TypeScript 5 (`tsc`)
- **スタイリング**: Tailwind CSS v4 (`@tailwindcss/postcss`, `postcss`, `autoprefixer`)
- **アイコン**: Lucide React (`lucide-react`)
- **オーディオエンジン**: Web Audio API (`AudioContext`, `AudioBufferSourceNode`, `GainNode`, `BiquadFilterNode`)

### インフラ・デプロイ
- **ホスティング**: Cloudflare Pages
- **デプロイ方式**: Wrangler Direct Upload（`wrangler pages deploy dist`）
- **音源配信**: `public/audio/` 静的配信（Cloudflare CDNエッジキャッシュ）

---

## 3. ディレクトリ構成

```text
learn-kagura-fue/
├── agents.md               # プロジェクト仕様書・AIエージェント向け指示書
├── index.html              # エントリーHTML
├── package.json            # 依存関係・スクリプト定義
├── public/
│   └── audio/              # 全33節のMP3音源ファイル（00前奏.mp3 〜 31後半-後半.mp3）
├── src/
│   ├── App.tsx             # メインUI・プレイヤーロジック・Web Audio再生エンジン
│   ├── index.css           # Tailwind CSS スタイルエントリー
│   ├── main.tsx            # Reactルートマウント
│   ├── songData.ts         # 全33節のトラック定義・3大部グルーピング
│   └── types.ts            # TypeScript型定義（TrackItem, SectionGroup, MajorGroup 等）
├── tsconfig.json           # TypeScript設定
└── vite.config.ts          # Vite設定
```

---

## 4. 楽曲構造とデータ設計（全33節）

神楽笛の曲全体を**「前奏」「前半」「後半」の3大項目（項）**にグルーピングし、各項内でセクションとタイル（節）を管理しています。

### 大項目（`MAJOR_GROUPS`）
1. **前奏**（全1節）: 導入演奏
2. **前半**（全21節）:
   - **前半**: 基本数字フレーズ ① 〜 ⑥
   - **中盤**: 単発フレーズ 中1 〜 中4（後半のA〜Cとは独立）
   - **後半**: フレーズ ① 〜 ⑤ の反復（⑥は無し）
   - **宮**: 宮バージョン ①宮 〜 ⑤宮
   - **結び**: 前半の締めくくり（単発）
3. **後半**（全11節）:
   - **導入**: 後半への繋ぎ演奏（導1 ➔ 導2）
   - **主旋律**: A ➔ B ➔ C ➔ A（Aが2回反復）
   - **宮**: 宮バージョン B宮 ➔ C宮 ➔ A宮
   - **結び**: 結び① ➔ 結び②（クライマックス・終盤）

---

## 5. UI / UX 設計

- **和モダン・サイバーダークUI**:
  - `bg-slate-950` をベースに、ガラスモーフィズム（`backdrop-blur`）と繊細な光彩効果を配置。
- **通し進行ミニマップ**:
  - 画面上部に全33節がひと目で俯瞰できるミニバーを常時表示。
- **再生中ブロックの同色アウトライン（outlined）デザイン**:
  - 再生中ブロックは白ベタ塗りではなく、背景をダーク（`bg-slate-950`）にし、各フレーズ固有のテーマカラーの太枠線（`border-2`）と同色発光グローで縁取られる。
  - 右上の点滅インジケータも同色でパルス表示。
- **同フレーズ連動ハイライト**:
  - いずれかのブロックにホバーまたは再生すると、同じフレーズを持つすべてのブロックが同色でパルス強調。
- **フローティング・プレイヤー**:
  - 画面下部に固定ドックを配置。
  - プログレスバー（クリックシーク対応）、再生/一時停止（Spaceキー）、前へ/次へ（矢印キー）。
  - 再生速度（0.8x / 1.0x / 1.2x）切替。
  - 再生モード（通し連続再生 / セクション内ループ / 1曲リピート）切替。

---

## 6. オーディオ再生エンジンの仕様と注意点

### Web Audio API を採用する理由
- 連続再生時やリピート時のギャップレス再生・低遅延レスポンス。
- 先頭・末尾のマイクロフェードアウト処理によるクリックノイズ（プチ音）の抑制。

### Autoplay Policy（自動再生制限）対策
- ブラウザ（iOS Safari / Chrome等）の自動再生制限により、ユーザーの直接操作外での `ctx.resume()` はブロックされる。
- **対応**: タイル、ミニマップ、プレイヤー操作ボタン等のすべての `onClick` ハンドラ同期コンテキストの先頭で `unlockAudioContext()` を呼び出し、即座にオーディオエンジンをアンロックする。
- ページ全体の初回操作（`pointerdown` / `touchstart` / `click` / `keydown`）でも自動アンロックする。

### トラック手動切替時の `onended` 競合防止
- 音声停止時（`stopAudio`）に `source.stop()` を呼ぶと Web Audio API 仕様により `onended` イベントが発火する。
- この `onended` が「自然終了」と誤認して次のトラックへ勝手に進行するのを防ぐため、**手動停止時は即座に `source.onended = null` を代入してリスナーを破棄**し、さらに `activeSourceRef.current !== source` のガードを設けている。

---

## 7. 開発・運用コマンド

```bash
# 依存関係のインストール
npm install

# ローカル開発サーバー起動 (http://localhost:5173/)
npm run dev

# TypeScript型チェック & プロダクションビルド (dist/ 出力)
npm run build

# ビルド成果物のローカルプレビュー
npm run preview

# Cloudflare Pages への本番デプロイ
npx wrangler pages deploy dist --project-name learn-kagura-fue
```