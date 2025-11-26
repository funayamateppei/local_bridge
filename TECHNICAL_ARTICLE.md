# 【React/TypeScript】完全オフライン動作する「Local-First」な点検アプリのアーキテクチャ設計

## はじめに

「地下の倉庫で電波が繋がらない」「山間部の現場で写真をアップロードできない」
現場 DX の文脈において、ネットワーク接続の不安定さは UX を破壊する最大の要因です。

従来の SPA（Single Page Application）は、API サーバーとの通信を前提としていました。Service Worker によるキャッシュである程度のオフライン対応は可能ですが、動的なデータの生成や保存（例：点検結果の入力、写真撮影）となると、単なるキャッシュでは対応しきれません。

そこで私たちが採用したのが **Local-First (Offline-First)** アーキテクチャです。
本記事では、**IndexedDB** と **OPFS (Origin Private File System)** を駆使し、**Clean Architecture** と **DDD (Domain-Driven Design)** の原則に基づいて構築した、堅牢なフロントエンド設計の詳細を解説します。

---

## 1. Local-First アーキテクチャの核心

Local-First とは、**「ローカルデバイス（ブラウザ）を信頼できる唯一の情報源（Source of Truth）とし、サーバーはあくまでバックアップや共有のために使う」** というパラダイムシフトです。

### 従来の Web アプリ vs Local-First

| 特徴                | 従来の Web アプリ            | Local-First アプリ              |
| ------------------- | ---------------------------- | ------------------------------- |
| **Source of Truth** | サーバー DB                  | **ローカル DB (IndexedDB)**     |
| **データ保存**      | API リクエスト (非同期)      | ローカル DB への書き込み (即時) |
| **ID 採番**         | サーバー (Auto Increment 等) | **クライアント (UUID v4)**      |
| **オフライン**      | エラーまたは Read-Only       | **Full Read/Write 可能**        |
| **レイテンシ**      | ネットワーク依存             | **ゼロ (ディスク I/O のみ)**    |

このアーキテクチャにより、ユーザーはネットワークの状態を一切気にすることなく、サクサクと作業を進めることができます。

---

## 2. 技術スタックと選定理由

- **Framework**: React 19 + TypeScript
- **Local DB**: **IndexedDB** (via **Dexie.js**)
  - _理由_: ブラウザ標準の NoSQL DB。`localStorage` (5MB 制限) とは比較にならない容量とクエリ能力を持つ。Dexie.js によるラッパーで型安全かつ直感的に扱える。
- **File Storage**: **OPFS (Origin Private File System)**
  - _理由_: 画像・動画などのバイナリデータを IndexedDB に入れるとパフォーマンスが劣化するため。ファイルシステムレベルの高速アクセスが可能。
- **State Management**: **Zustand**
  - _理由_: Redux より軽量でボイラープレートが少ない。非同期処理との相性が良く、ローカル DB との同期が書きやすい。
- **Architecture**: **Clean Architecture + DDD**
  - _理由_: 「データの保存先がローカルかサーバーか」という詳細をドメインロジックから隠蔽するため。

---

## 3. アーキテクチャ詳細：Clean Architecture の適用

フロントエンド内で Clean Architecture を適用し、依存の方向を制御しています。

```mermaid
graph TD
    subgraph Presentation [Presentation Layer]
        React[React Components]
        Store[Zustand Store]
    end

    subgraph Domain [Domain Layer]
        Entity[Entities]
        RepoInterface[Repository Interfaces]
    end

    subgraph Infrastructure [Infrastructure Layer]
        RepoImpl[Repository Implementations]
        Dexie[Dexie.js (IndexedDB)]
        OPFS[OPFS Storage]
        API[API Client]
    end

    React --> Store
    Store --> RepoInterface
    RepoImpl ..|> RepoInterface
    RepoImpl --> Dexie
    RepoImpl --> OPFS
    RepoImpl --> API
```

### Domain Layer (中心)

ここにはビジネスロジックと型定義のみが存在します。外部ライブラリやフレームワークには依存しません。

```typescript
// src/domain/entities/Evidence.ts
export class Evidence {
  constructor(
    public readonly id: string,
    public readonly resultId: string,
    public readonly type: "image" | "video",
    public readonly filePath: string, // OPFS上のパス
    public readonly mimeType: string,
    public readonly createdAt: number
  ) {}
}

// src/domain/repositories/IInspectionRepository.ts
export interface IInspectionRepository {
  saveEvidence(evidence: Evidence, file: Blob): Promise<void>
  getEvidencesByResultId(resultId: string): Promise<Evidence[]>
}
```

### Infrastructure Layer (詳細)

ここで初めて「データがどこに保存されるか」に関心を持ちます。
Local-First の肝は、**Repository の実装がまずローカル DB を読み書きする**点にあります。

```typescript
// src/infrastructure/repositories/InspectionRepositoryImpl.ts
export class InspectionRepositoryImpl implements IInspectionRepository {
  constructor(
    private db: LocalBridgeDatabase, // Dexieインスタンス
    private opfs: OPFSStorage // OPFSラッパー
  ) {}

  async saveEvidence(evidence: Evidence, file: Blob): Promise<void> {
    // 1. バイナリはOPFSに保存 (高速)
    await this.opfs.saveFile(evidence.filePath, file)

    // 2. メタデータはIndexedDBに保存 (検索可能)
    await this.db.evidences.add({
      id: evidence.id,
      resultId: evidence.resultId,
      filePath: evidence.filePath,
      mimeType: evidence.mimeType,
      createdAt: evidence.createdAt,
      sync_status: "pending", // 未同期フラグ
    })
  }
}
```

