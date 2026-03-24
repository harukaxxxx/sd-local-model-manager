# SD Local Model Manager

一款基於網頁介面的 Stable Diffusion 本地模型管理工具，使用 Python FastAPI 作為後端，純 HTML/CSS/JS 作為前端。

## 功能特色

- **模型瀏覽** - 網格/列表視圖，顯示預覽圖、檔案大小、中繼資料
- **目錄掃描** - 自動掃描本地目錄建立模型索引，支援多種模型類型
- **Civitai 整合** - 代理下載 Civitai 模型、預覽圖
- **雜湊比對** - 計算 SHA256/MD5 雜湊值比對本地模型與 Civitai 資料
- **批次作業** - 多選模型進行標籤指派、檔案搬移
- **匯入匯出** - JSON 資料庫備份/還原、.info 檔案解析
- **標籤系統** - 自訂標籤組織模型
- **NSFW 處理** - 模糊處理敏感內容預覽圖
- **主題支援** - 深色/淺色主題
- **虛擬滾動** - 高效能瀏覽大量模型集合

## 技術棧

- **後端**：Python 3.11+, FastAPI, aiosqlite, httpx, Pillow
- **前端**：原生 HTML5/CSS3/JavaScript ES6+（無框架）
- **資料庫**：SQLite（metadata.db）
- **架構**：REST API，採用非同步作業

## 環境需求

- Python 3.11 或更高版本
- Conda 或 pip 管理依賴
- Windows/macOS/Linux 皆可執行

## 快速開始

### 1. 克隆專案

```bash
git clone https://github.com/harukaxxxx/sd-local-model-manager.git
cd sd-local-model-manager
```

### 2. 設定環境

**使用 Conda（推薦）：**
```bash
conda env create -f environment.yml
conda activate sd-local-model-manager
```

**使用 pip：**
```bash
cd server
pip install -e ".[dev]"
pip install python-multipart Pillow
```

### 3. 啟動伺服器

```bash
python -m server.main
```

伺服器啟動於 `http://localhost:3030`。前端位於 `/app`（如 `http://localhost:3030/app`）。

## 專案結構

```
sd-local-model-manager/
├── server/
│   ├── main.py              # FastAPI 應用程式入口
│   ├── routers/              # API 端點
│   │   ├── models.py         # 模型 CRUD 操作
│   │   ├── tags.py           # 標籤管理
│   │   ├── civitai.py        # Civitai 代理
│   │   └── import_export.py   # 匯入/匯出作業
│   ├── services/              # 業務邏輯
│   │   ├── scanner.py         # 目錄掃描
│   │   ├── hasher.py          # 雜湊計算
│   │   ├── downloader.py      # 檔案下載
│   │   ├── preview.py         # 圖片處理
│   │   └── info_parser.py    # .info 檔案解析
│   ├── database.py            # SQLite 連線管理
│   └── tests/                 # 測試套件（47 項測試）
├── frontend/
│   ├── index.html           # 進入點
│   ├── css/                  # 樣式表
│   └── js/
│       ├── main.js           # 應用程式初始化
│       ├── api.js            # API 用戶端
│       └── components/        # UI 元件
│           ├── ModelCard.js
│           ├── ModelGrid.js
│           ├── ModelDetail.js
│           ├── BatchActions.js
│           ├── DownloadModal.js
│           ├── MoveModal.js
│           └── ImportExportModal.js
├── environment.yml            # Conda 環境設定
└── README.md
```

## API 參考

### 模型 API

| 方法 | 端點 | 說明 |
|------|-------|------|
| GET | `/api/models` | 列出模型（分頁、篩選、排序）|
| GET | `/api/models/{id}` | 取得模型詳情 |
| POST | `/api/models/scan` | 掃描目錄建立模型索引 |
| PATCH | `/api/models/{id}` | 更新模型中繼資料 |
| DELETE | `/api/models/{id}` | 從資料庫移除 |
| POST | `/api/models/move` | 搬移模型檔案 |
| POST | `/api/models/rename` | 重新命名模型檔案 |

### 標籤 API

| 方法 | 端點 | 說明 |
|------|-------|------|
| GET | `/api/tags` | 列出所有標籤 |
| POST | `/api/tags` | 建立標籤 |
| POST | `/api/tags/model` | 更新模型標籤 |

### Civitai 代理 API

| 方法 | 端點 | 說明 |
|------|-------|------|
| GET | `/api/civitai/models/search` | 搜尋 Civitai 模型 |
| GET | `/api/civitai/models/{id}` | 取得 Civitai 模型資訊 |
| POST | `/api/civitai/download` | 下載模型 |
| GET | `/api/civitai/models/by-hash/{hash}` | 以雜湊值查詢模型 |
| POST | `/api/civitai/models/{id}/hash-and-link` | 計算本地檔案雜湊並連結 Civitai |

