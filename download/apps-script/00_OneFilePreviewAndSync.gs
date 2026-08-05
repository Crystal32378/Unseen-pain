/**
 * 看不見的痛｜神經痛院所資料庫
 * MVP 唯一正式同步來源（版本 1.1.0）。先執行 previewNhiSync()，確認後才執行 syncNhiData()
 * 請勿與 02_SyncNHI.gs 同時加入同一個 Apps Script 專案；該多檔版已移除以避免同名函式衝突。
 */

const APP_CONFIG = {
  urls: {
    facility: 'https://info.nhi.gov.tw/api/iode0000s01/Dataset?rId=A21030000I-D2100G-001',
    clinic: 'https://info.nhi.gov.tw/api/iode0000s01/Dataset?rId=A21030000I-D21004-009',
    department: 'https://info.nhi.gov.tw/api/iode0000s01/Dataset?rId=A21030000I-D2100C-001',
    deptCode: 'https://info.nhi.gov.tw/api/iode0000s01/Dataset?rId=A21030000I-D2100F-001'
  },
  facilityHeaders: [
    'facility_id','nhi_facility_code','facility_name','facility_type',
    'accreditation_type','specialty_neurology','specialty_rehabilitation',
    'specialty_codes_raw','city','district','address','phone',
    'official_service_items','official_schedule_raw','contract_start_date',
    'closed_or_terminated_date','active_status','official_source',
    'official_source_updated_at','imported_at','last_synced_at'
  ],
  syncLogHeaders: [
    'run_id','started_at','completed_at','source','records_received',
    'records_created','records_updated','records_deactivated','error_count',
    'error_message','script_version'
  ],
  minimumExpected: 50,
  scriptVersion: '1.1.0'
};

function previewNhiSync() {
  const startedAt = new Date();
  Logger.log('=== 開始完整資料預覽（不寫入 Sheet）===');

  const prepared = prepareNhiData_();
  const rows = prepared.records;

  const neuro = rows.filter(function(r) { return r.specialty_neurology; }).length;
  const rehab = rows.filter(function(r) { return r.specialty_rehabilitation; }).length;
  const both = rows.filter(function(r) {
    return r.specialty_neurology && r.specialty_rehabilitation;
  }).length;

  Logger.log('主檔院所數: ' + prepared.stats.facilityCount);
  Logger.log('診所補充資料數: ' + prepared.stats.clinicCount);
  Logger.log('科別明細數: ' + prepared.stats.departmentCount);
  Logger.log('科別代碼數: ' + prepared.stats.deptCodeCount);
  Logger.log('神經科／復健科活躍院所總數: ' + rows.length);
  Logger.log('神經科院所數: ' + neuro);
  Logger.log('復健科院所數: ' + rehab);
  Logger.log('同時具有兩科: ' + both);
  Logger.log('前 5 筆: ' + JSON.stringify(rows.slice(0, 5)));
  Logger.log('耗時秒數: ' + ((new Date() - startedAt) / 1000));
  Logger.log('✅ 預覽完成，沒有修改任何工作表。');

  return {
    total: rows.length,
    neurology: neuro,
    rehabilitation: rehab,
    both: both,
    sample: rows.slice(0, 5),
    stats: prepared.stats
  };
}

function syncNhiData() {
  const startedAt = new Date();
  const runId = 'sync_' + Date.now();

  try {
    ensureSheets_();
    const prepared = prepareNhiData_();

    if (prepared.records.length < APP_CONFIG.minimumExpected) {
      throw new Error(
        '安全中止：篩選後只有 ' + prepared.records.length +
        ' 筆，低於安全門檻 ' + APP_CONFIG.minimumExpected
      );
    }

    const result = writeFacilitiesSnapshot_(prepared.records);
    appendSyncLog_(
      runId,
      startedAt,
      new Date(),
      'nhi_public_data',
      result.received,
      result.created,
      result.updated,
      result.deactivated,
      0,
      ''
    );

    Logger.log('✅ 正式同步完成');
    Logger.log(JSON.stringify(result));
    return result;
  } catch (e) {
    try {
      appendSyncLog_(
        runId,
        startedAt,
        new Date(),
        'nhi_public_data',
        0,0,0,0,1,e.message
      );
    } catch (ignore) {}
    Logger.log('❌ 同步失敗: ' + e.message);
    throw e;
  }
}

