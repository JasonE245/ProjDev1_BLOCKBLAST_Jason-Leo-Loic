# Aide-mémoire — Block Blast

Deux parties : la **carte du code**, pour s'y retrouver quand on développe, et les
**explications à raconter**, pour présenter le projet sans l'avoir sous les yeux.

Les numéros de ligne correspondent à la branche `feature/classes`.

---

# Partie 1 — La carte du code

## Les fichiers

| Fichier | Lignes | Classes | Rôle en une phrase |
| --- | --- | --- | --- |
| `game_logic.js` | 707 | 5 | Les règles. Ne touche jamais à la page. |
| `display.js` | 592 | 6 | Tout ce qui écrit dans la page. Lit la partie, ne la modifie jamais. |
| `main.js` | 196 | 1 | La classe `Jeu`, qui relie les deux autres. Le seul à modifier la partie. |
| `index.html` | 54 | | La structure seule. Tous les conteneurs sont vides au départ. |
| `style.css` | 302 | | La mise en forme. Les couleurs sont des variables posées par le thème. |
| `test/game_logic.test.js` | 262 | | 20 tests des règles, lancés par `npm test`. |

La règle de dépendance, à retenir : **`main.js` connaît les deux autres, `display.js`
connaît `game_logic.js`, et `game_logic.js` ne connaît personne.** C'est pour ça qu'on
peut tester les règles avec Node, sans navigateur.

Il n'y a plus qu'**un seul nom global** dans tout le projet : `jeu`, créé à la dernière
ligne de `main.js`. Tout le reste est rangé dans les douze classes.

## La partie

Un seul objet, `jeu.partie`, créé dans le constructeur de `Jeu` (`main.js` ligne
93). Tout le reste en découle.

```js
{
    grille: Grille,         // sa taille et ses cases : 0 = vide, 1 à 4 = couleur de la pièce posée
    nbCouleurs: 4,          // nombre de nuances de pièces
    score: 0,
    combo: 0,
    ligneCasseeDansLeLot: false,
    pieces: [ { id, forme, couleur }, ... ]   // les 3 pièces de la réserve
}
```

## Où est quoi — `game_logic.js`

| Ligne | Quoi | Fait quoi |
| --- | --- | --- |
| 21 | **`class Forme`** | Une forme de pièce, décrite par ses cases en `[ligne, colonne]` |
| 41 | `calculerTaille()` | Le rectangle qui contient la forme, en lignes et colonnes |
| 59 | `calculerCasesPosees()` | Les cases occupées par la forme posée à tel endroit |
| 74 | `Forme.trouverParNom()` | Retrouve une forme à partir de son nom |
| 88 | `Forme.TOUTES` | Le catalogue des 41 formes |
| 147 | **`class Grille`** | La grille de jeu : 0 = case vide, 1 à 4 = couleur de la pièce posée |
| 190 | `copier()` | Une copie indépendante, pour faire un essai sans toucher à la vraie |
| 221 | `peutPoser()` | Est-ce que cette forme rentre ici ? |
| 237 | `peutPoserQuelquePart()` | Est-ce qu'elle rentre quelque part ? |
| 254 | `poserForme()` | Dessine une forme sur la grille |
| 288 | `chercherLignesPleines()` | Les index des lignes et colonnes entièrement occupées |
| 306 | `viderLignes()` | Vide les lignes et colonnes indiquées |
| 329 | `chercherLignesCasseesPar()` | Ce que cette pose ferait sauter, sans rien poser |
| 348 | `calculerGrilleApresPose()` | La grille après une pose, sur une copie |
| 378 | **`class Bareme`** | Le calcul des points. Que des méthodes `static` |
| 399 | `Bareme.calculerPoints()` | Les points d'une suppression |
| 409 | `Bareme.POINTS_PAR_LIGNE` | Les constantes du barème |
| 421 | **`class Tirage`** | Le choix des pièces. Que des méthodes `static` |
| 430 | `Tirage.construireSac()` | Le sac où les grosses formes sont en 5 exemplaires |
| 494 | `Tirage.peutToutPoserDansUnOrdre()` | **La fonction récursive.** Vérifie qu'un lot est posable en entier |
| 534 | `Tirage.tirerLot()` | Tire jusqu'à 40 lots et garde le premier qui passe la vérification |
| 561 | `Tirage.CHANCE_TRIPLE_GRILLE_VIDE` | Les constantes du tirage |
| 580 | **`class Partie`** | La partie en cours. Se modifie elle-même |
| 586 | `constructor()` | Grille vide, score à zéro, premier lot |
| 601 | `trouverPiece()` | Une pièce de la réserve, à partir de son identifiant |
| 627 | `supprimerLignesPleines()` | Vide les lignes, ajoute les points, monte le combo |
| 647 | `poserPiece()` | **Le cœur.** Pose, compte, nettoie, décide du combo, retire un lot. Renvoie `false` si impossible |
| 679 | `estTerminee()` | Plus aucune pièce ne rentre nulle part |
| 693 | `basculerCase()` | Remplit ou vide une case à la main (mode debug) |

