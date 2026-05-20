// src/config.ts
import * as vscode from 'vscode';

export interface BlackstaffSettings {
  webhookUrl: string;
  project:    string;
  mode:       'generate' | 'dry-run';
}

export class BlackstaffConfig {

  static get(): BlackstaffSettings {
    const cfg = vscode.workspace.getConfiguration('blackstaff');
    return {
      webhookUrl: cfg.get<string>('webhookUrl', 'http://localhost:5678/webhook/blackstaff'),
      project:    cfg.get<string>('project', ''),
      mode:       cfg.get<'generate' | 'dry-run'>('mode', 'generate'),
    };
  }

  static async set(key: keyof BlackstaffSettings, value: string): Promise<void> {
    await vscode.workspace.getConfiguration('blackstaff').update(
      key,
      value,
      vscode.ConfigurationTarget.Global
    );
  }

  // Wizard de configuration pas-à-pas
  static async runWizard(): Promise<boolean> {
    const current = BlackstaffConfig.get();

    // ── 1. URL du webhook ──────────────────────────────────────────
    const webhookUrl = await vscode.window.showInputBox({
      title:       'Blackstaff — Configuration (1/3)',
      prompt:      'URL du webhook n8n',
      value:       current.webhookUrl,
      placeHolder: 'http://n8n:5678/webhook/blackstaff',
      validateInput: (v) => {
        if (!v) return 'L\'URL est requise';
        try { new URL(v); return null; }
        catch { return 'URL invalide'; }
      }
    });
    if (!webhookUrl) return false;

    // ── 2. Nom du projet ────────────────────────────────────────────
    // Auto-détecter depuis le workspace si possible
    const workspaceName = vscode.workspace.workspaceFolders?.[0]?.name || '';
    const project = await vscode.window.showInputBox({
      title:       'Blackstaff — Configuration (2/3)',
      prompt:      'Nom du projet (dossier dans /home/node/projets/)',
      value:       current.project || workspaceName,
      placeHolder: 'chartman2.fr',
      validateInput: (v) => v ? null : 'Le nom du projet est requis'
    });
    if (!project) return false;

    // ── 3. Mode ─────────────────────────────────────────────────────
    const modeChoice = await vscode.window.showQuickPick(
      [
        { label: '$(check) generate',  description: 'Génère et écrit les fichiers', value: 'generate' as const },
        { label: '$(eye)  dry-run',    description: 'Preview uniquement, rien n\'est écrit', value: 'dry-run' as const },
      ],
      {
        title:       'Blackstaff — Configuration (3/3)',
        placeHolder: 'Choisir le mode',
      }
    );
    if (!modeChoice) return false;

    // Sauvegarder
    await BlackstaffConfig.set('webhookUrl', webhookUrl);
    await BlackstaffConfig.set('project', project);
    await BlackstaffConfig.set('mode', modeChoice.value);

    vscode.window.showInformationMessage(
      `✅ Blackstaff configuré — projet: ${project}`
    );

    return true;
  }
}