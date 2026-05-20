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
    // ── Commande : ouvrir le panel ─────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('blackstaff.openPanel', () => {
        panel_1.BlackstaffPanel.createOrShow(context);
    }));
    // ── Commande : configurer ──────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('blackstaff.configure', async () => {
        await config_1.BlackstaffConfig.runWizard();
    }));
    // ── Commande : générer (raccourci rapide via input box) ────────────
    context.subscriptions.push(vscode.commands.registerCommand('blackstaff.generate', async () => {
        const config = config_1.BlackstaffConfig.get();
        // Vérifier la config avant d'ouvrir
        if (!config.webhookUrl || !config.project) {
            const action = await vscode.window.showWarningMessage('Blackstaff n\'est pas configuré.', 'Configurer maintenant');
            if (action === 'Configurer maintenant') {
                await config_1.BlackstaffConfig.runWizard();
            }
            return;
        }
        // Ouvrir le panel avec le focus sur le champ instruction
        panel_1.BlackstaffPanel.createOrShow(context, { focusInput: true });
    }));
    // ── Ouvrir automatiquement le panel dans la sidebar ────────────────
    vscode.commands.executeCommand('blackstaff.panel.focus').then(() => { }, () => { } // Silencieux si la sidebar n'est pas visible
    );
}
function deactivate() { }
//# sourceMappingURL=extension.js.map