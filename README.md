# Visual Studio Code Salesforce Toolkit

This is a VS Code Extension for Salesforce DX projects. Provides quick visual access to scratch orgs, sandboxes, and other useful features.
The extension will become active if the workspace contains the Salesforce's DX project `force-app/` directory.

# Main Features

### Orgs Explorer

Shows the Orgs (Dev Hubs, Sandboxes and Scratch Orgs) with different icon colors depending on the type.
On mouse hover, there are quick actions available (Open, Setup, Delete, Set as default)

![Org Explorer](./media/org_explorer.gif)

Color code:
* Blue = Dev Hub
* Green = Sandbox
* Gray = Scratch Org
* Yellow = Default Scratch Org

### Org Info Panel

Clicking on an org from the Org Explorer, opens a practical all-in-one Info Panel for the org selected.

![Org Info Panel](./media/org_info_panel.gif)

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

**Enjoy!**

Author: drossi750@gmail.com

Icons made by [Smashicons](https://www.flaticon.com/authors/smashicons) from [www.flaticon.com](https://www.flaticon.com/)