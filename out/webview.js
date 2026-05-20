"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebviewContent = getWebviewContent;
function getWebviewContent(webview, _extensionUri, config) {
    // Nonce pour la Content Security Policy
    const nonce = getNonce();
    // code-server a une CSP différente de VS Code desktop
    // On utilise 'unsafe-inline' en fallback pour garantir le rendu
    const csp = `default-src 'none';
    style-src  'nonce-${nonce}' 'unsafe-inline' ${webview.cspSource};
    script-src 'nonce-${nonce}' 'unsafe-inline';
    img-src    ${webview.cspSource} data:;`;
    return /* html */ `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
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
    .config-bar .type {
      font-weight: 500;
      color: var(--vscode-descriptionForeground);
      background: var(--vscode-badge-background);
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 10px;
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

    /* ── Mode bar ────────────────────────────── */
    .mode-bar {
      display: flex;
      gap: 4px;
      margin-bottom: 10px;
    }
    .mode-btn {
      flex: 1;
      padding: 4px 8px;
      font-size: 11px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 3px;
      background: transparent;
      color: var(--vscode-descriptionForeground);
      cursor: pointer;
    }
    .mode-btn:hover {
      background: var(--vscode-list-hoverBackground);
      color: var(--vscode-foreground);
    }
    .mode-btn.active {
      background: var(--vscode-button-background);
      color:      var(--vscode-button-foreground);
      border-color: var(--vscode-button-background);
      font-weight: 600;
    }

    /* ── Task list (mode thinking) ───────────── */
    .task-list { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
    .task-item {
      padding: 8px 10px;
      border-radius: 4px;
      border: 1px solid var(--vscode-panel-border);
      font-size: 11px;
    }
    .task-item .task-title {
      font-weight: 600;
      margin-bottom: 3px;
    }
    .task-item .task-desc {
      color: var(--vscode-descriptionForeground);
      font-size: 10px;
    }
    .task-item.pending { border-left: 3px solid var(--vscode-editorWarning-foreground); }
    .task-item.done    { border-left: 3px solid var(--vscode-testing-iconPassed); }
    .task-item.error   { border-left: 3px solid var(--vscode-testing-iconFailed); }
    .task-run-btn {
      margin-top: 5px;
      padding: 2px 8px;
      font-size: 10px;
      border: 1px solid var(--vscode-button-background);
      border-radius: 3px;
      background: transparent;
      color: var(--vscode-button-background);
      cursor: pointer;
    }
    .task-run-btn:hover {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
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
    <div style="display:flex;gap:4px">
      <button class="btn-icon" id="btnMode"   title="Changer de mode">⇄</button>
      <button class="btn-icon" id="btnConfig" title="Configurer">⚙</button>
    </div>
  </div>

  <!-- Config bar -->
  <div class="config-bar" id="configBar">
    <div class="dot ${config.project ? '' : 'error'}" id="statusDot"></div>
    <span>
      ${config.project
        ? `<span class="project">${config.project}</span> · <span class="type">${config.projectType}</span>`
        : 'Non configuré — cliquez sur ⚙'}
    </span>
  </div>

  <!-- Mode selector -->
  <div class="mode-bar" id="modeBar">
    ${config.modes.map(m => `
      <button
        class="mode-btn ${m.id === config.activeMode ? 'active' : ''}"
        data-mode="${m.id}"
        title="${m.description}"
      >${m.label}</button>
    `).join('')}
  </div>

  <!-- Form -->
  <div class="form">

    <!-- Suggestions selon le mode actif -->
    <div class="suggestions" id="suggestions">
      ${config.activeMode === 'generate' ? `
        <button class="chip" data-text="Créer le système d'authentification (login, register, logout)">Auth</button>
        <button class="chip" data-text="Créer le CRUD complet pour le modèle ">CRUD...</button>
        <button class="chip" data-text="Créer les tests e2e pour le CRUD ">Tests e2e...</button>
      ` : `
        <button class="chip" data-text="Analyser les specs suivantes et décomposer en tâches : ">Analyser specs...</button>
        <button class="chip" data-text="Planifier le développement de : ">Planifier...</button>
      `}
    </div>

    <textarea
      id="instruction"
      placeholder="${config.activeMode === 'generate'
        ? 'Créer le CRUD complet pour le modèle Article. Les champs name (string, 255 max, 6 min) et content (text, 5000 max, 20 min).'
        : 'Analyser les specs suivantes et décomposer en tâches de développement...'}"
      rows="4"
    ></textarea>

    <div id="status"></div>

    <div class="btn-row">
      <button class="btn btn-primary" id="btnGenerate">
        ${config.activeMode === 'generate' ? '⚡ Générer' : '💡 Analyser'}
      </button>
      <button class="btn btn-secondary" id="btnClear">Effacer</button>
    </div>

  </div>

  <!-- Résultats -->
  <div id="results"></div>

  <script>
    const vscode = acquireVsCodeApi();

    const instruction = document.getElementById('instruction');
    const btnGenerate = document.getElementById('btnGenerate');
    const btnClear    = document.getElementById('btnClear');
    const btnConfig   = document.getElementById('btnConfig');
    const btnMode     = document.getElementById('btnMode');
    const statusEl    = document.getElementById('status');
    const resultsEl   = document.getElementById('results');
    const configBar   = document.getElementById('configBar');
    const statusDot   = document.getElementById('statusDot');

    // ── Mode buttons ──────────────────────────────────────────────
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Changer de mode via VS Code (QuickPick)
        vscode.postMessage({ type: 'switchMode' });
      });
    });

    // ── Suggestions ───────────────────────────────────────────────
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        instruction.value = chip.dataset.text;
        instruction.focus();
        instruction.selectionStart = instruction.selectionEnd = instruction.value.length;
      });
    });

    btnGenerate.addEventListener('click', () => {
      const text = instruction.value.trim();
      if (!text) { setStatus('⚠ L\\'instruction ne peut pas être vide'); return; }
      vscode.postMessage({ type: 'generate', instruction: text });
    });

    btnClear.addEventListener('click', () => {
      instruction.value = '';
      resultsEl.innerHTML = '';
      setStatus('');
      instruction.focus();
    });

    btnConfig.addEventListener('click', () => vscode.postMessage({ type: 'configure' }));
    btnMode.addEventListener('click',   () => vscode.postMessage({ type: 'switchMode' }));

    instruction.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') btnGenerate.click();
    });

    // ── Messages reçus ────────────────────────────────────────────
    window.addEventListener('message', (event) => {
      const msg = event.data;
      switch (msg.type) {
        case 'focusInput':
          instruction.focus();
          break;
        case 'config':
          // Re-render complet si config change (géré côté panel par _render())
          break;
        case 'generating':
          setGenerating(true, msg.mode);
          resultsEl.innerHTML = '';
          break;
        case 'progress':
          setStatus('<span class="spinner"></span>' + msg.message);
          break;
        case 'result':
          setGenerating(false);
          // Rendu selon le type de réponse
          if (msg.response.tasks) {
            renderTasks(msg.response);
          } else {
            renderFiles(msg.response);
          }
          break;
        case 'error':
          setGenerating(false);
          setStatus('');
          resultsEl.innerHTML = '<div class="error-msg">❌ ' + escHtml(msg.message) + '</div>';
          break;
      }
    });

    vscode.postMessage({ type: 'getConfig' });

    // ── Helpers ───────────────────────────────────────────────────
    function setGenerating(active, modeName) {
      btnGenerate.disabled = active;
      btnGenerate.textContent = active
        ? (modeName === 'Thinking' ? '💡 Analyse...' : '⚡ Génération...')
        : (btnGenerate.dataset.mode === 'thinking' ? '💡 Analyser' : '⚡ Générer');
      if (active) setStatus('<span class="spinner"></span> Envoi à n8n...');
    }

    function setStatus(html) { statusEl.innerHTML = html; }

    // Rendu mode generate — liste de fichiers
    function renderFiles(response) {
      const cls     = response.ok ? 'ok' : response.failed > 0 ? 'error' : 'warn';
      let html = '<div class="result-header ' + cls + '">' + escHtml(response.message || '') + '</div>';
      html += '<div class="file-list">';
      (response.files || []).forEach(f => {
        const icon  = f.status === 'valid' ? '✅' : f.status === 'warning' || f.status === 'max_retries' ? '⚠️' : '❌';
        const badge = f.status === 'valid' ? 'badge-valid' : f.status === 'warning' || f.status === 'max_retries' ? 'badge-warning' : 'badge-error';
        const label = f.status === 'max_retries' ? 'retry' : f.status;
        const errors = (f.errors || []).length > 0 ? ' title="' + escAttr(f.errors.join('\\n')) + '"' : '';
        html += '<div class="file-item" data-path="' + escAttr(f.file) + '"' + errors + '>'
              + '<span class="icon">' + icon + '</span>'
              + '<span class="path">' + escHtml(f.file) + '</span>'
              + '<span class="badge ' + badge + '">' + escHtml(label) + '</span>'
              + '</div>';
      });
      html += '</div>';
      resultsEl.innerHTML = html;
      resultsEl.querySelectorAll('.file-item').forEach(el => {
        el.addEventListener('click', () => {
          vscode.postMessage({ type: 'openFile', path: el.dataset.path });
        });
      });
    }

    // Rendu mode thinking — liste de tâches avec bouton "Exécuter"
    function renderTasks(response) {
      const tasks = response.tasks || [];
      let html = '<div class="result-header ok">💡 ' + tasks.length + ' tâche(s) identifiée(s)</div>';
      html += '<div class="task-list">';
      tasks.forEach((task, i) => {
        html += '<div class="task-item ' + (task.status || 'pending') + '">'
              + '<div class="task-title">' + escHtml(task.title) + '</div>'
              + '<div class="task-desc">' + escHtml(task.instruction || '') + '</div>'
              + '<button class="task-run-btn" data-instruction="' + escAttr(task.instruction) + '">'
              + '⚡ Exécuter en Generate'
              + '</button>'
              + '</div>';
      });
      html += '</div>';
      resultsEl.innerHTML = html;

      // Clic sur "Exécuter" → envoyer la tâche en mode generate
      resultsEl.querySelectorAll('.task-run-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          instruction.value = btn.dataset.instruction;
          vscode.postMessage({ type: 'generate', instruction: btn.dataset.instruction });
        });
      });
    }

    function escHtml(str)  { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function escAttr(str)  { return escHtml(str).replace(/'/g,'&#39;'); }

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
        ? '<span class="project">' + escHtml(config.project) + '</span>'
          + ' · <span class="type">' + escHtml(config.projectType || 'nuxt3') + '</span>'
          + ' — ' + escHtml(config.webhookUrl)
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
function getNonce() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
//# sourceMappingURL=webview.js.map