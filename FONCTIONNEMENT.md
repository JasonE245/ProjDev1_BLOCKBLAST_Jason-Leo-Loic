# Comment le code fonctionne

L'en-tête de `main.js` donne la carte du projet : quelles classes existent et dans quel
fichier. Ce document-ci explique ce qui ne se devine pas à la lecture, même quand on a la
carte.

## 1. Les classes et qui parle à qui

Le jeu compte douze classes, réparties dans trois fichiers :

| Fichier | Classes | Rôle |
| --- | --- | --- |
| `game_logic.js` | `Forme`, `Grille`, `Bareme`, `Tirage`, `Partie` | Les règles. Ne touche jamais à la page. |
| `display.js` | `Themes`, `VueGrille`, `GlisserDeposer`, `VueReserve`, `VueScore`, `ModeDebug` | Tout ce qui touche à la page. Ne modifie jamais la partie. |
| `main.js` | `Jeu` | Crée tout le reste et relie la logique à l'affichage. |

Ces classes ne se parlent pas n'importe comment. Il n'y a que quatre sortes de messages :

```
   le joueur
       |
       v
 +----------------------------+  1. prévient   +-------+   2. modifie   +---------------------+
 | display.js                 | -------------> |       | -------------> | game_logic.js       |
 |   GlisserDeposer, ModeDebug|                |  Jeu  |                |   Partie            |
 |   VueScore, Themes         |                |       |                |     qui utilise     |
 |                            | <------------- |       |                |     Grille, Tirage, |
 |   VueGrille, VueReserve,   |  3. redessine  +-------+                |     Bareme, Forme   |
 |   VueScore                 |                                         |                     |
 |                            | ------------------ 4. lisent ---------> |                     |
 +----------------------------+                                         +---------------------+
```

1. **Les vues préviennent le jeu.** Quand le joueur lâche une pièce, `GlisserDeposer` ne
   touche à rien : il appelle la fonction que `Jeu` lui a donnée en le créant, avec
   « la pièce p a été lâchée en (2, 3) ».
2. **Le jeu modifie la partie.** `Jeu` est la seule classe qui appelle les méthodes qui
   changent la partie, comme `poserPiece` ou `basculerCase`.
3. **Le jeu demande aux vues de redessiner.** Après chaque action, `afficherTout()`
   redessine toute la page.
4. **Les vues lisent la partie.** Pour se dessiner, `VueGrille` lit la grille, `VueScore`
   lit le score. Elles ne la modifient jamais.

Et `game_logic.js` ne connaît personne : ni la page, ni le jeu. C'est ce qui permet de
lancer ses tests avec Node, sans navigateur.

Une vue reçoit la fonction à appeler au moment où elle est créée :

```js
const gererPose = (idPiece, ligne, colonne) => this.gererPosePiece(idPiece, ligne, colonne);
this.glisserDeposer = new GlisserDeposer(this.vueGrille, gererPose);
```

La fonction fléchée `=>` sert à garder `this` : sans elle, au moment où le joueur lâche la
pièce, `this` ne désignerait plus le jeu.

## 2. Une partie qui se modifie, et la règle qui va avec

`Partie` et `Grille` se modifient elles-mêmes. Quand on écrit :

```js
this.partie.poserPiece(idPiece, ligne, colonne);
```

c'est la partie elle-même qui change : sa grille, son score, son combo, sa réserve. La
méthode renvoie `true` si la pièce a été posée, et `false` si la pose était impossible —
dans ce cas, rien n'a bougé.

Puisque la partie change sur place, une règle protège le tout : **seul `Jeu` appelle les
méthodes qui la modifient**. Si la partie se met un jour à changer de façon inattendue,
il n'y a qu'un seul endroit où chercher.

Conséquence à connaître : l'ordre des opérations compte. Dans `Jeu.gererPosePiece`, on a
besoin de savoir quelles lignes vont sauter, pour les faire clignoter. Il faut le
calculer **avant** de poser la pièce :

```js
const cassees = this.partie.grille.chercherLignesCasseesPar(piece.forme, ligne, colonne);

if (!this.partie.poserPiece(idPiece, ligne, colonne)) return;
// ... mise à jour du record ...

this.afficherTout();
this.vueGrille.animerLignesCassees(cassees);
```

Après la pose, les lignes sont déjà vides et il n'y aurait plus rien à faire clignoter.

Quand il faut essayer quelque chose sans rien changer, on travaille sur une copie :
`chercherLignesCasseesPar` et `simulerPose` commencent par `this.copier()`, puis font leur essai
sur la copie. La vraie grille n'est pas touchée.

## 3. Le tirage garanti posable

C'est la partie la plus difficile du projet, et c'est normal : c'est un vrai problème
d'algorithmique.

**Ce qu'on veut :** que les 3 pièces proposées puissent toujours être posées toutes les
trois, dans un ordre ou dans un autre. Autrement dit, qu'une défaite vienne d'un mauvais
placement du joueur et jamais d'un tirage impossible.

