# Moodle Vocab Helper

Extension Chrome Manifest V3 qui détecte des mots espagnols sur les pages Moodle et affiche leur traduction en français dans un petit pop-up discret.

## Installation en mode développeur

1. Télécharger ou cloner ce dépôt `moodle-vocab-helper` sur votre machine.
2. Ouvrir Chrome et aller sur `chrome://extensions/`.
3. Activer le **Mode développeur** (coin supérieur droit).
4. Cliquer sur **Charger l'extension non empaquetée**.
5. Sélectionner le dossier `moodle-vocab-helper` contenant le fichier `manifest.json`.
6. Ouvrir une page Moodle compatible, la détection et les pop-ups s'activeront automatiquement.

## Utilisation et comportement

- L'extension charge le fichier `vocab.json` inclus dans l'extension (aucune requête externe).
- Le script analyse en priorité la zone `#region-main` d'une page Moodle, puis `#page`, puis `body` si nécessaire.
- Les mots espagnols trouvés dans `vocab.json` sont détectés dans le texte de cette zone.
- Pour chaque mot détecté, un petit pop-up apparaît en haut à droite avec la forme `mot espagnol → traduction française`.
- Chaque mot n'est notifié qu'une seule fois par session grâce à un cache interne.
- Un `MutationObserver` surveille les changements dans la zone cible (chargement dynamique des questions, navigation interne, etc.) pour relancer la détection.

## Ajouter ou modifier du vocabulaire

Le vocabulaire est défini dans le fichier `vocab.json` à la racine du projet.

- Le format attendu est un objet JSON simple :

```json
{
  "hola": "bonjour",
  "libro": "livre",
  "gracias": "merci"
}
```

- La clé est le mot espagnol à détecter dans la page.
- La valeur est la traduction française qui sera affichée dans le pop-up.
- Respecter la syntaxe JSON (guillemets doubles, virgules, accolades correctement fermées).

Après modification de `vocab.json` :

- Enregistrer le fichier.
- Retourner sur `chrome://extensions/`.
- Cliquer sur le bouton **Actualiser** de l'extension *Moodle Vocab Helper* pour recharger le vocabulaire.

## Notes techniques

- Manifest V3 avec permissions minimales (`activeTab`).
- `vocab.json` est exposé via `web_accessible_resources` et chargé avec `chrome.runtime.getURL`.
- Le script normalise le texte (minuscules, suppression des accents, nettoyage des caractères spéciaux) avant la détection.
- La logique est optimisée pour ne pas rescanner en boucle tout le DOM : un `MutationObserver` cible uniquement la zone pertinente.
- L'interface de notification est minimaliste, fixe, translucide et n'interfère pas avec les interactions utilisateur.
