/**
 * ============================================================
 * 看不見的痛｜神經痛就醫導航
 * Apps Script — 02_SyncNHI.gs
 * ============================================================
 *
 * 功能：
 *   1. 從健保署官方 CSV 下載院所、科別與科別代碼資料
 *   2. 以「健保特約醫療院所名冊」作為院所主檔
 *   3. 以診所資料補充服務項目與固定看診時段（不重複新增院所）
 *   4. 篩選神經科／神經內科與復健科
 *   5. 以醫事機構代碼去重，保留已消失院所並標記 inactive
 *   6. 批次寫入 FACILITIES 與記錄 SYNC_LOG
 *
 * 重要：
 *   - testNhiResources() 與 previewNhiSync() 不會修改試算表資料。
 *   - syncNhiData() 才會寫入 FACILITIES。
 * ============================================================
 */

const NHI_CONFIG = {
  FACILITY_API: 'https://info.nhi.gov.tw/api/iode0000s01/Dataset?rId=A21030000I-D2100G-001',
  CLINIC_API: 'https://info.nhi.gov.tw/api/iode0000s01/Dataset?rId=A21030000I-D21004-009',
  DEPARTMENT_API: 'https://info.nhi.gov.tw/api/iode0000s01/Dataset?rId=A21030000I-D2100C-001',
  DEPT_CODE_API: 'https://info.nhi.gov.tw/api/iode0000s01/Dataset?rId=A21030000I-D2100F-001',

  SOURCE_NAME: '衛福部中央健康保險署公開資料',
  MAX_RECORDS: 100000,
  BATCH_SIZE: 1000,
  MIN_EXPECTED_FILTERED_RECORDS: 50,

  REQUIRED_HEADERS: {
    facility: [
      '醫事機構代碼', '醫事機構名稱', '機構地址', '特約類別',
      '醫事機構種類', '終止合約或歇業日期', '原始合約起始日期'
    ],
    clinic: [
      '醫事機構代碼', '醫事機構名稱', '電話', '地址', '特約類別',
      '服務項目', '診療科別', '終止合約或歇業日期', '固定看診時段', '合約起日'
    ],
    department: ['醫事機構代碼', '診療科別'],
    deptCode: ['診療科別', '診療科別名稱']
  }
};

/**
 * 最小連線測試：只下載並檢查四個官方資源，不修改 Sheet。
 */
function testNhiResources() {
  const resources = [
    { name: '健保特約醫療院所名冊', url: NHI_CONFIG.FACILITY_API, headers: NHI_CONFIG.REQUIRED_HEADERS.facility },
    { name: '健保特約醫事機構-診所', url: NHI_CONFIG.CLINIC_API, headers: NHI_CONFIG.REQUIRED_HEADERS.clinic },
    { name: '醫療院所診療科別明細', url: NHI_CONFIG.DEPARTMENT_API, headers: NHI_CONFIG.REQUIRED_HEADERS.department },
    { name: '診療科別代碼對照檔', url: NHI_CONFIG.DEPT_CODE_API, headers: NHI_CONFIG.REQUIRED_HEADERS.deptCode }
  ];

  Logger.log('=== 健保署官方資源連線測試 ===');
  resources.forEach(function(resource) {
    const parsed = fetchAndParseCsv_(resource.url, resource.name, resource.headers);
    Logger.log('✓ ' + resource.name);
    Logger.log('  HTTP: ' + parsed.status);
    Logger.log('  Content-Type: ' + parsed.contentType);
    Logger.log('  Bytes: ' + parsed.byteSize);
    Logger.log('  Rows（不含標題）: ' + parsed.records.length);
    Logger.log('  Header: ' + JSON.stringify(parsed.headers));
    Logger.log('  第一筆: ' + JSON.stringify(parsed.records[0] || {}));
  });
  Logger.log('✅ 四個官方資源皆可讀取，且必要欄位存在。');
}

/**
 * 完整資料預覽：執行下載、合併、篩選與統計，但不寫入 Sheet。
 */
