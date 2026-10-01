# Aide-mémoire — Block Blast

Deux parties : la **carte du code**, pour s'y retrouver quand on développe, et les
**explications à raconter**, pour présenter le projet sans l'avoir sous les yeux.

Les numéros de ligne correspondent à la branche `feature/lisibilite`.

---

# Partie 1 — La carte du code

## Les trois fichiers

| Fichier | Lignes | Rôle en une phrase |
| --- | --- | --- |
| `game_logic.js` | 671 | Les règles. Ne touche jamais à la page, ne modifie jamais ce qu'il reçoit. |
| `display.js` | 482 | Tout ce qui écrit dans la page. Lit l'état, ne le modifie jamais. |
| `main.js` | 176 | Relie les deux. Le seul endroit qui remplace `etat` et qui écrit dans le navigateur. |
| `index.html` | 54 | La structure seule. Tous les conteneurs sont vides au départ. |
| `style.css` | 302 | La mise en forme. Les couleurs sont des variables posées par le thème. |
| `test/game_logic.test.js` | 242 | 19 tests des règles, lancés par `npm test`. |

La règle de dépendance, à retenir : **`main.js` connaît les deux autres, `display.js`
connaît `game_logic.js`, et `game_logic.js` ne connaît personne.** C'est pour ça qu'on
peut tester les règles avec Node, sans navigateur.

## L'état du jeu

Une seule variable, `etat`, déclarée dans `main.js` ligne 86. Tout le reste en découle.

```js
{
    taille: 8,              // côté de la grille
    nbCouleurs: 4,          // nombre de nuances de pièces
    grille: [[0, 0, ...]],  // 0 = vide, 1 à 4 = couleur de la pièce posée
    score: 0,
    combo: 0,
    ligneCasseeDansLeLot: false,
    pieces: [ { id, forme, couleur }, ... ]   // les 3 pièces de la réserve
}
```

## Où est quoi — `game_logic.js`

**Les données**

| Ligne | Quoi |
| --- | --- |
| 18 | `FORMES` — les 41 formes, en coordonnées `[ligne, colonne]` |
| 72 | `PIECES_PAR_LOT` = 3 |
| 340-345 | Le barème : `POINTS_PAR_LIGNE`, `PLAFOND_COMBO_PAR_LIGNE`, `MAX_LIGNES_COMPTEES` |
| 380-388 | Le tirage : chances de triplet, poids des grosses formes, nombre d'essais |

**Les outils sur la grille** — aucun ne modifie ce qu'il reçoit

| Ligne | Fonction | Fait quoi |
| --- | --- | --- |
| 85 | `etatAvec` | Copie l'état avec quelques champs remplacés. Le seul `...` du projet. |
| 100 | `casesDeLaForme` | Les cases occupées par une forme posée à tel endroit |
| 116 | `tailleDeLaForme` | Le rectangle qui contient la forme, en lignes et colonnes |
| 137 | `creerGrilleVide` | Une grille carrée de zéros |
| 155 | `copierGrille` | Une copie indépendante |
| 188 | `grilleAvecForme` | Copie avec une forme dessinée dessus |
| 203 | `grilleSansLignes` | Copie avec les lignes et colonnes indiquées vidées |
| 253 | `chercherLignesPleines` | Les index des lignes et colonnes entièrement occupées |
| 274 | `peutPoser` | Est-ce que cette forme rentre ici ? |
| 292 | `peutPoserQuelquePart` | Est-ce qu'elle rentre quelque part ? |
| 310 | `lignesCasseesPar` | Ce que cette pose ferait sauter, sans rien poser |

**Le tirage des pièces**

| Ligne | Fonction | Fait quoi |
| --- | --- | --- |
| 397 | `construireSacDeFormes` | Le sac où les grosses formes sont en 5 exemplaires |
| 430 | `creerPieces` | Tire un lot au hasard, sans vérifier |
| 465 | `peutToutPoserDansUnOrdre` | **La fonction récursive.** Vérifie qu'un lot est posable en entier |
| 504 | `tirerLotPosable` | Tire jusqu'à 40 lots et garde le premier qui passe la vérification |

