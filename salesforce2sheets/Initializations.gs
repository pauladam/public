// Salesforce User must have a  full license: will get an insufficient privileges error if a free license

var LOG_ON = false;

// URL of script project (in editor) with /exec (and everything which follows) replaced by /usercallback
var REDIRECT_URL_USERCALLBACK = 'https://script.google.com/a/google.com/macros/d/[YOUR SCRIPT ID in Editor]/usercallback';

//var REDIRECT_URL = 'https://docs.google.com/a/google.com/uc?authuser=0&id=[YOUR REDIRECT HTML DOC ID]&export=view';

var LOG_SPREADSHEET_KEY = '[YOUR LOG SPREADSHEET KEY - ONLY REQUIRED IF LOGGING ON]';
var DEMO_TRACKING_SPREADSHEET_KEY = '[YOUR USAGE TRACKING SPREADSHEET KEY]';

var TOKEN_PROPERTY_NAME = 'SF_BROWSER_OAUTH_TOKEN'; 
var BASE_URL_PROPERTY_NAME = 'SF_BROWSER_INSTANCE_URL'; 

var AUTHORIZE_URL = "https://login.salesforce.com/services/oauth2/authorize"; 
var TOKEN_URL = "https://login.salesforce.com/services/oauth2/token";

/*
Not using the callback.html file in this implementation

// Upload callback.html file to Google Drive in web hosting mode as described here: https://support.google.com/drive/answer/2881970?hl=en
// Callback file source is in the callback html source.gs
// Get ID of folder from sharing dialog and paste it into following
// Paste the full redirect URL below into the Salesforce Callback URL (Create -> Apps -> Connected Apps -> API)
// Don't need to re-version and re-publish after changing this URL

var REDIRECT_URL_EXEC = 'https://script.google.com/a/macros/google.com/s/[YOUR EXEC ID]/exec'; 
*/

var DATE = new Date();

try {
  var SS = SpreadsheetApp.getActiveSpreadsheet();
  var SPREADSHEET_ID = SS.getId();
  var SHEET = SpreadsheetApp.getActiveSheet();
  //var DB = ScriptDb.getMyDb();
  var USER = Session.getUser().getEmail();
}
catch(err) {
  // Add On not yet Enabled
}

function onInstall(e) { // required for add ons
  onOpen(e);
}

function onOpen(e) {
  var menu = SpreadsheetApp.getUi().createAddonMenu(); 
  //var menu = SpreadsheetApp.getUi().createMenu('Test Unify'); 
  if (false) { //e && e.authMode == ScriptApp.AuthMode.NONE) { 
    // Add a normal menu item (works in all authorization modes).
    menu.addItem("About", "about_");
  } 
  else {

    menu.addItem("Import Report", "importReport_")
    .addItem("Refresh Report", "refreshReport_")
    .addSeparator()
    .addItem("Clear Sheet", "clearSheet_")
    .addItem("Disconnect", "disconnect_")
    .addSeparator()
    .addItem("About", "about_");
  }
  menu.addToUi();

}