function previewNhiSync() {
  const prepared = prepareNhiFacilities_();
  const records = prepared.records;

  Logger.log('=== 健保署同步預覽（不寫入）===');
  Logger.log('主檔院所數: ' + prepared.stats.facilityRecords);
  Logger.log('診所補充資料數: ' + prepared.stats.clinicRecords);
  Logger.log('科別明細數: ' + prepared.stats.departmentRecords);
  Logger.log('科別代碼數: ' + prepared.stats.departmentCodeRecords);
  Logger.log('神經科／復健科活躍院所數: ' + records.length);
  Logger.log('神經科院所數: ' + records.filter(function(f) { return f.specialty_neurology; }).length);
  Logger.log('復健科院所數: ' + records.filter(function(f) { return f.specialty_rehabilitation; }).length);
  Logger.log('同時具有兩科: ' + records.filter(function(f) { return f.specialty_neurology && f.specialty_rehabilitation; }).length);
  Logger.log('前 5 筆: ' + JSON.stringify(records.slice(0, 5)));
  Logger.log('✅ 預覽完成，未修改任何工作表。');

  return {
    total: records.length,
    sample: records.slice(0, 5),
    stats: prepared.stats
  };
}

/**
 * 正式同步入口：下載、整理並寫入 FACILITIES。
 */
function syncNhiData() {
  const runId = 'sync_' + Date.now();
  const startTime = new Date();

  Logger.log('=== 開始同步健保署資料 ===');
  Logger.log('Run ID: ' + runId);

  try {
    verifySyncPrerequisites_();

    const prepared = prepareNhiFacilities_();
    const records = prepared.records;

    if (records.length < NHI_CONFIG.MIN_EXPECTED_FILTERED_RECORDS) {
      throw new Error(
        '安全中止：篩選後只有 ' + records.length + ' 筆，低於安全門檻 ' +
        NHI_CONFIG.MIN_EXPECTED_FILTERED_RECORDS + '。未寫入 Sheet。'
      );
    }

    const result = upsertFacilities(records);
    const duration = (new Date().getTime() - startTime.getTime()) / 1000;

    Logger.log('=== 同步完成 ===');
    Logger.log('耗時: ' + duration + ' 秒');
    Logger.log('接收: ' + result.received);
    Logger.log('新增: ' + result.created);
    Logger.log('更新: ' + result.updated);
    Logger.log('未變更: ' + result.unchanged);
    Logger.log('停用: ' + result.deactivated);
    Logger.log('重複代碼移除: ' + result.duplicatesRemoved);

    logSyncRun(
      runId,
      'nhi_public_data_v3',
      result.received,
      result.created,
      result.updated,
      result.deactivated,
      null
    );

    return result;
  } catch (e) {
    Logger.log('!!! 同步失敗，FACILITIES 未完成更新 !!!');
    Logger.log('錯誤: ' + e.message);
    Logger.log('堆疊: ' + (e.stack || ''));

    try {
      logSyncRun(runId, 'nhi_public_data_v3', 0, 0, 0, 0, e.message);
    } catch (logError) {
      Logger.log('SYNC_LOG 寫入失敗: ' + logError.message);
    }
    throw e;
  }
}

/**
 * 下載並整理正式院所資料。
 */
function prepareNhiFacilities_() {
  const facilityCsv = fetchAndParseCsv_(
    NHI_CONFIG.FACILITY_API,
    '健保特約醫療院所名冊',
    NHI_CONFIG.REQUIRED_HEADERS.facility
  );

  const departmentCsv = fetchAndParseCsv_(
    NHI_CONFIG.DEPARTMENT_API,
    '醫療院所診療科別明細',
    NHI_CONFIG.REQUIRED_HEADERS.department
  );

  const deptCodeCsv = fetchAndParseCsv_(
    NHI_CONFIG.DEPT_CODE_API,
    '診療科別代碼對照檔',
    NHI_CONFIG.REQUIRED_HEADERS.deptCode
  );

  // 診所檔只用來補充服務項目與固定看診時段；下載失敗不應阻斷主同步。
  let clinicCsv = { records: [], headers: [], lastModified: '' };
  try {
    clinicCsv = fetchAndParseCsv_(
      NHI_CONFIG.CLINIC_API,
      '健保特約醫事機構-診所',
      NHI_CONFIG.REQUIRED_HEADERS.clinic
    );
  } catch (e) {
    Logger.log('警告：診所補充資料下載失敗，將以院所主檔繼續：' + e.message);
  }

  const deptCodeMap = buildDepartmentCodeMap_(deptCodeCsv.records);
  if (Object.keys(deptCodeMap).length === 0) {
    throw new Error('診療科別代碼對照檔解析後為空，為避免錯誤分類已停止同步。');
  }

  const departmentMap = buildDepartmentMap_(departmentCsv.records);
  const clinicMap = buildClinicEnrichmentMap_(clinicCsv.records);

  const sourceUpdatedAt = facilityCsv.lastModified || '';
  const mapped = facilityCsv.records
    .slice(0, NHI_CONFIG.MAX_RECORDS)
    .map(function(row) {
      return mapFacilityRecord_(row, departmentMap, deptCodeMap, clinicMap, sourceUpdatedAt);
    })
    .filter(function(record) {
      return record !== null;
    });

  const deduped = dedupeByFacilityCode_(mapped);
  const filtered = filterNeuroAndRehab(deduped);
  const active = filterActiveFacilities(filtered);

  return {
    records: active,
    stats: {
      facilityRecords: facilityCsv.records.length,
      clinicRecords: clinicCsv.records.length,
      departmentRecords: departmentCsv.records.length,
      departmentCodeRecords: deptCodeCsv.records.length,
      mappedRecords: mapped.length,
      dedupedRecords: deduped.length,
      filteredRecords: filtered.length,
      activeRecords: active.length
    }
  };
}