**Le déroulement d'une partie**

| Ligne | Fonction | Fait quoi |
| --- | --- | --- |
| 540 | `creerEtatInitial` | L'état de départ, avec son premier lot |
| 573 | `supprimerLignesPleines` | Vide les lignes, ajoute les points, monte le combo |
| 597 | `poserPiece` | **Le cœur.** Pose, compte, nettoie, décide du combo, retire un lot |
| 637 | `partieTerminee` | Plus aucune pièce ne rentre nulle part |
| 652 | `basculerCase` | Remplit ou vide une case à la main (mode debug) |

## Où est quoi — `display.js`

| Ligne | Fonction | Fait quoi |
| --- | --- | --- |
| 18 | `themes` | Les 4 palettes. Leur longueur décide du nombre de couleurs du jeu. |
| 46 | `appliquerTheme` | Pose les couleurs comme variables CSS |
| 87 | `TAILLE_CASE` = 40 | Transmis au CSS par `--taille-case` |
| 91 | `etatAffiche` | Le dernier état dessiné. Les écouteurs viennent le lire ici. |
| 94 | `idPieceGlissee` | La pièce en cours de glisser |
| 149 | `afficherGrille` | Reconstruit les 64 cases |
| 186 | `effacerApercu` | Enlève les marques d'aperçu |
| 200 | `afficherApercu` | Montre où la pièce tomberait et ce que ça casserait |
| 231 | `animerLignesCassees` | Fait clignoter les lignes qui viennent de sauter |
| 254 | `origineDeLaPose` | Traduit la position du curseur en coin haut-gauche de la forme |
| 277 | `initInteractionsGrille` | Branche les écouteurs, **une seule fois** |
| 290 | `pieceGlisseeSur` | Quelle case, quelle pièce |
| 306-341 | `surSurvolGlisser`, `surLacher`, `surClicDebug` | Les trois gestionnaires |
| 383 | `creerElementPiece` | Fabrique une pièce de la réserve, glissable |
| 439 | `afficherReserve` | Redessine les trois pièces |
| 460 | `afficherScore` | Score, record, combo |
| 475 | `afficherFinDePartie` | Montre ou cache l'écran de fin |

## Où est quoi — `main.js`

L'en-tête du fichier (lignes 1 à 77) contient déjà le résumé de tout le projet. À lire en
premier quand on découvre le code.

| Ligne | Quoi |
| --- | --- |
| 86 | `etat` — l'état de la partie |
| 89 | `record` — relu depuis le navigateur |
| 97 | `afficherTout` — redessine les quatre morceaux de la page |
| 111 | `surPosePiece` — appelée quand le joueur lâche une pièce |
| 136 | `surBasculeCase` — clic en mode debug |
| 145 | `surRejouer` — bouton Rejouer |
| 155 | `surChoixTheme` — choix d'un thème |
| 165 et suivantes | Le démarrage : thème, écouteurs, premier affichage |

## Le chemin d'un coup, de bout en bout

```
le joueur lâche une pièce sur la grille
        |
        v
display.js  surLacher()                     l'écouteur posé sur #grille
        |                                   retrouve la case et la pièce
        v
display.js  origineDeLaPose()               position du curseur -> coin de la forme
        |
        v
main.js     surPosePiece(id, ligne, colonne)
        |
        +-- lignesCasseesPar()              AVANT la pose, pour l'animation
        |
        +-- poserPiece()                    renvoie un NOUVEL état
        |        |
        |        +-- peutPoser()            pose valide ?
        |        +-- grilleAvecForme()      dessine la pièce
        |        +-- supprimerLignesPleines()   vide, compte, monte le combo
        |        +-- tirerLotPosable()      seulement si la réserve est vide
        |
        +-- etat = ce nouvel état
        |
        +-- afficherTout()                  redessine tout
        |
        +-- animerLignesCassees()           fait clignoter
```

## Je veux modifier quelque chose, je vais où

