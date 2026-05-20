// src/webview.ts
import * as vscode from 'vscode';
import { BlackstaffSettings } from './config';

export function getWebviewContent(
  webview: vscode.Webview,
  _extensionUri: vscode.Uri,
  config: BlackstaffSettings
): string {
  // Nonce pour la Content Security Policy
  const nonce = getNonce();

  return /* html */`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
             style-src  'nonce-${nonce}' ${webview.cspSource};
             script-src 'nonce-${nonce}';" />
  <title>Blackstaff</title>
  <style nonce="${nonce}">
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--vscode-font-family);
      font-size:   var(--vscode-font-size);
      color:       var(--vscode-foreground);
      background:  var(--vscode-sideBar-background);
      padding:     12px;
    }

    /* ── Header ─────────────────────────────── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .header h1 {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: .5px;
    }
    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--vscode-foreground);
      opacity: .7;
      font-size: 16px;
      padding: 2px 4px;
      border-radius: 3px;
    }
    .btn-icon:hover { opacity: 1; background: var(--vscode-toolbar-hoverBackground); }

    /* ── Config badge ────────────────────────── */
    .config-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      background: var(--vscode-editor-inactiveSelectionBackground);
      border-radius: 4px;
      margin-bottom: 12px;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }
    .config-bar .project {
      font-weight: 600;
      color: var(--vscode-foreground);
    }
    .dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--vscode-testing-iconPassed);
      flex-shrink: 0;
    }
    .dot.error { background: var(--vscode-testing-iconFailed); }

    /* ── Form ────────────────────────────────── */
    .form { display: flex; flex-direction: column; gap: 8px; }

    textarea {
      width: 100%;
      min-height: 80px;
      resize: vertical;
      background:  var(--vscode-input-background);
      color:       var(--vscode-input-foreground);
      border:      1px solid var(--vscode-input-border, transparent);
      border-radius: 3px;
      padding:     6px 8px;
      font-family: var(--vscode-font-family);
      font-size:   var(--vscode-font-size);
      line-height: 1.5;
    }
    textarea:focus {
      outline: 1px solid var(--vscode-focusBorder);
      border-color: var(--vscode-focusBorder);
    }
    textarea::placeholder { color: var(--vscode-input-placeholderForeground); }

    /* ── Suggestions ─────────────────────────── */
    .suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 4px;
    }
    .chip {
      padding: 2px 8px;
      font-size: 11px;
      border-radius: 10px;
      border: 1px solid var(--vscode-button-secondaryBackground, #555);
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      cursor: pointer;
      white-space: nowrap;
    }
    .chip:hover { opacity: .8; }

    /* ── Boutons ─────────────────────────────── */
    .btn-row { display: flex; gap: 6px; }
    .btn {
      flex: 1;
      padding: 6px 12px;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: var(--vscode-font-size);
      font-family: var(--vscode-font-family);
    }
    .btn-primary {
      background: var(--vscode-button-background);
      color:      var(--vscode-button-foreground);
    }
    .btn-primary:hover { background: var(--vscode-button-hoverBackground); }
    .btn-primary:disabled {
      opacity: .5;
      cursor: not-allowed;
    }
    .btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color:      var(--vscode-button-secondaryForeground);
    }
    .btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }

    /* ── Status / Progress ───────────────────── */
    #status {
      font-size: 11px;
      min-height: 18px;
      color: var(--vscode-descriptionForeground);
    }
    .spinner {
      display: inline-block;
      width: 10px; height: 10px;
      border: 2px solid var(--vscode-foreground);
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin .8s linear infinite;
      margin-right: 6px;
      vertical-align: middle;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Résultats ───────────────────────────── */
    #results { margin-top: 16px; }
    .result-header {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .result-header.ok    { color: var(--vscode-testing-iconPassed); }
    .result-header.warn  { color: var(--vscode-editorWarning-foreground); }
    .result-header.error { color: var(--vscode-testing-iconFailed); }

    .file-list { display: flex; flex-direction: column; gap: 3px; }
    .file-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 6px;
      border-radius: 3px;
      font-size: 11px;
      cursor: pointer;
    }
    .file-item:hover { background: var(--vscode-list-hoverBackground); }
    .file-item .icon { flex-shrink: 0; font-size: 12px; }
    .file-item .path {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--vscode-foreground);
    }
    .file-item .badge {
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 8px;
      flex-shrink: 0;
    }
    .badge-valid   { background: var(--vscode-testing-iconPassed);  color: #fff; }
    .badge-warning { background: var(--vscode-editorWarning-foreground); color: #000; }
    .badge-error   { background: var(--vscode-testing-iconFailed);  color: #fff; }

    .error-msg {
      margin-top: 8px;
      padding: 8px;
      background: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      border-radius: 3px;
      font-size: 11px;
      color: var(--vscode-inputValidation-errorForeground);
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <h1>⚡ Blackstaff</h1>
    <button class="btn-icon" id="btnConfig" title="Configurer">⚙</button>
  </div>

  <!-- Config bar -->
  <div class="config-bar" id="configBar">
    <div class="dot ${config.project ? '' : 'error'}" id="statusDot"></div>
    <span>
      ${config.project
        ? `<span class="project">${config.project}</span> — ${config.webhookUrl}`
        : 'Non configuré — cliquez sur ⚙'
      }
    </span>
  </div>

  <!-- Form -->
  <div class="form">

    <!-- Suggestions rapides -->
    <div class="suggestions" id="suggestions">
      <button class="chip" data-text="Créer le système d'authentification (login, register, logout)">Auth</button>
      <button class="chip" data-text="Créer le CRUD complet pour le modèle ">CRUD...</button>
      <button class="chip" data-text="Créer les tests e2e pour le CRUD ">Tests e2e...</button>
    </div>

    <textarea
      id="instruction"
      placeholder="Créer le CRUD complet pour le modèle Article. Les champs name (string, 255 max, 6 min) et content (text, 5000 max, 20 min)."
      rows="4"
    ></textarea>

    <div id="status"></div>

    <div class="btn-row">
      <button class="btn btn-primary" id="btnGenerate">
        ⚡ Générer
      </button>
      <button class="btn btn-secondary" id="btnClear">
        Effacer
      </button>
    </div>

  </div>

  <!-- Résultats -->
  <div id="results"></div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    // ── Refs ──────────────────────────────────────────────────────
    const instruction = document.getElementById('instruction');
    const btnGenerate = document.getElementById('btnGenerate');
    const btnClear    = document.getElementById('btnClear');
    const btnConfig   = document.getElementById('btnConfig');
    const statusEl    = document.getElementById('status');
    const resultsEl   = document.getElementById('results');
    const configBar   = document.getElementById('configBar');
    const statusDot   = document.getElementById('statusDot');

    // ── Suggestions ───────────────────────────────────────────────
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        instruction.value = chip.dataset.text;
        instruction.focus();
        // Placer le curseur en fin de texte
        instruction.selectionStart = instruction.selectionEnd = instruction.value.length;
      });
    });

    // ── Boutons ───────────────────────────────────────────────────
    btnGenerate.addEventListener('click', () => {
      const text = instruction.value.trim();
      if (!text) { setStatus('⚠ L\\'instruction ne peut pas être vide', 'warn'); return; }
      vscode.postMessage({ type: 'generate', instruction: text });
    });

    btnClear.addEventListener('click', () => {
      instruction.value = '';
      resultsEl.innerHTML = '';
      setStatus('');
      instruction.focus();
    });

    btnConfig.addEventListener('click', () => {
      vscode.postMessage({ type: 'configure' });
    });

    // Ctrl+Enter pour générer
    instruction.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        btnGenerate.click();
      }
    });

    // ── Messages reçus depuis l'extension ─────────────────────────
    window.addEventListener('message', (event) => {
      const msg = event.data;
      switch (msg.type) {

        case 'focusInput':
          instruction.focus();
          break;

        case 'config':
          updateConfigBar(msg.config);
          break;

        case 'generating':
          setGenerating(true);
          resultsEl.innerHTML = '';
          break;

        case 'progress':
          setStatus('<span class="spinner"></span>' + msg.message);
          break;

        case 'result':
          setGenerating(false);
          renderResult(msg.response);
          break;

        case 'error':
          setGenerating(false);
          setStatus('');
          resultsEl.innerHTML = '<div class="error-msg">❌ ' + escHtml(msg.message) + '</div>';
          break;
      }
    });

    // Demander la config au chargement
    vscode.postMessage({ type: 'getConfig' });

    // ── Helpers ───────────────────────────────────────────────────
    function setGenerating(active) {
      btnGenerate.disabled = active;
      btnGenerate.textContent = active ? 'Génération...' : '⚡ Générer';
      if (active) setStatus('<span class="spinner"></span> Envoi à n8n...');
    }

    function setStatus(html, level) {
      statusEl.innerHTML = html;
    }

    function updateConfigBar(config) {
      statusDot.className = 'dot' + (config.project ? '' : ' error');
      configBar.querySelector('span').innerHTML = config.project
        ? '<span class="project">' + escHtml(config.project) + '</span> — ' + escHtml(config.webhookUrl)
        : 'Non configuré — cliquez sur ⚙';
    }

    function renderResult(response) {
      const cls     = response.ok ? 'ok' : response.failed > 0 ? 'error' : 'warn';
      const summary = escHtml(response.message || '');

      let html = '<div class="result-header ' + cls + '">' + summary + '</div>';
      html += '<div class="file-list">';

      (response.files || []).forEach(f => {
        const icon  = f.status === 'valid'   ? '✅'
                    : f.status === 'warning' || f.status === 'max_retries' ? '⚠️'
                    : '❌';
        const badge = f.status === 'valid'   ? 'badge-valid'
                    : f.status === 'warning' || f.status === 'max_retries' ? 'badge-warning'
                    : 'badge-error';
        const label = f.status === 'max_retries' ? 'retry' : f.status;
        const errors = (f.errors || []).length > 0
          ? ' title="' + escAttr(f.errors.join('\\n')) + '"'
          : '';

        html += '<div class="file-item" data-path="' + escAttr(f.file) + '"' + errors + '>'
              + '<span class="icon">' + icon + '</span>'
              + '<span class="path">' + escHtml(f.file) + '</span>'
              + '<span class="badge ' + badge + '">' + escHtml(label) + '</span>'
              + '</div>';
      });

      html += '</div>';
      resultsEl.innerHTML = html;

      // Clic sur un fichier → ouvrir dans l'éditeur
      resultsEl.querySelectorAll('.file-item').forEach(el => {
        el.addEventListener('click', () => {
          vscode.postMessage({ type: 'openFile', path: el.dataset.path });
        });
      });
    }

    function escHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
    function escAttr(str) {
      return escHtml(str).replace(/'/g, '&#39;');
    }
  </script>

</body>
</html>`;
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}