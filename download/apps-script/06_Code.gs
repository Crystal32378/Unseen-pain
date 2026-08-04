/**
 * ============================================================
 * 看不見的痛｜神經痛就醫導航
 * Apps Script — 06_Code.gs（主檔：Web App 入口與後端函式）
 * ============================================================
 *
 * 本檔案包含：
 *   - doGet: Web App 入口（搜尋器）
 *   - include: HTML 模板包含函式
 *   - searchFacilities: 搜尋 API（前端呼叫）
 *   - getDistrictsByCity: 取行政區清單
 *   - getFacilityDetail: 取院所詳情（含 Places 即時資料）
 *   - 管理介面函式
 *
 * 部署方式：
 *   1. 在 Apps Script 編輯器中部署 > Web App
 *   2. 執行身份：我
 *   3. 存取權限：任何人（或任何人（含匿名））
 *   4. 取得部署網址，貼入 Google Sites 的「嵌入網址」
 *
 * ============================================================
 */

// ===== Web App 入口 =====

/**
 * 搜尋器 Web App 入口
 */
function doGet(e) {
  const page = e && e.parameter && e.parameter.page ? e.parameter.page : 'search';

  if (page === 'symptom') {
    return HtmlService.createHtmlOutputFromFile('05_SymptomTool')
      .setTitle('症狀整理工具｜看不見的痛')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // 預設：搜尋器
  return HtmlService.createHtmlOutputFromFile('04_SearchWebApp')
    .setTitle('院所搜尋｜看不見的痛')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * HTML 模板包含
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ===== 搜尋 API =====

/**
 * 搜尋院所（前端 google.script.run 呼叫）
 * @param {Object} filters 搜尋條件
 * @return {Array} 院所清單
 */
function searchFacilities(filters) {
  try {
    const facilities = getSheetData('FACILITIES');
    const verifiedServices = getSheetData('VERIFIED_SERVICES');
    const placeLinks = getSheetData('PLACE_LINKS');

    // 建立查詢索引
    const verifiedMap = {};
    verifiedServices.forEach(function(v) {
      verifiedMap[v.nhi_facility_code] = v;
    });

    const placeMap = {};
    placeLinks.forEach(function(p) {
      if (p.match_status === 'matched' || p.match_status === 'pending') {
        placeMap[p.nhi_facility_code] = p;
      }
    });

    // 篩選
    let results = facilities.filter(function(f) {
      // 只回傳活躍院所
      if (f.active_status !== 'active') return false;

      // 科別
      if (filters.specialty === 'neurology' && !f.specialty_neurology) return false;
      if (filters.specialty === 'rehabilitation' && !f.specialty_rehabilitation) return false;
      if (filters.specialty === 'both' && !f.specialty_neurology && !f.specialty_rehabilitation) return false;

      // 縣市
      if (filters.city && f.city !== filters.city) return false;

      // 行政區
      if (filters.district && f.district !== filters.district) return false;

      // 院所類型
      if (filters.facilityType && filters.facilityType !== 'any' && f.facility_type !== filters.facilityType) return false;

      // 進階條件（只回傳已查證）
      if (filters.advanced) {
        const verified = verifiedMap[f.nhi_facility_code];
        if (!verified) return false;  // 無查證資料

        if (filters.advanced.has_emg && !isVerified(verified.has_emg)) return false;
        if (filters.advanced.has_ncs && !isVerified(verified.has_nerve_conduction_study)) return false;
        if (filters.advanced.has_pt && !isVerified(verified.has_physical_therapy)) return false;
        if (filters.advanced.has_et && !isVerified(verified.has_electrotherapy)) return false;
        if (filters.advanced.need_appt && !isVerified(verified.appointment_required)) return false;
      }

      return true;
    });

    // 合併查證與 Place 資訊
    results = results.map(function(f) {
      const verified = verifiedMap[f.nhi_facility_code];
      const place = placeMap[f.nhi_facility_code];

      return {
        facility_id: f.facility_id,
        nhi_facility_code: f.nhi_facility_code,
        facility_name: f.facility_name,
        facility_type: f.facility_type,
        specialty_neurology: f.specialty_neurology,
        specialty_rehabilitation: f.specialty_rehabilitation,
        city: f.city,
        district: f.district,
        address: f.address,
        phone: f.phone,
        official_source_updated_at: f.official_source_updated_at,
        official_schedule_raw: f.official_schedule_raw,
        has_emg: verified ? verified.has_emg : 'unverified',
        has_nerve_conduction_study: verified ? verified.has_nerve_conduction_study : 'unverified',
        has_physical_therapy: verified ? verified.has_physical_therapy : 'unverified',
        has_electrotherapy: verified ? verified.has_electrotherapy : 'unverified',
        appointment_required: verified ? verified.appointment_required : 'unverified',
        google_place_id: place ? place.google_place_id : '',
        match_status: place ? place.match_status : 'unmatched',
        match_confidence: place ? place.match_confidence : 'low'
      };
    });

    // 排序
    results = sortResults(results, filters);

    // 限制回傳數量（避免回傳過多資料）
    const maxResults = 100;
    if (results.length > maxResults) {
      results = results.slice(0, maxResults);
    }

    return results;

  } catch (e) {
    Logger.log('searchFacilities 錯誤: ' + e.message);
    throw new Error('搜尋時發生問題，請稍後再試。');
  }
}

/**
 * 判定是否已查證
 */
function isVerified(status) {
  return status === 'official_website' ||
         status === 'phone_confirmed' ||
         status === 'written_confirmed';
}

/**
 * 排序結果
 */
function sortResults(results, filters) {
  // 若有定位，依距離排序
  if (filters.useLocation && filters.lat && filters.lng) {
    // TODO: 如有 Place location，計算距離
    // 第一版先依院所類型排序，距離排序需 Places 資料
  }

  // 院所類型優先級
  const typeOrder = {
    medical_center: 1,
    regional_hospital: 2,
    district_hospital: 3,
    clinic: 4
  };

  results.sort(function(a, b) {
    // 1. 院所類型
    const typeDiff = (typeOrder[a.facility_type] || 5) - (typeOrder[b.facility_type] || 5);
    if (typeDiff !== 0) return typeDiff;

    // 2. 名稱
    return a.facility_name.localeCompare(b.facility_name, 'zh-TW');
  });

  return results;
}

// ===== 行政區 API =====

/**
 * 取得指定縣市的行政區清單
 */
function getDistrictsByCity(city) {
  if (!city) return [];

  const facilities = getSheetData('FACILITIES');
  const districts = {};

  facilities.forEach(function(f) {
    if (f.city === city && f.active_status === 'active' && f.district) {
      districts[f.district] = true;
    }
  });

  return Object.keys(districts).sort();
}

// ===== 院所詳情（含 Places 即時資料）=====

/**
 * 取得院所詳情（含 Google Places 即時資料）
 * 在使用者展開時呼叫，降低 API 呼叫量
 */
function getFacilityDetail(nhiCode) {
  const facilities = getSheetData('FACILITIES');
  const fac = facilities.find(function(f) { return f.nhi_facility_code === nhiCode; });

  if (!fac) throw new Error('找不到此院所');

  const placeLinks = getSheetData('PLACE_LINKS');
  const placeLink = placeLinks.find(function(p) { return p.nhi_facility_code === nhiCode; });

  let placeDetail = null;

  // 只在已匹配 Place ID 時才呼叫 Places API
  if (placeLink && placeLink.google_place_id && placeLink.match_status === 'matched') {
    const apiKey = getApiKey();
    if (apiKey) {
      try {
        placeDetail = getPlaceDetails(placeLink.google_place_id, apiKey);
      } catch (e) {
        Logger.log('Places Details 失敗: ' + e.message);
        // 不中斷流程，只回傳基本資料
      }
    }
  }

  const verifiedServices = getSheetData('VERIFIED_SERVICES');
  const verified = verifiedServices.find(function(v) { return v.nhi_facility_code === nhiCode; });

  return {
    facility: fac,
    verified_services: verified || null,
    place_detail: placeDetail,
    place_link: placeLink || null
  };
}

// ===== 管理介面函式 =====

/**
 * 管理儀表板資料
 */
function getAdminDashboard() {
  const facilities = getSheetData('FACILITIES');
  const activeFacilities = facilities.filter(function(f) { return f.active_status === 'active'; });
  const neurologyCount = activeFacilities.filter(function(f) { return f.specialty_neurology; }).length;
  const rehabCount = activeFacilities.filter(function(f) { return f.specialty_rehabilitation; }).length;

  const placeLinks = getSheetData('PLACE_LINKS');
  const unmatched = placeLinks.filter(function(p) { return p.match_status !== 'matched'; }).length;
  const pendingReview = placeLinks.filter(function(p) { return p.match_status === 'pending'; }).length;

  const verifiedServices = getSheetData('VERIFIED_SERVICES');

  const syncLogs = getSheetData('SYNC_LOG');
  const lastSync = syncLogs.length > 0 ? syncLogs[syncLogs.length - 1] : null;
  const syncErrors = syncLogs.filter(function(l) { return l.error_count > 0; }).length;

  return {
    last_synced_at: lastSync ? lastSync.completed_at : null,
    total_facilities: facilities.length,
    active_facilities: activeFacilities.length,
    neurology_count: neurologyCount,
    rehabilitation_count: rehabCount,
    unmatched_place_count: unmatched,
    pending_review_count: pendingReview,
    verified_service_count: verifiedServices.length,
    sync_error_count: syncErrors,
    places_api_calls_today: getTodayApiCallCount()
  };
}

/**
 * 更新院所服務查證狀態
 */
function updateVerifiedService(nhiCode, field, value, source, note) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('VERIFIED_SERVICES');
  const headers = SHEET_CONFIG.VERIFIED_SERVICES.headers;

  // 查找現有紀錄
  const data = getSheetData('VERIFIED_SERVICES');
  const existingIdx = data.findIndex(function(v) { return v.nhi_facility_code === nhiCode; });

  const now = new Date().toISOString();
  const currentUser = Session.getActiveUser().getEmail() || 'admin';

  if (existingIdx >= 0) {
    // 更新
    const row = existingIdx + 2;
    const fieldCol = headers.indexOf(field) + 1;
    sheet.getRange(row, fieldCol).setValue(value);

    // 更新查證來源與時間
    sheet.getRange(row, headers.indexOf('service_source_type') + 1).setValue(source || 'manual');
    sheet.getRange(row, headers.indexOf('verification_status') + 1).setValue(value === 'invalidated' ? 'invalidated' : 'phone_confirmed');
    sheet.getRange(row, headers.indexOf('verified_at') + 1).setValue(now);
    sheet.getRange(row, headers.indexOf('verified_by') + 1).setValue(currentUser);
    if (note) {
      sheet.getRange(row, headers.indexOf('verification_note') + 1).setValue(note);
    }

    Logger.log('✓ 已更新查證狀態: ' + nhiCode + ' — ' + field + ' = ' + value);
  } else {
    // 新增
    const newRow = headers.map(function(h) {
      switch(h) {
        case 'nhi_facility_code': return nhiCode;
        case field: return value;
        case 'service_source_type': return source || 'manual';
        case 'verification_status': return value === 'invalidated' ? 'invalidated' : 'phone_confirmed';
        case 'verified_at': return now;
        case 'verified_by': return currentUser;
        case 'verification_note': return note || '';
        default: return '';
      }
    });
    sheet.appendRow(newRow);
    Logger.log('✓ 已新增查證紀錄: ' + nhiCode);
  }
}

/**
 * 停用院所
 */
function deactivateFacility(nhiCode, reason) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('FACILITIES');
  const headers = SHEET_CONFIG.FACILITIES.headers;

  const row = findRowByFacilityCode(sheet, nhiCode, headers);
  if (row > 0) {
    const statusCol = headers.indexOf('active_status') + 1;
    sheet.getRange(row, statusCol).setValue('inactive');
    Logger.log('✓ 已停用院所: ' + nhiCode + '（原因: ' + reason + '）');
  } else {
    Logger.log('找不到院所: ' + nhiCode);
  }
}