function prepareNhiData_() {
  const facilityRows = fetchCsvObjects_(APP_CONFIG.urls.facility);
  const clinicRows = fetchCsvObjects_(APP_CONFIG.urls.clinic);
  const departmentRows = fetchCsvObjects_(APP_CONFIG.urls.department);
  const deptCodeRows = fetchCsvObjects_(APP_CONFIG.urls.deptCode);

  const deptNameMap = {};
  deptCodeRows.forEach(function(row) {
    const code = clean_(row['診療科別']);
    const name = clean_(row['診療科別名稱']);
    if (code && name) deptNameMap[code] = name;
  });

  if (Object.keys(deptNameMap).length === 0) {
    throw new Error('科別代碼對照解析為空');
  }

  const deptByFacility = {};
  departmentRows.forEach(function(row) {
    const facilityCode = clean_(row['醫事機構代碼']);
    const deptCode = clean_(row['診療科別']);
    if (!facilityCode || !deptCode) return;
    if (!deptByFacility[facilityCode]) deptByFacility[facilityCode] = [];
    if (deptByFacility[facilityCode].indexOf(deptCode) === -1) {
      deptByFacility[facilityCode].push(deptCode);
    }
  });

  const clinicByFacility = {};
  clinicRows.forEach(function(row) {
    const code = clean_(row['醫事機構代碼']);
    if (code && !clinicByFacility[code]) clinicByFacility[code] = row;
  });

  const mappedByCode = {};

  facilityRows.forEach(function(row) {
    const code = clean_(row['醫事機構代碼']);
    if (!code) return;

    const category = clean_(row['特約類別']).toUpperCase();
    if (['1','2','3','4'].indexOf(category) === -1) return;

    const clinic = clinicByFacility[code] || {};
    const deptCodes = (deptByFacility[code] || []).slice();

    if (deptCodes.length === 0) {
      splitDeptValues_(clinic['診療科別']).forEach(function(value) {
        if (deptCodes.indexOf(value) === -1) deptCodes.push(value);
      });
    }

    const deptPairs = deptCodes.map(function(deptCode) {
      return { code: deptCode, name: deptNameMap[deptCode] || deptCode };
    });

    const hasNeurology = deptPairs.some(function(pair) {
      const name = clean_(pair.name).replace(/\s+/g, '');
      return name.indexOf('神經') !== -1 && name.indexOf('外科') === -1;
    });

    const hasRehab = deptPairs.some(function(pair) {
      return clean_(pair.name).replace(/\s+/g, '').indexOf('復健') !== -1;
    });

    if (!hasNeurology && !hasRehab) return;

    const address = clean_(row['機構地址']) || clean_(clinic['地址']);
    const parsed = parseAddress_(address);
    const closedDate = clean_(row['終止合約或歇業日期']) ||
      clean_(clinic['終止合約或歇業日期']);

    if (closedDate) return;

    const record = {
      nhi_facility_code: code,
      facility_name: clean_(row['醫事機構名稱']) || clean_(clinic['醫事機構名稱']),
      facility_type: facilityType_(category),
      accreditation_type: accreditationName_(category),
      specialty_neurology: hasNeurology,
      specialty_rehabilitation: hasRehab,
      specialty_codes_raw: deptPairs.map(function(pair) {
        return pair.code + ':' + pair.name;
      }).join(','),
      city: parsed.city,
      district: parsed.district,
      address: address,
      phone: buildPhone_(row, clinic),
      official_service_items: clean_(clinic['服務項目']),
      official_schedule_raw: clean_(clinic['固定看診時段']),
      contract_start_date: clean_(row['原始合約起始日期']) || clean_(clinic['合約起日']),
      closed_or_terminated_date: '',
      active_status: 'active',
      official_source: '衛福部中央健康保險署公開資料',
      official_source_updated_at: ''
    };

    if (!mappedByCode[code] || completenessScore_(record) > completenessScore_(mappedByCode[code])) {
      mappedByCode[code] = record;
    }
  });

  const records = Object.keys(mappedByCode).map(function(code) {
    return mappedByCode[code];
  }).sort(function(a, b) {
    const cityDiff = a.city.localeCompare(b.city, 'zh-TW');
    if (cityDiff !== 0) return cityDiff;
    const districtDiff = a.district.localeCompare(b.district, 'zh-TW');
    if (districtDiff !== 0) return districtDiff;
    return a.facility_name.localeCompare(b.facility_name, 'zh-TW');
  });

  return {
    records: records,
    stats: {
      facilityCount: facilityRows.length,
      clinicCount: clinicRows.length,
      departmentCount: departmentRows.length,
      deptCodeCount: deptCodeRows.length
    }
  };
}

