Salesforce2Sheets
=================

Security Considerations
-----------------------
Store OAuth credentials in PropertiesService: https://developers.google.com/apps-script/reference/properties/properties-service

- Script/document/user properties can only be accessed by someone with 'write' access on the script ACL

- Don't use the deprecated ScriptProperties or UserProperties

Make sensitive functions private (suffix with underscore)

Use JSON.parse() instead of eval()

Host image files yourself and refer to them via https:// in <img src=""> 

- The Salesforce logo reference isn't implemented in this way in this sample


Porting
-------
Replace ScriptDb with getUserProperties: https://developers.google.com/apps-script/reference/properties/properties-service#getUserProperties()

- ScriptDb is deprecated and will be turned off later this year: https://developers.google.com/apps-script/guides/script-db/

Implement Javascript Styleguide: https://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml

- The code is largely compliant; however, many of the comments aren't JSDoc compliant