function buildDepartmentCodeMap_(records) {
  const map = {};
  records.forEach(function(row) {
    const code = cleanString_(row['診療科別']);
    const name = cleanString_(row['診療科別名稱']);
    if (code && name) map[code] = name;
  });
  return map;
}

function buildDepartmentMap_(records) {
  const map = {};
  records.forEach(function(row) {
    const facilityCode = cleanString_(row['醫事機構代碼']);
    const deptCode = cleanString_(row['診療科別']);
    if (!facilityCode || !deptCode) return;
    if (!map[facilityCode]) map[facilityCode] = [];
    if (map[facilityCode].indexOf(deptCode) === -1) {
      map[facilityCode].push(deptCode);
    }
  });
  return map;
}

function buildClinicEnrichmentMap_(records) {
  const map = {};
  records.forEach(function(row) {
    const code = cleanString_(row['醫事機構代碼']);
    if (!code) return;
    // 同一機構代碼只保留第一筆；院所主檔才是唯一主來源。
    if (!map[code]) map[code] = row;
  });
  return map;
}

function mapFacilityRecord_(row, departmentMap, deptCodeMap, clinicMap, sourceUpdatedAt) {
  const code = cleanString_(row['醫事機構代碼']);
  if (!code) return null;

  const contractCategory = cleanString_(row['特約類別']).toUpperCase();
  if (['1', '2', '3', '4'].indexOf(contractCategory) === -1) {
    return null;
  }

  const clinic = clinicMap[code] || {};
  const deptCodes = (departmentMap[code] || []).slice();

  // 若科別明細缺漏，診所檔的「診療科別」僅作 fallback。
  if (deptCodes.length === 0) {
    splitDepartmentValues_(clinic['診療科別']).forEach(function(value) {
      if (deptCodes.indexOf(value) === -1) deptCodes.push(value);
    });
  }

  const deptPairs = deptCodes.map(function(deptCode) {
    return {
      code: deptCode,
      name: deptCodeMap[deptCode] || deptCode
    };
  });

  const address = cleanString_(row['機構地址']) || cleanString_(clinic['地址']);
  const parsedAddress = parseAddress(address);

  const phone = buildPhone_(row, clinic);
  const closedDate = cleanString_(row['終止合約或歇業日期']) ||
    cleanString_(clinic['終止合約或歇業日期']);

  const hasNeurology = deptPairs.some(function(pair) {
    return isNeurologyDepartmentName_(pair.name);
  });
  const hasRehabilitation = deptPairs.some(function(pair) {
    return isRehabilitationDepartmentName_(pair.name);
  });

  return {
    nhi_facility_code: code,
    facility_name: cleanString_(row['醫事機構名稱']) || cleanString_(clinic['醫事機構名稱']),
    facility_type: determineFacilityType(row),
    accreditation_type: getAccreditationType_(contractCategory),
    specialty_neurology: hasNeurology,
    specialty_rehabilitation: hasRehabilitation,
    specialty_codes_raw: deptPairs.map(function(pair) {
      return pair.code + ':' + pair.name;
    }).join(','),
    city: parsedAddress.city,
    district: parsedAddress.district,
    address: address,
    phone: phone,
    official_service_items: cleanString_(clinic['服務項目']),
    official_schedule_raw: cleanString_(clinic['固定看診時段']),
    contract_start_date: cleanString_(row['原始合約起始日期']) || cleanString_(clinic['合約起日']),
    closed_or_terminated_date: closedDate,
    active_status: closedDate ? 'inactive' : 'active',
    official_source: NHI_CONFIG.SOURCE_NAME,
    official_source_updated_at: sourceUpdatedAt
  };
}

