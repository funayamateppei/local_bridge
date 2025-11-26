# Backend (Spring Boot)

## 概要

Local Bridge のバックエンドは、フロントエンドに対して**通常の REST API**を提供します。

### バックエンドの役割

1. **データの永続化** - PostgreSQL へのデータ保存・取得
2. **CRUD API 提供** - エリア、設備、タスク、結果、コメントの CRUD 操作
3. **認証・認可** - ユーザー認証とアクセス制御
4. **ファイルストレージ** - エビデンス(画像・動画)のアップロード先 URL 提供

### バックエンドが**知らなくて良い**こと

- ✅ クライアントがオフラインかオンラインか
- ✅ いつ同期が実行されるか
- ✅ どのデータが未同期か(`sync_status`等はクライアント専用フィールド)
- ✅ 競合解決ロジック(クライアント側で実装)

**同期ロジックはすべてフロントエンド側で完結します。** バックエンドは通常の REST API を提供するだけで、同期を意識する必要はありません。

### 主要な API エンドポイント

```
GET    /api/areas                    # エリア一覧取得
GET    /api/equipments               # 設備一覧取得
GET    /api/inspections              # 検査一覧取得
POST   /api/inspections              # 検査作成
GET    /api/inspections/:id          # 検査詳細取得
GET    /api/inspection-items         # 検査項目一覧取得
POST   /api/inspection-items         # 検査項目作成
GET    /api/inspection-results       # 検査結果一覧取得
POST   /api/inspection-results       # 検査結果作成
GET    /api/comments                 # コメント一覧取得
POST   /api/comments                 # コメント作成
POST   /api/evidences/presigned-url  # エビデンスアップロード用URL取得
```

詳細は [ARCHITECTURE.md](./ARCHITECTURE.md) を参照してください。

## Development Scripts

### Format

Google Java Format を適用します。

```bash
./gradlew format
```

### Lint

フォーマット違反がないかチェックします。

```bash
./gradlew lint
```

### Test

ユニットテストを実行します。

```bash
./gradlew test
```

### Run

1. **Environment Variables**
   環境変数を設定します。`.env.example` をコピーして `.env` を作成してください。

   ```bash
   cp .env.example .env
   ```

   必要に応じて `.env` の値を編集してください。

2. **Database**
   Docker で PostgreSQL を起動します。

   ```bash
   docker-compose up -d
   ```

3. **Application**
   Spring Boot アプリケーションを起動します。

   ```bash
   # .env ファイルを読み込んで起動（推奨）
   export $(cat .env | xargs) && ./gradlew bootRun

   # または、IDE で起動する場合は IDE の環境変数設定を使用
   ```

## Database Migration (Flyway)

### 前提条件

PostgreSQL が起動している必要があります。

```bash
# docker-compose.yml を使用してデータベースを起動
docker-compose up -d
```

詳細な設定は `docker-compose.yml` を参照してください。

### マイグレーションファイルの作成

1. **ファイル配置場所**: `src/main/resources/db/migration/`

2. **命名規則**: `V{バージョン番号}__{説明}.sql`

   - バージョン番号は連番（例: 1, 2, 3...）
   - 既存のマイグレーションファイルより大きい数字を使用
   - 説明はスネークケース（小文字とアンダースコア）
   - 例: `V1__create_users_table.sql`, `V2__add_logs_table.sql`

3. **ファイルの作成**:

   Gradle タスクを使用してマイグレーションファイルを作成します（命名規則を統一するため）。

   ```bash
   # 例: ユーザーテーブル作成用のマイグレーション
   ./gradlew flywayCreate -PmigrationDesc=CreateUsersTable
   ```

   これにより `src/main/resources/db/migration/V{N}__createuserstable.sql` が自動生成されます。

4. **SQL の記述**:
   ```sql
   CREATE TABLE users (
       id BIGSERIAL PRIMARY KEY,
       username VARCHAR(255) NOT NULL UNIQUE,
       password_hash VARCHAR(255) NOT NULL
   );
   ```

### マイグレーションの実行

```bash
# マイグレーション適用
./gradlew flywayMigrate

# 適用状況確認
./gradlew flywayInfo

# マイグレーション履歴のクリア（開発環境のみ）
./gradlew flywayClean
```

### データベース接続設定

データベース接続情報は `.env` ファイルで管理します。詳細は上記の「Environment Variables」セクションを参照してください。

### トラブルシューティング

#### マイグレーションが失敗する

- データベースが起動しているか確認: `docker-compose ps`
- 接続情報が正しいか確認: `.env` ファイル
- マイグレーションファイルの SQL 構文が正しいか確認

#### データベースをリセットしたい

```bash
# データベースを削除して再作成
docker-compose down -v
docker-compose up -d

# マイグレーション再実行
./gradlew flywayMigrate
```
