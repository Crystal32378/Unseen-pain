/**
 * ============================================================
 * 看不見的痛｜神經痛就醫導航
 * Apps Script — 02_SyncNHI.gs
 * ============================================================
 *
 * 功能：匯入與同步健保署公開資料
 *
 * 資料來源：
 *   - 健保特約醫事機構資料（醫院、診所）
 *   - 醫療院所診療科別明細
 *   - 診療科別代碼對照檔
 *
 * 健保署開放資料平台：https://data.nhi.gov.tw/
 *
 * ============================================================
 */

// ============ 設定區 ============

const NHI_CONFIG = {
  // 健保署開放資料 API 端點（CSV 格式）
  // 實際部署時請確認最新網址
  FACILITY_API: 'https://data.nhi.gov.tw/Datasets/Download.ashx?rid=A21030000I-D50001-001',
  HOSPITAL_API: 'https://data.nhi.gov.tw/Datasets/Download.ashx?rid=A21030000I-D50001-002',
  DEPARTMENT_API: 'https://data.nhi.gov.tw/Datasets/Download.ashx?rid=A21030000I-D21001-001',
  DEPT_CODE_API: 'https://data.nhi.gov.tw/Datasets/Download.ashx?rid=A21030000I-D21002-001',

  // 神經相關科別代碼（需對照健保署科別代碼檔）
  // 常見代碼（實際代碼以健保署公布為準）：
  //   11 = 神經科 / 神經內科
  //   12 = 神經外科
  //   13 = 復健科 / 物理醫學與復健科
  NEUROLOGY_CODES: ['11', '1A', '60'],       // 神經內科相關
  REHABILITATION_CODES: ['13', '1B', '8B'],  // 復健科相關

  // 醫院層級
  ACCREDITATION_MAP: {
    '醫學中心': 'medical_center',
    '區域醫院': 'regional_hospital',
    '地區醫院': 'district_hospital',
    '診所': 'clinic'
  },

  MAX_RECORDS: 50000,  // 單次最多處理筆數（安全上限）
  BATCH_SIZE: 500       // 批次寫入大小
};

// ============ 主同步函式 ============

/**
 * 主同步入口 — 匯入健保署資料
 */
function syncNhiData() {
  const runId = 'sync_' + Date.now();
  const startTime = new Date();

  Logger.log('=== 開始同步健保署資料 ===');
  Logger.log('Run ID: ' + runId);
  Logger.log('開始時間: ' + startTime);

  try {
    // 1. 建立備份
    Logger.log('步驟 1: 建立備份...');
    // createBackup(); // 視需求啟用，避免備份過多

    // 2. 下載資料
    Logger.log('步驟 2: 下載院所基本資料...');
    const facilities = downloadAndParseFacilities();

    Logger.log('步驟 3: 下載科別明細...');
    const departments = downloadAndParseDepartments();

    Logger.log('步驟 4: 下載科別代碼對照...');
    const deptCodes = downloadAndParseDeptCodes();

    // 3. 合併與篩選
    Logger.log('步驟 5: 合併院所與科別資料...');
    const merged = mergeFacilityAndDepartments(facilities, departments, deptCodes);

    Logger.log('步驟 6: 篩選神經科與復健科...');
    const filtered = filterNeuroAndRehab(merged);

    Logger.log('步驟 7: 去除歇業與終止合約院所...');
    const active = filterActiveFacilities(filtered);

    Logger.log('篩選結果: ' + active.length + ' 間活躍院所（含神經科或復健科）');

    // 4. 寫入 Sheet（使用 upsert 邏輯）
    Logger.log('步驟 8: 寫入 FACILITIES 工作表...');
    const result = upsertFacilities(active);

    // 5. 記錄同步結果
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;

    Logger.log('=== 同步完成 ===');
    Logger.log('耗時: ' + duration + ' 秒');
    Logger.log('接收: ' + result.received + ' 筆');
    Logger.log('新增: ' + result.created + ' 筆');
    Logger.log('更新: ' + result.updated + ' 筆');
    Logger.log('停用: ' + result.deactivated + ' 筆');

    logSyncRun(runId, 'nhi_public_data', result.received, result.created, result.updated, result.deactivated, null);

    return result;

  } catch (e) {
    Logger.log('!!! 同步失敗 !!!');
    Logger.log('錯誤: ' + e.message);
    Logger.log('堆疊: ' + e.stack);

    logSyncRun(runId, 'nhi_public_data', 0, 0, 0, 0, e.message);

    // 發送錯誤通知（可選）
    // notifySyncError(e.message);

    throw e;
  }
}

