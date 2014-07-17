////////////////////////////////////////////////////////////////////////
//
//Log passed values
//
////////////////////////////////////////////////////////////////////////

function myLogger_(logString) {
  if (LOG_ON) {
    //Logger.log(logString);
    
    var spreadsheet = SpreadsheetApp.openById(LOG_SPREADSHEET_KEY);
    var sheetsArr = spreadsheet.getSheets();
    sheetsArr[0].appendRow([logString]); 
    }
}

////////////////////////////////////////////////////////////////////////
//
//Clear log
//
////////////////////////////////////////////////////////////////////////
function clearLogSpreadsheet() {
  var spreadsheet = SpreadsheetApp.openById(LOG_SPREADSHEET_KEY);
  var sheetsArr = spreadsheet.getSheets();
  sheetsArr[0].clearContents();
}

function logDb() {
  var resultArr = dbQuery_({});
  myLogger_("scriptDb: "+JSON.stringify(resultArr));
}

////////////////////////////////////////////////////////////////////////
//
//Empty ScriptDb
//
////////////////////////////////////////////////////////////////////////

function dbDeleteAll() {
  var DB = ScriptDb.getMyDb();
  while (true) {
    var result = DB.query({}); // Get everything, up to limit.
    if (result.getSize() == 0) {
      break;
    }
    while (result.hasNext()) {
      DB.remove(result.next());
    }
  }
}

////////////////////////////////////////////////////////////////////////
//
//Trim String
//
////////////////////////////////////////////////////////////////////////
function trim_(str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}


function padSingleNumber_(numberToPad) {
  
  var paddedNumber;
  
  // pad single digit durations with leading zero so they show up in right order on chart axis
  if (numberToPad > -1 && numberToPad < 10) {
    paddedNumber = "0" + numberToPad.toString();
  }
  else if (numberToPad < 0 && numberToPad > -10) {
    paddedNumber = "-0" + numberToPad.toString().substring(1);
  }
  else {
    paddedNumber = numberToPad.toString();
  }
  
  return paddedNumber;
}


// https://gist.github.com/knowtheory/913112
function pp_(object, depth, embedded) { 
  typeof(depth) == "number" || (depth = 0)
  typeof(embedded) == "boolean" || (embedded = false)
  var newline = false
  var spacer = function(depth) { var spaces = ""; for (var i=0;i<depth;i++) { spaces += "  "}; return spaces }
  var pretty = ""
  if (      typeof(object) == "undefined" ) { pretty += "undefined" }
  else if ( typeof(object) == "boolean" || 
            typeof(object) == "number" ) {    pretty += object.toString() } 
  else if ( typeof(object) == "string" ) {    pretty += "\"" + object + "\"" } 
  else if (        object  == null) {         pretty += "null" } 
  else if ( object instanceof(Array) ) {
    if ( object.length > 0 ) {
      if (embedded) { newline = true }
      var content = ""
      for each (var item in object) { content += pp_(item, depth+1) + ",\n" + spacer(depth+1) }
      content = content.replace(/,\n\s*$/, "").replace(/^\s*/,"")
      pretty += "[ " + content + "\n" + spacer(depth) + "]"
    } else { pretty += "[]" }
  } 
  else if (typeof(object) == "object") {
    if ( Object.keys(object).length > 0 ){
      if (embedded) { newline = true }
      var content = ""
      for (var key in object) { 
        content += spacer(depth + 1) + key.toString() + ": " + pp_(object[key], depth+2, true) + ",\n" 
      }
      content = content.replace(/,\n\s*$/, "").replace(/^\s*/,"")
      pretty += "{ " + content + "\n" + spacer(depth) + "}"
    } else { pretty += "{}"}
  }
  else { pretty += object.toString() }
  return ((newline ? "\n" + spacer(depth) : "") + pretty)
}
