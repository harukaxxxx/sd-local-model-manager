優化版 PRD：Stable Diffusion 本地模型管理系統 (Web-Based Agent-Ready)
0. 給 AI Agent 的開發指引 (Agent Instructions)
核心目標：開發一款基於 B/S 架構（Browser/Server）的 Stable Diffusion 本地模型管理系統。

部署模式：Localhost 優先。後端服務運行在存放模型的實體機器上，前端透過瀏覽器（如 http://localhost:3000）進行存取與管理。

架構邊界原則（極度重要）：

前端 (Browser)：絕對不可使用 Node.js fs 模組或任何本地檔案路徑操作。僅負責 UI 渲染、狀態管理與發送 API 請求。

後端 (Server)：全權負責硬碟 I/O、大檔案 SHA256 Hash 計算（需使用 Worker Threads 或 Stream 避免阻塞）、SQLite 資料庫讀寫、以及對外發送請求（如下載模型或打 CivitAI API）。

通訊機制：一般操作使用 RESTful API；涉及長時間運行的任務（如 6GB 模型下載進度、目錄深度掃描進度）必須使用 WebSocket (Socket.io) 進行即時狀態推送。

1. 系統架構與技術棧 (Tech Stack)
前端 (Client)：Vue 3 (Composition API) + Vite + TypeScript + Tailwind CSS + Pinia

後端 (Server)：Node.js + Express (或 Fastify) + TypeScript

本地資料庫：sqlite3 或 better-sqlite3 + Prisma ORM

檔案系統：Node.js fs/promises 與 stream 模組

即時通訊：Socket.io

2. 核心 API 設計與通訊規範 (API & Communication Schema)
2.1 RESTful API 規劃 (部分核心)
GET /api/models：獲取本地資料庫中的模型列表（支援分頁與標籤過濾）。

POST /api/scan：觸發後端掃描指定的本地目錄。

POST /api/models/download：提交 CivitAI URL，後端解析並建立下載任務。

POST /api/models/:id/symlink：傳入目標目錄路徑，後端執行 fs.symlink 建立軟連結。

2.2 WebSocket 事件規劃 (Socket.io)
scan_progress：推送目錄掃描與 Hash 計算進度（例如：{ "status": "hashing", "file": "model.safetensors", "percent": 45 }）。

download_progress：推送模型下載的即時進度、速度與剩餘時間。

3. 核心資料結構 (Database Schema Definition)
(與先前版本結構相同，但由 Prisma 在後端端點進行管理)

Model 表：id, name, fileName, type, filePath, fileSize, sha256, civitaiId, createdAt

Tag 表：id, name

Model_Tag 關聯表：modelId, tagId

4. 功能需求落地邏輯 (Backend-Heavy Logic)
4.1 模型導入與掃描 (Directory Scanning & Hashing)
設定掛載點：用戶在網頁前端輸入本機的絕對路徑（例如 D:\AI\models），後端驗證路徑是否存在並寫入設定檔。

非同步 Hash 運算：後端掃描到新的 .safetensors 後，需開啟 Node.js 子執行緒計算 SHA256，計算完畢後透過 API 自動向 CivitAI 查詢 Metadata。

4.2 下載管理器 (Server-Side Downloader)
後端需實作一個下載管理器，支援 HTTP Range 請求以實現斷點續傳。

下載時直接寫入後端設定的目標硬碟目錄，並在完成後自動觸發資料庫更新與預覽圖抓取。

4.3 軟連結佈署 (Symlink Deployment)
解決硬碟空間焦慮的核心功能。網頁前端發送指令，後端負責在指定的目標資料夾（如 WebUI 的 models/Stable-diffusion 目錄）中建立原始檔案的 Symlink，實現「一處下載，多處使用」。

5. AI Agent 開發實施步驟 (Execution Roadmap)
Agent 請依序執行以下步驟，確保前後端分離開發：

Phase 1: 環境與資料庫初始化 (Backend) - 建立 Node.js Express 專案，設定 Prisma 與 SQLite，完成 Schema Migration。

Phase 2: 檔案掃描與 Hash 引擎 (Backend) - 實作本地目錄遍歷腳本，以及基於 Stream 的大檔案 SHA256 計算邏輯，並封裝成 API。

Phase 3: 基礎 API 與前端對接 (Frontend & Backend) - 建立 Vue 3 Vite 專案，實作 API 呼叫，完成模型列表的網格/列表 UI 渲染。

Phase 4: CivitAI 對接與中繼資料 (Backend) - 實作後端向 CivitAI 請求資料的邏輯，並將預覽圖下載到本地伺服器供前端讀取。

Phase 5: WebSocket 實作 (Fullstack) - 引入 Socket.io，打通後端掃描與下載任務到前端進度條的即時通訊。

Phase 6: 下載器與軟連結 (Fullstack) - 實作伺服器端斷點續傳下載機制，以及前端觸發軟連結的完整業務邏輯。