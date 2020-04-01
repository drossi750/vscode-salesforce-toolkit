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

const vscode = acquireVsCodeApi();

window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'showAccessLink':
            document.querySelector('#accessLinkTextArea').value = message.accessLinkUrl;
            break;
        case 'showQueryResults':
            document.querySelector('#queryResultsTextArea').value = message.data;
            break;
        case 'setRelease':
            document.querySelector('#orgRelease').innerHTML = message.release;
            document.querySelector('#apiVersion').innerHTML = message.apiVersion;
            document.querySelector('#restCallUrl').value = message.restUrl;
            break;
        case 'showRestCallResults':
            renderjson.set_show_to_level(1);
            document.querySelector('#restResults').innerHTML = '';
            document.querySelector('#restResults').appendChild(
                renderjson(message.body)
            );
            break;
    }
});

function executeCommand(cmd) {
    vscode.postMessage({ command: cmd });
}

function showAccessToken() {
    document.querySelector('#accessToken').classList.remove('hidden');
    document.querySelector('#showTokenButton').classList.add('hidden');;
}

function retrieveAccessLink() {
    document.querySelector('#accessLink').classList.remove('hidden');
    document.querySelector('#accessLinkTextArea').value = 'Loading...';
    document.querySelector('#accessLinkTextArea').classList.remove('hidden');
    document.querySelector('#showAccessLinkButton').classList.add('hidden');
    executeCommand('accessLink');
}

function copyToClipboard(elementSelector) {
    var textArea = document.querySelector(elementSelector);
    textArea.select();
    document.execCommand("copy");
}

function setAlias() {
    var alias = document.querySelector('#orgAlias').value;
    alias = alias.replace(/[^A-Za-z0-9-]/g, "_");
    document.querySelector('#orgAlias').value = alias;
    vscode.postMessage({ command: 'setAlias', alias: alias });
}

function executeQuery(queryTextAreaSelector, resultTextAreaSelector) {
    var query = document.querySelector(queryTextAreaSelector).value;
    var limit = document.querySelector('#queryLimit').value;
    var outputFormat = document.querySelector('input[name="queryOutput"]:checked').value;
    document.querySelector(resultTextAreaSelector).value = 'Executing query...';
    vscode.postMessage({ command: 'query', soql: query, limit: limit, format: outputFormat });
}

function showRestBody() {
    document.querySelector('#restBody').classList.remove('hidden');
    document.querySelector('#restBodyTextArea').classList.remove('hidden');
}

function hideRestBody() {
    document.querySelector('#restBody').classList.add('hidden');
    document.querySelector('#restBodyTextArea').classList.add('hidden');
}

function executeRestCall() {
    document.querySelector('#restResultsLabel').classList.remove('hidden');
    document.querySelector('#restResults').innerHTML = '<span class="inline-block loader">Loading...</span>';
    var relativeUrl = document.querySelector("#restCallUrl").value;
    var method = document.querySelector('input[name="restMethod"]:checked').value;
    vscode.postMessage({ command: 'restCall', url: relativeUrl, method: method });
}

function clearRestResults() {
    document.querySelector('#restResultsLabel').classList.add('hidden');
    document.querySelector('#restResults').innerHTML = '';
}

(function () {
    executeCommand('fetchReleaseVersion');
}())