// ============ 資料下載與解析 ============

/**
 * 下載並解析院所基本資料（CSV）
 */
function downloadAndParseFacilities() {
  const response = fetchWithRetry(NHI_CONFIG.FACILITY_API, 3);
  const csvText = response.getContentText('UTF-8');

  // 健保署 CSV 通常為 Big5 或 UTF-8 編碼
  // 若為 Big5：
  // const csvText = Utilities.newBlob(response.getContent()).setDataFromString(response.getContent(), 'Big5').getDataAsString();

  const rows = parseCSV(csvText);

  if (rows.length < 2) {
    throw new Error('院所資料為空或格式錯誤');
  }

  const headers = rows[0];
  const data = rows.slice(1, NHI_CONFIG.MAX_RECORDS + 1).map(function(row) {
    const obj = {};
    headers.forEach(function(h, i) {
      obj[h] = row[i] || '';
    });
    return obj;
  });

  Logger.log('下載院所資料: ' + data.length + ' 筆');
  return data;
}

/**
 * 下載並解析診療科別明細
 */
function downloadAndParseDepartments() {
  const response = fetchWithRetry(NHI_CONFIG.DEPARTMENT_API, 3);
  const csvText = response.getContentText('UTF-8');
  const rows = parseCSV(csvText);

  if (rows.length < 2) {
    Logger.log('警告: 科別明細為空');
    return [];
  }

  const headers = rows[0];
  const data = rows.slice(1).map(function(row) {
    const obj = {};
    headers.forEach(function(h, i) {
      obj[h] = row[i] || '';
    });
    return obj;
  });

  Logger.log('下載科別明細: ' + data.length + ' 筆');
  return data;
}

/**
 * 下載並解析科別代碼對照檔
 */
function downloadAndParseDeptCodes() {
  try {
    const response = fetchWithRetry(NHI_CONFIG.DEPT_CODE_API, 3);
    const csvText = response.getContentText('UTF-8');
    const rows = parseCSV(csvText);

    if (rows.length < 2) return {};

    const headers = rows[0];
    const codeMap = {};

    rows.slice(1).forEach(function(row) {
      const obj = {};
      headers.forEach(function(h, i) {
        obj[h] = row[i] || '';
      });
      // 以科別代碼為 key，科別名稱為 value
      const code = obj['科別代碼'] || obj['DEPT_CODE'] || '';
      const name = obj['科別名稱'] || obj['DEPT_NAME'] || '';
      if (code) codeMap[code] = name;
    });

    Logger.log('下載科別代碼: ' + Object.keys(codeMap).length + ' 個');
    return codeMap;
  } catch (e) {
    Logger.log('科別代碼下載失敗，使用預設對照: ' + e.message);
    return getDefaultDeptCodes();
  }
}

/**
 * 預設科別代碼對照（備用）
 */
function getDefaultDeptCodes() {
  return {
    '11': '神經科', '1A': '神經內科', '60': '神經內科',
    '12': '神經外科', '13': '復健科', '1B': '復健科', '8B': '物理治療',
    '01': '家醫科', '02': '內科', '22': '骨科',
    '40': '中醫一般科', '50': '牙科'
  };
}

// ============ 資料合併與篩選 ============

/**
 * 合併院所基本資料與科別明細
 */
