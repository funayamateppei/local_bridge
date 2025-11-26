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
- **Business Flow Documentation**: 業務フローは `docs/business-flow.md` で管理します。新機能の追加やフロー変更時は、必ずこのドキュメントを更新してください。

## 2. Architecture & Design Patterns (アーキテクチャとデザインパターン)

### Clean Architecture

このプロジェクトは**Clean Architecture**に基づいて設計されています。

1. **依存の方向**: 外側(詳細)から内側(抽象)へ
2. **レイヤー構成**:
   - **Domain Layer**: ビジネスロジックの中核(エンティティ、リポジトリインターフェース)
   - **Application Layer**: ユースケース、サービス(ドメインロジックのオーケストレーション)
   - **Infrastructure Layer**: リポジトリの実装、外部 API、DB アダプター(Dexie など)
   - **Presentation Layer**: React コンポーネント、Hooks、Zustand ストア

**Dependency Rule**: 依存関係は内側に向かわなければなりません。ドメイン層はインフラ層やプレゼンテーション層に依存してはいけません。

### ドメイン駆動設計(DDD)

#### エンティティの定義

- エンティティは`src/domain/entities/`に配置
- 一意な識別子(`id`)を持つ
- ビジネスロジックをカプセル化
- フレームワークや外部ライブラリに依存しない純粋な TypeScript クラス

**例:**

```typescript
export class InspectionTask {
  readonly id: string
  readonly title: string
  status: InspectionStatus
  // ...

  constructor(/* ... */) {
    // 初期化
  }
}
```

#### リポジトリパターン

- インターフェースは`src/domain/repositories/`に配置
- 実装は`src/infrastructure/repositories/`に配置
- データの永続化方法(DB、API 等)を抽象化

**例:**

```typescript
// Domain層
export interface IInspectionRepository {
  getAreas(): Promise<Area[]>
  createTask(task: Omit<InspectionTask, "id" | "createdAt" | "updatedAt">): Promise<void>
}

// Infrastructure層
export class InspectionRepositoryImpl implements IInspectionRepository {
  async getAreas(): Promise<Area[]> {
    const areas = await db.areas.toArray()
    return areas.map((a) => new Area(a.id, a.name))
  }
}
```

## 3. データ同期戦略

### オフラインファースト

このアプリケーションは**オフラインファースト**で設計されています。

#### 基本方針

1. **ローカル DB を信頼できる唯一の情報源とする**

   - すべての読み書きはまずローカル DB(IndexedDB)に対して行う
   - UI はローカル DB の状態を反映する

2. **手動同期**

   - オンライン/オフラインモードはユーザーが明示的に切り替える
   - 同期はユーザーが同期ボタンを押した時のみ実行
   - 理由: 不安定な接続での自動同期は予期しない動作を引き起こす可能性がある

3. **同期の方向性**
   - **Server → Client**: マスターデータ(Area, Equipment, InspectionTask)
   - **Client → Server**: 点検結果(InspectionResult, Evidence)
   - **Bi-directional**: コメント(InspectionComment)

### 競合解決

複数の点検者が同じタスクを同時に実施する可能性があるため、以下の戦略で競合を解決します:

1. **InspectionResult: Append-Only (追記のみ)**

   - 1 つのタスクに対して複数の結果を許容
   - 各点検者の結果は独立して保存
   - `createdBy`と`createdAt`で作成者と時刻を記録
   - UI では最新の結果を表示、履歴も閲覧可能

2. **InspectionTask Status: Last-Write-Wins (LWW)**

   - `updatedAt`タイムスタンプで最新を判定
   - サーバーが最終的な真実を保持
   - 同期時にタイムスタンプを比較して新しい方を採用

3. **InspectionComment: Merge (マージ)**

   - ID で重複を検知
   - 両方のコメントを保持
   - UUID により ID 衝突は発生しない

4. **Evidence: Immutable (不変)**
   - 一度作成されたエビデンスは変更・削除しない
   - 証拠としての完全性を保つ

詳細は `frontend/ARCHITECTURE.md` の「競合解決戦略」セクションを参照してください。

### バイナリファイル管理(OPFS)

#### 基本方針

画像・動画などの大容量バイナリファイルは**OPFS (Origin Private File System)**に保存します。

**理由**:

- IndexedDB は大きなバイナリデータに不向き(パフォーマンス低下、容量制限)
- Base64 エンコードは不要なオーバーヘッド
- OPFS は高速なファイル I/O を提供

#### Evidence エンティティの設計

