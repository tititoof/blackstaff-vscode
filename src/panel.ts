// src/panel.ts
import * as vscode from 'vscode';
import { BlackstaffConfig } from './config';
import { sendToN8n } from './client';
import { getWebviewContent } from './webview';

export class BlackstaffPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = 'blackstaff.panel';
  private _view?: vscode.WebviewView;

  constructor(private readonly _context: vscode.ExtensionContext) {}

  // ── Appelé automatiquement par VS Code quand la sidebar est visible ─
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

    this._render();

    // Re-rendre si la config change
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('blackstaff')) {
        this._render();
      }
    });

    // Messages reçus depuis le WebView
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

  // ── API publique ───────────────────────────────────────────────────
  refreshConfig() {
    this._sendConfig();
  }

  focusInput() {
    this._view?.webview.postMessage({ type: 'focusInput' });
  }

  // ── Rendu ──────────────────────────────────────────────────────────
  private _render() {
    if (!this._view) return;
    this._view.webview.html = getWebviewContent(
      this._view.webview,
      this._context.extensionUri,
      BlackstaffConfig.get()
    );
  }

  private _sendConfig() {
    this._view?.webview.postMessage({
      type:   'config',
      config: BlackstaffConfig.get(),
    });
  }

  // ── Génération ─────────────────────────────────────────────────────
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

    this._view?.webview.postMessage({ type: 'generating', instruction });

    try {
      const response = await sendToN8n(
        config.webhookUrl,
        { project: config.project, instruction: instruction.trim(), mode: config.mode },
        (msg) => this._view?.webview.postMessage({ type: 'progress', message: msg })
      );

      this._view?.webview.postMessage({ type: 'result', response });

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

  // ── Configuration ──────────────────────────────────────────────────
  private async _handleConfigure() {
    const saved = await BlackstaffConfig.runWizard();
    if (saved) this._sendConfig();
  }

  // ── Ouvrir un fichier ──────────────────────────────────────────────
  private async _openFile(relativePath: string) {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders?.length) {
      vscode.window.showErrorMessage('Aucun workspace ouvert');
      return;
    }
    const uri = vscode.Uri.joinPath(folders[0].uri, relativePath);
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