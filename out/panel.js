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
    // ── Enregistrement du provider ─────────────────────────────────────
    static createOrShow(context, options) {
        if (!BlackstaffPanel._instance) {
            BlackstaffPanel._instance = new BlackstaffPanel(context);
            context.subscriptions.push(vscode.window.registerWebviewViewProvider(BlackstaffPanel.viewType, BlackstaffPanel._instance, { webviewOptions: { retainContextWhenHidden: true } }));
        }
        vscode.commands.executeCommand('blackstaff.panel.focus').then(() => {
            if (options?.focusInput) {
                BlackstaffPanel._instance?._view?.webview.postMessage({ type: 'focusInput' });
            }
        });
    }
    // ── Résolution du WebviewView ──────────────────────────────────────
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._context.extensionUri],
        };
        webviewView.webview.html = (0, webview_1.getWebviewContent)(webviewView.webview, this._context.extensionUri, config_1.BlackstaffConfig.get());
        // ── Messages reçus depuis le WebView ──────────────────────────
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'generate':
                    await this._handleGenerate(message.instruction);
                    break;
                case 'configure':
                    await this._handleConfigure();
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
    // ── Envoi de la configuration au WebView ──────────────────────────
    _sendConfig() {
        this._view?.webview.postMessage({
            type: 'config',
            config: config_1.BlackstaffConfig.get(),
        });
    }
    // ── Gestion de la génération ───────────────────────────────────────
    async _handleGenerate(instruction) {
        if (!instruction?.trim()) {
            this._postError('L\'instruction ne peut pas être vide');
            return;
        }
        const config = config_1.BlackstaffConfig.get();
        if (!config.webhookUrl || !config.project) {
            this._postError('Blackstaff n\'est pas configuré. Cliquez sur ⚙ pour configurer.');
            return;
        }
        // Notifier le WebView : début de génération
        this._view?.webview.postMessage({ type: 'generating', instruction });
        try {
            const response = await (0, client_1.sendToN8n)(config.webhookUrl, {
                project: config.project,
                instruction: instruction.trim(),
                mode: config.mode,
            }, (msg) => this._view?.webview.postMessage({ type: 'progress', message: msg }));
            // Notifier le WebView : résultat
            this._view?.webview.postMessage({ type: 'result', response });
            // Notification VS Code
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
    // ── Gestion de la configuration ───────────────────────────────────
    async _handleConfigure() {
        const saved = await config_1.BlackstaffConfig.runWizard();
        if (saved) {
            this._view?.webview.postMessage({
                type: 'config',
                config: config_1.BlackstaffConfig.get(),
            });
        }
    }
    // ── Ouvrir un fichier généré dans l'éditeur ────────────────────────
    async _openFile(relativePath) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders?.length) {
            vscode.window.showErrorMessage('Aucun workspace ouvert');
            return;
        }
        const uri = vscode.Uri.joinPath(workspaceFolders[0].uri, relativePath);
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