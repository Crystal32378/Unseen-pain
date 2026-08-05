function testNhiJsonEndpoint() {
  const url = 'https://info.nhi.gov.tw/api/iode0010/v1/rest/datastore/A21030000I-D2100F-001?limit=1&offset=0';

  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    followRedirects: true
  });

  const status = response.getResponseCode();
  const headers = response.getAllHeaders();
  const contentType = headers['Content-Type'] || headers['content-type'] || '';
  const text = response.getContentText('UTF-8');

  Logger.log('HTTP Status: ' + status);
  Logger.log('Content-Type: ' + contentType);
  Logger.log('回傳前 1000 字元：\n' + text.substring(0, 1000));

  if (status !== 200) {
    throw new Error('健保署分頁 JSON API 失敗，HTTP ' + status);
  }

  Logger.log('✅ 分頁 JSON API 可讀取。');
}
