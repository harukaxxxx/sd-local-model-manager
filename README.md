# 🧊 SD Local Model Manager

> 基於 B/S 架構的 **Stable Diffusion 本地模型管理系統**，一處下載，多處使用。

管理散落在硬碟各處的 AI 模型檔案，自動辨識模型資訊，透過 Symlink 實現零空間佔用的多 WebUI 部署。

---

## ✨ 功能特色

| 功能 | 說明 |
|------|------|
| 📂 **目錄掃描** | 遞迴掃描指定目錄，自動辨識 `.safetensors` / `.ckpt` / `.pt` 模型檔 |
| 🔐 **SHA256 Hash** | Stream-based 大檔案 Hash 計算，不阻塞主執行緒 |
| 🎨 **CivitAI 自動對接** | 透過 Hash 自動查詢 CivitAI API，取得模型名稱、標籤、預覽圖 |
| ⬇️ **斷點續傳下載** | HTTP Range 支援，中斷後可從斷點繼續，即時速度/ETA 顯示 |
| 🔗 **Symlink 部署** | 一鍵建立軟連結到 WebUI 目錄，一處下載多處使用，不重複佔用空間 |
| 📡 **WebSocket 即時推送** | 掃描/下載進度透過 Socket.io 即時推送到前端 |
| 🌙 **深色主題 UI** | Glassmorphism 風格、Grid/List 切換、搜尋過濾、分頁 |

---

## 🛠️ 技術棧

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **ORM**: Prisma + SQLite
- **即時通訊**: Socket.io
- **檔案處理**: Node.js `fs/promises` + `stream` + `crypto`

### Frontend
- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **狀態管理**: Pinia
- **路由**: Vue Router
- **樣式**: Tailwind CSS 4
- **HTTP Client**: Axios
- **WebSocket**: Socket.io Client

---

## 🚀 快速開始

### 前置需求

