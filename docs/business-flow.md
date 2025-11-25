# 業務フロー (Business Flow)

## 概要

Local Bridge は、検査業務を効率化するための PWA アプリケーションです。
管理者（Desktop）と検査員（Mobile）の 2 つの役割で、検査タスクの作成から完了までのフローを管理します。

---

## 基本フロー

```
1. 管理者: タスク作成 (Desktop)
   ↓
2. 検査員: タスク確認 (Mobile)
   ↓
3. 検査員: 検査実施・結果送信 (Mobile)
   ↓
4. 管理者: 結果確認 (Desktop)
   ├→ 承認 → 完了
   └→ 是正指示 → 再検査
        ↓
5. 検査員: 再検査実施 (Mobile)
   ↓
   (ステップ4に戻る)
```

---

## 詳細フロー

### 1. タスク作成 (管理者 / Desktop)

**画面**: `/desktop/tasks/create`

**操作**:

1.  エリア（場所）を選択（例: Kitchen, Hall）
2.  ターゲット（設備）を選択（例: Dishwasher, Oven）
3.  タスクタイトルと説明を入力
4.  「Create Task」ボタンをクリック

**データの流れ**:

- `InspectionTask` が作成される
- ステータス: `todo` (未実施)
- IndexedDB に保存される

---

### 2. タスク確認 (検査員 / Mobile)

**画面**: `/mobile`

**表示内容**:

- 自分に割り当てられたタスクの一覧
- ステータスごとに色分け:
  - 未実施: グレー
  - 再検査必要: 赤（「Re-check」バッジ付き）

**操作**:

- タスクカードをタップ → 検査実施画面へ遷移

---

### 3. 検査実施 (検査員 / Mobile)

**画面**: `/mobile/tasks/:taskId`

**操作**:

1.  **判定を選択**:
    - OK: 合格
    - NG: 不合格
    - N/A: 判断不可
2.  **証拠を撮影** (任意):
    - 「Take Photo」ボタンでカメラ起動
    - 「Record Video」ボタンで動画撮影
    - 複数枚の撮影が可能
    - プレビューで確認、削除も可能
3.  **メモを入力** (任意):
    - 観察内容や気づきをテキストで入力
4.  「Submit Inspection」ボタンをクリック

**データの流れ**:

- `InspectionResult` が作成される
  - 判定 (verdict)
  - メモ (note)
  - 証拠 ID のリスト (evidenceIds)
  - 作成者 (createdBy): 検査員のユーザー名
- 証拠データ (`Evidence`) が Base64 形式で保存される
- タスクのステータスが `in_review` (確認中) に変更される

---

### 4. 結果確認・承認 (管理者 / Desktop)

**画面**: `/desktop/tasks/:taskId`

**表示内容**:

- タスク情報（エリア、ターゲット、タイトル、説明）
- 最新の検査結果:
  - 判定（アイコン付き）
  - メモ
  - 証拠（写真・動画のプレビュー）
- コメント履歴

**操作**:

#### A. 承認する場合

1.  検査結果を確認
2.  必要に応じてコメントを追加
3.  「Approve & Mark as Done」ボタンをクリック

**データの流れ**:

- タスクのステータスが `done` (完了) に変更される
- システムコメントが自動追加: "Task approved and marked as done."

#### B. 是正を指示する場合

1.  検査結果を確認し、問題点を特定
2.  是正内容をテキストエリアに入力
3.  「Request Correction (Re-check)」ボタンをクリック

**データの流れ**:

- タスクのステータスが `correction_needed` (再検査必要) に変更される
- 是正指示コメントが追加される
- 検査員側のタスク一覧に「Re-check」バッジが表示される

---

### 5. 再検査 (検査員 / Mobile)

**画面**: `/mobile` → 「Re-check」バッジ付きタスクをタップ → `/mobile/tasks/:taskId`

**操作**:

- ステップ 3 と同様に検査を実施
- 是正指示のコメントを参考に再度検査

**データの流れ**:

- 新しい `InspectionResult` が作成される
- タスクのステータスが再度 `in_review` に変更される
- ステップ 4 に戻る

---

## ステータス遷移図

```
[todo]
  ↓ (検査員が結果を送信)
[in_review]
  ├→ (管理者が承認) → [done] ★ 終了
  └→ (管理者が是正指示) → [correction_needed]
       ↓ (検査員が再検査)
     [in_review] (再度確認へ)
```

---

## 役割と権限

### 管理者 (Desktop)

- タスクの作成・編集・削除
- 検査結果の確認
- 承認・是正指示
- コメント追加
- 統計情報の閲覧（今後実装予定）

### 検査員 (Mobile)

- タスク一覧の閲覧
- 検査の実施（判定・証拠撮影・メモ）
- 結果の送信
- コメントの閲覧

---

## データモデル

### InspectionTask (検査タスク)

- `id`: タスク ID
- `title`: タイトル
- `description`: 説明
- `areaId`: エリア ID
- `equipmentId`: ターゲット ID
- `status`: ステータス (`todo` | `in_review` | `done` | `correction_needed`)
- `createdAt`, `updatedAt`: 作成・更新日時

### InspectionResult (検査結果)

- `id`: 結果 ID
- `taskId`: 紐づくタスク ID
- `verdict`: 判定 (`ok` | `ng` | `n_a`)
- `note`: メモ
- `evidenceIds`: 証拠 ID のリスト
- `createdBy`: 作成者（ユーザー名）
- `createdAt`: 作成日時

### Evidence (証拠)

- `id`: 証拠 ID
- `resultId`: 紐づく結果 ID
- `type`: 種類 (`image` | `video`)
- `data`: Base64 エンコードされたデータ
- `mimeType`: MIME タイプ
- `createdAt`: 作成日時

### InspectionComment (コメント)

- `id`: コメント ID
- `taskId`: 紐づくタスク ID
- `content`: 内容
- `createdBy`: 作成者（ユーザー名）
- `createdAt`: 作成日時
- `isSystemComment`: システムコメントかどうか

---

## 今後の拡張予定

### Phase 2: Service Worker / PWA 対応

- オフライン時の動作保証
- バックグラウンド同期
- プッシュ通知（タスク割り当て通知など）

### Phase 3: バックエンド同期

- IndexedDB とバックエンド API の同期
- 競合解決ロジック
- リアルタイム更新

### Phase 4: 追加機能

- ダッシュボード（統計情報）
- 検索・フィルタリング機能の強化
- PDF レポート生成
- タスクのスケジューリング

---

## 更新履歴

- 2025-11-25: 初版作成（基本フロー、詳細フロー、データモデル）
