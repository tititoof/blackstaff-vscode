// src/extension.ts
import * as vscode from 'vscode';
import { BlackstaffPanel } from './panel';
import { BlackstaffConfig } from './config';

export function activate(context: vscode.ExtensionContext) {
  console.log('[Blackstaff] Extension activée');

  // ── Enregistrer le provider de sidebar EN PREMIER ──────────────────
  // Doit être fait dans activate() directement, pas dans une commande
  const panel = new BlackstaffPanel(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      BlackstaffPanel.viewType,
      panel,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // ── Commande : ouvrir le panel ─────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('blackstaff.openPanel', () => {
      vscode.commands.executeCommand('blackstaff.panel.focus');
    })
  );

  // ── Commande : configurer ──────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('blackstaff.configure', async () => {
      await BlackstaffConfig.runWizard();
      panel.refreshConfig();
    })
  );

  // ── Commande : générer ────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('blackstaff.generate', async () => {
      const config = BlackstaffConfig.get();
      if (!config.webhookUrl || !config.project) {
        const action = await vscode.window.showWarningMessage(
          'Blackstaff n\'est pas configuré.',
          'Configurer maintenant'
        );
        if (action === 'Configurer maintenant') {
          await BlackstaffConfig.runWizard();
          panel.refreshConfig();
        }
        return;
      }
      vscode.commands.executeCommand('blackstaff.panel.focus');
      panel.focusInput();
    })
  );
}

export function deactivate() {}