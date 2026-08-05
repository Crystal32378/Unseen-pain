/**
 * ============================================================
 * 看不見的痛｜神經痛就醫導航
 * Apps Script — 01_InitSheet.gs
 * ============================================================
 *
 * 功能：自動建立 Google Sheet 資料庫結構（5 個工作表 + 欄位 + 格式）
 *
 * 使用方式：
 * 1. 在 Google Sheets 中建立新的試算表
 * 2. 拓展 > Apps Script
 * 3. 將本檔案內容貼入 Code.gs（或新增檔案）
 * 4. 執行 setupDatabase()
 * 5. 授權後即自動建立所有工作表與欄位
 *
 * ============================================================
 */

// ============ 設定區 ============
const SHEET_CONFIG = {
  FACILITIES: {
    headers: [
      'facility_id',
      'nhi_facility_code',
      'facility_name',
      'facility_type',
      'accreditation_type',
      'specialty_neurology',
      'specialty_rehabilitation',
      'specialty_codes_raw',
      'city',
      'district',
      'address',
      'phone',
      'official_service_items',
      'official_schedule_raw',
      'contract_start_date',
      'closed_or_terminated_date',
      'active_status',
      'official_source',
      'official_source_updated_at',
      'imported_at',
      'last_synced_at'
    ],
    colors: { tab: '#6B8CAE', header: '#E8EDF3' }
  },
  PLACE_LINKS: {
    headers: [
      'nhi_facility_code',
      'google_place_id',
      'match_status',
      'match_confidence',
      'matched_name',
      'matched_address',
      'manually_reviewed',
      'reviewed_at',
      'review_note'
    ],
    colors: { tab: '#8CAE6B', header: '#EDF3E8' }
  },
  VERIFIED_SERVICES: {
    headers: [
      'nhi_facility_code',
      'has_emg',
      'has_nerve_conduction_study',
      'has_physical_therapy',
      'has_electrotherapy',
      'same_day_rehabilitation_possible',
      'appointment_required',
      'service_source_type',
      'service_source_reference',
      'verification_status',
      'verified_at',
      'verified_by',
      'verification_note'
    ],
    colors: { tab: '#AE9B6B', header: '#F3F0E8' }
  },
  SYNC_LOG: {
    headers: [
      'run_id',
      'started_at',
      'completed_at',
      'source',
      'records_received',
      'records_created',
      'records_updated',
      'records_deactivated',
      'error_count',
      'error_message',
      'script_version'
    ],
    colors: { tab: '#9B6BAE', header: '#F0E8F3' }
  },
  CONTENT_CONFIG: {
    headers: ['key', 'value', 'updated_at'],
    colors: { tab: '#6BAEAE', header: '#E8F3F3' },
    initialData: [
      ['homepage_intro', '有些痛看不見傷口，也很難說清楚。它可能像針刺、火燒、觸電、螞蟻爬，也可能同時麻木又疼痛。當你不知道這算不算神經痛，也不知道該掛哪一科時，這裡可以幫你整理感受、找到就醫方向與附近院所。', new Date().toISOString()],
      ['medical_disclaimer', '本網站不提供醫療診斷、不推薦治療方案、不保證治癒。實際診斷與治療請由合格醫療人員評估。如有緊急情況，請立即撥打 119。', new Date().toISOString()],
      ['emergency_notice', '若出現突然無力、臉歪、說話困難、大小便控制異常等情況，請不要繼續只在網站上搜尋，請立即或儘快尋求專業醫療協助。', new Date().toISOString()],
      ['data_source_notice', '院所資料來源：衛福部中央健康保險署公開資料（醫事機構資料、診療科別明細）。', new Date().toISOString()],
      ['google_attribution_notice', '部分地圖、網站與營業資訊由 Google Maps 提供。實際科別、門診、檢查與復健服務，請於前往前向院所確認。', new Date().toISOString()],
      ['last_content_reviewed_at', new Date().toISOString()]
    ]
  }
};

const SCRIPT_VERSION = '1.1.0';

// ============ 主函式 ============

/**
 * 一鍵建立資料庫結構
 * 執行此函式即可建立所有工作表、欄位與初始資料
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let created = 0;
  let existing = 0;

  Logger.log('=== 開始建立資料庫結構 ===');

  Object.keys(SHEET_CONFIG).forEach(function(sheetName) {
    const config = SHEET_CONFIG[sheetName];
    let sheet = ss.getSheetByName(sheetName);

    if (sheet) {
      Logger.log('工作表已存在（保留）: ' + sheetName);
      existing++;
    } else {
      sheet = ss.insertSheet(sheetName);
      Logger.log('已建立工作表: ' + sheetName);
      created++;
    }

    // 設定分頁顏色
    sheet.setTabColor(config.colors.tab);

    // 寫入欄位標題
    const headerRange = sheet.getRange(1, 1, 1, config.headers.length);
    headerRange.setValues([config.headers]);

    // 格式化標題列
    headerRange
      .setBackground(config.colors.header)
      .setFontWeight('bold')
      .setFontSize(11)
      .setHorizontalAlignment('left');

    // 凍結第一列
    sheet.setFrozenRows(1);

    // 設定欄位寬度（依欄位名稱長度）
    config.headers.forEach(function(header, i) {
      const width = Math.max(100, Math.min(250, header.length * 12 + 20));
      sheet.setColumnWidth(i + 1, width);
    });

    // 寫入初始資料（CONTENT_CONFIG）
    if (config.initialData) {
      const dataRange = sheet.getRange(2, 1, config.initialData.length, config.initialData.length > 0 ? config.initialData[0].length : 1);
      dataRange.setValues(config.initialData);
      Logger.log('  已寫入初始資料: ' + config.initialData.length + ' 筆');
    }
  });

  // 建立 SYNC_LOG 初始紀錄
  logSyncRun('setup', 'init', 0, 0, 0, 0, '資料庫結構初始化完成');

  Logger.log('=== 完成 ===');
  Logger.log('新建: ' + created + ' 個工作表');
  Logger.log('保留: ' + existing + ' 個已存在工作表');
  Logger.log('請至試算表查看結果。');
}

/**
 * 檢查資料庫結構完整性
 */
function verifyDatabaseStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const issues = [];

  Object.keys(SHEET_CONFIG).forEach(function(sheetName) {
    const config = SHEET_CONFIG[sheetName];
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      issues.push('缺少工作表: ' + sheetName);
      return;
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const expectedHeaders = config.headers;

    expectedHeaders.forEach(function(expected, i) {
      if (headers[i] !== expected) {
        issues.push(sheetName + ' 欄位 ' + (i + 1) + ' 應為 "' + expected + '"，實際為 "' + headers[i] + '"');
      }
    });
  });

  if (issues.length === 0) {
    Logger.log('✓ 資料庫結構完整，所有工作表與欄位皆正確。');
  } else {
    Logger.log('✗ 發現 ' + issues.length + ' 個問題：');
    issues.forEach(function(issue) { Logger.log('  - ' + issue); });
  }

  return issues;
}

// ============ 輔助函式 ============

/**
 * 取得指定工作表的資料（轉為物件陣列）
 */
function getSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('工作表不存在: ' + sheetName);

  const config = SHEET_CONFIG[sheetName];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, config.headers.length).getValues();
  const headers = config.headers;

  return data.map(function(row) {
    const obj = {};
    headers.forEach(function(header, i) {
      obj[header] = row[i];
    });
    return obj;
  });
}

/**
 * 寫入 SYNC_LOG
 */
function logSyncRun(runId, source, received, created, updated, deactivated, errorMsg) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('SYNC_LOG');
  if (!sheet) return;

  const now = new Date();
  const errorCount = errorMsg ? 1 : 0;

  sheet.appendRow([
    runId,
    now,               // started_at
    now,               // completed_at
    source,
    received || 0,
    created || 0,
    updated || 0,
    deactivated || 0,
    errorCount,
    errorMsg || '',
    SCRIPT_VERSION
  ]);
}

/**
 * 建立備份（複製整個試算表）
 */
function createBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss');
  const backupName = '備份_' + ss.getName() + '_' + timestamp;

  const backupFile = DriveApp.getFileById(ss.getId()).makeCopy(backupName);
  Logger.log('已建立備份: ' + backupName);
  Logger.log('備份連結: ' + backupFile.getUrl());
  return backupFile.getUrl();
}

/**
 * 顯示管理儀表板資訊
 */
function showDashboard() {
  const facilities = getSheetData('FACILITIES');
  const activeFacilities = facilities.filter(function(f) { return f.active_status === 'active'; });
  const neurologyCount = activeFacilities.filter(function(f) { return f.specialty_neurology === true; }).length;
  const rehabCount = activeFacilities.filter(function(f) { return f.specialty_rehabilitation === true; }).length;

  const placeLinks = getSheetData('PLACE_LINKS');
  const unmatched = placeLinks.filter(function(p) { return p.match_status !== 'matched'; }).length;
  const pendingReview = placeLinks.filter(function(p) { return p.match_status === 'pending'; }).length;

  const verifiedServices = getSheetData('VERIFIED_SERVICES');

  const syncLogs = getSheetData('SYNC_LOG');
  const lastSync = syncLogs.length > 0 ? syncLogs[syncLogs.length - 1] : null;
  const syncErrors = syncLogs.filter(function(l) { return l.error_count > 0; }).length;

  Logger.log('=== 管理儀表板 ===');
  Logger.log('最後同步時間: ' + (lastSync ? lastSync.completed_at : '無'));
  Logger.log('院所總數: ' + facilities.length + '（其中活躍: ' + activeFacilities.length + '）');
  Logger.log('神經科院所: ' + neurologyCount);
  Logger.log('復健科院所: ' + rehabCount);
  Logger.log('未匹配 Google Place ID: ' + unmatched);
  Logger.log('待人工確認匹配: ' + pendingReview);
  Logger.log('已查證進階服務院所: ' + verifiedServices.length);
  Logger.log('同步錯誤紀錄數: ' + syncErrors);
}

/**
 * 建立每週同步觸發器
 */
function setupWeeklyTrigger() {
  // 先清除既有觸發器
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === 'runWeeklySync') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // 每週一凌晨 3 點執行
  ScriptApp.newTrigger('runWeeklySync')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(3)
    .create();

  Logger.log('已建立每週一凌晨 3 點的同步觸發器');
}

/**
 * 手動觸發同步（供管理介面使用）
 */
function runWeeklySync() {
  Logger.log('=== 開始每週同步 ===');
  try {
    syncNhiData();
    Logger.log('=== 同步完成 ===');
  } catch (e) {
    Logger.log('同步失敗: ' + e.message);
    logSyncRun('weekly_' + Date.now(), 'trigger', 0, 0, 0, 0, e.message);
  }
}
