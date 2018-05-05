/**
 * @fileoverview Utility to detect and address folder and file sharing which is broader than intended
 * Removes overly broad permissions at folder and optinally file level
 * Notifies specified email of breaches
 */

/**
 * Main code
 */
function main() {
  var user = Session.getActiveUser().getEmail();
  var hostDomain = user.split('@')[1];
  var permittedDomainArr  = [];
  var folder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  var notificationObj = {};
  
  recurseOverFolders_(hostDomain, folder, permittedDomainArr, notificationObj);
  var rootFolderName = folder.getName();
  notify_(notificationObj, rootFolderName);
}

/**
 * Recursive navigation down the folder hierarchy
 * @param {string} host domain, ie. the domain from which the script is run; this is considered valid
 * @param {folder} folder; folder to scan, beginning with root
 * @param {arr} whitelisted domains
 * @param {obj} list of all notifications indexed by file/folder id
 * @private
 */
function recurseOverFolders_(hostDomain, folder, permittedDomainArr, notificationObj) {
  
  var file;
  var isFolder;
  
  try {  
    
    // check whether down at shared folder level
    var folderId = folder.getId();
    if (SHARED_FOLDER_OBJ[folderId]) { 
      // add to list of permitted domains at this level
      permittedDomainArr.push(SHARED_FOLDER_OBJ[folderId]);
    }
    //validate folder permissions
    isFolder = true;
    var userArr = folder.getViewers(); // includes commenters
    validatePermissions_(hostDomain, isFolder, folder, 'VIEWER', userArr, permittedDomainArr, notificationObj);
    var userArr = folder.getEditors();
    validatePermissions_(hostDomain, isFolder, folder, 'EDITOR', userArr, permittedDomainArr, notificationObj);
    
    //validate file permissions
    isFolder = false;
    var files = folder.getFiles();
    while (files.hasNext()) {
      file = files.next();
      if (!file.isTrashed()) {
        var userArr = file.getViewers(); // includes commenters
        validatePermissions_(hostDomain, isFolder, file, 'VIEWER', userArr, permittedDomainArr, notificationObj);
        var userArr = file.getEditors();
        validatePermissions_(hostDomain, isFolder, file, 'EDITOR', userArr, permittedDomainArr, notificationObj);
      }
    }
    
    //do the same for nested folders
    var folders = folder.getFolders();
    while (folders.hasNext()) {    
      folder = folders.next();
      var branchPermittedDomainArr = (permittedDomainArr.length > 0) ? permittedDomainArr: []; // need one per branch or permissions are accumulated across folders as well as down
      recurseOverFolders_(hostDomain, folder, permittedDomainArr, notificationObj);
    }
  }
  catch (error) {
    Logger.log(error);
  }

}

/**
 * Validate permissions
 * @param {string} host domain, ie. the domain from which the script is run; this is considered valid
 * @param {boolean} whether asset is a file or folder
 * @param {file or folder} asset
 * @param {ENUM} 'VIEWER' or 'EDITOR'
 * @param {arr} users with whom the folder is shared with this permission
 * @param {arr} whitelisted domains at this folder level
 * @param {obj} list of all notifications indexed by file/folder id
 * @private
 */
function validatePermissions_(hostDomain, isFolder, fileOrFolder, permissionType, userArr, permittedDomainArr, notificationObj) {

  var permissionsArr = [];
  var userArrLen = userArr.length;
  var userDomain;
  for (var i=userArrLen; i--;) {
    userDomain = userArr[i].getDomain();
    if (userDomain != hostDomain && permittedDomainArr.indexOf(userDomain) == -1) {
      fixPermissions_(isFolder, fileOrFolder, permissionType, userArr[i], permittedDomainArr, notificationObj);
    }
  }
}

/**
 * Fix permissions
 * @param {boolean} whether asset is a file or folder
 * @param {file or folder} asset
 * @param {ENUM} 'VIEWER' or 'EDITOR'
 * @param {user} user whose permission to remove
 * @param {arr} whitelisted domains at this folder level
 * @param {obj} list of all notifications indexed by file/folder id
 * @private
 */
function fixPermissions_(isFolder, fileOrFolder, permissionType, user, permittedDomainArr, notificationObj) {
  
  var result = '';
  
  if ((isFolder && REMOVE_FOLDER_PERMISSIONS) || (!isFolder && REMOVE_FILE_PERMISSIONS)) {
    // may not want to remove individual file shares
    
    if (permissionType == 'VIEWER') {
      try {
        fileOrFolder.removeViewer(user); // includes commenter
        result = 'SUCCESS';
      }
      catch (error){
        result = 'FAILURE';
      }        
    }
    else {
      try {
        fileOrFolder.removeEditor(user); // includes commenter
        result = 'SUCCESS';
      }
      catch (error){
        result = 'FAILURE';
      }
    }
  }
  addNotification_(isFolder, fileOrFolder, permissionType, user, permittedDomainArr, notificationObj, result); 
}

/**
 * Add a permissions violation notification 
 * @param {boolean} whether asset is a file or folder
 * @param {file or folder} asset
 * @param {ENUM} 'VIEWER' or 'EDITOR'
 * @param {user} user whose permission to remove
 * @param {arr} whitelisted domains at this folder level
 * @param {obj} list of all notifications indexed by file/folder id
 * @param {boolean} whether permission removal was successful
 * @private
 */
function addNotification_(isFolder, fileOrFolder, permissionType, user, permittedDomainArr, notificationObj, result) {
  var id;
  var name;
  var url;
  var email;
  try {
    id = fileOrFolder.getId();
    name = fileOrFolder.getName();
    url = fileOrFolder.getUrl();
    email = user.getEmail();
  }
  catch (error){
  }
  
  var assetType = isFolder ? 'Folder' : 'File';
  var permittedDomains = '';
  var permittedDomainArrLen = permittedDomainArr.length;
  for (var i=0;i<permittedDomainArrLen;i++) {
    if (permittedDomains) {
      permittedDomains = permittedDomains + ', ';
    }
    permittedDomains = permittedDomains + permittedDomainArr[i];
  }
  
  if (!notificationObj[id]) {
    notificationObj[id] = {assetType: assetType, fileOrFolder: fileOrFolder, name: name, url: url, permittedDomains: permittedDomains, emailArr: [email], permissionTypeArr: [permissionType], resultArr: [result]};
  }
  else {
    notificationObj[id].emailArr.push(email);
    notificationObj[id].permissionTypeArr.push(permissionType);
    notificationObj[id].resultArr.push(result);
  }
}