```typescript
class Evidence {
  id: string // UUID
  resultId: string // 紐づく点検結果のID
  type: "image" | "video"
  filePath: string // OPFSでのファイルパス
  mimeType: string
  createdAt: number
  fileSize?: number
}
```

**重要**:

- メタデータ(id, type, mimeType 等)は IndexedDB に保存
- 実ファイルは OPFS に保存し、`filePath`で参照
- **Base64 エンコードは使用しない**

#### ファイル命名規則

```
/evidence/{uuid}.{ext}
```

例: `/evidence/550e8400-e29b-41d4-a716-446655440000.jpg`

#### 実装パターン

```typescript
// OPFSラッパー
export class OPFSStorage {
  async saveFile(filePath: string, blob: Blob): Promise<void>
  async getFile(filePath: string): Promise<File>
  async deleteFile(filePath: string): Promise<void>
}

// Repository実装
export class InspectionRepositoryImpl {
  constructor(
    private db: LocalBridgeDatabase,
    private opfs: OPFSStorage
  ) {}

  async saveEvidence(file: File, resultId: string): Promise<string> {
    // 1. OPFSにファイル保存
    const filePath = `/evidence/${uuidv4()}.${ext}`
    await this.opfs.saveFile(filePath, file)

    // 2. メタデータをIndexedDBに保存
    const evidence = new Evidence(...)
    await this.db.evidences.add({ ...evidence })

    return evidence.id
  }
}
```

## 4. Frontend (React + TypeScript)

### Component Structure

- **Functional Components**: 全て関数コンポーネントを使用します。
- **Named Exports**: 遅延ロードされるページを除き、デフォルトエクスポートではなく名前付きエクスポート(例: `export const Button = ...`)を使用します。
- **Props Interface**: プロパティはコンポーネントの直上で `interface` を使用して定義します。
- **Pages**:
  - ページコンポーネントは `src/presentation/pages` に配置し、ルート構造を反映させます(例: `pages/login/page.tsx`)。
  - **責務**: ルーティングロジック(遷移、パラメータ取得)とデータ取得のみを担当します。
  - **UI**: 描画処理は `src/presentation/features` 内の View コンポーネントに委譲します。
- **Features vs Components**:
  - **`features/`**: 特定の機能に紐づく UI(例: `LoginView`, `HomeView`)。機能単位でディレクトリを分けます。
  - **`components/`**: 汎用的な再利用可能な部品(例: `Button`, `Input`, `Card`)。プロジェクト全体で使い回せるもの。
- **Export Management**:
  - 各ディレクトリに `index.ts` を配置し、必要なもののみを明示的にエクスポートします。
  - 外部からは `index.ts` 経由でのみインポートし、内部実装の詳細を隠蔽します。
  - 例: `import { AuthProvider } from './context/auth'` (`auth/index.ts`からエクスポート)
- **Import Paths**:
  - `@/` エイリアスを使用して、`src` 配下のファイルを絶対パスでインポートします。
  - 例: `import { useAuth } from '@/presentation/hooks/auth'`
  - 相対パス(`../../`)は使用しません。

### State Management

- **Local State**: UI 固有の状態には `useState` を使用します。
- **Global State**: グローバルな状態管理には **Zustand** を使用します。
- **Data Fetching**: データ取得ロジックはカスタムフックまたはリポジトリ実装内にカプセル化します。コンポーネント内で直接データを取得しないでください。

### Routing

**ルーティング設計**:

このアプリケーションでは、以下のパスプレフィックスのみを使用します:

- `/login`, `/register` - 認証関連
- `/desktop/*` - デスクトップ向け(管理者用)
- `/mobile/*` - モバイル向け(点検者用)
- `/` - ダッシュボード
- `*` - 404 Not Found

**上記以外のパスは 404 にリダイレクトされます。**

- **Type Safety**: ルート定義は `Routing` オブジェクトで行い、型安全性を確保します。
- **Usage**: 定義には `Routing.Path.to.Screen.path` を使用し、パラメータ付き遷移には `Routing.Path.to.Screen.path.replace(...)` を使用します。
- **Structure**: URL 構造を反映するようにルート定義をネストさせます。

### Styling (CSS)

- **Tailwind CSS**: スタイリングには Tailwind CSS を使用します。
- **Utility First**: カスタム CSS よりもユーティリティクラスを優先します。
- **Configuration**: 必要に応じて `tailwind.config.js` でカスタムカラーやスペーシングを定義します。

### UI Components & Icons