**Ce qu'on fait :** `Tirage.tirerLot` tire un lot au hasard, vérifie qu'il est posable en
entier, et si non retire. Jusqu'à 40 fois (`Tirage.MAX_ESSAIS_LOT`), après quoi on garde
le dernier lot — dont chaque pièce est au moins posable seule.

La vérification est faite par `Tirage.peutToutPoserDansUnOrdre`. Elle fonctionne par
**retour en arrière** : on essaie, et si ça ne mène nulle part on annule et on essaie
autre chose.

Déroulé avec deux formes, A et B :

```
peutToutPoserDansUnOrdre(grille, [A, B])
|
+- essayer A en (0,0) ?  oui
|     +- peutToutPoserDansUnOrdre(grille.simulerPose(A, 0, 0), [B])
|           +- essayer B en (0,0) ? non, occupé par A
|           +- essayer B en (0,1) ? non
|           +- ... aucune position ne marche  ->  FAUX
|
+- essayer A en (0,1) ?  oui
|     +- peutToutPoserDansUnOrdre(grille.simulerPose(A, 0, 1), [B])
|           +- essayer B en (0,0) ? oui
|                 +- peutToutPoserDansUnOrdre(..., [])  ->  liste vide  ->  VRAI
|           ->  VRAI
|     ->  VRAI
|
->  VRAI
```

Deux choses à retenir :

- **La fonction s'appelle elle-même**, à chaque fois avec une forme de moins. Le cas
  d'arrêt est la liste vide, qui renvoie `true` : plus rien à poser, donc tout a été posé.
- **L'ordre compte.** Si aucune position de A ne laisse de place à B, on repart en
  essayant B en premier. C'est ce que dit le nom de la fonction.

`simulerPose` renvoie une copie de la grille telle qu'elle serait après la pose. C'est
indispensable ici : la recherche essaie des centaines de positions, et aucune ne doit
toucher à la vraie grille.

Le coût pourrait être élevé, mais il est mesuré sur environ 1 700 coups : 2 millisecondes
au 99e centile, moins de 10 au pire, alors qu'un écran se rafraîchit toutes les 16. La
recherche s'arrête à la première solution trouvée, et deux pièces identiques ne sont
essayées qu'une fois.

## 4. La règle du combo

Le combo compte les **lots** consécutifs pendant lesquels au moins une ligne a sauté, et
non les pièces. D'où le champ `ligneCasseeDansLeLot` de `Partie` :

- `supprimerLignesPleines` fait monter le combo de 1 chaque fois qu'une ligne saute, et
  met `ligneCasseeDansLeLot` à `true` ;
- ce champ n'est jamais remis à `false` en cours de lot ;
- à la fin du lot, quand `poserPiece` voit que la réserve est vide, il tranche : si
  `ligneCasseeDansLeLot` est resté `false`, le combo retombe à 0, sinon il est conservé.

Autrement dit, casser une ligne avec la première pièce d'un lot protège le combo même si
les deux suivantes ne cassent rien.

Le barème est dans `Bareme.calculerPoints` :

```
score = 30 x L! x min(combo + 1, 6 x L)
```

où `L` est le nombre de lignes et colonnes cassées du même coup. La factorielle fait qu'un
double vaut plus que deux simples, ce qui est le comportement du jeu original. Le
multiplicateur est plafonné pour que le combo ne s'emballe pas.

## 5. Le glisser-déposer

`GlisserDeposer` pose ses écouteurs une seule fois, sur `#grille`, et pas sur les 64
cases : `VueGrille.afficher` recrée les cases à chaque affichage, et des écouteurs posés
dessus seraient perdus à chaque tour. Le navigateur fait remonter l'événement de la case
jusqu'à la grille, et `evenement.target.closest(".case")` retrouve la case concernée.

Trois détails qui ne se devinent pas :

- Sans `evenement.preventDefault()` pendant le survol, le navigateur refuse le lâcher.
- `calculerOrigine` traduit la position du curseur en coin haut-gauche de la forme, pour
  que la pièce paraisse centrée sous le curseur plutôt qu'accrochée par son coin.
- `GlisserDeposer` a besoin de savoir quelle pièce est glissée, alors que les écouteurs
  ont été posés une fois pour toutes. C'est `VueReserve` qui le prévient avec
  `commencerGlisser(idPiece)` quand le joueur attrape une pièce, et il retrouve la pièce dans
  `vueGrille.partieAffichee`, la dernière partie dessinée.

## 6. Classes sans état, et constantes posées après la classe

`Bareme`, `Tirage` et `Themes` n'ont que des méthodes `static` : on n'en crée jamais avec
`new`, on écrit directement `Bareme.calculerPoints(...)`. Ce sont des classes qui servent
à **ranger** ensemble un calcul et les constantes dont il a besoin, au lieu de les laisser
traîner en variables globales.

Les constantes sont toujours écrites **après** la classe :

```js
class Bareme {
    ...
}

Bareme.POINTS_PAR_LIGNE = 30;
```

et jamais à l'intérieur avec `static POINTS_PAR_LIGNE = 30;`. Cette deuxième syntaxe est
plus récente et n'est pas comprise par tous les navigateurs : c'est elle qui avait rendu
la page blanche sous Firefox lors de la PR #7.
