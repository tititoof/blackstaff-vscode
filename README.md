# Blackstaff — VS Code Extension

Plugin VS Code pour envoyer des instructions à n8n et générer du code Nuxt 3 + Rails.

## Installation

```bash
cd blackstaff-vscode
npm install
npm run compile
# Puis F5 dans VS Code pour tester en mode développement
# Ou : npm run package → installe le .vsix généré
```

## Configuration

1. Cliquer sur ⚙ dans le panel Blackstaff
2. Renseigner :
   - **URL webhook n8n** : `http://localhost:5678/webhook/blackstaff`
   - **Nom du projet** : `chartman2.fr`
   - **Mode** : `generate` ou `dry-run`

Ou directement dans les settings VS Code (`Ctrl+,`) → rechercher "blackstaff".

## Utilisation

1. Ouvrir le panel Blackstaff dans la sidebar (icône ⚡)
2. Taper l'instruction, ex :
   - `Créer le CRUD complet pour le modèle Article. Les champs name (string) et content (text).`
   - `Créer le système d'authentification`
3. `Ctrl+Enter` ou cliquer **⚡ Générer**
4. Les fichiers générés apparaissent avec leur statut — cliquer pour les ouvrir

## Raccourcis

| Raccourci | Action |
|-----------|--------|
| `Ctrl+Enter` | Envoyer l'instruction |
| Clic sur chip | Insérer une suggestion |
| Clic sur fichier | Ouvrir dans l'éditeur |