| Je veux... | Fichier | Endroit |
| --- | --- | --- |
| Ajouter ou retirer une forme | `game_logic.js` | `FORMES`, ligne 18 |
| Changer le barème de points | `game_logic.js` | lignes 340-345 et `pointsDeSuppression` |
| Changer la taille de la grille | `main.js` | `TAILLE_GRILLE`, ligne 79 |
| Ajouter un thème ou une couleur | `display.js` | `themes`, ligne 18 — rien d'autre à toucher |
| Changer la taille des cases | `display.js` | `TAILLE_CASE`, ligne 87 |
| Changer la fréquence des grosses formes | `game_logic.js` | `POIDS_GROSSE_FORME`, ligne 385 |
| Changer l'animation de suppression | `style.css` | `@keyframes eclair-suppression` |
| Changer le mot du mode debug | `display.js` | `CODE_DEBUG`, ligne 351 |
| Ajouter un test | `test/game_logic.test.js` | puis `npm test` |

---

# Partie 2 — Ce qu'il faut savoir raconter

## Le projet en trente secondes

« Un clone de Block Blast en JavaScript, HTML et CSS, sans aucune bibliothèque. Une
grille de 8 par 8, trois pièces proposées à la fois, qu'on place sans pouvoir les
tourner. Chaque ligne ou colonne remplie disparaît et rapporte des points. La partie
s'arrête quand plus aucune des trois pièces ne rentre.

Le code est séparé en trois couches : les règles, l'affichage, et la liaison entre les
deux. Les règles ne touchent jamais à la page, ce qui nous permet de les tester
automatiquement avec Node. »

## Les cinq mécanismes à savoir expliquer

**1. Le cycle action → état → affichage**

Il n'y a qu'un seul chemin possible : le joueur agit, une fonction des règles renvoie un
nouvel état, on remplace la variable `etat`, et on redessine tout. On ne met jamais à
jour un morceau de page directement.

On redessine tout plutôt que de chercher ce qui a changé. Sur 64 cases c'est instantané,
et c'est beaucoup plus simple à suivre.

**2. L'état qu'on ne modifie jamais**

Aucune fonction des règles n'écrit dans l'objet qu'elle reçoit : elle en renvoie une
copie modifiée, fabriquée par `etatAvec`.

L'exemple concret à donner si on demande à quoi ça sert : avant de poser une pièce, on
calcule quelles lignes vont sauter, pour pouvoir les faire clignoter après. Si
`poserPiece` modifiait la grille sur place, la ligne serait déjà vide au moment de
l'animation et il n'y aurait plus rien à faire clignoter.

**3. Le tirage garanti posable**

C'est la partie la plus difficile, et c'est celle qui impressionne.

Ce qu'on veut : que les trois pièces proposées puissent toujours être posées toutes les
trois, dans un ordre ou dans un autre — pour qu'une défaite vienne d'un mauvais
placement du joueur, jamais d'un tirage impossible.

Comment : on tire un lot au hasard, on vérifie qu'il est posable en entier, et sinon on
retire. Jusqu'à 40 fois.

La vérification est une **recherche avec retour en arrière**. On prend une forme, on
l'essaie à chaque endroit possible, et pour chaque endroit qui marche on recommence avec
les formes restantes sur la grille obtenue. La fonction s'appelle elle-même avec une
forme de moins, jusqu'à la liste vide qui est le cas gagnant. Si aucun essai n'aboutit,
c'est perdu et on retire un lot.

L'ordre compte : si aucune position de A ne laisse de place à B, on repart en essayant B
en premier. D'où le nom `peutToutPoserDansUnOrdre`.

**4. Le combo**

Il compte les **lots** consécutifs pendant lesquels au moins une ligne a sauté, pas les
pièces. D'où le champ `ligneCasseeDansLeLot` : il passe à `true` dès qu'une ligne saute,
n'est jamais remis à `false` en cours de lot, et c'est `poserPiece` qui tranche à la fin
du lot — combo conservé s'il est resté `true`, remis à zéro sinon.

Conséquence à connaître : casser une ligne avec la première pièce d'un lot protège le
combo même si les deux suivantes ne cassent rien.

Le barème : `30 × L! × min(combo + 1, 6 × L)`, où L est le nombre de lignes et colonnes
cassées du même coup. La factorielle fait qu'un double vaut plus que deux simples, comme
dans le jeu original.

