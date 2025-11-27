# Local Bridge 詳細仕様書

## 1. 概要

Local Bridge は、オフラインファーストで動作する設備点検（Inspection）アプリケーションです。
現場でのインターネット接続が不安定な環境でも、点検業務を滞りなく遂行できることを目的としています。

## 2. システムアーキテクチャ

### 2.1 全体構成

- **Frontend**: React + TypeScript + Vite (PWA)
- **Backend**: Kotlin + Spring Boot (REST API)
- **Database**: PostgreSQL (Backend), IndexedDB (Frontend)
- **File Storage**: OPFS (Frontend), S3 Compatible (Backend)

### 2.2 データフロー

1. **Read**: UI は常にローカルの IndexedDB からデータを読み込んで表示する（爆速・オフライン対応）。
2. **Write**: ユーザーの操作は IndexedDB に即時反映され、バックグラウンドで SyncService がサーバーへ送信する。
3. **Sync**: 定期的またはユーザーの操作により、サーバーの最新データをローカルに取り込む。

## 3. 機能仕様

### 3.1 検査 (Inspection)

- **一覧表示**: 担当する検査の一覧を表示。ステータス（Todo, In Review, Done）でフィルタリング可能。
- **詳細表示**: 検査の基本情報と、含まれる検査項目（InspectionItem）の一覧を表示。
  - **フィルタリング**: 「すべて」「NG のみ」「未実施」「完了」で絞り込み表示が可能。特に NG 項目のみを抽出して確認できる。
  - **結果表示**: 一覧上で判定結果（OK/NG/N/A）をバッジ表示し、詳細を開かなくても状態を把握可能。
- **実施**: 各検査項目に対して、OK/NG/N/A の判定、メモ、写真・動画の添付が可能。

### 3.2 再検査 (Re-Inspection)

- **ワークフロー**:
  1. 検査完了後、NG 項目がある場合のみ「再検査を作成」ボタンが有効化される。
  2. ボタン押下により、NG 項目のみを抽出した新しい検査データが作成される。
  3. 元の検査は「Done」のまま保持され、履歴として残る（改ざん防止）。
  4. 新しい検査は独立した ID を持ち、通常の検査と同様に実施できる。

### 3.3 写真・動画管理 (Evidence)

- **保存先**: ブラウザの **OPFS (Origin Private File System)** を使用。
  - IndexedDB にはバイナリを含めず、ファイルパスとメタデータのみを保存することでパフォーマンスを維持。
- **表示**: OPFS から Blob として読み込み、`URL.createObjectURL` または Data URL で表示。
- **同期**: バックグラウンドで S3（または互換ストレージ）へアップロード（※S3 連携は今後実装）。

### 3.4 同期 (Synchronization)

- **戦略**: **Local-First / Eventual Consistency**
- **Master Data**: サーバー → クライアントの一方向同期（Area, Equipment）。
- **Transaction Data**: 双方向同期。
  - **Upstream**: ローカルの未送信データをサーバーへ POST。
  - **Downstream**: サーバーの更新データをローカルへ Fetch。
- **Conflict Resolution**: **Last Write Wins** (LWW) を基本とするが、ステータス遷移などはサーバー側のロジックで整合性を保つ。

### 3.5 オフライン対応 (PWA)

- **Service Worker**: アプリケーションシェル（HTML, JS, CSS）をキャッシュし、オフライン起動を保証。
- **Manifest**: インストール可能な PWA として設定（アイコン、テーマカラー）。
- **ReloadPrompt**: 新しいバージョンがデプロイされた際、ユーザーに更新を促す UI を表示。

### 3.6 認証・セキュリティ

- **トークン戦略**:
  - **Access Token**: 有効期限 1 時間。API アクセスに使用。
  - **Refresh Token**: 有効期限 30 日。Access Token の再発行に使用。
- **オフライン時の挙動**:
  - Access Token が期限切れの場合、Refresh Token による更新を試みる。
  - ネットワークエラー等で更新に失敗した場合、**ログアウトせずに**ローカルでの利用を継続させる（Local-First 原則）。
  - サーバーから明示的に拒否（401/403）された場合のみログアウトする。

## 4. データモデル

詳細な ER 図は [backend/ER_DIAGRAM.md](../backend/ER_DIAGRAM.md) を参照。

### 主要エンティティ

- **Inspection**: 検査タスク（例: "10 月の定期点検"）
- **InspectionItem**: 個別の点検項目（例: "エアコンフィルター確認"）
- **InspectionResult**: 点検結果（OK/NG, メモ）
- **Evidence**: 証拠写真・動画のメタデータ

## 5. UX/UI 仕様

- **Optimistic UI**: サーバーレスポンスを待たずに UI を更新し、操作感を向上。
- **Sync Status**: 同期状態（同期中、完了、エラー、オフライン）をヘッダーに常時表示。
- **Feedback**: エラー発生時は Toast 通知などでユーザーに知らせるが、作業を中断させない。

## 6. 今後の拡張予定

- **Push 通知**: 検査アサイン時や、再検査作成時に担当者へ通知（Web Push API）。
- **S3 連携**: Evidence ファイルのバックエンドストレージへの永続化。
