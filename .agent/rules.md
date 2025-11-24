---
description: Global Coding Guidelines
---

# Coding Guidelines

コード生成および修正タスクにおいては、以下のガイドラインを必ず遵守してください。
このファイルは**日本語**で記述し、維持してください。

## 1. General Principles (基本原則)

- **Local-First**: オフライン機能を最優先します。ネットワークリクエストはバックグラウンド同期のためにのみ使用し、UI をブロックしてはいけません。
- **Type Safety**: TypeScript の型システムを広範囲に使用します。`any`の使用は厳禁です。
- **Simplicity**: 複雑な抽象化よりも、可読性と保守性を優先します。

## 2. Architecture & Design Patterns (アーキテクチャとデザインパターン)

- **Architecture**: **Clean Architecture** と **Domain-Driven Design (DDD)** の原則に従います。
- **Layers**:
  - **Domain**: エンティティ、値オブジェクト、リポジトリインターフェース（純粋な TypeScript、フレームワーク依存なし）。
  - **Application**: ユースケース、サービス（ドメインロジックのオーケストレーション）。
  - **Infrastructure**: リポジトリの実装、外部 API、DB アダプター（Dexie など）。
  - **Presentation**: React コンポーネント、Hooks、Zustand ストア。
- **Dependency Rule**: 依存関係は内側に向かわなければなりません。ドメイン層はインフラ層やプレゼンテーション層に依存してはいけません。

## 3. Frontend (React + TypeScript)

### Component Structure

- **Functional Components**: 全て関数コンポーネントを使用します。
- **Named Exports**: 遅延ロードされるページを除き、デフォルトエクスポートではなく名前付きエクスポート（例: `export const Button = ...`）を使用します。
- **Props Interface**: プロパティはコンポーネントの直上で `interface` を使用して定義します。
- **Pages**:
  - ページコンポーネントは `src/presentation/pages` に配置し、ルート構造を反映させます（例: `pages/login/page.tsx`）。
  - **責務**: ルーティングロジック（遷移、パラメータ取得）とデータ取得のみを担当します。
  - **UI**: 描画処理は `src/presentation/features` 内の View コンポーネントに委譲します。
- **Features vs Components**:
  - **`features/`**: 特定の機能に紐づく UI（例: `LoginView`, `HomeView`）。機能単位でディレクトリを分けます。
  - **`components/`**: 汎用的な再利用可能な部品（例: `Button`, `Input`, `Card`）。プロジェクト全体で使い回せるもの。
- **Export Management**:
  - 各ディレクトリに `index.ts` を配置し、必要なもののみを明示的にエクスポートします。
  - 外部からは `index.ts` 経由でのみインポートし、内部実装の詳細を隠蔽します。
  - 例: `import { AuthProvider } from './context/auth'` （`auth/index.ts`からエクスポート）
- **Import Paths**:
  - `@/` エイリアスを使用して、`src` 配下のファイルを絶対パスでインポートします。
  - 例: `import { useAuth } from '@/presentation/hooks/auth'`
  - 相対パス（`../../`）は使用しません。

### State Management

- **Local State**: UI 固有の状態には `useState` を使用します。
- **Global State**: グローバルな状態管理には **Zustand** を使用します。
- **Data Fetching**: データ取得ロジックはカスタムフックまたはリポジトリ実装内にカプセル化します。コンポーネント内で直接データを取得しないでください。

### Routing

- **Type Safety**: ルート定義は `Routing` オブジェクトで行い、型安全性を確保します。
- **Usage**: 定義には `Routing.Path.to.Screen.path` を使用し、パラメータ付き遷移には `Routing.Path.to.Screen.path.replace(...)` を使用します。
- **Structure**: URL 構造を反映するようにルート定義をネストさせます。

### Styling (CSS)

- **Tailwind CSS**: スタイリングには Tailwind CSS を使用します。
- **Utility First**: カスタム CSS よりもユーティリティクラスを優先します。
- **Configuration**: 必要に応じて `tailwind.config.js` でカスタムカラーやスペーシングを定義します。

## 4. Naming Conventions (命名規則)

- **Variables/Functions**: `camelCase`
- **Components**: `PascalCase`
- **Files**:
  - React Components: `PascalCase.tsx`
  - Utilities/Hooks: `camelCase.ts`
  - Constants: `UPPER_SNAKE_CASE`

## 5. Comments (コメント)

- **Why, not What**: コードが何をするかだけでなく、複雑なロジックの背後にある「なぜ」を文書化します。
- **JSDoc**: 複雑な関数や共有コンポーネントには JSDoc を使用します。