## Où est quoi — `display.js`

| Ligne | Quoi | Fait quoi |
| --- | --- | --- |
| 17 | **`class Themes`** | Les thèmes de couleurs. Que des méthodes `static` |
| 24 | `Themes.appliquer()` | Pose les couleurs comme variables CSS |
| 55 | `Themes.afficherChoix()` | Remplit le panneau de choix et branche son bouton |
| 76 | `Themes.LISTE` | Les 4 palettes. Leur longueur décide du nombre de couleurs du jeu |
| 119 | **`class VueGrille`** | Le dessin de la grille |
| 183 | `afficher()` | Reconstruit les 64 cases et retient la partie dessinée |
| 227 | `afficherApercu()` | Montre où la pièce tomberait et ce que ça casserait |
| 258 | `animerLignesCassees()` | Fait clignoter les lignes qui viennent de sauter |
| 271 | `VueGrille.TAILLE_CASE` | 40 pixels, transmis au CSS par `--taille-case` |
| 281 | **`class GlisserDeposer`** | Le glisser-déposer. Écouteurs posés **une seule fois** sur la grille |
| 303 | `commencerGlisser()` | Appelée par la réserve quand le joueur attrape une pièce |
| 324 | `calculerOrigine()` | Traduit la position du curseur en coin haut-gauche de la forme |
| 360 | `gererSurvol()` | Montre l'aperçu pendant que la pièce survole la grille |
| 377 | `gererLacher()` | Prévient le jeu quand la pièce est lâchée |
| 395 | **`class ModeDebug`** | Taper « debug », puis cliquer les cases pour les remplir ou les vider |
| 452 | `ModeDebug.CODE` | Le mot à taper |
| 459 | **`class VueReserve`** | Le dessin des pièces proposées |
| 492 | `creerElementPiece()` | Fabrique une pièce glissable |
| 548 | **`class VueScore`** | Score, record, combo, et écran de fin avec son bouton Rejouer |
| 584 | `afficherFinDePartie()` | Montre ou cache l'écran de fin |

## Où est quoi — `main.js`

L'en-tête du fichier (lignes 1 à 79) résume déjà tout le projet, classe par
classe. À lire en premier quand on découvre le code.

| Ligne | Quoi | Fait quoi |
| --- | --- | --- |
| 84 | **`class Jeu`** | Crée la partie et les vues, et réagit aux actions du joueur |
| 88 | `constructor()` | Le démarrage : thème, partie, vues, et les fonctions données à chaque vue |
| 119 | `afficherTout()` | Redessine toute la page |
| 133 | `gererPosePiece()` | Le joueur a lâché une pièce |
| 159 | `gererBasculeCase()` | Clic en mode debug |
| 168 | `gererRejouer()` | Bouton Rejouer |
| 178 | `gererChoixTheme()` | Choix d'un thème |
| 185 | `Jeu.TAILLE_GRILLE` | Côté de la grille, et noms sous lesquels le navigateur retient record et thème |
| 196 | `const jeu = new Jeu()` | Le démarrage, et le seul nom global de tout le projet |

## Le chemin d'un coup, de bout en bout

```
le joueur lâche une pièce sur la grille
        |
        v
GlisserDeposer.gererLacher()            l'écouteur posé sur #grille retrouve la case et la pièce
        |
        v
GlisserDeposer.calculerOrigine()        position du curseur -> coin de la forme
        |
        v
Jeu.gererPosePiece(id, ligne, colonne)    la fonction que le jeu a donnée au glisser-déposer
        |
        +-- partie.grille.chercherLignesCasseesPar()    AVANT la pose, pour l'animation
        |
        +-- partie.poserPiece()                 modifie la partie, renvoie false si impossible
        |        |
        |        +-- grille.peutPoser()                 pose valide ?
        |        +-- grille.poserForme()                dessine la pièce
        |        +-- partie.supprimerLignesPleines()    vide, compte avec Bareme, monte le combo
        |        +-- Tirage.tirerLot()                  seulement si la réserve est vide
        |
        +-- jeu.afficherTout()                  VueGrille, VueScore et VueReserve redessinent
        |
        +-- vueGrille.animerLignesCassees()                  fait clignoter
```