function splitDepartmentValues_(value) {
  const text = cleanString_(value);
  if (!text) return [];
  return text.split(/[，,、;；|\/\s]+/).map(function(item) {
    return item.trim();
  }).filter(function(item) {
    return item !== '';
  });
}

function isNeurologyDepartmentName_(name) {
  const normalized = cleanString_(name).replace(/\s+/g, '');
  return normalized.indexOf('神經') !== -1 && normalized.indexOf('外科') === -1;
}

function isRehabilitationDepartmentName_(name) {
  return cleanString_(name).replace(/\s+/g, '').indexOf('復健') !== -1;
}

function filterNeuroAndRehab(facilities) {
  return facilities.filter(function(facility) {
    return facility.specialty_neurology || facility.specialty_rehabilitation;
  });
}

function filterActiveFacilities(facilities) {
  return facilities.filter(function(facility) {
    return facility.active_status === 'active' && !cleanString_(facility.closed_or_terminated_date);
  });
}

function determineFacilityType(row) {
  const category = cleanString_(row['特約類別']).toUpperCase();
  if (category === '1') return 'medical_center';
  if (category === '2') return 'regional_hospital';
  if (category === '3') return 'district_hospital';
  if (category === '4') return 'clinic';
  return 'other';
}

function determineActiveStatus(row) {
  return cleanString_(row['終止合約或歇業日期']) ? 'inactive' : 'active';
}

function getAccreditationType_(category) {
  const map = {
    '1': '醫學中心',
    '2': '區域醫院',
    '3': '地區醫院',
    '4': '診所'
  };
  return map[category] || '其他';
}

function buildPhone_(facilityRow, clinicRow) {
  const clinicPhone = cleanString_(clinicRow['電話']);
  if (clinicPhone) return clinicPhone;

  const area = cleanString_(facilityRow['電話區域號碼']);
  const number = cleanString_(facilityRow['電話號碼']);
  if (area && number) return area + '-' + number;
  return area || number;
}

function dedupeByFacilityCode_(records) {
  const map = {};
  records.forEach(function(record) {
    if (!record.nhi_facility_code) return;
    if (!map[record.nhi_facility_code]) {
      map[record.nhi_facility_code] = record;
      return;
    }

    // 同代碼重複時，保留資料較完整的一筆。
    if (recordCompletenessScore_(record) > recordCompletenessScore_(map[record.nhi_facility_code])) {
      map[record.nhi_facility_code] = record;
    }
  });
  return Object.keys(map).map(function(code) { return map[code]; });
}

function recordCompletenessScore_(record) {
  const fields = ['facility_name', 'address', 'phone', 'specialty_codes_raw', 'official_service_items', 'official_schedule_raw'];
  return fields.reduce(function(score, field) {
    return score + (cleanString_(record[field]) ? 1 : 0);
  }, 0);
}

/**
 * 以醫事機構代碼為唯一鍵，建立完整快照後批次寫回。
 * 舊資料中已不在本次結果者會保留並標記 inactive。
 */
