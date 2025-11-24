# Frontend Architecture (React + TypeScript)

**Clean Architecture** に基づき、関心事を分離して実装します。
依存の方向は常に **外側（詳細）から内側（抽象）** へ向かいます。

## Layer Structure

```mermaid
graph TD
    Presentation[Presentation Layer<br/>(React, Zustand)] --> Application[Application Layer<br/>(Use Cases)]
    Application --> Domain[Domain Layer<br/>(Entities, Repository Interfaces)]
    Infrastructure[Infrastructure Layer<br/>(Dexie, OPFS, API)] --> Domain
    Infrastructure -.->|Implements| Domain
```

### 1. Domain Layer (`src/domain`)

- **役割**: ビジネスロジックの中核。フレームワークや外部ライブラリに依存しない純粋な TypeScript で記述。
- **構成要素**:
  - **Entities**: 一意な識別子を持つオブジェクト（例: `Log`）。
  - **Value Objects**: 値によって識別されるオブジェクト（例: `SyncStatus`）。
  - **Repository Interfaces**: データの永続化に関する抽象定義（例: `LogRepository`）。

### 2. Application Layer (`src/application`)

- **役割**: ドメインオブジェクトを操作し、ユースケースを実現する。
- **構成要素**:
  - **Use Cases**: アプリケーションの機能単位（例: `CreateLogUseCase`, `SyncLogsUseCase`）。
  - **Services**: ドメインを跨ぐロジック（必要な場合）。

### 3. Infrastructure Layer (`src/infrastructure`)

- **役割**: 技術的な詳細の実装。
- **構成要素**:
  - **Repositories**: Domain層で定義されたインターフェースの実装（例: `DexieLogRepository`）。
  - **External Services**: API クライアント、IndexedDB (Dexie)、OPFS ラッパー。

### 4. Presentation Layer (`src/presentation`)

- **役割**: ユーザーインターフェースと状態管理。
- **構成要素**:
  - **Components**: React コンポーネント。
  - **Stores**: Zustand によるグローバル状態管理。Use Case を呼び出し、結果を Store に反映する。
  - **Hooks**: UI ロジックの切り出し。