- [Node.js](https://nodejs.org/) >= 18
- npm >= 9

### 安裝

```bash
# Clone
git clone https://github.com/your-username/sd-local-model-manager.git
cd sd-local-model-manager

# 安裝後端依賴
cd server
npm install

# 初始化資料庫
npx prisma migrate dev --name init

# 安裝前端依賴
cd ../client
npm install
```

### 啟動

需要同時啟動前後端（兩個終端機）：

```bash
# Terminal 1 - 後端 (port 3001)
cd server
npm run dev

# Terminal 2 - 前端 (port 5173)
cd client
npm run dev
```

開啟瀏覽器前往 **http://localhost:5173**

---

## 📖 使用流程

### 1. 設定掃描路徑

前往 **設定** 頁面，新增模型檔案所在的目錄路徑，並選擇模型類型（Checkpoint / LoRA / VAE / Embedding）。

### 2. 掃描模型

回到首頁，點擊 **掃描** 按鈕。系統將：
1. 遞迴掃描所有設定的目錄
2. 使用 Stream 計算每個模型的 SHA256 Hash
3. 透過 Hash 自動向 CivitAI 查詢模型資訊
4. 下載預覽圖到本地

全程可在頂部進度條觀看即時進度。

### 3. 瀏覽與管理

- 支援 **Grid / List** 兩種檢視模式
- 透過搜尋框、類型過濾器快速找到模型
- 點擊模型卡片查看詳細資訊

### 4. 建立 Symlink

在模型詳情頁點擊 **建立 Symlink**，輸入目標目錄（例如 WebUI 的 `models/Stable-diffusion` 資料夾），即可建立軟連結。

```
原始檔案: D:\AI\models\my-model.safetensors
Symlink:  D:\stable-diffusion-webui\models\Stable-diffusion\my-model.safetensors
```

> **Windows 注意事項**：Symlink 建立需要管理員權限，或啟用 Windows 開發者模式。若權限不足，系統會自動 fallback 到 Hard Link（僅限同磁碟）。

### 5. 下載模型

透過 API 提交 CivitAI 下載連結，系統將：
- 自動解析檔名
- 支援斷點續傳
- 即時推送下載速度與 ETA
- 下載完成後自動 Hash → CivitAI 查詢 → 入庫

---

## 📡 API 參考

### Models

| Method | Endpoint | 說明 |
|--------|----------|------|
| `GET` | `/api/models` | 模型列表（支援 `page`, `limit`, `type`, `tag`, `search`） |
| `GET` | `/api/models/:id` | 模型詳情 |
| `DELETE` | `/api/models/:id` | 從資料庫移除模型（不刪檔案） |

### Scan

| Method | Endpoint | 說明 |
|--------|----------|------|
| `POST` | `/api/scan` | 觸發掃描（可選 `pathId` 指定掃描路徑） |

### Settings

| Method | Endpoint | 說明 |
|--------|----------|------|
| `GET` | `/api/settings/scan-paths` | 取得掃描路徑列表 |
| `POST` | `/api/settings/scan-paths` | 新增掃描路徑（`path`, `modelType`） |
| `DELETE` | `/api/settings/scan-paths/:id` | 刪除掃描路徑 |

### Download

| Method | Endpoint | 說明 |
|--------|----------|------|
| `POST` | `/api/models/download` | 提交下載（`url`, `targetDir`, `modelType`） |
| `POST` | `/api/models/download/:taskId/pause` | 暫停下載 |
| `GET` | `/api/models/download/tasks` | 取得所有下載任務狀態 |

### Symlink

| Method | Endpoint | 說明 |
|--------|----------|------|
| `POST` | `/api/models/:id/symlink` | 建立 Symlink（`targetDir`） |

### WebSocket Events

| Event | 方向 | 說明 |
|-------|------|------|
| `scan_progress` | Server → Client | 掃描進度（status, file, percent, current, total） |
| `download_progress` | Server → Client | 下載進度（taskId, percent, speed, eta） |

---

## 📁 專案結構

```
sd-local-model-manager/
├── server/                          # Express 後端
│   ├── prisma/
│   │   └── schema.prisma           # DB Schema (Model, Tag, ScanPath)
│   └── src/
│       ├── index.ts                 # 伺服器入口
│       ├── lib/
│       │   ├── prisma.ts            # Prisma Client
│       │   └── config.ts            # 系統設定
│       ├── routes/
│       │   ├── models.ts            # 模型 CRUD API
│       │   ├── scan.ts              # 掃描 API
│       │   ├── settings.ts          # 設定 API
│       │   ├── download.ts          # 下載 API
│       │   └── symlink.ts           # Symlink API
│       ├── services/
│       │   ├── scanner.ts           # 目錄掃描引擎
│       │   ├── hasher.ts            # SHA256 Hash
│       │   ├── civitai.ts           # CivitAI API
│       │   ├── downloader.ts        # 斷點續傳下載器
│       │   └── symlink.ts           # Symlink 管理
│       └── websocket/
│           └── index.ts             # Socket.io 管理
├── client/                          # Vue 3 前端
│   ├── src/
│   │   ├── main.ts                  # App 入口
│   │   ├── App.vue                  # Root component
│   │   ├── router.ts                # Vue Router
│   │   ├── style.css                # Tailwind + Design tokens
│   │   ├── api/
│   │   │   └── index.ts             # API Client + Types
│   │   ├── stores/
│   │   │   ├── models.ts            # 模型狀態管理
│   │   │   └── socket.ts            # WebSocket 狀態
│   │   ├── components/
│   │   │   ├── ModelCard.vue         # Grid 模型卡片
│   │   │   ├── ModelListItem.vue     # List 模型項目
│   │   │   └── ScanProgressBar.vue   # 全局掃描進度
│   │   └── views/
│   │       ├── HomeView.vue          # 模型列表主頁
│   │       ├── ModelDetail.vue       # 模型詳情
│   │       └── SettingsView.vue      # 掃描路徑設定
│   └── vite.config.ts               # Vite + API Proxy
└── PRD.md                           # 產品需求文件
```

---

## 📋 資料庫 Schema

```
Model
├── id            Int (PK)
├── name          String
├── fileName      String
├── type          String        (Checkpoint / LoRA / VAE / Embedding)
├── filePath      String        (Unique, 絕對路徑)
├── fileSize      BigInt
├── sha256        String?
├── civitaiId     Int?          (CivitAI version ID)
├── civitaiModelId Int?         (CivitAI model ID)
├── baseModel     String?       (SD 1.5 / SDXL / ...)
├── description   String?
├── previewUrl    String?       (本地預覽圖路徑)
├── createdAt     DateTime
├── updatedAt     DateTime
└── tags          ModelTag[]

Tag
├── id            Int (PK)
├── name          String (Unique)
└── models        ModelTag[]

ScanPath
├── id            Int (PK)
├── path          String (Unique)
├── modelType     String
└── createdAt     DateTime
```

---

## 🔧 環境變數

```env
# server/.env
DATABASE_URL="file:./dev.db"
PORT=3001
```

---

## 📄 License

MIT
