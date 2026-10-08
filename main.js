// programme: Block Blast section principale
// par : Roux Loïc, Léo Del Duca, Jason Roger Marc Edmonds
// créé le : 18.08.2026
// Version: V.3.0
// dernière modif: 08.10.2026
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
Ce fichier crée le jeu et relie la logique à l'affichage. La classe Jeu est la seule qui modifie la partie, et la
seule qui écrit dans la mémoire du navigateur.

Le programme tourne toujours de la même façon :

        le joueur fait quelque chose sur la page
                    |
                    v
        une vue de display.js prévient le jeu, en appelant la fonction qu'il lui a donnée
                    |
                    v
        le jeu modifie la partie (game_logic.js)
                    |
                    v
        afficherTout() redessine la page à partir de la partie

-   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -
game_logic.js contient les règles du jeu :

classes:
~~~~~~~~

Forme:
    - une forme de pièce, décrite par ses cases en coordonnées [ligne, colonne]
    - le catalogue des 41 formes est rangé dans Forme.TOUTES

Grille:
    - la grille de jeu : poser une forme, dire si une pièce rentre, chercher et vider les lignes pleines

Bareme:
    - le calcul des points d'une suppression, selon le nombre de lignes cassées et le combo

Tirage:
    - le choix des pièces proposées, toujours posables toutes ensemble

Partie:
    - la partie en cours : grille, score, combo et pièces de la réserve
    - poserPiece() applique toutes les conséquences d'un coup, et renvoie false si la pose est impossible

-   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -
display.js contient tout ce qui touche à la page :

classes:
~~~~~~~~

Themes:
    - les quatre thèmes de couleurs, et le panneau pour les choisir

VueGrille:
    - dessine la grille, l'aperçu pendant le glisser-déposer, et fait clignoter les lignes qui sautent

GlisserDeposer:
    - suit la pièce glissée, et prévient le jeu quand elle est lâchée sur la grille

VueReserve:
    - dessine les pièces proposées, prêtes à être glissées

VueScore:
    - affiche le score, le record, le combo et l'écran de fin de partie

ModeDebug:
    - taper "debug" sur la page, puis cliquer les cases pour les remplir ou les vider

-   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -
ce fichier:
~~~~~~~~~~~

Jeu:
    - crée la partie et les vues, et réagit aux actions du joueur
    - partie : la partie en cours, remplacée par une nouvelle quand le joueur clique sur "Rejouer"
    - record : meilleur score du joueur, conservé d'une partie à l'autre dans la mémoire du navigateur
*/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// le jeu : il crée la partie et les vues, et réagit aux actions du joueur
// c'est la seule classe qui modifie la partie ; les vues ne font que la lire, et lui transmettre les actions du joueur
class Jeu {
    /**
     * prépare le jeu : thème, partie, vues, puis premier affichage
     */
    constructor() {
        // on retrouve le thème choisi la dernière fois, et à défaut on prend le premier de la liste
        Themes.appliquer(Themes.trouverParNom(localStorage.getItem(Jeu.CLE_THEME)));

        // la partie en cours
        this.partie = new Partie(Jeu.TAILLE_GRILLE, Themes.NB_COULEURS);

        // Number(null) vaut 0, et le "|| 0" couvre le cas où la valeur enregistrée ne serait pas un nombre
        this.record = Number(localStorage.getItem(Jeu.CLE_RECORD)) || 0;

        // chaque vue reçoit la fonction à appeler quand le joueur agit
        // les fonctions fléchées gardent "this" : sans elles, this ne désignerait plus le jeu au moment de l'appel
        const surPose = (idPiece, ligne, colonne) => this.surPosePiece(idPiece, ligne, colonne);
        const surBascule = (ligne, colonne) => this.surBasculeCase(ligne, colonne);

        Themes.afficherChoix((theme) => this.surChoixTheme(theme));
        this.vueGrille = new VueGrille();
        this.glisserDeposer = new GlisserDeposer(this.vueGrille, surPose);
        this.vueReserve = new VueReserve(this.glisserDeposer);
        this.vueScore = new VueScore(() => this.surRejouer());
        this.modeDebug = new ModeDebug(surBascule);

        this.afficherTout();
    }

    /**
     * redessine toute la page à partir de la partie en cours
     * on redessine tout plutôt que de chercher ce qui a changé : à cette taille de grille c'est instantané, et c'est
     * beaucoup plus simple à suivre
     * :return: rien
     */
    afficherTout() {
        this.vueGrille.afficher(this.partie);
        this.vueScore.afficher(this.partie, this.record);
        this.vueReserve.afficher(this.partie);
        this.vueScore.afficherFin(this.partie);
    }

    /**
     * appelée quand le joueur lâche une pièce sur la grille
     * :param idPiece: identifiant de la pièce lâchée
     * :param ligne: ligne du coin haut-gauche
     * :param colonne: colonne du coin haut-gauche
     * :return: rien
     */
    surPosePiece(idPiece, ligne, colonne) {
        const piece = this.partie.trouverPiece(idPiece);
        if (piece === null) return;

        // calculé AVANT la pose : après, les lignes ont déjà sauté et il n'y aurait plus rien à faire clignoter
        const cassees = this.partie.grille.lignesCasseesPar(piece.forme, ligne, colonne);

        // pose impossible : rien n'a changé, il n'y a rien à redessiner
        if (!this.partie.poserPiece(idPiece, ligne, colonne)) return;

        // mise à jour du record, conservé pour les prochaines parties
        if (this.partie.score > this.record) {
            this.record = this.partie.score;
            localStorage.setItem(Jeu.CLE_RECORD, String(this.record));
        }

        this.afficherTout();
        this.vueGrille.animer(cassees);
    }

    /**
     * appelée quand le joueur clique une case en mode debug
     * :param ligne: ligne de la case
     * :param colonne: colonne de la case
     * :return: rien
     */
    surBasculeCase(ligne, colonne) {
        this.partie.basculerCase(ligne, colonne);
        this.afficherTout();
    }

    /**
     * appelée quand le joueur clique sur "Rejouer"
     * :return: rien
     */
    surRejouer() {
        this.partie = new Partie(Jeu.TAILLE_GRILLE, Themes.NB_COULEURS);
        this.afficherTout();
    }

    /**
     * appelée quand le joueur choisit un thème dans le panneau
     * :param theme: le thème choisi
     * :return: rien
     */
    surChoixTheme(theme) {
        Themes.appliquer(theme);
        localStorage.setItem(Jeu.CLE_THEME, theme.nom);
    }
}

// côté de la grille de jeu
Jeu.TAILLE_GRILLE = 8;

// noms sous lesquels le navigateur retient le record et le thème choisi
Jeu.CLE_RECORD = "blockblast-record";
Jeu.CLE_THEME = "blockblast-theme";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// démarrage du jeu
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// le jeu est gardé dans une variable pour pouvoir l'inspecter dans la console du navigateur (jeu.partie, jeu.record)
const jeu = new Jeu();
