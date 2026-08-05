/**
 * 看不見的痛｜唯讀院所搜尋 API
 *
 * 使用方式：
 * 1. 將本檔加入目前綁定 Google Sheet 的 Apps Script 專案。
 * 2. 部署為 Web App：執行身分「我」、存取權「任何人」。
 * 3. 測試：<WEB_APP_URL>?action=health
 *
 * 此 API 只讀取 FACILITIES，不會修改任何工作表。
 */

const PAIN_NAV_API_VERSION = '1.0.0';
const PAIN_NAV_API_MAX_LIMIT = 100;

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    const action = apiClean_(params.action || 'health').toLowerCase();

    if (action === 'health') {
      return apiJson_({
        ok: true,
        service: 'unseen-pain-facility-api',
        version: PAIN_NAV_API_VERSION,
        timestamp: new Date().toISOString()
      });
    }

    const facilities = apiReadFacilities_();

    if (action === 'cities') {
      return apiJson_({
        ok: true,
        cities: apiUniqueSorted_(facilities
          .filter(apiIsActive_)
          .map(function(row) { return apiClean_(row.city); })
          .filter(Boolean))
      });
    }

    if (action === 'districts') {
      const city = apiClean_(params.city);
      if (!city) {
        return apiJson_({ ok: false, error: 'city is required', districts: [] });
      }

      return apiJson_({
        ok: true,
        city: city,
        districts: apiUniqueSorted_(facilities
          .filter(function(row) {
            return apiIsActive_(row) && apiClean_(row.city) === city;
          })
          .map(function(row) { return apiClean_(row.district); })
          .filter(Boolean))
      });
    }

    if (action !== 'search') {
      return apiJson_({
        ok: false,
        error: 'unsupported action',
        supported_actions: ['health', 'cities', 'districts', 'search']
      });
    }

    const specialty = apiClean_(params.specialty || 'both').toLowerCase();
    const city = apiClean_(params.city);
    const district = apiClean_(params.district);
    const facilityType = apiClean_(params.facilityType || params.facility_type || 'any');
    const query = apiClean_(params.q).toLowerCase();
    const requestedLimit = Number(params.limit || 100);
    const requestedOffset = Number(params.offset || 0);
    const limit = Math.max(1, Math.min(
      Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 100,
      PAIN_NAV_API_MAX_LIMIT
    ));
    const offset = Math.max(0,
      Number.isFinite(requestedOffset) ? Math.floor(requestedOffset) : 0
    );

    let results = facilities.filter(apiIsActive_).filter(function(row) {
      const hasNeurology = apiToBool_(row.specialty_neurology);
      const hasRehabilitation = apiToBool_(row.specialty_rehabilitation);

      if (specialty === 'neurology' && !hasNeurology) return false;
      if (specialty === 'rehabilitation' && !hasRehabilitation) return false;
      if (specialty === 'both' && !hasNeurology && !hasRehabilitation) return false;

      if (city && apiClean_(row.city) !== city) return false;
      if (district && apiClean_(row.district) !== district) return false;
      if (facilityType && facilityType !== 'any' && apiClean_(row.facility_type) !== facilityType) {
        return false;
      }

      if (query) {
        const haystack = [
          row.facility_name,
          row.city,
          row.district,
          row.address,
          row.phone
        ].map(apiClean_).join(' ').toLowerCase();
        if (haystack.indexOf(query) === -1) return false;
      }

      return true;
    });

    const typeOrder = {
      medical_center: 1,
      regional_hospital: 2,
      district_hospital: 3,
      clinic: 4
    };

    results.sort(function(a, b) {
      const typeDiff = (typeOrder[apiClean_(a.facility_type)] || 9) -
        (typeOrder[apiClean_(b.facility_type)] || 9);
      if (typeDiff !== 0) return typeDiff;
      return apiClean_(a.facility_name).localeCompare(apiClean_(b.facility_name), 'zh-TW');
    });

    const total = results.length;
    const page = results.slice(offset, offset + limit).map(apiPublicFacility_);
    const lastSyncedAt = facilities.reduce(function(latest, row) {
      const value = apiClean_(row.last_synced_at);
      return value > latest ? value : latest;
    }, '');

    return apiJson_({
      ok: true,
      results: page,
      meta: {
        total: total,
        returned: page.length,
        limit: limit,
        offset: offset,
        has_more: offset + page.length < total,
        last_synced_at: lastSyncedAt,
        source: '衛福部中央健康保險署公開資料'
      }
    });
  } catch (error) {
    console.error(error);
    return apiJson_({
      ok: false,
      error: error && error.message ? error.message : 'unknown error'
    });
  }
}

function apiReadFacilities_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('FACILITIES');
  if (!sheet) throw new Error('FACILITIES sheet not found');
  if (sheet.getLastRow() < 2) return [];

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(apiClean_);

  return values.slice(1).map(function(row) {
    const item = {};
    headers.forEach(function(header, index) {
      item[header] = row[index];
    });
    return item;
  }).filter(function(row) {
    return apiClean_(row.nhi_facility_code) !== '';
  });
}

function apiPublicFacility_(row) {
  return {
    facility_id: apiClean_(row.facility_id),
    nhi_facility_code: apiClean_(row.nhi_facility_code),
    facility_name: apiClean_(row.facility_name),
    facility_type: apiClean_(row.facility_type),
    accreditation_type: apiClean_(row.accreditation_type),
    specialty_neurology: apiToBool_(row.specialty_neurology),
    specialty_rehabilitation: apiToBool_(row.specialty_rehabilitation),
    specialty_codes_raw: apiClean_(row.specialty_codes_raw),
    city: apiClean_(row.city),
    district: apiClean_(row.district),
    address: apiClean_(row.address),
    phone: apiClean_(row.phone),
    official_service_items: apiClean_(row.official_service_items),
    official_schedule_raw: apiClean_(row.official_schedule_raw),
    contract_start_date: apiClean_(row.contract_start_date),
    active_status: apiClean_(row.active_status),
    official_source: apiClean_(row.official_source),
    official_source_updated_at: apiClean_(row.official_source_updated_at),
    imported_at: apiClean_(row.imported_at),
    last_synced_at: apiClean_(row.last_synced_at),
    has_emg: 'unverified',
    has_nerve_conduction_study: 'unverified',
    has_physical_therapy: 'unverified',
    has_electrotherapy: 'unverified',
    appointment_required: 'unverified',
    match_status: 'unmatched',
    match_confidence: 'low'
  };
}

function apiIsActive_(row) {
  return apiClean_(row.active_status).toLowerCase() === 'active';
}

function apiToBool_(value) {
  if (value === true) return true;
  const normalized = apiClean_(value).toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function apiUniqueSorted_(values) {
  const seen = {};
  values.forEach(function(value) {
    const clean = apiClean_(value);
    if (clean) seen[clean] = true;
  });
  return Object.keys(seen).sort(function(a, b) {
    return a.localeCompare(b, 'zh-TW');
  });
}

function apiJson_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function apiClean_(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/^\uFEFF/, '').trim();
}