**5. Les écouteurs posés sur la grille, pas sur les cases**

`afficherGrille` recrée les 64 cases à chaque affichage. Des écouteurs posés dessus
seraient perdus à chaque tour. On les pose donc une seule fois sur la grille elle-même,
et le navigateur fait remonter l'événement de la case jusqu'à elle. Deux écouteurs au
lieu de cent vingt-huit.

C'est pour ça que `display.js` garde `etatAffiche` : les écouteurs sont branchés une fois
pour toutes, mais ils ont besoin de lire l'état courant, qui change à chaque coup.

## Questions probables, et quoi répondre

**« Pourquoi trois fichiers ? »**
Pour que les règles ne dépendent de rien. C'est ce qui permet de les charger dans Node et
de les tester sans navigateur. Les 19 tests ne testent que `game_logic.js`.

**« Cette recherche récursive, ce n'est pas trop lent ? »**
On a mesuré sur des parties complètes : 1,3 milliseconde au 99e centile, 2 millisecondes
au pire. La recherche s'arrête à la première solution trouvée, et deux pièces identiques
d'un triplet ne sont essayées qu'une fois.

**« Que se passe-t-il si vous ajoutez une cinquième couleur ? »**
On ajoute une nuance dans `themes`, et c'est tout. Le nombre de couleurs est déduit de la
longueur de cette liste, et la couleur d'une case passe par une variable CSS — le CSS n'a
donc pas besoin de connaître le nombre de couleurs.

**« Pourquoi une variable CSS plutôt qu'une classe par couleur ? »**
Avec une classe par couleur, il fallait maintenir la même information à trois endroits :
le JavaScript, la liste des thèmes, et les règles CSS. Avec la variable, il n'y a plus
qu'une source.

**« Comment testez-vous ? »**
`npm test`, qui lance `node --test` sur `test/game_logic.test.js`. 19 tests : les formes,
le placement, la suppression de ligne et de colonne, le barème, la montée et la retombée
du combo, le fait que l'état n'est jamais modifié, et que le lot tiré est bien posable en
entier.

**« Le jeu marche sur téléphone ? »**
Non, et c'est assumé. Le glisser-déposer HTML5 n'émet aucun événement tactile. Il
faudrait soit ajouter les événements `touchstart` et compagnie, soit passer à un modèle
clic-pour-sélectionner puis clic-pour-poser, qui marcherait partout.

**« À quoi sert le mode debug ? »**
On tape `debug` n'importe où sur la page, et on peut alors remplir ou vider les cases au
clic. Ça sert à préparer une situation précise pour la tester, par exemple une ligne
presque pleine.

**« Pourquoi l'historique git est en désordre au début ? »**
La branche `feature/game-foundations` a été réutilisée après avoir déjà été fusionnée, ce
qui a fait apparaître le même travail deux fois. On ne l'a pas réécrit volontairement :
l'historique est déjà partagé entre nous trois et les pull requests y font référence.
La refonte, elle, a été faite en 22 commits qui ne changent qu'une chose chacun.

## Les chiffres à avoir en tête

| | |
| --- | --- |
| Grille | 8 × 8 = 64 cases |
| Formes | 41, rotations comprises |
| Pièces par lot | 3 |
| Thèmes | 4, de 4 nuances chacun |
| Essais de tirage maximum | 40 |
| Barème | 30 × L! × min(combo + 1, 6 × L) |
| Tests | 19, tous sur la logique pure |
| Temps d'un coup | 1,3 ms au 99e centile |
| Lignes de JavaScript | environ 1300, commentaires compris |

## Ce qu'on assume comme limites

- Pas de support tactile, donc injouable sur téléphone
- Le bonus du jeu original quand la grille se vide entièrement n'est pas implémenté
- Le barème est une approximation : les valeurs exactes du jeu original ne sont pas publiques
- L'historique git des premières semaines est en désordre, et on a choisi de ne pas le réécrire

---

Pour le détail des mécanismes avec les schémas, voir `FONCTIONNEMENT.md`.
Pour la carte des fonctions par fichier, l'en-tête de `main.js` la reprend aussi.