## Je veux modifier quelque chose, je vais où

| Je veux... | Fichier | Endroit |
| --- | --- | --- |
| Ajouter ou retirer une forme | `game_logic.js` | `Forme.TOUTES`, ligne 88 |
| Changer le barème de points | `game_logic.js` | `Bareme.POINTS_PAR_LIGNE` et suivantes, ligne 409 |
| Changer la taille de la grille | `main.js` | `Jeu.TAILLE_GRILLE`, ligne 185 |
| Ajouter un thème ou une couleur | `display.js` | `Themes.LISTE`, ligne 76 — rien d'autre à toucher |
| Changer la taille des cases | `display.js` | `VueGrille.TAILLE_CASE`, ligne 271 |
| Changer la fréquence des grosses formes | `game_logic.js` | `Tirage.POIDS_GROSSE_FORME`, ligne 566 |
| Changer l'animation de suppression | `style.css` | `@keyframes eclair-suppression` |
| Changer le mot du mode debug | `display.js` | `ModeDebug.CODE`, ligne 452 |
| Réagir à une nouvelle action du joueur | `main.js` et `display.js` | Une méthode `gerer...` dans `Jeu`, passée à la vue concernée dans le constructeur |
| Ajouter un test | `test/game_logic.test.js` | puis `npm test` |

---

# Partie 2 — Ce qu'il faut savoir raconter

## Le projet en trente secondes

« Un clone de Block Blast en JavaScript, HTML et CSS, sans aucune bibliothèque. Une
grille de 8 par 8, trois pièces proposées à la fois, qu'on place sans pouvoir les
tourner. Chaque ligne ou colonne remplie disparaît et rapporte des points. La partie
s'arrête quand plus aucune des trois pièces ne rentre.

Le code est organisé en douze classes, réparties en trois couches : les règles,
l'affichage, et le jeu qui relie les deux. Les règles ne touchent jamais à la page, ce
qui nous permet de les tester automatiquement avec Node. »

## Les cinq mécanismes à savoir expliquer

**1. Douze classes, quatre sortes de messages**

Les vues **préviennent** le jeu quand le joueur agit, en appelant une fonction que le jeu
leur a donnée en les créant. Le jeu **modifie** la partie. Le jeu demande aux vues de
**redessiner**. Et les vues **lisent** la partie pour se dessiner. Il n'existe aucun
autre chemin : une vue ne modifie jamais la partie, et les règles ne connaissent pas la
page.

**2. Une partie qui se modifie, et un seul endroit qui la modifie**

`partie.poserPiece()` change la partie elle-même et renvoie `true` ou `false`. Pour que ça
reste maîtrisé, une seule classe a le droit d'appeler les méthodes qui modifient la
partie : `Jeu`. Si la partie se met un jour à changer de façon inattendue, il n'y a qu'un
endroit où chercher.

L'exemple concret à donner : avant de poser une pièce, le jeu calcule quelles lignes vont
sauter, pour pouvoir les faire clignoter après. Il **doit** le faire avant : après la
pose, les lignes sont déjà vides.

**3. Le tirage garanti posable**

C'est la partie la plus difficile, et c'est celle qui impressionne.

Ce qu'on veut : que les trois pièces proposées puissent toujours être posées toutes les
trois, dans un ordre ou dans un autre — pour qu'une défaite vienne d'un mauvais
placement du joueur, jamais d'un tirage impossible.

Comment : on tire un lot au hasard, on vérifie qu'il est posable en entier, et sinon on
retire. Jusqu'à 40 fois.

La vérification est une **recherche avec retour en arrière**. On prend une forme, on
l'essaie à chaque endroit possible, et pour chaque endroit qui marche on recommence avec
les formes restantes sur une copie de la grille. La fonction s'appelle elle-même avec une
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

`VueGrille` recrée les 64 cases à chaque affichage. Des écouteurs posés dessus seraient
perdus à chaque tour. `GlisserDeposer` les pose donc une seule fois sur la grille
elle-même, et le navigateur fait remonter l'événement de la case jusqu'à elle. Deux
écouteurs au lieu de cent vingt-huit.

## Questions probables, et quoi répondre

