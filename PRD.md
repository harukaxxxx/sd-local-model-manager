# Stable Diffusion 本地模型管理系統開發需求書

## 開發概要

- 核心目標：開發一款 Stable Diffusion 本地模型管理系統。
- 部署模式：Localhost 優先。前端透過瀏覽器（如 http://localhost:3000）進行存取與管理。

## 技術架構

- **後端**：Python + FastAPI
  - 處理所有檔案系統操作（讀取、編輯、移動）
  - 計算模型 sha256（async 非同步，不 block）
  - 代理 Civitai 下載請求（解決 CORS 限制）
  - 靜態檔案 hosting（直接 serve 前端）
- **前端**：純 HTML/CSS/JS（無框架，輕量）
- **Metadata 儲存**：SQLite（單一 `.db` 檔案，位於項目根目錄）

## 資料庫 Schema

```sql
CREATE TABLE models (
  id            TEXT PRIMARY KEY,    -- 檔案路徑
  name          TEXT NOT NULL,       -- 顯示名稱
  file_path     TEXT NOT NULL,       -- 實體檔案路徑
  file_size     INTEGER,             -- 檔案大小（bytes）
  sha256        TEXT,                -- 模型 sha256 hash
  md5           TEXT,                -- 模型 md5 hash
  model_type    TEXT,                -- 模型類型：checkpoint, vae, lora, hypernet, embedding, other
  civitai_id    INTEGER,             -- Civitai 模型 ID
  civitai_url   TEXT,                -- 關聯的 Civitai 網址
  preview_url   TEXT,                -- 預覽圖 URL
  description   TEXT,                -- 模型描述（可含 prompt）
  nsfw          INTEGER DEFAULT 0,   -- 是否為 NSFW 內容
  created_at    INTEGER,             -- unix timestamp
  updated_at    INTEGER
);

CREATE TABLE tags (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE model_tags (
  model_id TEXT,
  tag_id   INTEGER,
  PRIMARY KEY (model_id, tag_id)
);

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);
```

### 模型類型說明

| 類型 | 說明 |
|------|------|
| `checkpoint` | 主模型檔案（.ckpt, .safetensors） |
| `vae` | VAE 模型檔案 |
| `lora` | LoRA 模型檔案 |
| `hypernet` | HyperNetwork 檔案 |
| `embedding` | Textual Inversion / Embedding |
| `other` | 其他類型，需手動指定下載路徑 |

## 功能概要

### 核心功能

- 依使用者提供的本地路徑讀取模型及相關資料。
- 透過前端卡牌式介面，管理與瀏覽本地模型。
- 圖像介面編輯檔案名稱或移動資料夾。
- 讀取使用者提供的 Civitai 模型網址，下載到使用者選擇的目錄。

### 瀏覽功能

- 透過模型名稱、檔名、容量等數據進行卡片排序。
- 透過使用者自訂的標籤作為篩選顯示條件。
- 批次選取模型卡片加入/移除標籤。

### 模型卡片

- 如有同模型檔名 .md 檔，則顯示於模型卡片內
- 如有同模型檔名之圖片檔（jpg, png, jpeg, webp），則優先將其作為預覽圖顯示
- 非同步分析模型 sha256 尋找並紀錄 Civitai 模型網址
- 顯示模型類型（checkpoint / vae / lora / hypernet / embedding / other）
- 可展開顯示詳細資訊：描述、prompt（正向/負向）、Civitai 連結等


### 下載功能

- 支援單一 URL 或模型 ID 下載（Civitai）
- 下載時顯示模型名稱、版本、預覽圖等資訊供使用者確認
- 支援批次下載（可套用篩選條件）
- 下載模型時自動下載一張預覽圖，檔名與模型相同
- 提供欄位供使用者自訂下載模型之檔案名稱以及存放路徑
- 支援 Google Drive 分享連結下載（直接連結 / 共享連結）
- 下載完成後自動計算 md5 / sha256 hash

### 預覽圖功能

- 支援外部 URL 設定模型預覽圖
- 自動下載的預覽圖可設定是否resize
- NSFW 內容可設定模糊處理

### 匯入/匯出功能

- 支援從 .info 檔案匯入模型資訊
- 支援 JSON 檔案匯入/匯出模型資料庫
- 支援綁定本地已存在的模型檔案

## 資料結構

- 模型資料夾以單一主路徑為主，遍歷所有子資料夾進行管理
- Metadata 統一存放於模型主目錄根目錄的 `metadata.db` SQLite 資料庫

## 使用者操作流程

```
選擇模型目錄 → 系統掃描建立索引 → 瀏覽/篩選/排序卡片
                                                    ↓
                     ┌──────────────────────────────┴──────────────────────────────┐
                     ↓                                                           ↓
              檢視模型詳情                                                 批次管理模式
              - 預覽圖 / .md 說明                                            - 加入/移除標籤
              - Civitai 網址                                                 - 統整搬移
              - sha256 比對結果
                                                           ↓
                                                    下載新模型
                                                    - 貼上 Civitai URL
                                                    - 選擇存放路徑與檔名
                                                    - 自動下載預覽圖
```

## 效能考量

- 大模型（數 GB）sha256 計算：使用 Python `asyncio` + `aiofiles` 非同步串流計算，不 block 系統
- 大量模型（數百個）：前端卡片虛擬滾動（virtual scrolling），後端分頁 API
- 縮圖快取：依 sha256 命名存於 `.cache/thumbnails/` 目錄

## 設定面板

- 模型存放根目錄設定
- 各模型類型（checkpoint / vae / lora / embedding / hypernet）的預設下載路徑
- 預覽圖下載開關（是否自動下載）
- 資料庫位置設定（`--database-dir` 命令列參數）
- 主題支援（深色/淺色）