function mergeFacilityAndDepartments(facilities, departments, deptCodes) {
  // 以醫事機構代碼為 key，將科別明細分組
  const deptByFacility = {};
  departments.forEach(function(dept) {
    const code = dept['醫事機構代碼'] || dept['機構代碼'] || '';
    if (!code) return;
    if (!deptByFacility[code]) deptByFacility[code] = [];
    deptByFacility[code].push(dept);
  });

  // 合併
  const merged = facilities.map(function(fac) {
    const facCode = fac['醫事機構代碼'] || fac['機構代碼'] || '';
    const facDepts = deptByFacility[facCode] || [];

    // 收集所有科別代碼與名稱
    const deptCodesRaw = facDepts.map(function(d) {
      return d['科別代碼'] || d['DEPT_CODE'] || '';
    }).filter(function(c) { return c; });

    const deptNamesRaw = deptCodesRaw.map(function(code) {
      return deptCodes[code] || code;
    });

    return {
      nhi_facility_code: facCode,
      facility_name: fac['醫事機構名稱'] || fac['機構名稱'] || '',
      facility_type: determineFacilityType(fac),
      accreditation_type: fac['特約類別'] || fac['醫院評鑑等級'] || '',
      specialty_codes_raw: deptNamesRaw.join(','),
      address: fac['醫事機構地址'] || fac['地址'] || '',
      phone: fac['醫事機構電話'] || fac['電話'] || '',
      official_service_items: fac['服務項目'] || '',
      official_schedule_raw: fac['固定看診時段'] || fac['診療時段'] || '',
      contract_start_date: fac['合約起始日期'] || fac['特約日期'] || '',
      closed_or_terminated_date: fac['歇業日期'] || fac['終止合約日期'] || '',
      active_status: determineActiveStatus(fac),
      official_source: '健保署醫事機構資料',
      official_source_updated_at: Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd')
    };
  });

  Logger.log('合併完成: ' + merged.length + ' 筆');
  return merged;
}

/**
 * 篩選含神經科或復健科的院所
 */
function filterNeuroAndRehab(facilities) {
  return facilities.filter(function(fac) {
    const codes = fac.specialty_codes_raw.toLowerCase();
    const hasNeurology = NHI_CONFIG.NEUROLOGY_CODES.some(function(code) {
      return codes.includes(code);
    }) || codes.includes('神經');

    const hasRehab = NHI_CONFIG.REHABILITATION_CODES.some(function(code) {
      return codes.includes(code);
    }) || codes.includes('復健');

    fac.specialty_neurology = hasNeurology;
    fac.specialty_rehabilitation = hasRehab;

    return hasNeurology || hasRehab;
  });
}

/**
 * 篩選活躍院所（排除歇業、終止合約）
 */
function filterActiveFacilities(facilities) {
  return facilities.filter(function(fac) {
    // 已有 active_status 判定
    if (fac.active_status !== 'active') return false;

    // 額外檢查歇業日期
    if (fac.closed_or_terminated_date && fac.closed_or_terminated_date.trim() !== '') {
      fac.active_status = 'inactive';
      return false;
    }

    return true;
  });
}

/**
 * 判定院所類型
 */
function determineFacilityType(fac) {
  const accType = (fac['醫院評鑑等級'] || fac['特約類別'] || '').toString();

  for (var key in NHI_CONFIG.ACCREDITATION_MAP) {
    if (accType.includes(key)) {
      return NHI_CONFIG.ACCREDITATION_MAP[key];
    }
  }

  // 預設為診所
  return 'clinic';
}

/**
 * 判定活躍狀態
 */
function determineActiveStatus(fac) {
  const status = (fac['狀態'] || fac['業務狀況'] || '').toString();
  if (status.includes('歇業') || status.includes('終止') || status.includes('停業')) {
    return 'inactive';
  }
  return 'active';
}

// ============ 寫入 Sheet（Upsert）============

/**
 * Upsert 院所資料到 FACILITIES 工作表
 * 使用醫事機構代碼作為主鍵
 */
