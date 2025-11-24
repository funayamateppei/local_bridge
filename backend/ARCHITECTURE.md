# Backend Architecture (Spring Boot)

Spring Boot 標準のレイヤードアーキテクチャを採用し、将来的な拡張性とテスト容易性を確保します。

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