- **Components**:
  - 汎用的な UI コンポーネント(Button, Input, Dropdown 等)は `src/presentation/components/ui` に実装します。
  - **`cn` (classnames) の使用基準**:
    - **共通コンポーネント**: `className` props を受け取り、内部スタイルとマージする場合に**必須**です。
    - **通常のページ/機能コンポーネント**: 基本的に**不要**です。通常の文字列としてクラス名を記述してください。条件付きスタイルが多い場合のみ使用を検討してください。
- **Icons**:
  - アイコンライブラリには **lucide-react** を使用します。
  - 例: `import { User, LogOut } from 'lucide-react'`

## 5. Database & Backend

### Database Migration

- **マイグレーションファイルは必ずコマンドで作成してください**(`./gradlew flywayCreate -PmigrationDesc=...`)。
- 手動でのファイル作成(`touch` 等)は禁止です。これは命名規則を統一するためです。
- 詳細な手順については `backend/README.md` を参照してください。

### データベースシード

- 開発用のテストデータは`npm run seed`で投入
- **本番環境では自動実行されない**
- `frontend/src/infrastructure/db/seed.ts`に定義

## 6. Naming Conventions (命名規則)

- **Variables/Functions**: `camelCase`
- **Components**: `PascalCase`
- **Files**:
  - React Components: `PascalCase.tsx`
  - Utilities/Hooks: `camelCase.ts`
  - Constants: `UPPER_SNAKE_CASE`
- **ページコンポーネント**: `src/presentation/pages/{category}/{feature}/page.tsx`
- **機能コンポーネント**: `src/presentation/features/{feature}/{ComponentName}.tsx`

## 7. TypeScript

- 型安全性を最優先
- `any`の使用は原則禁止
- インターフェースよりも型エイリアスを優先(空のインターフェースは使用しない)

## 8. Comments (コメント)

- **Why, not What**: コードが何をするかだけでなく、複雑なロジックの背後にある「なぜ」を文書化します。
- **JSDoc**: 複雑な関数や共有コンポーネントには JSDoc を使用します。

## 9. ドキュメント管理

- **ルール**: すべての開発ルールは `.agent/rules.md` に記載します
- **仕様書**: 詳細仕様は `docs/SPECIFICATION.md` に記載します。機能変更時は**必ず更新**してください
- **アーキテクチャ**: フロントエンドの詳細設計は `frontend/ARCHITECTURE.md` に記載します
- **README**: 各ディレクトリに `README.md` を配置し、セットアップ手順や使い方を記載します

## 10. バックエンド開発ルール

### データベースマイグレーション

#### Flyway マイグレーションファイルの作成

1. **命名規則**: `V{version}__{description}.sql`

   - 例: `V2__create_inspection_tables.sql`
   - バージョン番号は連番で、既存のマイグレーションより大きい番号を使用

2. **ER 図の更新**:

   - **必須**: マイグレーションファイルを作成したら、必ず `backend/ER_DIAGRAM.md` を更新すること
   - Mermaid 形式の ER 図を最新の状態に保つ
   - テーブル説明、ステータス定義、インデックス情報も更新
   - 更新履歴テーブルにバージョンと変更内容を記録

3. **マイグレーションの内容**:

   - テーブル作成時は外部キー制約を明示的に定義
   - パフォーマンスのため、適切なインデックスを作成
   - `ON DELETE CASCADE` などのカスケード動作を明確に指定
   - デフォルト値は `DEFAULT` 句で設定

4. **実行順序**:
   - マイグレーションは一度実行されたら変更不可
   - 修正が必要な場合は新しいマイグレーションファイルを作成

#### Entity 定義

- JPA/Hibernate アノテーションを使用
- `data class` を使用してボイラープレートを削減
- Enum は別途定義し、`@Enumerated(EnumType.STRING)` で保存
- タイムスタンプは `java.time.Instant` を使用

#### Repository

- Spring Data JPA の `JpaRepository` を継承
- カスタムクエリメソッドは命名規則に従う（例: `findByAreaId`）
- 複雑なクエリは `@Query` アノテーションを使用

#### Controller

- RESTful API の原則に従う
- `@CrossOrigin` は開発時のみ使用、本番環境では適切に設定
- Request/Response DTO を明確に定義
- HTTP ステータスコードを適切に返す（201 Created, 404 Not Found 等）

### ドキュメント

- **ER 図**: `backend/ER_DIAGRAM.md` に Mermaid 形式で記載
- **API 仕様**: 必要に応じて Swagger/OpenAPI で文書化
- **README**: セットアップ手順、環境変数、実行方法を記載