function upsertFacilities(newData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('FACILITIES');
  const headers = SHEET_CONFIG.FACILITIES.headers;

  // 讀取現有資料
  const existingData = getSheetData('FACILITIES');
  const existingMap = {};
  existingData.forEach(function(f) {
    if (f.nhi_facility_code) existingMap[f.nhi_facility_code] = f;
  });

  // 準備寫入資料
  const now = new Date().toISOString();
  const rowsToWrite = [];
  let created = 0;
  let updated = 0;
  let received = newData.length;

  // 去重：以醫事機構代碼 + 名稱 + 地址 + 電話 為依據
  const seenKeys = {};

  newData.forEach(function(fac) {
    // 去重檢查
    const dedupKey = fac.nhi_facility_code + '|' + fac.facility_name + '|' + fac.address + '|' + fac.phone;
    if (seenKeys[dedupKey]) return;
    seenKeys[dedupKey] = true;

    // 解析地址：城市與行政區
    const parsed = parseAddress(fac.address);
    fac.city = parsed.city;
    fac.district = parsed.district;

    const existing = existingMap[fac.nhi_facility_code];

    if (existing) {
      // 更新
      updated++;
      fac.facility_id = existing.facility_id;
      fac.imported_at = existing.imported_at;
      fac.last_synced_at = now;
    } else {
      // 新增
      created++;
      fac.facility_id = 'F' + String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      fac.imported_at = now;
      fac.last_synced_at = now;
    }

    // 組裝 row（依 headers 順序）
    const row = headers.map(function(h) {
      return fac[h] !== undefined ? fac[h] : '';
    });
    rowsToWrite.push(row);
  });

  // 批次寫入
  if (rowsToWrite.length > 0) {
    // 先清除舊資料（保留標題列）
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
    }

    // 分批寫入
    for (var i = 0; i < rowsToWrite.length; i += NHI_CONFIG.BATCH_SIZE) {
      var batch = rowsToWrite.slice(i, i + NHI_CONFIG.BATCH_SIZE);
      sheet.getRange(i + 2, 1, batch.length, headers.length).setValues(batch);
    }
  }

  // 標記已消失的院所為 inactive（不刪除）
  const newCodes = {};
  newData.forEach(function(f) { newCodes[f.nhi_facility_code] = true; });

  let deactivated = 0;
  existingData.forEach(function(f) {
    if (!newCodes[f.nhi_facility_code] && f.active_status === 'active') {
      // 標記為 inactive
      const row = findRowByFacilityCode(sheet, f.nhi_facility_code, headers);
      if (row > 0) {
        const statusCol = headers.indexOf('active_status') + 1;
        sheet.getRange(row, statusCol).setValue('inactive');
        deactivated++;
      }
    }
  });

  return { received: received, created: created, updated: updated, deactivated: deactivated };
}

/**
 * 解析地址，取出縣市與行政區
 */
function parseAddress(address) {
  if (!address) return { city: '', district: '' };

  const addr = address.trim();

  // 縣市清單
  const cities = ['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
    '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣',
    '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
    '台東縣', '澎湖縣', '金門縣', '連江縣'];

  let city = '';
  let district = '';

  for (var i = 0; i < cities.length; i++) {
    if (addr.startsWith(cities[i])) {
      city = cities[i];
      // 取行政區（縣市後到「路」「街」「段」前的區段）
      const rest = addr.substring(cities[i].length);
      const districtMatch = rest.match(/^([\u4e00-\u9fa5]{2}[鄉鎮市區])/);
      if (districtMatch) {
        district = districtMatch[1];
      }
      break;
    }
  }

  return { city: city, district: district };
}

/**
 * 依醫事機構代碼找列號
 */
function findRowByFacilityCode(sheet, code, headers) {
  const codeCol = headers.indexOf('nhi_facility_code') + 1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const values = sheet.getRange(2, codeCol, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] === code) return i + 2;
  }
  return -1;
}

// ============ 工具函式 ============

/**
 * 帶重試的 HTTP 請求
 */
function fetchWithRetry(url, maxRetries) {
  var lastError = null;

  for (var attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        followRedirects: true,
        validateHttpsCertificates: true
      });

      if (response.getResponseCode() === 200) {
        return response;
      }

      lastError = new Error('HTTP ' + response.getResponseCode() + ': ' + response.getContentText().substring(0, 200));
      Logger.log('嘗試 ' + (attempt + 1) + ' 失敗: ' + lastError.message);

    } catch (e) {
      lastError = e;
      Logger.log('嘗試 ' + (attempt + 1) + ' 例外: ' + e.message);
    }

    if (attempt < maxRetries - 1) {
      Utilities.sleep(2000 * (attempt + 1));  // 指數退避
    }
  }

  throw lastError;
}

/**
 * CSV 解析（支援含逗號的引號欄位）
 */
function parseCSV(text) {
  var rows = [];
  var currentRow = [];
  var currentField = '';
  var inQuotes = false;

  for (var i = 0; i < text.length; i++) {
    var char = text.charAt(i);
    var nextChar = text.charAt(i + 1);

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentField);
        if (currentRow.length > 0 && currentRow.some(function(f) { return f !== ''; })) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // 最後一筆
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some(function(f) { return f !== ''; })) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * 發送同步錯誤通知（可選）
 */
function notifySyncError(message) {
  // 可串接 Email、LINE Notify 或 Slack
  // 範例：Email 通知
  /*
  MailApp.sendEmail({
    to: 'admin@example.com',
    subject: '[看不見的痛] 同步錯誤通知',
    body: '同步時間: ' + new Date() + '\n錯誤訊息: ' + message
  });
  */
}
