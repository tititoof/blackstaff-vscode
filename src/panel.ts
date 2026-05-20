// src/panel.ts
import * as vscode from 'vscode';
import { BlackstaffConfig } from './config';
import { sendToN8n, BlackstaffResponse } from './client';
import { getWebviewContent } from './webview';

export class BlackstaffPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = 'blackstaff.panel';
  private static _instance?: BlackstaffPanel;
  private _view?: vscode.WebviewView;

  constructor(private readonly _context: vscode.ExtensionContext) {}

  // ── Enregistrement du provider ─────────────────────────────────────
  static createOrShow(
    context: vscode.ExtensionContext,
    options?: { focusInput?: boolean }
  ) {
    if (!BlackstaffPanel._instance) {
      BlackstaffPanel._instance = new BlackstaffPanel(context);
      context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
          BlackstaffPanel.viewType,
          BlackstaffPanel._instance,
          { webviewOptions: { retainContextWhenHidden: true } }
        )
      );
    }

    vscode.commands.executeCommand('blackstaff.panel.focus').then(() => {
      if (options?.focusInput) {
        BlackstaffPanel._instance?._view?.webview.postMessage({ type: 'focusInput' });
      }
    });
  }

  // ── Résolution du WebviewView ──────────────────────────────────────
  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._context.extensionUri],
    };

    webviewView.webview.html = getWebviewContent(
      webviewView.webview,
      this._context.extensionUri,
      BlackstaffConfig.get()
    );

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
  private _sendConfig() {
    this._view?.webview.postMessage({
      type:   'config',
      config: BlackstaffConfig.get(),
    });
  }

  // ── Gestion de la génération ───────────────────────────────────────
  private async _handleGenerate(instruction: string) {
    if (!instruction?.trim()) {
      this._postError('L\'instruction ne peut pas être vide');
      return;
    }

    const config = BlackstaffConfig.get();

    if (!config.webhookUrl || !config.project) {
      this._postError('Blackstaff n\'est pas configuré. Cliquez sur ⚙ pour configurer.');
      return;
    }

    // Notifier le WebView : début de génération
    this._view?.webview.postMessage({ type: 'generating', instruction });

    try {
      const response = await sendToN8n(
        config.webhookUrl,
        {
          project:     config.project,
          instruction: instruction.trim(),
          mode:        config.mode,
        },
        (msg) => this._view?.webview.postMessage({ type: 'progress', message: msg })
      );

      // Notifier le WebView : résultat
      this._view?.webview.postMessage({ type: 'result', response });

      // Notification VS Code
      if (response.ok) {
        vscode.window.showInformationMessage(response.message);
      } else {
        vscode.window.showWarningMessage(response.message);
      }

    } catch (err: any) {
      const message = err.message || 'Erreur inconnue';
      this._postError(message);
      vscode.window.showErrorMessage(`Blackstaff: ${message}`);
    }
  }

  // ── Gestion de la configuration ───────────────────────────────────
  private async _handleConfigure() {
    const saved = await BlackstaffConfig.runWizard();
    if (saved) {
      this._view?.webview.postMessage({
        type:   'config',
        config: BlackstaffConfig.get(),
      });
    }
  }

  // ── Ouvrir un fichier généré dans l'éditeur ────────────────────────
  private async _openFile(relativePath: string) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders?.length) {
      vscode.window.showErrorMessage('Aucun workspace ouvert');
      return;
    }

    const uri = vscode.Uri.joinPath(workspaceFolders[0].uri, relativePath);
    try {
      await vscode.window.showTextDocument(uri);
    } catch {
      vscode.window.showErrorMessage(`Impossible d'ouvrir: ${relativePath}`);
    }
  }

  private _postError(message: string) {
    this._view?.webview.postMessage({ type: 'error', message });
  }
}