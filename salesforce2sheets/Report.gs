function refreshReport_(){
  
  var template = HtmlService.createTemplateFromFile('reportRefreshUi');  // calls runReportRefresh()  
  var output = template.evaluate().setSandboxMode(HtmlService.SandboxMode.NATIVE);
  output.setHeight(300).setWidth(300);
  
  SpreadsheetApp.getActiveSpreadsheet().show(output);
  
}

function importReport_(origin){

  var template = HtmlService.createTemplateFromFile('reportUi');  // calls runReport() 
  
  // initialize for no radio button selection 
  template.reportArr = ["Select Report Type First"];
  myLogger_(template.reportArr);
  
  // template variables 
  template.reportSelected = "None Selected";
   
  var configObj = {};
  if (origin == "invalidRefresh") {
    configObj.invalidRefresh = "true";
    configObj.message = "Please select a report first";
  }
  else {
    configObj.invalidRefresh = "false";
  }
  template.configObj = configObj;
  
  var output = template.evaluate().setSandboxMode(HtmlService.SandboxMode.NATIVE).setTitle("Import Report").setWidth(300);

  SpreadsheetApp.getUi().showSidebar(output);
}

function _getReportList(selection) {
  if (selection == 1) { // "Recent"
    response = getRecentReports()
  }
  else { // "All"
    response = getAllReports_()
  } 
  
  return response;
}

function getRecentReports() {  // get recent reports
  var reportObj = {};
  var reportArr = [];
  var dataResponseArr = fetchREST_('analytics/reports');  
  if (dataResponseArr.length) {
    dataResponseArr = _.sortBy(dataResponseArr, function(obj){ return obj.name.toLowerCase(); });
  }
  
  var len = dataResponseArr.length;
  for (var i=len;i--;) {
    reportObj[dataResponseArr[i].name] = dataResponseArr[i].id;
    reportArr.push(dataResponseArr[i].name);
  }
  reportArr.push("Select Report");

  return {reportObj: reportObj, reportArr: reportArr};
}

function getAllReports_() { // get recent reports
  // get all reports
  var reportObj = {};
  var reportArr = [];
  var dataResponseArr = fetchREST_('query/?q=select ID, NAME from REPORT').records;
  if (dataResponseArr.length) {
    dataResponseArr = _.sortBy(dataResponseArr, function(obj){ return obj.Name.toLowerCase(); });
  }
  
  var len = dataResponseArr.length;
  for (var i=len;i--;) {
    reportObj[dataResponseArr[i].Name] = dataResponseArr[i].Id;
    reportArr.push(dataResponseArr[i].Name);
  }
  reportArr.push("Select Report");

  return {reportObj: reportObj, reportArr: reportArr};
}


function fetchREST_(query) {
  myLogger_("query "+query);
  var getDataURL = PropertiesService.getUserProperties().getProperty(BASE_URL_PROPERTY_NAME) + '/services/data/v29.0/'+query;
  var dataResponse = UrlFetchApp.fetch(getDataURL,getUrlFetchOptions_()).getContentText(); 
  myLogger_("dataResponse "+dataResponse);

  return JSON.parse(dataResponse);
}

/*
function runReportTestHarness() {
  if (Date.parse("11/16/2011")) {
    myLogger_("true");
  }
  else {
    myLogger_("false");
  }
  if (Date.parse("006i000000ERqZZAA1")) {
    myLogger_("true");
  }
  else {
    myLogger_("false");
  }
}
*/
function runReportRefresh() {
  myLogger_("*** runReportRefresh");
  var report = dbQuery_({userId:USER, spreadsheetId:SPREADSHEET_ID, sheetId:SHEET.getSheetId()})[0];
  if (report) { // report has been run previously
    var sheet = SpreadsheetApp.getActiveSheet();    
    runReport(report.reportId);
  }
  else {
    importReport_("invalidRefresh");
  } 
}


