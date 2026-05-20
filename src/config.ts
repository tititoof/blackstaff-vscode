// src/config.ts
import * as vscode from 'vscode';

export interface BlackstaffMode {
  id:          string;
  label:       string;
  description: string;
  webhookUrl:  string;
  icon:        string;
}

export interface BlackstaffSettings {
  project:     string;
  projectType: string;
  activeMode:  string;
  modes:       BlackstaffMode[];
}

export class BlackstaffConfig {

  static get(): BlackstaffSettings {
    const cfg = vscode.workspace.getConfiguration('blackstaff');
    return {
      project:     cfg.get<string>('project', ''),
      projectType: cfg.get<string>('projectType', 'nuxt3'),
      activeMode:  cfg.get<string>('activeMode', 'generate'),
      modes:       cfg.get<BlackstaffMode[]>('modes', BlackstaffConfig.defaultModes()),
    };
  }

  static getActiveMode(): BlackstaffMode | undefined {
    const { modes, activeMode } = BlackstaffConfig.get();
    return modes.find(m => m.id === activeMode) ?? modes[0];
  }

  static defaultModes(): BlackstaffMode[] {
    return [
      {
        id:          'generate',
        label:       'Generate',
        description: 'Génère des fichiers depuis une instruction',
        webhookUrl:  'http://localhost:5678/webhook/blackstaff',
        icon:        '$(wand)',
      },
      {
        id:          'thinking',
        label:       'Thinking',
        description: 'Analyse une spec et décompose en tâches',
        webhookUrl:  'http://localhost:5678/webhook/blackstaff-thinking',
        icon:        '$(lightbulb)',
      },
    ];
  }

  static async set(key: string, value: unknown): Promise<void> {
    await vscode.workspace.getConfiguration('blackstaff').update(
      key,
      value,
      vscode.ConfigurationTarget.Global
    );
  }

  // ── Wizard de configuration ────────────────────────────────────────
  static async runWizard(): Promise<boolean> {
    const current = BlackstaffConfig.get();

    // 1. Nom du projet
    const workspaceName = vscode.workspace.workspaceFolders?.[0]?.name || '';
    const project = await vscode.window.showInputBox({
      title:       'Blackstaff — Configuration (1/3)',
      prompt:      'Nom du projet (dossier dans /home/node/projets/)',
      value:       current.project || workspaceName,
      placeHolder: 'chartman2.fr',
      validateInput: (v) => v ? null : 'Le nom du projet est requis'
    });
    if (!project) return false;

    // 2. Type de projet
    const typeChoice = await vscode.window.showQuickPick(
      [
        { label: 'nuxt3',        description: 'Nuxt 3 + Nitro',              value: 'nuxt3' },
        { label: 'rails',        description: 'Ruby on Rails API',            value: 'rails' },
        { label: 'nuxt3+rails',  description: 'Nuxt 3 frontend + Rails API', value: 'nuxt3+rails' },
      ],
      { title: 'Blackstaff — Configuration (2/3)', placeHolder: 'Type de projet' }
    );
    if (!typeChoice) return false;

    // 3. Configurer les modes (webhook par mode)
    const configureModes = await vscode.window.showQuickPick(
      [
        { label: '$(check) Garder les modes par défaut', value: false },
        { label: '$(gear)  Configurer les webhooks',     value: true  },
      ],
      { title: 'Blackstaff — Configuration (3/3)', placeHolder: 'Modes et webhooks' }
    );
    if (!configureModes) return false;

    let modes = current.modes.length > 0 ? current.modes : BlackstaffConfig.defaultModes();

    if (configureModes.value) {
      // Configurer le webhook de chaque mode
      for (const mode of modes) {
        const url = await vscode.window.showInputBox({
          title:       `Webhook pour le mode "${mode.label}"`,
          prompt:      `URL du webhook n8n pour ${mode.label}`,
          value:       mode.webhookUrl,
          placeHolder: `http://localhost:5678/webhook/blackstaff-${mode.id}`,
          validateInput: (v) => {
            if (!v) return 'L\'URL est requise';
            try { new URL(v); return null; }
            catch { return 'URL invalide'; }
          }
        });
        if (url) mode.webhookUrl = url;
      }
    }

    await BlackstaffConfig.set('project',     project);
    await BlackstaffConfig.set('projectType', typeChoice.value);
    await BlackstaffConfig.set('modes',       modes);

    vscode.window.showInformationMessage(
      `✅ Blackstaff configuré — ${typeChoice.value} / ${project}`
    );
    return true;
  }

  // ── Changer de mode actif ──────────────────────────────────────────
  static async switchMode(): Promise<BlackstaffMode | undefined> {
    const { modes, activeMode } = BlackstaffConfig.get();

    const choice = await vscode.window.showQuickPick(
      modes.map(m => ({
        label:       `${m.icon || '$(circle-outline)'} ${m.label}`,
        description: m.description,
        detail:      m.webhookUrl,
        picked:      m.id === activeMode,
        value:       m,
      })),
      { title: 'Blackstaff — Changer de mode', placeHolder: 'Sélectionner un mode' }
    );

    if (!choice) return undefined;

    await BlackstaffConfig.set('activeMode', choice.value.id);
    return choice.value;
  }
}