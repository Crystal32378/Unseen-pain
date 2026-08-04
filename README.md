# 看不見的痛｜神經痛就醫導航

協助使用者整理疼痛描述、理解就醫方向，並找到神經內科與復健科的就醫入口。

## 目前狀態

- Next.js 預覽介面已整理在 `src/`。
- 院所搜尋預覽目前使用 `src/lib/mockData.ts`，不代表已完成健保署資料同步或現況查證。
- Google Apps Script 生產草稿與部署文件位於 `download/`。
- 這個 repository 不應包含 `.env`、API key、患者症狀、定位資料或本機 SQLite 資料庫。

## 開發

```bash
npm install
npm run lint
npm run build
```

需要本機資料庫時，請先複製 `.env.example` 為 `.env`，並只使用本機測試值。

## 文件

- [交付與架構說明](download/docs/README.md)
- [部署指南](download/docs/deployment-guide.md)
- [Crystal 操作清單](download/docs/crystal-checklist.md)

本專案不提供醫療診斷；實際診斷、檢查與治療請由合格醫療人員評估。
