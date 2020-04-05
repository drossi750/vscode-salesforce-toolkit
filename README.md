# Visual Studio Code Salesforce Toolkit

[![](https://vsmarketplacebadge.apphb.com/version/drossi750.vscode-salesforce-toolkit.svg)](https://marketplace.visualstudio.com/items?itemName=drossi750.vscode-salesforce-toolkit) 
![GitHub issues](https://img.shields.io/github/issues-raw/drossi750/vscode-salesforce-toolkit)

This extension is designed to support developers with Salesforce DX projects. Provides quick visual access to scratch orgs, sandboxes, and other useful features.
The icon will appear if the workspace contains the Salesforce's DX project `force-app/` directory.

**Note:** Requires [SFDX CLI](https://developer.salesforce.com/tools/sfdxcli) installed.

# Main Features

### Orgs Explorer

Shows the Orgs (Dev Hubs, Sandboxes and Scratch Orgs) with different icon colors depending on the type.
On mouse hover, there are quick actions available (Open, Setup, Delete, Set as default)

![Org Explorer](./resources/org_explorer.gif)

Color code:
* Blue = Dev Hub
* Green = Sandbox
* Gray = Scratch Org
* Yellow = Default Scratch Org

___

### Org Info Panel

Clicking on an org from the Org Explorer, opens a practical all-in-one Info Panel for the org selected.

![Org Info Panel](./resources/org_info_panel.gif)

Info & Actions available:
* Quick view for Org Id, Release, API Version, Type and username
* Change Alias
* Show Access Token
* Show quick Link (Scratch orgs only). This link allows anyone to access to the org without login! 
* Open org Homepage / Setup Page / Deployment Status Page
* Logout from org
* Run Unit Tests (RunLocalTests)
* Deploy source
* SOQL Query tool
* REST API Explorer

___

### Results Viewer Panel

After performing source push or pull operations, clicking on the "Show Results" button of the notification

![Notification](./resources/notification.png)

You will access a page with the output of the DX command, in JSON.

![Results Viewer Panel](./resources/results-viewer.png)

___

**Enjoy!**
 
This software is free of charge, opensource, and it's developed during my spare time. If you feel that you want to contribute, you can:

[![Report Issue](https://img.shields.io/badge/Report%20Issue-Github-green)](https://github.com/drossi750/vscode-salesforce-toolkit/issues/new/choose)

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://paypal.me/drossi750)

___

![GitHub](https://img.shields.io/github/license/drossi750/vscode-salesforce-toolkit)

Icons made by [Smashicons](https://www.flaticon.com/authors/smashicons) from [www.flaticon.com](https://www.flaticon.com/)