function fetchCsvObjects_(url) {
  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    followRedirects: true
  });

  const status = response.getResponseCode();
  if (status !== 200) {
    throw new Error('下載失敗 HTTP ' + status + ': ' + url);
  }

  const text = response.getContentText('UTF-8').replace(/^\uFEFF/, '');
  const rows = Utilities.parseCsv(text);
  if (rows.length < 2) throw new Error('CSV 無資料: ' + url);

  const headers = rows[0].map(function(h) {
    return clean_(h).replace(/^\uFEFF/, '');
  });

  return rows.slice(1).map(function(row) {
    const obj = {};
    headers.forEach(function(header, index) {
      obj[header] = row[index] === undefined ? '' : clean_(row[index]);
    });
    return obj;
  }).filter(function(obj) {
    return Object.keys(obj).some(function(key) { return obj[key] !== ''; });
  });
}

function writeFacilitiesSnapshot_(incomingRecords) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('FACILITIES');
  const headers = APP_CONFIG.facilityHeaders;
  const existing = readSheetObjects_(sheet, headers);
  const existingMap = {};

  existing.forEach(function(row) {
    const code = clean_(row.nhi_facility_code);
    if (code) existingMap[code] = row;
  });

  const now = new Date().toISOString();
  const incomingMap = {};
  incomingRecords.forEach(function(row) {
    if (row.nhi_facility_code) incomingMap[row.nhi_facility_code] = row;
  });

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let deactivated = 0;
  const finalRows = [];

  Object.keys(incomingMap).forEach(function(code) {
    const incoming = incomingMap[code];
    const old = existingMap[code];

    incoming.facility_id = old && old.facility_id ? old.facility_id : 'NHI_' + code;
    incoming.imported_at = old && old.imported_at ? old.imported_at : now;
    incoming.last_synced_at = now;

    if (!old) created++;
    else if (hasChanged_(old, incoming)) updated++;
    else unchanged++;

    finalRows.push(incoming);
  });

  Object.keys(existingMap).forEach(function(code) {
    if (incomingMap[code]) return;
    const old = existingMap[code];
    if (String(old.active_status).toLowerCase() === 'active') deactivated++;
    old.active_status = 'inactive';
    old.last_synced_at = now;
    finalRows.push(old);
  });

  finalRows.sort(function(a, b) {
    const activeDiff = (a.active_status === 'active' ? 0 : 1) -
      (b.active_status === 'active' ? 0 : 1);
    if (activeDiff !== 0) return activeDiff;
    return clean_(a.facility_name).localeCompare(clean_(b.facility_name), 'zh-TW');
  });

  const values = finalRows.map(function(row) {
    return headers.map(function(header) {
      return row[header] === undefined || row[header] === null ? '' : row[header];
    });
  });

  if (sheet.getMaxRows() < values.length + 1) {
    sheet.insertRowsAfter(sheet.getMaxRows(), values.length + 1 - sheet.getMaxRows());
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (values.length > 0) {
    sheet.getRange(2, 1, values.length, headers.length).setValues(values);
  }

  const newLastRow = values.length + 1;
  const oldLastRow = sheet.getLastRow();
  if (oldLastRow > newLastRow) {
    sheet.getRange(newLastRow + 1, 1, oldLastRow - newLastRow, headers.length).clearContent();
  }

  SpreadsheetApp.flush();

  return {
    received: Object.keys(incomingMap).length,
    created: created,
    updated: updated,
    unchanged: unchanged,
    deactivated: deactivated,
    totalRows: finalRows.length
  };
}

