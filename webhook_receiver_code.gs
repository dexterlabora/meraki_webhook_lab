function flattenObject(ob) {
  var toReturn = {};
  for (var i in ob) {
    if (!ob.hasOwnProperty(i)) continue;
    if ((typeof ob[i]) == 'object' && ob[i] !== null) {
      var flatObject = flattenObject(ob[i]);
      for (var x in flatObject) {
        if (!flatObject.hasOwnProperty(x)) continue;
        toReturn[i + '.' + x] = flatObject[x];
      }
    } else {
      toReturn[i] = ob[i];
    }
  }
  return toReturn;
}

function addExtraColumns(sheet, keylength) {
  var sheet_column_count = sheet.getMaxColumns();
  var extra_columns_required = keylength - sheet_column_count;
  if (extra_columns_required > 0) {
    sheet.insertColumns(1, extra_columns_required);
  }
}

function setHeaders(sheet, values) {
  var headerRow = sheet.getRange(1, 1, 1, values.length);
  headerRow.setValues([values]);
  headerRow.setFontWeight("bold").setHorizontalAlignment("center");
}

function display(data) {
  var flat = flattenObject(data);
  var keys = Object.keys(flat);
  var values = [];
  var headers = [];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var alertType = data['alertType'] || 'WebhookData';
  var alertSheet;
  if (ss.getSheetByName(alertType) == null) {
    ss.insertSheet(alertType);
    alertSheet = ss.getSheetByName(alertType);
    addExtraColumns(alertSheet, keys.length);
    alertSheet.setColumnWidths(1, keys.length, 200);
    headers = keys;
  } else {
    alertSheet = ss.getSheetByName(alertType);
    headers = alertSheet.getRange(1, 1, 1, alertSheet.getLastColumn() || 1).getValues()[0];
    var newHeaders = keys.filter(function(k) { return headers.indexOf(k) === -1; });
    headers = headers.concat(newHeaders);
  }
  setHeaders(alertSheet, headers);
  headers.forEach(function(h) {
    values.push(flat[h]);
  });
  var lastRow = Math.max(alertSheet.getLastRow(), 1);
  alertSheet.insertRowAfter(lastRow);
  alertSheet.getRange(lastRow + 1, 1, 1, headers.length).setValues([values]).setFontWeight("normal").setHorizontalAlignment("center");

  // Add image if present
  var imageUrlIndex = headers.indexOf('imageUrl');
  if (imageUrlIndex !== -1 && values[imageUrlIndex]) {
    var imageFormula = '=IMAGE("' + values[imageUrlIndex] + '")';
    alertSheet.getRange(lastRow + 1, imageUrlIndex + 1).setFormula(imageFormula);
  }
}

function doPost(e) {
  var params = JSON.stringify(e.postData.contents);
  params = JSON.parse(params);
  var postData = JSON.parse(params);
  display(postData);
  return HtmlService.createHtmlOutput("post request received");
} 