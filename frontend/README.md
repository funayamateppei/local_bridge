# Local Bridge - Frontend

オフラインファーストの点検管理アプリケーション

## 概要

Local Bridgeは、インターネット接続が不安定な環境でも使用できる点検管理システムのフロントエンドアプリケーションです。

### 主な特徴

- **オフラインファースト**: IndexedDBを使用し、オフライン環境でも完全に動作
- **手動同期**: ユーザーが明示的にオンライン/オフラインモードを切り替え、同期タイミングを制御
- **Clean Architecture**: ドメイン駆動設計に基づいた保守性の高いアーキテクチャ
- **レスポンシブデザイン**: デスクトップ(管理者)とモバイル(点検者)の両方に対応

### 技術スタック

- **フレームワーク**: React 19 + TypeScript
- **ビルドツール**: Vite
- **状態管理**: Zustand
- **ローカルDB**: Dexie (IndexedDB wrapper)
- **ルーティング**: React Router v7
- **スタイリング**: Tailwind CSS
- **アイコン**: Lucide React

## Getting Started

### インストール

```bash
npm install
```

### 開発サーバー起動

```bash
npm run dev
```

### 開発用データの投入

初回起動時やデータベースをリセットしたい場合、以下のコマンドでテストデータを投入できます:

```bash
npm run seed
```

**注意**: このコマンドは開発環境専用です。本番環境では実行されません。

## Development Scripts

### Format

Prettier を使用してコードを整形します。

```bash
npm run format
```

### Lint

ESLint を使用してコードの静的解析を行います。

```bash
npm run lint
```

### Test

Vitest を使用してテストを実行します。

```bash
npm run test
```

### Build

本番用ビルドを作成します。

```bash
npm run build
```

### Preview

ビルドした本番用アプリケーションをプレビューします。

```bash
npm run preview
```

## アーキテクチャ

詳細なアーキテクチャ設計については [ARCHITECTURE.md](./ARCHITECTURE.md) を参照してください。

### ディレクトリ構成

```
src/
├── domain/              # ドメイン層(エンティティ、リポジトリインターフェース)
│   ├── entities/        # ドメインエンティティ
│   ├── repositories/    # リポジトリインターフェース
│   └── types/           # 型定義
├── application/         # アプリケーション層(ユースケース)
├── infrastructure/      # インフラ層(DB、API実装)
│   ├── api/            # APIクライアント
│   ├── db/             # IndexedDB設定
│   └── repositories/   # リポジトリ実装
└── presentation/        # プレゼンテーション層(UI)
    ├── components/     # 再利用可能なコンポーネント
    ├── features/       # 機能別コンポーネント
    ├── pages/          # ページコンポーネント
    ├── routes/         # ルーティング設定
    ├── context/        # Reactコンテキスト
    └── hooks/          # カスタムフック
```

## データ同期戦略

### オンライン/オフラインモード

このアプリケーションは、ユーザーが手動でオンライン/オフラインモードを切り替える設計です。

- **オフラインモード**: すべての操作がローカルDBに保存される
- **オンラインモード**: ユーザーが同期ボタンを押すことでサーバーと同期

### 同期の仕組み

1. **マスターデータ(Area, Equipment)**: サーバー → クライアント(一方向)
2. **タスク(InspectionTask)**: サーバー → クライアント(管理者が作成)
3. **点検結果(InspectionResult, Evidence)**: クライアント → サーバー(点検者が登録)
4. **コメント(InspectionComment)**: 双方向同期

詳細は [ARCHITECTURE.md](./ARCHITECTURE.md) の「Data Flow & Synchronization Strategy」セクションを参照してください。

## ルーティング

### 認証

- `/login` - ログイン
- `/register` - ユーザー登録

### デスクトップ(管理者向け)

- `/desktop/tasks` - タスク一覧
- `/desktop/tasks/create` - タスク作成
- `/desktop/tasks/:taskId` - タスク詳細

### モバイル(点検者向け)

- `/mobile` - ホーム(タスク一覧)
- `/mobile/tasks/:taskId` - タスク詳細(点検実施)

### その他

- `/` - ダッシュボード(ロール選択)
- `*` - 404 Not Found

## 📚 詳細ドキュメント

- [ARCHITECTURE.md](./ARCHITECTURE.md) - アーキテクチャ設計の詳細
- [SYNC_LOGIC.md](./SYNC_LOGIC.md) - 同期ロジックの詳細実装
