/**
 * ============================================================
 * 看不見的痛｜神經痛就醫導航
 * Apps Script — 03_PlacesMatch.gs
 * ============================================================
 *
 * 功能：Google Places API (New) 匹配院所地點
 *
 * 安全原則：
 *   - API Key 存於 PropertiesService，不寫入前端
 *   - 使用 Field Mask 只取必要欄位
 *   - 設定應用限制與 API 限制
 *   - 記錄 API 呼叫量
 *
 * ============================================================
 */

// ============ 設定區 ============

const PLACES_CONFIG = {
  // API Key 存於 PropertiesService（不寫死在程式碼中）
  API_KEY_PROPERTY: 'PLACES_API_KEY',

  // Places API (New) 端點
  TEXT_SEARCH_URL: 'https://places.googleapis.com/v1/places:searchText',
  PLACE_DETAILS_URL: 'https://places.googleapis.com/v1/places/',

  // Field Mask — 只索取必要欄位（降低費用）
  SEARCH_FIELDS: 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber',
  DETAIL_FIELDS: 'id,displayName,formattedAddress,nationalPhoneNumber,websiteUri,regularOpeningHours,googleMapsUri,location,rating,userRatingCount',

  // 匹配信心度閾值
  HIGH_CONFIDENCE_THRESHOLD: 0.85,
  MEDIUM_CONFIDENCE_THRESHOLD: 0.6,

  // 每日 API 呼叫上限（安全控管）
  DAILY_QUOTA_LIMIT: 200,

  // 每次匹配最多搜尋筆數
  BATCH_MATCH_SIZE: 20
};

// ============ 主匹配函式 ============

/**
 * 批次匹配 Google Place ID
 * 只處理 PLACE_LINKS 中 match_status 為空或 'unmatched' 的院所
 */
function matchPendingPlaces() {
  Logger.log('=== 開始 Google Places 匹配 ===');

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('尚未設定 Places API Key。請先執行 setPlacesApiKey("你的API_KEY")');
  }

  // 檢查每日配額
  const todayCount = getTodayApiCallCount();
  if (todayCount >= PLACES_CONFIG.DAILY_QUOTA_LIMIT) {
    throw new Error('今日 API 呼叫量已達上限（' + todayCount + '/' + PLACES_CONFIG.DAILY_QUOTA_LIMIT + '）');
  }

  // 取得待匹配院所
  const facilities = getSheetData('FACILITIES');
  const placeLinks = getSheetData('PLACE_LINKS');
  const matchedCodes = {};
  placeLinks.forEach(function(p) {
    if (p.match_status === 'matched' || p.match_status === 'pending') {
      matchedCodes[p.nhi_facility_code] = p;
    }
  });

  const pending = facilities.filter(function(f) {
    return f.active_status === 'active' && !matchedCodes[f.nhi_facility_code];
  });

  Logger.log('待匹配院所: ' + pending.length + ' 間');
  Logger.log('今日已用 API 呼叫: ' + todayCount);

  let processed = 0;
  let matched = 0;
  let lowConfidence = 0;
  let errors = 0;

  // 逐筆匹配（控制速率）
  for (var i = 0; i < Math.min(pending.length, PLACES_CONFIG.BATCH_MATCH_SIZE); i++) {
    const fac = pending[i];

    try {
      const result = matchSingleFacility(fac, apiKey);

      if (result.match_status === 'matched') {
        matched++;
        savePlaceLink(fac.nhi_facility_code, result);
        Logger.log('✓ 匹配成功: ' + fac.facility_name);
      } else if (result.match_status === 'pending') {
        lowConfidence++;
        savePlaceLink(fac.nhi_facility_code, result);
        Logger.log('⚠ 待確認: ' + fac.facility_name + ' (信心度: ' + result.match_confidence + ')');
      } else {
        Logger.log('✗ 未匹配: ' + fac.facility_name);
      }

      processed++;
      incrementApiCallCount();

      // 速率控制：每次請求間隔 200ms
      Utilities.sleep(200);

    } catch (e) {
      errors++;
      Logger.log('!!! 匹配失敗: ' + fac.facility_name + ' — ' + e.message);
    }
  }

  Logger.log('=== 匹配完成 ===');
  Logger.log('處理: ' + processed + ' 間');
  Logger.log('高信心匹配: ' + matched);
  Logger.log('待確認: ' + lowConfidence);
  Logger.log('錯誤: ' + errors);
  Logger.log('今日累計 API 呼叫: ' + getTodayApiCallCount());
}

/**
 * 匹配單一院所
 */