function readSheetObjects_(sheet, headers) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  return values.map(function(row) {
    const obj = {};
    headers.forEach(function(header, index) { obj[header] = row[index]; });
    return obj;
  });
}

function appendSyncLog_(runId, startedAt, completedAt, source, received, created, updated, deactivated, errorCount, errorMessage) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SYNC_LOG');
  if (!sheet) return;
  sheet.appendRow([
    runId, startedAt, completedAt, source, received, created, updated,
    deactivated, errorCount, errorMessage, APP_CONFIG.scriptVersion
  ]);
}

function ensureSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ['FACILITIES','SYNC_LOG'].forEach(function(name) {
    if (!ss.getSheetByName(name)) throw new Error('缺少工作表: ' + name);
  });
}

function parseAddress_(address) {
  const normalized = clean_(address)
    .replace(/^臺北市/, '台北市')
    .replace(/^臺中市/, '台中市')
    .replace(/^臺南市/, '台南市')
    .replace(/^臺東縣/, '台東縣');

  const cities = [
    '台北市','新北市','桃園市','台中市','台南市','高雄市',
    '基隆市','新竹市','嘉義市','新竹縣','苗栗縣','彰化縣',
    '南投縣','雲林縣','嘉義縣','屏東縣','宜蘭縣','花蓮縣',
    '台東縣','澎湖縣','金門縣','連江縣'
  ];

  let city = '';
  for (let i = 0; i < cities.length; i++) {
    if (normalized.indexOf(cities[i]) === 0) {
      city = cities[i];
      break;
    }
  }

  if (!city) return { city: '', district: '' };
  const rest = normalized.substring(city.length);
  const match = rest.match(/^([\u4e00-\u9fff]{1,8}?[鄉鎮市區])/);
  return { city: city, district: match ? match[1] : '' };
}

function splitDeptValues_(value) {
  const text = clean_(value);
  if (!text) return [];
  return text.split(/[，,、;；|\/\s]+/).filter(function(v) { return v; });
}

function buildPhone_(facility, clinic) {
  const clinicPhone = clean_(clinic['電話']);
  if (clinicPhone) return clinicPhone;
  const area = clean_(facility['電話區域號碼']);
  const number = clean_(facility['電話號碼']);
  return area && number ? area + '-' + number : area || number;
}

function facilityType_(category) {
  if (category === '1') return 'medical_center';
  if (category === '2') return 'regional_hospital';
  if (category === '3') return 'district_hospital';
  if (category === '4') return 'clinic';
  return 'other';
}

function accreditationName_(category) {
  return ({'1':'醫學中心','2':'區域醫院','3':'地區醫院','4':'診所'})[category] || '其他';
}

function completenessScore_(record) {
  return ['facility_name','address','phone','specialty_codes_raw','official_service_items','official_schedule_raw']
    .reduce(function(score, key) { return score + (clean_(record[key]) ? 1 : 0); }, 0);
}

function hasChanged_(oldRow, newRow) {
  const keys = [
    'facility_name','facility_type','accreditation_type',
    'specialty_neurology','specialty_rehabilitation','specialty_codes_raw',
    'city','district','address','phone','official_service_items',
    'official_schedule_raw','contract_start_date','closed_or_terminated_date',
    'active_status','official_source','official_source_updated_at'
  ];
  return keys.some(function(key) {
    return normalizeCompare_(oldRow[key]) !== normalizeCompare_(newRow[key]);
  });
}

function normalizeCompare_(value) {
  if (value === true || value === 'TRUE') return 'true';
  if (value === false || value === 'FALSE') return 'false';
  return clean_(value);
}

function clean_(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/^\uFEFF/, '').trim();
}