function upsertFacilities(newData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('FACILITIES');
  if (!sheet) throw new Error('缺少 FACILITIES 工作表，請先執行 setupDatabase()。');

  const headers = SHEET_CONFIG.FACILITIES.headers;
  const existingData = getSheetData('FACILITIES');
  const existingMap = {};
  existingData.forEach(function(record) {
    const code = cleanString_(record.nhi_facility_code);
    if (code) existingMap[code] = record;
  });

  const now = new Date().toISOString();
  const incomingMap = {};
  let duplicatesRemoved = 0;

  newData.forEach(function(record) {
    const code = cleanString_(record.nhi_facility_code);
    if (!code) return;
    if (incomingMap[code]) duplicatesRemoved++;
    incomingMap[code] = record;
  });

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let deactivated = 0;
  const finalRecords = [];

  Object.keys(incomingMap).forEach(function(code) {
    const incoming = incomingMap[code];
    const existing = existingMap[code];

    incoming.facility_id = existing && existing.facility_id ?
      existing.facility_id : 'NHI_' + code;
    incoming.imported_at = existing && existing.imported_at ?
      existing.imported_at : now;
    incoming.last_synced_at = now;
    incoming.active_status = 'active';

    if (!existing) {
      created++;
    } else if (hasFacilityChanged_(existing, incoming)) {
      updated++;
    } else {
      unchanged++;
    }

    finalRecords.push(incoming);
  });

  Object.keys(existingMap).forEach(function(code) {
    if (incomingMap[code]) return;

    const oldRecord = existingMap[code];
    if (oldRecord.active_status === 'active' || oldRecord.active_status === true) {
      deactivated++;
    }
    oldRecord.active_status = 'inactive';
    oldRecord.last_synced_at = now;
    finalRecords.push(oldRecord);
  });

  finalRecords.sort(function(a, b) {
    const activeDiff = (a.active_status === 'active' ? 0 : 1) - (b.active_status === 'active' ? 0 : 1);
    if (activeDiff !== 0) return activeDiff;
    const cityDiff = cleanString_(a.city).localeCompare(cleanString_(b.city), 'zh-TW');
    if (cityDiff !== 0) return cityDiff;
    const districtDiff = cleanString_(a.district).localeCompare(cleanString_(b.district), 'zh-TW');
    if (districtDiff !== 0) return districtDiff;
    return cleanString_(a.facility_name).localeCompare(cleanString_(b.facility_name), 'zh-TW');
  });

  const rows = finalRecords.map(function(record) {
    return headers.map(function(header) {
      return record[header] !== undefined && record[header] !== null ? record[header] : '';
    });
  });

  writeFacilitySnapshot_(sheet, headers, rows);

  return {
    received: Object.keys(incomingMap).length,
    created: created,
    updated: updated,
    unchanged: unchanged,
    deactivated: deactivated,
    duplicatesRemoved: duplicatesRemoved,
    totalRows: rows.length
  };
}

function hasFacilityChanged_(existing, incoming) {
  const tracked = [
    'facility_name', 'facility_type', 'accreditation_type',
    'specialty_neurology', 'specialty_rehabilitation', 'specialty_codes_raw',
    'city', 'district', 'address', 'phone', 'official_service_items',
    'official_schedule_raw', 'contract_start_date', 'closed_or_terminated_date',
    'active_status', 'official_source', 'official_source_updated_at'
  ];

  return tracked.some(function(field) {
    return normalizeCompareValue_(existing[field]) !== normalizeCompareValue_(incoming[field]);
  });
}

function normalizeCompareValue_(value) {
  if (value === true || value === 'TRUE') return 'true';
  if (value === false || value === 'FALSE') return 'false';
  return cleanString_(value);
}

function writeFacilitySnapshot_(sheet, headers, rows) {
  const oldLastRow = sheet.getLastRow();

  if (rows.length === 0) {
    throw new Error('安全中止：沒有可寫入的院所資料。');
  }

  // 先確認工作表容量，再清除舊內容，降低中途失敗機率。
  const requiredRows = rows.length + 1;
  if (sheet.getMaxRows() < requiredRows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), requiredRows - sheet.getMaxRows());
  }
  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  for (var start = 0; start < rows.length; start += NHI_CONFIG.BATCH_SIZE) {
    const batch = rows.slice(start, start + NHI_CONFIG.BATCH_SIZE);
    sheet.getRange(start + 2, 1, batch.length, headers.length).setValues(batch);
  }

  const newLastRow = rows.length + 1;
  if (oldLastRow > newLastRow) {
    sheet.getRange(newLastRow + 1, 1, oldLastRow - newLastRow, headers.length).clearContent();
  }

  SpreadsheetApp.flush();
}

/**
 * 解析地址；輸出城市名稱採前端既有的「台」字格式。
 */
