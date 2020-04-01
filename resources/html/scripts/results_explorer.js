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
        case 'updateResults':
            renderjson.set_show_to_level(1);
            document.querySelector('#results').innerHTML = '';
            document.querySelector('#results').appendChild(
                renderjson(message.body)
            );
            break;
    }
});

function executeCommand(cmd) {
    vscode.postMessage({ command: cmd });
}

/*
renderjson.set_show_to_level(2);
var results = document.querySelector('#results').innerHTML;
document.getElementById('rendered').appendChild(
    renderjson(results)
);
*/
