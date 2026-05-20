"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlackstaffPanel = void 0;
// src/panel.ts
const vscode = require("vscode");
const config_1 = require("./config");
const client_1 = require("./client");
const webview_1 = require("./webview");
class BlackstaffPanel {
    constructor(_context) {
        this._context = _context;
    }
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._context.extensionUri],
        };
        this._render();
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('blackstaff'))
                this._render();
        });
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'generate':
                    await this._handleGenerate(message.instruction);
                    break;
                case 'configure':
                    const saved = await config_1.BlackstaffConfig.runWizard();
                    if (saved)
                        this._render();
                    break;
                case 'switchMode':
                    const mode = await config_1.BlackstaffConfig.switchMode();
                    if (mode)
                        this._render();
                    break;
                case 'openFile':
                    await this._openFile(message.path);
                    break;
                case 'getConfig':
                    this._sendConfig();
                    break;
            }
        });
    }
    refreshConfig() { this._render(); }
    focusInput() { this._view?.webview.postMessage({ type: 'focusInput' }); }
    _render() {
        if (!this._view)
            return;
        this._view.webview.html = (0, webview_1.getWebviewContent)(this._view.webview, this._context.extensionUri, config_1.BlackstaffConfig.get());
    }
    _sendConfig() {
        this._view?.webview.postMessage({
            type: 'config',
            config: config_1.BlackstaffConfig.get(),
        });
    }
    async _handleGenerate(instruction) {
        if (!instruction?.trim()) {
            this._postError('L\'instruction ne peut pas être vide');
            return;
        }
        const config = config_1.BlackstaffConfig.get();
        if (!config.project) {
            this._postError('Blackstaff n\'est pas configuré. Cliquez sur ⚙ pour configurer.');
            return;
        }
        const activeMode = config_1.BlackstaffConfig.getActiveMode();
        if (!activeMode) {
            this._postError('Aucun mode actif configuré.');
            return;
        }
        this._view?.webview.postMessage({ type: 'generating', instruction, mode: activeMode.label });
        try {
            const response = await (0, client_1.sendToN8n)(activeMode.webhookUrl, {
                project: config.project,
                instruction: instruction.trim(),
                mode: activeMode.id,
                type: config.projectType,
            }, (msg) => this._view?.webview.postMessage({ type: 'progress', message: msg }));
            this._view?.webview.postMessage({ type: 'result', response });
            if (response.ok) {
                vscode.window.showInformationMessage(response.message);
            }
            else {
                vscode.window.showWarningMessage(response.message);
            }
        }
        catch (err) {
            const message = err.message || 'Erreur inconnue';
            this._postError(message);
            vscode.window.showErrorMessage(`Blackstaff: ${message}`);
        }
    }
    async _openFile(relativePath) {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders?.length) {
            vscode.window.showErrorMessage('Aucun workspace ouvert');
            return;
        }
        const uri = vscode.Uri.joinPath(folders[0].uri, relativePath);
        try {
            await vscode.window.showTextDocument(uri);
        }
        catch {
            vscode.window.showErrorMessage(`Impossible d'ouvrir: ${relativePath}`);
        }
    }
    _postError(message) {
        this._view?.webview.postMessage({ type: 'error', message });
    }
}
exports.BlackstaffPanel = BlackstaffPanel;
BlackstaffPanel.viewType = 'blackstaff.panel';
//# sourceMappingURL=panel.js.map