function runReport(reportId, reportName){
  myLogger_("*** runReport");
  myLogger_("reportId "+reportId);
  myLogger_("reportName" + reportName);
  
   var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Expenses");
 if (sheet != null) {
   Logger.log(sheet.getIndex());
 }
  
  if (reportName && SS.getSheetByName(reportName) != null) {
    throw new Error("A sheet already exists for this report");
  }

  var getDataURL = PropertiesService.getUserProperties().getProperty(BASE_URL_PROPERTY_NAME) + '/services/data/v29.0/analytics/reports/'+reportId+'?includeDetails=true';
  var dataResponse = UrlFetchApp.fetch(getDataURL,getUrlFetchOptions_()).getContentText(); 
  var dataResponseObj = JSON.parse(dataResponse);
  //myLogger_(pp_(dataResponseObj));
  
  if (typeof dataResponseObj[0] == "object" && dataResponseObj[0].errorCode) {
    throw new Error(dataResponseObj[0].message); // Salesforce User must have a  full license: will get an insufficient privileges error if a free license
  }
  
  var spreadsheetValueArr = [];
  var spreadsheetFormulaArr = [];

  if (dataResponseObj.hasDetailRows) {
    var detailColumnsArr = dataResponseObj.reportMetadata.detailColumns;
    var detailColumnInfoObj = dataResponseObj.reportExtendedMetadata.detailColumnInfo;
    
    var headerArr = [];
    var headerTitleMappingObj = {};
    var len = detailColumnsArr.length;
    for (var i=0;i<len;i++) {
      headerArr.push(detailColumnInfoObj[detailColumnsArr[i]].label);  // need to preserve array order when getting row data
    }
    myLogger_("headerArr "+headerArr);
    //spreadsheetArr.push(headerArr);
    
    var sfBrowserInstanceUrl = PropertiesService.getUserProperties().getProperty(BASE_URL_PROPERTY_NAME);
    //var dataRowArr = dataResponseObj.factMap["1_0!T"].rows;
    //myLogger_("_.keys(dataResponseObj.factMap)[0] "+_.keys(dataResponseObj.factMap)[0]);
    myLogger_("");
    myLogger_("*** dataResponseObj ***");
    for (var i in dataResponseObj) {
      myLogger_(i+ ": " + JSON.stringify(dataResponseObj));
    }
    myLogger_("");
    myLogger_("*** factMap ***");
    for (var i in dataResponseObj.factMap) {
      myLogger_(i + ": "+JSON.stringify(dataResponseObj.factMap));
    }
    myLogger_("_.keys(dataResponseObj.factMap)[0] "+_.keys(dataResponseObj.factMap)[0]);
    myLogger_("dataResponseObj.factMap[_.keys(dataResponseObj.factMap)[0]].rows "+JSON.stringify(dataResponseObj.factMap[_.keys(dataResponseObj.factMap)[0]].rows));

    var groupRowArr;
    var dataRowArr = [];
    for (var group in dataResponseObj.factMap) {
      myLogger_("group "+group);
      myLogger_("dataResponseObj.factMap[group] "+JSON.stringify(dataResponseObj.factMap[group]));
      groupRowArr = dataResponseObj.factMap[group].rows;
      myLogger_("groupRowArr "+JSON.stringify(groupRowArr));
      len = groupRowArr.length;
      for (var j=len;j--;) {
        dataRowArr.push(groupRowArr[j].dataCells);
      }
    }
    myLogger_("dataRowArr "+dataRowArr);
    //var dataRowArr = dataResponseObj.factMap[_.keys(dataResponseObj.factMap)[0]].rows; // the object item containing the detailed rows is named differently depending on the report type (detail or summary)
    var dataCellArr = [];
    var spreadsheetValueRowArr = [];
    //var spreadsheetFormulaRowArr = [];
    var len = dataRowArr.length;
    myLogger_('query row count '+len);

    for (var i=0;i<len;i++) {
      myLogger_("dataRowArr[i] "+JSON.stringify(dataRowArr[i]));
      dataCellArr = dataRowArr[i]; //.dataCells;
      spreadsheetValueRowArr = []; // reset it for each row
      //spreadsheetFormulaRowArr = []; // reset it for each row
      
      var dataCellArrLen = dataCellArr.length;
      for (var j=0;j<dataCellArrLen;j++) {  // need to traverse in same order as header array
        if (typeof dataCellArr[j].value == "object" || Date.parse(dataCellArr[j].label)) { // Currency or Date
          spreadsheetValueRowArr.push(dataCellArr[j].label);
          //spreadsheetFormulaRowArr.push('="'+dataCellArr[j].label+'"');         
        }
        else { 
          if (dataCellArr[j].value == dataCellArr[j].label) {
            spreadsheetValueRowArr.push(dataCellArr[j].value);
            //spreadsheetFormulaRowArr.push('="'+dataCellArr[j].value+'"');
          }
          else {// hyperlink to salesforce object
            //spreadsheetValueRowArr.push(dataCellArr[j].label);
            spreadsheetValueRowArr.push('=hyperlink("' + sfBrowserInstanceUrl + '/' + dataCellArr[j].value + '","' + dataCellArr[j].label + '")'); //'=hyperlink("' + sfBrowserInstanceUrl + dataCellArr[j].value + '","' + dataCellArr[j].label + '")';
            //spreadsheetFormulaRowArr.push('=hyperlink("' + sfBrowserInstanceUrl + '/' + dataCellArr[j].value + '","' + dataCellArr[j].label + '")'); //'=hyperlink("' + sfBrowserInstanceUrl + dataCellArr[j].value + '","' + dataCellArr[j].label + '")';
          }
        }
      }
      spreadsheetValueArr.push(spreadsheetValueRowArr);
      //spreadsheetFormulaArr.push(spreadsheetFormulaRowArr);
    }
  }

  
  // populate sheet
  SHEET.clearContents();
  if (reportName) {
    SHEET.setName(reportName);
  }
  //myLogger_("spreadsheetFormulaArr.length "+spreadsheetValueArr.length);
  //myLogger_("headerArr.length "+headerArr.length);
  SHEET.getRange(1,1,1,headerArr.length).setValues([headerArr]);
  SHEET.getRange(1,1,1,headerArr.length).setFontWeight("bold");
  if (spreadsheetValueArr.length) { // ie. not 0    
      SHEET.getRange(2,1,spreadsheetValueArr.length,headerArr.length).setValues(spreadsheetValueArr);
    //SHEET.getRange(2,1,spreadsheetFormulaArr.length,headerArr.length).setFormulas(spreadsheetFormulaArr);
  }
  
  if (reportName) { // not a refresh
  // store report id by sheet id key to support refresh and asynch reports
    dbUpsert_({userId: USER, spreadsheetId:SPREADSHEET_ID, sheetId: SHEET.getSheetId(), reportId: reportId, reportName: reportName});
  }
  
  if (len == 2000) {
    //throw new Error("Report may be missing data: Salesforce API supports a maximum of 2000 rows");
    SpreadsheetApp.getActiveSpreadsheet().toast('Report may be missing data: Salesforce API supports a maximum of 2000 rows','Warning', 3);
  }
  
}