function matchSingleFacility(facility, apiKey) {
  const queryText = facility.facility_name + ' ' + facility.address;

  // Text Search 請求
  const searchResponse = callPlacesTextSearch(queryText, apiKey);

  if (!searchResponse.places || searchResponse.places.length === 0) {
    return {
      google_place_id: '',
      match_status: 'unmatched',
      match_confidence: 'low',
      matched_name: '',
      matched_address: ''
    };
  }

  // 取第一個結果（Places API 已依相關性排序）
  const firstPlace = searchResponse.places[0];

  // 計算匹配信心度
  const confidence = calculateMatchConfidence(facility, firstPlace);

  let matchStatus, matchConfidenceLabel;

  if (confidence >= PLACES_CONFIG.HIGH_CONFIDENCE_THRESHOLD) {
    matchStatus = 'matched';
    matchConfidenceLabel = 'high';
  } else if (confidence >= PLACES_CONFIG.MEDIUM_CONFIDENCE_THRESHOLD) {
    matchStatus = 'pending';
    matchConfidenceLabel = 'medium';
  } else {
    matchStatus = 'pending';
    matchConfidenceLabel = 'low';
  }

  return {
    google_place_id: firstPlace.id,
    match_status: matchStatus,
    match_confidence: matchConfidenceLabel,
    matched_name: firstPlace.displayName ? firstPlace.displayName.text : '',
    matched_address: firstPlace.formattedAddress || '',
    manually_reviewed: false,
    reviewed_at: '',
    review_note: ''
  };
}

/**
 * 計算匹配信心度（0-1）
 */
function calculateMatchConfidence(facility, place) {
  let score = 0;
  let maxScore = 0;

  // 名稱相似度（權重 50%）
  maxScore += 50;
  const facName = facility.facility_name.replace(/診所|醫院|紀念|附設/g, '').trim();
  const placeName = (place.displayName ? place.displayName.text : '').replace(/診所|醫院|紀念|附設/g, '').trim();

  if (placeName.includes(facName) || facName.includes(placeName)) {
    score += 50;
  } else if (facName.length > 2 && placeName.includes(facName.substring(0, Math.min(3, facName.length)))) {
    score += 30;
  }

  // 地址相似度（權重 35%）
  maxScore += 35;
  const facAddr = facility.address.replace(/\s/g, '');
  const placeAddr = (place.formattedAddress || '').replace(/\s/g, '');

  // 取地址中的關鍵部分（路名+號）
  const facRoadMatch = facAddr.match(/([\u4e00-\u9fa5]+路|街|段)/);
  const placeRoadMatch = placeAddr.match(/([\u4e00-\u9fa5]+路|街|段)/);

  if (facRoadMatch && placeRoadMatch && facRoadMatch[0] === placeRoadMatch[0]) {
    score += 35;
  } else if (facAddr.substring(0, 6) === placeAddr.substring(0, 6)) {
    score += 20;
  }

  // 電話相似度（權重 15%）
  maxScore += 15;
  if (facility.phone && place.nationalPhoneNumber) {
    const facPhone = facility.phone.replace(/[^0-9]/g, '').substring(-8);
    const placePhone = place.nationalPhoneNumber.replace(/[^0-9]/g, '').substring(-8);
    if (facPhone === placePhone) {
      score += 15;
    }
  }

  return score / maxScore;
}

// ============ Places API 呼叫 ============

/**
 * Text Search 請求
 */
function callPlacesTextSearch(query, apiKey) {
  const payload = {
    textQuery: query,
    languageCode: 'zh-TW',
    regionCode: 'TW',
    pageSize: 3
  };

  const response = UrlFetchApp.fetch(PLACES_CONFIG.TEXT_SEARCH_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': PLACES_CONFIG.SEARCH_FIELDS
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  if (code !== 200) {
    throw new Error('Places Text Search 失敗 (HTTP ' + code + '): ' + response.getContentText().substring(0, 300));
  }

  return JSON.parse(response.getContentText());
}

/**
 * Place Details 請求（在使用者查看時即時呼叫）
 */
function getPlaceDetails(placeId, apiKey) {
  const url = PLACES_CONFIG.PLACE_DETAILS_URL + placeId;

  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': PLACES_CONFIG.DETAIL_FIELDS
    },
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  if (code !== 200) {
    throw new Error('Place Details 失敗 (HTTP ' + code + '): ' + response.getContentText().substring(0, 300));
  }

  const data = JSON.parse(response.getContentText());
  incrementApiCallCount();

  return {
    place_id: data.id,
    name: data.displayName ? data.displayName.text : '',
    address: data.formattedAddress || '',
    phone: data.nationalPhoneNumber || '',
    website: data.websiteUri || '',
    opening_hours: data.regularOpeningHours ? formatOpeningHours(data.regularOpeningHours) : '',
    maps_url: data.googleMapsUri || '',
    latitude: data.location ? data.location.latitude : null,
    longitude: data.location ? data.location.longitude : null,
    rating: data.rating || null,
    user_rating_count: data.userRatingCount || null
  };
}

