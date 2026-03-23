## 計畫總覽

| 計畫 | 檔案 | Tasks | 修正重點 |
|------|------|-------|----------|
| 1. Backend Core | `backend-core.md` | 7 tasks | `scanned`/`added` 分開計算、`compute_md5` 錯誤、`conftest` 共享 fixture、`list_models` 支援 `tag` 篩選與 `sort` 欄位驗證 |
| 2. Civitai Integration | `civitai-integration.md` | 6 tasks | 修正硬編碼預覽圖 URL、GDrive streaming 下載實作、`compute_hashes` 串接 `get_model_info` 取得真實預覽圖 |
| 3. Frontend Foundation | `frontend-foundation.md` | 8 tasks | Tag 篩選完整實作（點擊過濾 + API 傳參）、Settings 改用 backend API 持久化、`main.js` `loadModels()` 正確傳遞篩選參數 |
| 4. Frontend Browse & Settings | `frontend-browse-settings.md` | 6 tasks | Settings Panel 完整程式碼（含 NSFW blur、各類型下載路徑、模型根目錄）、DownloadModal 整合進 `main.js` 的具體步驟 |
| 5. Import/Export & Polish | `import-export-polish.md` | 7 tasks | 新增 `POST /api/models/move` + `rename` 端點、修正 `compute_hashes` import、Polish CSS 完整內容 |

## 依賴關係提醒

```
Plan 1 (Backend Core) ──┬──► Plan 2 (Civitai)
                       └──► Plan 3 (Frontend Foundation) ──► Plan 4 (Browse & Settings)
                                                        └──► Plan 5 (Import/Export & Polish)
```

## 執行方式

每個計畫都可使用 **subagent-driven** 或 **inline execution** 模式執行。