---

## 4. OPFS (Origin Private File System) の活用

今回の技術的なハイライトの一つが **OPFS** です。
従来の Web アプリでは、画像を扱う際に以下の問題がありました：

1. **IndexedDB に Blob を入れる**: 読み書きが遅く、ブラウザ全体のパフォーマンスを低下させる。
2. **Base64 エンコード**: データサイズが約 1.3 倍になり、メモリ効率が悪い。

OPFS は、オリジンごとに隔離されたプライベートなファイルシステムを提供し、これらの問題を解決します。

### OPFS の実装例

```typescript
// src/infrastructure/storage/opfs.ts
export class OPFSStorage {
  private rootPromise: Promise<FileSystemDirectoryHandle>

  constructor() {
    this.rootPromise = navigator.storage.getDirectory()
  }

  async saveFile(path: string, blob: Blob): Promise<void> {
    const root = await this.rootPromise
    // ディレクトリ階層の作成などは省略
    const fileHandle = await root.getFileHandle(path, { create: true })

    // FileSystemWritableFileStreamを作成して書き込み
    const writable = await fileHandle.createWritable()
    await writable.write(blob)
    await writable.close()
  }

  async getFile(path: string): Promise<File> {
    const root = await this.rootPromise
    const fileHandle = await root.getFileHandle(path)
    return await fileHandle.getFile()
  }
}
```

**ポイント**:

- ユーザーにファイル保存のダイアログ（「名前を付けて保存」）は出ません。アプリ専用の領域に静かに保存されます。
- `createWritable()` はストリーム書き込みが可能で、大容量ファイルでもメモリを圧迫しません。

---

## 5. 同期ロジックと競合解決

Local-First における最大の課題は「同期」と「競合解決」です。
私たちは **「手動同期」** と **「データ特性に応じた競合解決戦略」** を採用しました。

### 同期フロー (Client → Server)

1. ユーザーが「同期」ボタンを押す。
2. `sync_status = 'pending'` のレコードを IndexedDB から抽出。
3. **Evidence (画像)**:
   - OPFS からファイルを読み出す。
   - サーバーへアップロード (Presigned URL 使用)。
   - 成功したら `sync_status = 'synced'` に更新。
4. **InspectionResult (点検結果)**:
   - JSON データとして API へ POST。
   - 成功したら `sync_status = 'synced'` に更新。

### 競合解決戦略

複数人が同じタスクを操作した場合の競合をどう防ぐか？
私たちは「技術的なマージ」ではなく「業務的な設計」で解決しました。

#### 1. InspectionResult: Append-Only (追記のみ)

点検結果は「上書き」を禁止しました。
A さんが「OK」、B さんが「NG」と判定した場合、**両方のレコードを保存**します。

```typescript
// サーバー上のデータ構造イメージ
{
  taskId: "task-123",
  history: [
    { user: "UserA", verdict: "OK", timestamp: 1000 },
    { user: "UserB", verdict: "NG", timestamp: 1005 } // ← 最新
  ]
}
```

これにより、**「競合」という概念自体をなくし**、監査証跡としての価値を高めました。

#### 2. Task Status: Last-Write-Wins (LWW)

タスクのステータス（完了/未完了）など、単一の値しか持てないものは、**タイムスタンプによる後勝ち**を採用しました。

```typescript
if (serverTask.updatedAt > localTask.updatedAt) {
  // サーバーが新しい -> ローカルを更新
  await db.tasks.put(serverTask)
} else {
  // ローカルが新しい -> サーバーへ送信
  await api.updateTask(localTask)
}
```

---

## 6. バックエンドの役割：実は「普通の REST API」でいい

Local-First アーキテクチャの隠れたメリットは、**バックエンドがシンプルになること**です。

### バックエンドが知らなくて良いこと

今回の設計では、バックエンドは以下のことを一切意識していません：

- クライアントが現在オンラインかオフラインか
- クライアントがいつ同期を実行したか
- どのデータが未同期か

### 責務の分離

| 責務               | 担当       | 理由                                                                 |
| ------------------ | ---------- | -------------------------------------------------------------------- |
| **同期タイミング** | **Client** | 通信環境を知っているのはクライアントだけだから                       |
| **競合解決**       | **Client** | ユーザーの意図（どれを残すか）を確認できるのはクライアントだけだから |
| **データの永続化** | **Server** | 最終的な「真実（Source of Truth）」としてデータを守るため            |

結果として、バックエンドは **Spring Boot で作られたごく一般的な REST API** となりました。
特別な同期プロトコルや WebSocket などは使用せず、シンプルな CRUD エンドポイントを提供するだけで、この高度なオフライン機能を実現します。

---

## 7. まとめ：Local-First がもたらす UX 変革

このアーキテクチャを採用したことで、以下の成果が得られました：

1. **UX の劇的な向上**: ネットワーク待ち時間がゼロになり、アプリの応答性が飛躍的に向上しました。
2. **堅牢性**: 「電波が悪いから使えない」という現場の言い訳（ボトルネック）を解消しました。
3. **開発者体験**: サーバーの状態管理から解放され、ローカル DB に対するシンプルな CRUD に集中できるようになりました。

Local-First は、単なるオフライン対応ではありません。**「ネットワークは不安定である」という前提に立った、現代の Web アプリケーションのあるべき姿**の一つだと考えています。

現場 DX や、信頼性が求められる業務アプリを開発されている方の参考になれば幸いです。