function parseAddress(address) {
  const raw = cleanString_(address);
  if (!raw) return { city: '', district: '' };

  const normalized = raw
    .replace(/^臺北市/, '台北市')
    .replace(/^臺中市/, '台中市')
    .replace(/^臺南市/, '台南市')
    .replace(/^臺東縣/, '台東縣');

  const cities = [
    '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
    '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣',
    '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
    '台東縣', '澎湖縣', '金門縣', '連江縣'
  ];

  let city = '';
  for (var i = 0; i < cities.length; i++) {
    if (normalized.indexOf(cities[i]) === 0) {
      city = cities[i];
      break;
    }
  }

  if (!city) return { city: '', district: '' };

  const rest = normalized.substring(city.length);
  const districtMatch = rest.match(/^([\u4e00-\u9fff]{1,8}?[鄉鎮市區])/);

  return {
    city: city,
    district: districtMatch ? districtMatch[1] : ''
  };
}

function findRowByFacilityCode(sheet, code, headers) {
  const codeCol = headers.indexOf('nhi_facility_code') + 1;
  const lastRow = sheet.getLastRow();
  if (codeCol <= 0 || lastRow < 2) return -1;

  const values = sheet.getRange(2, codeCol, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (cleanString_(values[i][0]) === cleanString_(code)) return i + 2;
  }
  return -1;
}

function verifySyncPrerequisites_() {
  if (typeof SHEET_CONFIG === 'undefined') {
    throw new Error('找不到 SHEET_CONFIG，請確認 01_InitSheet.gs 已加入同一個 Apps Script 專案。');
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('FACILITIES') || !ss.getSheetByName('SYNC_LOG')) {
    throw new Error('缺少 FACILITIES 或 SYNC_LOG，請先執行 setupDatabase()。');
  }
}

function fetchAndParseCsv_(url, resourceName, requiredHeaders) {
  const response = fetchWithRetry(url, 3);
  const status = response.getResponseCode();
  const responseHeaders = response.getAllHeaders();
  const contentType = String(
    responseHeaders['Content-Type'] || responseHeaders['content-type'] || ''
  );
  const bytes = response.getContent();
  const text = response.getContentText('UTF-8').replace(/^\uFEFF/, '');

  if (status !== 200) {
    throw new Error(resourceName + ' HTTP ' + status);
  }
  if (!text.trim()) {
    throw new Error(resourceName + ' 回傳空白內容');
  }

  const rows = Utilities.parseCsv(text);
  if (rows.length < 2) {
    throw new Error(resourceName + ' CSV 沒有資料列');
  }

  const headers = rows[0].map(function(header) {
    return cleanString_(header).replace(/^\uFEFF/, '');
  });
  assertRequiredHeaders_(resourceName, headers, requiredHeaders);

  const records = rows.slice(1).map(function(row) {
    const record = {};
    headers.forEach(function(header, index) {
      record[header] = row[index] !== undefined ? cleanString_(row[index]) : '';
    });
    return record;
  }).filter(function(record) {
    return Object.keys(record).some(function(key) { return record[key] !== ''; });
  });

  return {
    status: status,
    contentType: contentType,
    byteSize: bytes.length,
    headers: headers,
    records: records,
    lastModified: extractLastModified_(responseHeaders)
  };
}

function assertRequiredHeaders_(resourceName, actualHeaders, requiredHeaders) {
  const missing = requiredHeaders.filter(function(header) {
    return actualHeaders.indexOf(header) === -1;
  });
  if (missing.length > 0) {
    throw new Error(
      resourceName + ' 缺少必要欄位：' + missing.join('、') +
      '；實際 Header：' + JSON.stringify(actualHeaders)
    );
  }
}

function extractLastModified_(headers) {
  const value = headers['Last-Modified'] || headers['last-modified'] || '';
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  return Utilities.formatDate(date, 'Asia/Taipei', 'yyyy-MM-dd');
}

function fetchWithRetry(url, maxRetries) {
  let lastError = null;

  for (var attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        followRedirects: true,
        validateHttpsCertificates: true,
        headers: {
          'Accept': 'text/csv,application/csv,text/plain,*/*',
          'User-Agent': 'UnseenPain-NHI-Sync/1.1'
        }
      });

      const status = response.getResponseCode();
      if (status === 200) return response;

      lastError = new Error(
        'HTTP ' + status + ': ' + response.getContentText('UTF-8').substring(0, 300)
      );
    } catch (e) {
      lastError = e;
    }

    Logger.log('下載失敗，第 ' + attempt + '/' + maxRetries + ' 次：' + lastError.message);
    if (attempt < maxRetries) Utilities.sleep(1500 * attempt);
  }

  throw lastError || new Error('下載失敗：' + url);
}

function cleanString_(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/^\uFEFF/, '').trim();
}
