/**
 * @fileoverview Send notification email
 */

function notify(notificationObj, rootFolderName) {
  var html = HtmlService.createTemplateFromFile('email');
  html.sharedFolderObj = SHARED_FOLDER_OBJ;
  html.removeFilePermissions = REMOVE_FILE_PERMISSIONS;
  html.notifyFileIssues = NOTIFY_FILE_ISSUES;
  html.notificationObj = notificationObj;
  html.rootFolderName = rootFolderName;

  var message = html.evaluate();  
  var subject = rootFolderName + ' Inadvertent Shares';
  GmailApp.sendEmail(NOTIFICATION_EMAIL,
                     subject,
                     message.getContent(), {
                       name: EMAIL_SENDER,
                       htmlBody: message.getContent()
                     }
                    );

}
