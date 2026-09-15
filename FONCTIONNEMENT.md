# Comment le code fonctionne

L'en-tête de `main.js` donne la carte du projet : quelles fonctions existent et dans quel
fichier. Ce document-ci explique les quatre points qui ne se devinent pas à la lecture,
même quand on a la carte.

## 1. Le cycle : action, nouvel état, réaffichage

Tout le jeu tient dans une seule variable, `etat`, déclarée dans `main.js` :

```js
{
    taille: 8,              // côté de la grille
    nbCouleurs: 4,          // nombre de couleurs de pièces
    grille: [[0, 0, ...]],  // 0 = case vide, 1 à 4 = couleur de la pièce posée
    score: 0,
    combo: 0,
    ligneCasseeDansLeLot: false,
    pieces: [ { id, forme, couleur }, ... ]   // les 3 pièces de la réserve
}
```

Il n'y a jamais de modification directe de l'affichage. Le seul enchaînement possible est
celui-ci, écrit en entier dans `surPosePiece` (`main.js`) :

```
le joueur lâche une pièce
        |
        v
poserPiece(etat, ...)  ->  renvoie un NOUVEL état
        |
        v
etat = ce nouvel état
        |
        v
afficherTout()  ->  redessine la page à partir de etat
```

`afficherTout()` ne fait aucun calcul : il redessine la grille, le score, la réserve et
l'écran de fin à partir de l'état, sans se demander ce qui a changé. C'est plus simple à
suivre qu'un affichage qui essaierait de ne mettre à jour que les cases touchées, et à
cette taille de grille c'est instantané.

## 2. Pourquoi on ne modifie jamais l'état

Dans `game_logic.js`, aucune fonction n'écrit dans l'objet qu'elle reçoit. Elle en renvoie
une copie modifiée, fabriquée par `etatAvec` :

```js
return etatAvec(etat, { score: etat.score + points });
```

Cette ligne veut dire : « recopie tous les champs de `etat`, puis remplace `score` par
cette nouvelle valeur ». L'ancien état n'a pas bougé. C'est le seul endroit du programme
qui utilise `...`, justement pour n'avoir à l'expliquer qu'une fois.

L'intérêt est concret. Dans `surPosePiece`, on a besoin de savoir quelles lignes vont
sauter **avant** de poser la pièce, pour pouvoir les faire clignoter ensuite :

```js
const cassees = lignesCasseesPar(etat.grille, piece.forme, ligne, colonne);
etat = poserPiece(etat, idPiece, ligne, colonne);
afficherTout();
animerLignesCassees(etat, cassees);
```

Si `poserPiece` modifiait la grille sur place, la ligne serait déjà vidée au moment de
l'animation et il n'y aurait plus rien à faire clignoter.

## 3. Le tirage garanti posable

C'est la partie la plus difficile du projet, et c'est normal : c'est un vrai problème
d'algorithmique.

**Ce qu'on veut :** que les 3 pièces proposées puissent toujours être posées toutes les
trois, dans un ordre ou dans un autre. Autrement dit, qu'une défaite vienne d'un mauvais
placement du joueur et jamais d'un tirage impossible.

**Ce qu'on fait :** `tirerLotPosable` tire un lot au hasard, vérifie qu'il est posable en
entier, et si non retire. Jusqu'à 40 fois (`MAX_ESSAIS_LOT`), après quoi on garde le
dernier lot — dont chaque pièce est au moins posable seule.

La vérification est faite par `peutToutPoserDansUnOrdre`. Elle fonctionne par **retour en
arrière** : on essaie, et si ça ne mène nulle part on annule et on essaie autre chose.

Déroulé avec deux formes, A et B :

```
peutToutPoserDansUnOrdre(grille, [A, B])
|
+- essayer A en (0,0) ?  oui
|     +- peutToutPoserDansUnOrdre(grille avec A en (0,0), [B])
|           +- essayer B en (0,0) ? non, occupé par A
|           +- essayer B en (0,1) ? non
|           +- ... aucune position ne marche  ->  FAUX
|
+- essayer A en (0,1) ?  oui
|     +- peutToutPoserDansUnOrdre(grille avec A en (0,1), [B])
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

Le coût pourrait être élevé, mais il est mesuré : environ 1,3 ms au 99e centile et 2 ms au
pire sur une partie complète. La recherche s'arrête à la première solution trouvée, et
deux pièces identiques ne sont essayées qu'une fois.

## 4. La règle du combo

Le combo compte les **lots** consécutifs pendant lesquels au moins une ligne a sauté, et
non les pièces. D'où le champ `ligneCasseeDansLeLot` :

- `supprimerLignesPleines` fait monter le combo de 1 chaque fois qu'une ligne saute, et
  met `ligneCasseeDansLeLot` à `true` ;
- ce champ n'est jamais remis à `false` en cours de lot ;
- à la fin du lot, quand `poserPiece` voit que la réserve est vide, il tranche : si
  `ligneCasseeDansLeLot` est resté `false`, le combo retombe à 0, sinon il est conservé.

Autrement dit, casser une ligne avec la première pièce d'un lot protège le combo même si
les deux suivantes ne cassent rien.

Le barème est dans `pointsDeSuppression` :

```
score = 30 x L! x min(combo + 1, 6 x L)
```

où `L` est le nombre de lignes et colonnes cassées du même coup. La factorielle fait qu'un
double vaut plus que deux simples, ce qui est le comportement du jeu original. Le
multiplicateur est plafonné pour que le combo ne s'emballe pas.

## 5. Le glisser-déposer

Les écouteurs sont posés une seule fois sur `#grille`, pas sur les 64 cases, parce que
`afficherGrille` recrée les cases à chaque affichage : des écouteurs posés dessus seraient
perdus à chaque tour. Le navigateur fait remonter l'événement de la case jusqu'à la
grille, et `evenement.target.closest(".case")` retrouve la case concernée.

Deux détails qui ne se devinent pas :

- Sans `evenement.preventDefault()` dans `dragover`, le navigateur refuse le lâcher.
- `origineDeLaPose` traduit la position du curseur en coin haut-gauche de la forme, pour
  que la pièce paraisse centrée sous le curseur plutôt qu'accrochée par son coin.

Comme les écouteurs sont posés une fois pour toutes mais que l'état change à chaque coup,
`display.js` garde le dernier état affiché dans `etatAffiche`, mis à jour par
`afficherGrille`. C'est la seule variable partagée du fichier.