function clearSheet_() {
  //SHEET.setName("Sheet1");
  SHEET.clearContents();
}

function help_() {
  var HTMLToOutput;
  HTMLToOutput = HtmlService.createHtmlOutputFromFile('help').getContent();
  var output = HtmlService.createHtmlOutput(HTMLToOutput).setSandboxMode(HtmlService.SandboxMode.NATIVE);
  output.setHeight(200).setWidth(300);
  
  SpreadsheetApp.getActiveSpreadsheet().show(output);
}

function about_() {
  var HTMLToOutput;
  HTMLToOutput = HtmlService.createHtmlOutputFromFile('about').getContent();
  var output = HtmlService.createHtmlOutput(HTMLToOutput).setSandboxMode(HtmlService.SandboxMode.NATIVE);
  output.setHeight(400).setWidth(300);
  
  SpreadsheetApp.getActiveSpreadsheet().show(output);
}

function dbQuery_(queryObj) {
  myLogger_("queryObj "+JSON.stringify(queryObj));
  var resultArr = [];
  var DB = ScriptDb.getMyDb();
  var results = DB.query(queryObj);
  while (results.hasNext()) {
    var item = results.next();
    resultArr.push(item);
  }

  return resultArr;
}

function dbUpsert_(itemObj) {
  var DB = ScriptDb.getMyDb();
  var results = DB.query({userId:USER, spreadsheetId:SPREADSHEET_ID, sheetId:itemObj.sheetId});
  while (results.hasNext()) {
    var item = results.next();    
  }

  if (item) { // update
      myLogger_(item.getId());
    item.reportId = itemObj.reportId;
    DB.save(item);
  }
  else { // insert
    DB.save(itemObj);
  }

}

