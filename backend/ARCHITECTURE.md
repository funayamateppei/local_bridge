# Backend Architecture (Spring Boot)

## 概要

Local Bridge のバックエンドは、Spring Boot 標準のレイヤードアーキテクチャを採用し、将来的な拡張性とテスト容易性を確保します。

### 設計方針

1. **通常の REST API** - 同期を意識しない、シンプルな CRUD API
2. **ステートレス** - クライアントの状態(オンライン/オフライン)を保持しない
3. **データの永続化** - PostgreSQL にデータを保存し、真実の情報源(Source of Truth)として機能

### 同期ロジックとの関係

**バックエンドは同期ロジックを考慮する必要はありません。**

- 同期タイミング、競合解決、`sync_status`管理はすべてフロントエンド側で実装
- バックエンドは通常の CRUD 操作を提供するだけ
- クライアントがオフラインかオンラインかを知る必要はない

詳細は `frontend/SYNC_LOGIC.md` を参照してください。

## Layer Structure

```mermaid
graph TD
    Controller[Controller Layer<br/>(REST API)] --> Service[Service Layer<br/>(Business Logic)]
    Service --> Repository[Repository Layer<br/>(Data Access)]
    Repository --> DB[(PostgreSQL)]
```

### 1. Controller Layer (`com.localbridge.backend.controller`)

- **役割**: HTTP リクエストの受付とレスポンスの返却。
- **責務**:
  - リクエストパラメータの検証。
  - Service 層の呼び出し。
  - DTO (Data Transfer Object) への変換。

### 2. Service Layer (`com.localbridge.backend.service`)

- **役割**: ビジネスロジックの実行。
- **責務**:
  - トランザクション管理。
  - 複数の Repository を組み合わせた処理。
  - ドメインルールの適用。

### 3. Repository Layer (`com.localbridge.backend.repository`)

- **役割**: データベースへのアクセス。
- **技術**: Spring Data JPA を使用。

### 4. Domain/Model Layer (`com.localbridge.backend.model`)

- **役割**: データの構造定義。
- **構成要素**:
  - **Entities**: JPA エンティティ（DB テーブルとマッピング）。
  - **DTOs**: API 通信用のデータオブジェクト。

## API 設計

### エンドポイント一覧

#### マスターデータ

```
GET    /api/areas?since={ts} # エリア一覧取得 (差分対応)
POST   /api/areas           # エリア作成
PUT    /api/areas/:id       # エリア更新
DELETE /api/areas/:id       # エリア削除

GET    /api/equipments?since={ts} # 設備一覧取得 (差分対応)
POST   /api/equipments      # 設備作成
PUT    /api/equipments/:id  # 設備更新
DELETE /api/equipments/:id  # 設備削除
```

#### タスク管理

```
GET    /api/tasks           # タスク一覧取得
POST   /api/tasks           # タスク作成
GET    /api/tasks/:id       # タスク詳細取得
PUT    /api/tasks/:id       # タスク更新
DELETE /api/tasks/:id       # タスク削除
```

#### 点検結果

```
GET    /api/results         # 結果一覧取得
POST   /api/results         # 結果作成
GET    /api/results/:id     # 結果詳細取得
```

**注意**: 点検結果は追記のみ(Append-Only)のため、更新・削除エンドポイントは提供しません。

#### コメント

```
GET    /api/comments        # コメント一覧取得
POST   /api/comments        # コメント作成
```

#### エビデンス

```
POST   /api/evidences/presigned-url  # S3アップロード用のPresigned URL取得
```

**ファイルアップロードフロー**:

1. クライアントが Presigned URL をリクエスト
2. バックエンドが S3 の Presigned URL を生成して返却
3. クライアントが S3 に直接アップロード
4. クライアントがファイル URL を含む結果を POST

### 認証・認可

```
POST   /api/auth/login      # ログイン
POST   /api/auth/register   # ユーザー登録
POST   /api/auth/refresh    # トークンリフレッシュ
```

## データモデル

### 主要エンティティ

```
Area (エリア)
├─ id: UUID
└─ name: String

Equipment (設備)
├─ id: UUID
├─ name: String
└─ areaId: UUID

InspectionTask (点検タスク)
├─ id: UUID
├─ title: String
├─ description: String
├─ areaId: UUID
├─ equipmentId: UUID
├─ status: Enum (todo, in_review, done, correction_needed)
├─ createdAt: Timestamp
└─ updatedAt: Timestamp

InspectionResult (点検結果)
├─ id: UUID
├─ taskId: UUID
├─ verdict: Enum (ok, ng, n_a)
├─ note: String
├─ createdAt: Timestamp
└─ createdBy: UUID

InspectionComment (コメント)
├─ id: UUID
├─ taskId: UUID
├─ content: String
├─ createdAt: Timestamp
├─ createdBy: UUID
└─ isSystemComment: Boolean

Evidence (エビデンス)
├─ id: UUID
├─ resultId: UUID
├─ type: Enum (image, video)
├─ fileUrl: String (S3のURL)
├─ mimeType: String
└─ createdAt: Timestamp
```

**注意**: `sync_status`などのフィールドはクライアント専用のため、バックエンドの DB スキーマには含めません。
