# Block Blast

**Auteurs :** Roux Loïc, Léo Del Duca, Jason Roger

## But du jeu

Jeu à un joueur sur une grille de 8 par 8. On y place des formes géométriques, sans
pouvoir les tourner et sans qu'elles se superposent. Chaque ligne ou colonne remplie
entièrement disparaît et rapporte des points. La partie s'arrête quand plus aucune des
trois pièces proposées ne rentre dans la grille.

Casser des lignes sur plusieurs lots d'affilée fait monter un combo, qui multiplie les
points. Les trois pièces d'un lot sont toujours tirées de façon à pouvoir être posées
toutes les trois : une défaite vient d'un mauvais placement, jamais du tirage.

## Fonctionnalités

- Grille 8x8, glisser-déposer des pièces avec aperçu du placement
- Suppression des lignes et des colonnes pleines, avec animation
- Score, record conservé d'une partie à l'autre, combo
- Quatre thèmes de couleurs, conservés eux aussi
- Mode debug : taper `debug` sur la page, puis cliquer les cases pour les remplir ou les
  vider à la main et préparer une situation à tester

## Organisation du code

| Fichier | Rôle |
| --- | --- |
| `game_logic.js` | Règles du jeu, en cinq classes : `Forme`, `Grille`, `Bareme`, `Tirage`, `Partie`. Ne touche jamais à la page. |
| `display.js` | Affichage, en six classes : `Themes`, `VueGrille`, `GlisserDeposer`, `VueReserve`, `VueScore`, `ModeDebug`. Lit la partie, ne la modifie jamais. |
| `main.js` | La classe `Jeu`, qui crée la partie et les vues et réagit aux actions du joueur. Seule à modifier la partie et la mémoire du navigateur. Son en-tête donne la carte de tout le projet. |
| `style.css` | Mise en forme. Les couleurs sont des variables CSS posées par le thème actif. |
| `test/` | Tests de `game_logic.js`. |

L'en-tête de `main.js` liste toutes les classes du projet et le fichier où elles se
trouvent. Le document [FONCTIONNEMENT.md](FONCTIONNEMENT.md) va plus loin et explique les
points qui ne se devinent pas à la lecture : qui parle à qui entre les classes, pourquoi
seule la classe `Jeu` modifie la partie, comment marche le tirage garanti posable avec un
exemple déroulé, et la règle du combo.

L'[aide-mémoire](AIDE-MEMOIRE.md) donne la carte du code ligne par ligne, et ce qu'il faut
savoir raconter pour présenter le projet.

Le code, les commentaires et les noms de fonctions sont en français.

## Lancer le jeu

Ouvrir `index.html` dans un navigateur. Aucune installation n'est nécessaire.

## Lancer les tests

Node.js 18 ou plus récent :

```
npm test
```

## Technologies

JavaScript, HTML, CSS. Aucune bibliothèque externe.
