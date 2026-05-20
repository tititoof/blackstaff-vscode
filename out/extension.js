"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// src/extension.ts
const vscode = require("vscode");
const panel_1 = require("./panel");
const config_1 = require("./config");
function activate(context) {
    console.log('[Blackstaff] Extension activée');
    // ── Enregistrer le provider sidebar en premier ─────────────────────
    const panel = new panel_1.BlackstaffPanel(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(panel_1.BlackstaffPanel.viewType, panel, { webviewOptions: { retainContextWhenHidden: true } }));
    // ── Commande : ouvrir le panel ─────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('blackstaff.openPanel', () => {
        vscode.commands.executeCommand('blackstaff.panel.focus');
    }));
    // ── Commande : configurer ──────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('blackstaff.configure', async () => {
        const saved = await config_1.BlackstaffConfig.runWizard();
        if (saved)
            panel.refreshConfig();
    }));
    // ── Commande : changer de mode ─────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('blackstaff.switchMode', async () => {
        const mode = await config_1.BlackstaffConfig.switchMode();
        if (mode)
            panel.refreshConfig();
    }));
    // ── Commande : générer ─────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('blackstaff.generate', async () => {
        const config = config_1.BlackstaffConfig.get();
        if (!config.project) {
            const action = await vscode.window.showWarningMessage('Blackstaff n\'est pas configuré.', 'Configurer maintenant');
            if (action === 'Configurer maintenant') {
                const saved = await config_1.BlackstaffConfig.runWizard();
                if (saved)
                    panel.refreshConfig();
            }
            return;
        }
        vscode.commands.executeCommand('blackstaff.panel.focus');
        panel.focusInput();
    }));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map