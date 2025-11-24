---
description: Global Coding Guidelines
---

# Coding Guidelines

コード生成および修正タスクにおいては、以下のガイドラインを必ず遵守してください。

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

### State Management

- **Local State**: UI 固有の状態には `useState` を使用します。
- **Global State**: グローバルな状態管理には **Zustand** を使用します。
- **Data Fetching**: データ取得ロジックはカスタムフックまたはリポジトリ実装内にカプセル化します。コンポーネント内で直接データを取得しないでください。

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
