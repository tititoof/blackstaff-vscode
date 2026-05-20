"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlackstaffConfig = void 0;
// src/config.ts
const vscode = require("vscode");
class BlackstaffConfig {
    static get() {
        const cfg = vscode.workspace.getConfiguration('blackstaff');
        return {
            webhookUrl: cfg.get('webhookUrl', 'http://localhost:5678/webhook/blackstaff'),
            project: cfg.get('project', ''),
            mode: cfg.get('mode', 'generate'),
        };
    }
    static async set(key, value) {
        await vscode.workspace.getConfiguration('blackstaff').update(key, value, vscode.ConfigurationTarget.Global);
    }
    // Wizard de configuration pas-à-pas
    static async runWizard() {
        const current = BlackstaffConfig.get();
        // ── 1. URL du webhook ──────────────────────────────────────────
        const webhookUrl = await vscode.window.showInputBox({
            title: 'Blackstaff — Configuration (1/3)',
            prompt: 'URL du webhook n8n',
            value: current.webhookUrl,
            placeHolder: 'http://localhost:5678/webhook/blackstaff',
            validateInput: (v) => {
                if (!v)
                    return 'L\'URL est requise';
                try {
                    new URL(v);
                    return null;
                }
                catch {
                    return 'URL invalide';
                }
            }
        });
        if (!webhookUrl)
            return false;
        // ── 2. Nom du projet ────────────────────────────────────────────
        // Auto-détecter depuis le workspace si possible
        const workspaceName = vscode.workspace.workspaceFolders?.[0]?.name || '';
        const project = await vscode.window.showInputBox({
            title: 'Blackstaff — Configuration (2/3)',
            prompt: 'Nom du projet (dossier dans /home/node/projets/)',
            value: current.project || workspaceName,
            placeHolder: 'chartman2.fr',
            validateInput: (v) => v ? null : 'Le nom du projet est requis'
        });
        if (!project)
            return false;
        // ── 3. Mode ─────────────────────────────────────────────────────
        const modeChoice = await vscode.window.showQuickPick([
            { label: '$(check) generate', description: 'Génère et écrit les fichiers', value: 'generate' },
            { label: '$(eye)  dry-run', description: 'Preview uniquement, rien n\'est écrit', value: 'dry-run' },
        ], {
            title: 'Blackstaff — Configuration (3/3)',
            placeHolder: 'Choisir le mode',
        });
        if (!modeChoice)
            return false;
        // Sauvegarder
        await BlackstaffConfig.set('webhookUrl', webhookUrl);
        await BlackstaffConfig.set('project', project);
        await BlackstaffConfig.set('mode', modeChoice.value);
        vscode.window.showInformationMessage(`✅ Blackstaff configuré — projet: ${project}`);
        return true;
    }
}
exports.BlackstaffConfig = BlackstaffConfig;
//# sourceMappingURL=config.js.map