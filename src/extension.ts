// src/extension.ts
import * as vscode from 'vscode';
import { BlackstaffPanel } from './panel';
import { BlackstaffConfig } from './config';

export function activate(context: vscode.ExtensionContext) {
  console.log('[Blackstaff] Extension activée');

  // ── Commande : ouvrir le panel ─────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('blackstaff.openPanel', () => {
      BlackstaffPanel.createOrShow(context);
    })
  );

  // ── Commande : configurer ──────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('blackstaff.configure', async () => {
      await BlackstaffConfig.runWizard();
    })
  );

  // ── Commande : générer (raccourci rapide via input box) ────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('blackstaff.generate', async () => {
      const config = BlackstaffConfig.get();

      // Vérifier la config avant d'ouvrir
      if (!config.webhookUrl || !config.project) {
        const action = await vscode.window.showWarningMessage(
          'Blackstaff n\'est pas configuré.',
          'Configurer maintenant'
        );
        if (action === 'Configurer maintenant') {
          await BlackstaffConfig.runWizard();
        }
        return;
      }

      // Ouvrir le panel avec le focus sur le champ instruction
      BlackstaffPanel.createOrShow(context, { focusInput: true });
    })
  );

  // ── Ouvrir automatiquement le panel dans la sidebar ────────────────
  vscode.commands.executeCommand('blackstaff.panel.focus').then(
    () => {},
    () => {} // Silencieux si la sidebar n'est pas visible
  );
}

export function deactivate() {}