/**
 * 匯出備份 CSV
 */
function exportBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const facilities = getSheetData('FACILITIES');
  const headers = SHEET_CONFIG.FACILITIES.headers;

  // 轉 CSV
  const csvRows = [headers.join(',')];
  facilities.forEach(function(f) {
    const row = headers.map(function(h) {
      var val = f[h] || '';
      val = String(val).replace(/"/g, '""');
      if (val.includes(',') || val.includes('\n') || val.includes('"')) {
        val = '"' + val + '"';
      }
      return val;
    });
    csvRows.push(row.join(','));
  });

  const csv = csvRows.join('\n');
  const blob = Utilities.newBlob(csv, 'text/csv;charset=utf-8', 'facilities_backup_' + new Date().getTime() + '.csv');
  const file = DriveApp.createFile(blob);
  Logger.log('備份已建立: ' + file.getUrl());
  return file.getUrl();
}

// ===== 測試函式 =====

/**
 * 測試搜尋功能
 */
function testSearch() {
  const results = searchFacilities({
    specialty: 'both',
    city: '台北市',
    district: '',
    facilityType: 'any',
    useLocation: false,
    advanced: {}
  });

  Logger.log('搜尋結果: ' + results.length + ' 筆');
  results.slice(0, 5).forEach(function(f) {
    Logger.log('  - ' + f.facility_name + ' (' + f.city + f.district + ')');
  });
}

/**
 * 測試症狀工具頁面
 */
function testSymptomPage() {
  const html = HtmlService.createHtmlOutputFromFile('05_SymptomTool');
  Logger.log('症狀工具頁面已建立，長度: ' + html.getContent().length + ' 字元');
}