**« Pourquoi des classes ? »**
Avant, le code comptait 51 fonctions et 22 variables globales. Il compte maintenant douze
classes et un seul nom global, `jeu`. Chaque classe regroupe ce qui parle de la même
chose : pour modifier le barème on va dans `Bareme`, pour l'aperçu dans `VueGrille`.

**« Pourquoi trois fichiers ? »**
Pour que les règles ne dépendent de rien. C'est ce qui permet de les charger dans Node et
de les tester sans navigateur. Les 20 tests ne testent que `game_logic.js`.

**« Pourquoi `Bareme`, `Tirage` et `Themes` n'ont que des méthodes `static` ? »**
Parce qu'elles n'ont rien à retenir : un calcul de points ne dépend que de ce qu'on lui
donne. On n'en crée jamais avec `new`, on écrit `Bareme.calculerPoints(...)`. La classe
sert à ranger le calcul avec ses constantes.

**« Pourquoi les constantes sont écrites après la classe ? »**
La syntaxe `static X = ...` à l'intérieur de la classe est plus récente et n'est pas
comprise par tous les navigateurs. C'est elle qui avait rendu la page blanche sous
Firefox lors de la PR #7. On écrit donc `Bareme.POINTS_PAR_LIGNE = 30;` juste après la
classe, ce qui marche partout.

**« Cette recherche récursive, ce n'est pas trop lent ? »**
On a mesuré sur environ 1 700 coups : 2 millisecondes au 99e centile, moins de 10 au pire,
alors qu'un écran se rafraîchit toutes les 16. La recherche s'arrête à la première
solution trouvée, et deux pièces identiques ne sont essayées qu'une fois.

**« Que se passe-t-il si vous ajoutez une cinquième couleur ? »**
On ajoute une nuance dans `Themes.LISTE`, et c'est tout. Le nombre de couleurs est déduit
de la longueur de cette liste, et la couleur d'une case passe par une variable CSS — le
CSS n'a donc pas besoin de connaître le nombre de couleurs.

**« Comment testez-vous ? »**
`npm test`, qui lance `node --test` sur `test/game_logic.test.js`. 20 tests : les formes,
la grille (dont le fait qu'une copie est bien indépendante), le placement, la réserve, la
suppression de ligne et de colonne, le barème, la montée et la retombée du combo, le lot
tiré posable en entier, et la fin de partie.

**« Le jeu marche sur téléphone ? »**
Non, et c'est assumé. Le glisser-déposer HTML5 n'émet aucun événement tactile. Il
faudrait soit ajouter les événements `touchstart` et compagnie, soit passer à un modèle
clic-pour-sélectionner puis clic-pour-poser, qui marcherait partout.

**« À quoi sert le mode debug ? »**
On tape `debug` n'importe où sur la page, et on peut alors remplir ou vider les cases au
clic. Ça sert à préparer une situation précise pour la tester, par exemple une ligne
presque pleine.

**« Pourquoi l'historique git fait des allers-retours ? »**
Deux fois. Au début, la branche `feature/game-foundations` a été réutilisée après avoir
déjà été fusionnée, ce qui a fait apparaître le même travail deux fois. Et en octobre, la
PR #7 a été fusionnée avant d'avoir été testée dans le navigateur : la #8 l'a annulée et
la #9 l'a remise, corrigée. On ne réécrit pas l'historique partagé ; la leçon retenue,
c'est d'ouvrir le jeu avant de fusionner.

## Les chiffres à avoir en tête

| | |
| --- | --- |
| Grille | 8 × 8 = 64 cases |
| Formes | 41, rotations comprises |
| Pièces par lot | 3 |
| Thèmes | 4, de 4 nuances chacun |
| Classes | 12, et un seul nom global (`jeu`) |
| Essais de tirage maximum | 40 |
| Barème | 30 × L! × min(combo + 1, 6 × L) |
| Tests | 20, tous sur la logique |
| Temps d'un coup | 2 ms au 99e centile |
| Lignes de JavaScript | 1495, commentaires compris |

## Ce qu'on assume comme limites

- Pas de support tactile, donc injouable sur téléphone
- Le bonus du jeu original quand la grille se vide entièrement n'est pas implémenté
- Le barème est une approximation : les valeurs exactes du jeu original ne sont pas publiques
- L'historique git contient deux allers-retours, qu'on a choisi de ne pas réécrire

---

Pour le détail des mécanismes avec les schémas, voir `FONCTIONNEMENT.md`.
Pour la carte des classes par fichier, l'en-tête de `main.js` la reprend aussi.
