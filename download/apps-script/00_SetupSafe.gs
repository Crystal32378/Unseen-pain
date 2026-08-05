/**
 * 安全初始化工具。
 *
 * 與 01_InitSheet.gs 搭配使用，不覆寫既有工作表資料。
 * 第一次部署請優先執行 setupDatabaseSafe()，不要直接重跑會寫入初始內容的舊版 setupDatabase()。
 */
function setupDatabaseSafe() {
  if (typeof SHEET_CONFIG === 'undefined') {
    throw new Error('找不到 SHEET_CONFIG，請確認 01_InitSheet.gs 已加入同一個 Apps Script 專案。');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let created = 0;
  let preserved = 0;

  Logger.log('=== 安全建立資料庫結構 ===');

  Object.keys(SHEET_CONFIG).forEach(function(sheetName) {
    const config = SHEET_CONFIG[sheetName];
    let sheet = ss.getSheetByName(sheetName);
    const isNew = !sheet;

    if (isNew) {
      sheet = ss.insertSheet(sheetName);
      created++;
      Logger.log('已建立工作表: ' + sheetName);
    } else {
      preserved++;
      Logger.log('保留既有工作表: ' + sheetName);
    }

    if (sheet.getMaxColumns() < config.headers.length) {
      sheet.insertColumnsAfter(
        sheet.getMaxColumns(),
        config.headers.length - sheet.getMaxColumns()
      );
    }

    sheet.setTabColor(config.colors.tab);

    const headerRange = sheet.getRange(1, 1, 1, config.headers.length);
    headerRange
      .setValues([config.headers])
      .setBackground(config.colors.header)
      .setFontWeight('bold')
      .setFontSize(11)
      .setHorizontalAlignment('left');

    sheet.setFrozenRows(1);

    config.headers.forEach(function(header, index) {
      const width = Math.max(100, Math.min(250, header.length * 12 + 20));
      sheet.setColumnWidth(index + 1, width);
    });

    // 只在新工作表或完全沒有資料時建立 CONTENT_CONFIG 初始內容。
    if (config.initialData && sheet.getLastRow() < 2) {
      const normalizedRows = config.initialData.map(function(row) {
        const normalized = row.slice(0, config.headers.length);
        while (normalized.length < config.headers.length) normalized.push('');
        return normalized;
      });

      if (normalizedRows.length > 0) {
        sheet.getRange(2, 1, normalizedRows.length, config.headers.length)
          .setValues(normalizedRows);
        Logger.log('  已寫入初始資料: ' + normalizedRows.length + ' 筆');
      }
    }
  });

  if (typeof logSyncRun === 'function') {
    logSyncRun('setup_' + Date.now(), 'init_safe', 0, 0, 0, 0, null);
  }

  Logger.log('✅ 安全初始化完成');
  Logger.log('新建: ' + created + '；保留: ' + preserved);
}

function verifyDatabaseStructureSafe() {
  if (typeof SHEET_CONFIG === 'undefined') {
    throw new Error('找不到 SHEET_CONFIG。');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const issues = [];

  Object.keys(SHEET_CONFIG).forEach(function(sheetName) {
    const config = SHEET_CONFIG[sheetName];
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      issues.push('缺少工作表: ' + sheetName);
      return;
    }

    const actual = sheet.getRange(1, 1, 1, config.headers.length).getValues()[0];
    config.headers.forEach(function(expected, index) {
      if (actual[index] !== expected) {
        issues.push(
          sheetName + ' 第 ' + (index + 1) + ' 欄應為「' + expected +
          '」，實際為「' + actual[index] + '」'
        );
      }
    });
  });

  if (issues.length > 0) {
    Logger.log('✗ 發現 ' + issues.length + ' 個結構問題');
    issues.forEach(function(issue) { Logger.log('  - ' + issue); });
  } else {
    Logger.log('✅ 所有工作表與欄位結構正確');
  }

  return issues;
}