/**
 * 格式化營業時間
 */
function formatOpeningHours(hours) {
  if (!hours.weekdayDescriptions) return '';
  return hours.weekdayDescriptions.join(', ');
}

// ============ API Key 管理 ============

/**
 * 設定 Places API Key（由管理者執行一次）
 * @param {string} key Google Places API Key
 */
function setPlacesApiKey(key) {
  if (!key || key.length < 20) {
    throw new Error('API Key 格式不正確');
  }
  PropertiesService.getScriptProperties().setProperty(PLACES_CONFIG.API_KEY_PROPERTY, key);
  Logger.log('✓ API Key 已設定');
  Logger.log('請記得到 Google Cloud Console 設定：');
  Logger.log('  1. API 限制：只啟用 Places API (New)');
  Logger.log('  2. 應用限制：Apps Script 專案 IP 或 HTTP referrer');
  Logger.log('  3. 每日配額上限');
}

/**
 * 取得 API Key
 */
function getApiKey() {
  return PropertiesService.getScriptProperties().getProperty(PLACES_CONFIG.API_KEY_PROPERTY);
}

/**
 * 刪除 API Key
 */
function deletePlacesApiKey() {
  PropertiesService.getScriptProperties().deleteProperty(PLACES_CONFIG.API_KEY_PROPERTY);
  Logger.log('API Key 已刪除');
}

// ============ 配額管理 ============

/**
 * 取得今日 API 呼叫次數
 */
function getTodayApiCallCount() {
  const today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
  const key = 'API_CALLS_' + today;
  const count = PropertiesService.getScriptProperties().getProperty(key);
  return count ? parseInt(count) : 0;
}

/**
 * 增加今日 API 呼叫次數
 */
function incrementApiCallCount() {
  const today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
  const key = 'API_CALLS_' + today;
  const current = getTodayApiCallCount();
  PropertiesService.getScriptProperties().setProperty(key, String(current + 1));
}

// ============ PLACE_LINKS 寫入 ============

/**
 * 儲存 Place Link 到工作表
 */
function savePlaceLink(nhiCode, result) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PLACE_LINKS');
  const headers = SHEET_CONFIG.PLACE_LINKS.headers;

  // 檢查是否已存在
  const existing = findRowInPlaceLinks(nhiCode);
  if (existing > 0) {
    // 更新
    const rowData = [
      nhiCode,
      result.google_place_id,
      result.match_status,
      result.match_confidence,
      result.matched_name,
      result.matched_address,
      false,
      '',
      ''
    ];
    sheet.getRange(existing, 1, 1, headers.length).setValues([rowData]);
  } else {
    // 新增
    sheet.appendRow([
      nhiCode,
      result.google_place_id,
      result.match_status,
      result.match_confidence,
      result.matched_name,
      result.matched_address,
      false,
      '',
      ''
    ]);
  }
}

/**
 * 在 PLACE_LINKS 中找指定院所代碼的列號
 */
function findRowInPlaceLinks(nhiCode) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PLACE_LINKS');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] === nhiCode) return i + 2;
  }
  return -1;
}

/**
 * 手動修改 Place ID（供管理介面使用）
 */
function manuallyUpdatePlaceId(nhiCode, placeId, note) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PLACE_LINKS');
  const headers = SHEET_CONFIG.PLACE_LINKS.headers;

  const row = findRowInPlaceLinks(nhiCode);
  const now = new Date().toISOString();

  if (row > 0) {
    sheet.getRange(row, headers.indexOf('google_place_id') + 1).setValue(placeId);
    sheet.getRange(row, headers.indexOf('match_status') + 1).setValue('matched');
    sheet.getRange(row, headers.indexOf('match_confidence') + 1).setValue('high');
    sheet.getRange(row, headers.indexOf('manually_reviewed') + 1).setValue(true);
    sheet.getRange(row, headers.indexOf('reviewed_at') + 1).setValue(now);
    if (note) {
      sheet.getRange(row, headers.indexOf('review_note') + 1).setValue(note);
    }
    Logger.log('✓ 已手動更新 Place ID: ' + nhiCode);
  } else {
    sheet.appendRow([nhiCode, placeId, 'matched', 'high', '', '', true, now, note || '手動新增']);
    Logger.log('✓ 已新增手動匹配紀錄: ' + nhiCode);
  }
}