### 匯入匯出 API

| 方法 | 端點 | 說明 |
|------|-------|------|
| POST | `/api/import/from-info` | 解析 .info 檔案 |
| POST | `/api/import/bind-file` | 綁定已存在的檔案 |
| POST | `/api/import/export/json` | 匯出資料庫 |
| POST | `/api/import/import/json` | 匯入資料庫 |
| POST | `/api/import/batch-hash` | 批次計算雜湊值 |
| POST | `/api/import/blur` | 模糊處理圖片（NSFW）|

## 資料庫 Schema

```sql
-- models: 核心模型中繼資料
CREATE TABLE models (
    id TEXT PRIMARY KEY,        -- UUID
    name TEXT NOT NULL,         -- 顯示名稱
    file_path TEXT NOT NULL,    -- 實體檔案路徑
    file_size INTEGER,          -- 檔案大小（位元組）
    sha256 TEXT,               -- SHA256 雜湊值
    md5 TEXT,                  -- MD5 雜湊值
    model_type TEXT,           -- checkpoint/vae/lora/hypernet/embedding/other
    civitai_id INTEGER,        -- Civitai 模型 ID
    civitai_url TEXT,          -- Civitai 網址
    preview_url TEXT,           -- 預覽圖 URL
    description TEXT,           -- 模型描述/prompts
    nsfw INTEGER DEFAULT 0,    -- NSFW 標記
    created_at INTEGER,          -- Unix 時間戳記
    updated_at INTEGER
);

-- tags: 使用者定義的標籤
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- model_tags: 多對多關聯
CREATE TABLE model_tags (
    model_id TEXT,
    tag_id INTEGER,
    PRIMARY KEY (model_id, tag_id)
);

-- settings: 應用程式設定
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
```

## 模型類型

| 類型 | 副檔名 | 說明 |
|------|--------|------|
| checkpoint | .ckpt, .safetensors | 基礎模型/合併模型 |
| vae | .vae.pt, .vae.safetensors | VAE 模型 |
| lora | .pt, .safetensors, .ckpt | LoRA 適配器 |
| hypernet | .pth | HyperNetwork 擴充 |
| embedding | .pt, .bin | Textual Inversion 嵌入檔 |
| other | 任意 | 未分類檔案 |

## 設定面板

設定儲存於 SQLite 並跨工作階段持久化：

- `theme` - UI 主題（dark/light）
- `nsfw_blur` - 自動模糊 NSFW 內容
- `auto_preview` - 自動下載預覽圖
- `resize_preview` - 將預覽圖縮圖至 512x512
- `model_root_path` - 預設掃描目錄
- `default_paths` - 各類型預設下載路徑

## 開發指南

### 執行測試

```bash
# 所有測試
python -m pytest server/tests -v

# 單一測試檔案
python -m pytest server/tests/test_hash.py -v

# 單一測試案例
python -m pytest server/tests/test_hash.py::test_compute_sha256 -v
```

### 程式碼品質

- 提交前格式化程式碼
- 為新功能撰寫測試
- I/O 作業使用 async/await
- 從 worktree 執行 pytest 時需設定 PYTHONPATH

### Git 工作流程

```bash
# 為功能建立 worktree
git worktree add .worktrees/功能名稱 -b feature/功能名稱

# 完成後合併回 main
git checkout main
git merge feature/功能名稱 --no-ff
git push origin main
```

## 架構筆記

### 為何前端放在 /app 路徑？

FastAPI 的 StaticFiles 掛載於根路徑 `/` 時會攔截所有路徑包括 `/api/*`，導致 404 錯誤。前端改為服務於 `/app` 避免與 API 路徑衝突。

### 非同步雜湊計算

大型模型檔案（數 GB）使用 `asyncio` + `aiofiles` 串流處理避免記憶體溢出：

```python
async for chunk in response.itr_bytes(chunk_size=CHUNK_SIZE):
    sha256_hash.update(chunk)
```

### 虛擬滾動

前端使用 Intersection Observer 實作高效渲染大量模型列表，僅渲染可見區域的卡片。

### Civitai API 代理

瀏覽器 CORS 限制阻擋直接呼叫 Civitai API，後端代理請求以實現搜尋和下載功能。

## 授權

MIT

## 貢獻方式

1. Fork 本專案
2. 使用 worktree 建立功能分支
3. 以 TDD 方式開發（先寫測試）
4. 確保所有 47 項測試通過
5. 提交含清楚說明的 Pull Request
