// Copyright (C) 2020 Davide Rossi
// 
// This file is part of vscode-salesforce-toolkit.
// 
// vscode-salesforce-toolkit is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// vscode-salesforce-toolkit is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with vscode-salesforce-toolkit.  If not, see <http://www.gnu.org/licenses/>.

import * as vscode from 'vscode';
import * as path from 'path';
import * as utilities from './utilities';
import { getExtensionPath } from './extension';
import { getContext } from './extension';

/**
 * Manages Results webpanels
 */
export class ResultsPanel {
    public static currentPanel: ResultsPanel | undefined;
    public static readonly viewType = 'results';
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    /**
     * Entry point for instantiation 
     * 
     * @param operation the operation for which to show results
     * @param results the results (JSON) to render in the view
     */
    public static createOrShow(operation: string, results: string) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        ResultsPanel.currentPanel?.dispose();

        const panel = vscode.window.createWebviewPanel(
            ResultsPanel.viewType,
            `Results`,
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                enableFindWidget: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.file(path.join(getExtensionPath(), 'resources'))]
            }
        );

        ResultsPanel.currentPanel = new ResultsPanel(panel, operation, results);
    }

    /**
     * Private constructor. Instantiation through static createOrShow() method.
     * 
     * @param panel 
     * @param operation the operation for which to show results
     * @param results the results (JSON) to render in the view
     */
    private constructor(panel: vscode.WebviewPanel, operation: string, results: string) {
        this._panel = panel;

        // Set the webview's initial html content
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview, operation, results);

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            _e => {
                if (this._panel.visible) {
                    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview, operation, results);
                }
            },
            null,
            this._disposables
        );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(async message => this.processReceivedMessage(message), null, getContext().subscriptions);

    }

    /**
     * Make sure to dispose related disposables
     */
    public dispose() {
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    /**
     * Dispose if any panel
     */
    public static disposeIfVisible() {
        if (ResultsPanel.currentPanel) {
            ResultsPanel.currentPanel.dispose();
        }
    }

    /**
     * Process and return the html to be rendered in the webview
     * 
     * @param webview Used to generate URIs for static resources
     * @param operation the operation for which to show results
     * @param results the results (JSON) to render in the view
     */
    private _getHtmlForWebview(webview: vscode.Webview, operation: string, results: string) {
        let varWrapper = {
            cssFile: webview.asWebviewUri(vscode.Uri.file(path.join(getExtensionPath(), 'resources', 'html', 'scripts', 'styles.css'))),
            renderjsonFile: webview.asWebviewUri(vscode.Uri.file(path.join(getExtensionPath(), 'resources', 'html', 'scripts', 'renderjson.js'))),
            jsFile: webview.asWebviewUri(vscode.Uri.file(path.join(getExtensionPath(), 'resources', 'html', 'scripts', 'results_explorer.js'))),
            operation: operation,
            results: results
        };
        return utilities.loadFromTemplate(path.join(getExtensionPath(), 'resources', 'html', 'results-explorer-template.html'), varWrapper);
    }


    /**
     * Process messages sent from the Webview
     * @param message JSON Message from the Webview
     */
    private async processReceivedMessage(message: any) {
        switch (message.command) {
            default:
                utilities.loggingChannel.appendLine('NOT SUPPORTED');
                return;
        }
    }
}
