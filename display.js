// `pieces` = les nuances utilisées pour distinguer les pièces posées
const themes = [
    {
        nom: "mauve", fond: "#1e1e2e", grille: "#313244", case: "#45475a", pleine: "#89b4fa",
        pieces: ["#89b4fa", "#74c7ec", "#94e2d5", "#b4befe"],
    },
    {
        nom: "rose", fond: "#2a1e2e", grille: "#3d2a3f", case: "#5a4550", pleine: "#f5a1c9",
        pieces: ["#f5a1c9", "#f2a9e0", "#eba0e0", "#f5c2e7"],
    },
    {
        nom: "forêt", fond: "#1a2418", grille: "#2b3a28", case: "#40523c", pleine: "#8fd97f",
        pieces: ["#8fd97f", "#a6e3a1", "#94e2a1", "#b8e994"],
    },
    {
        nom: "ambre", fond: "#2a2016", grille: "#3f3122", case: "#5c4a32", pleine: "#f5b942",
        pieces: ["#f5b942", "#f9c74f", "#f8961e", "#f3a83c"],
    },
];

// la longueur de `pieces` est la seule source de vérité pour le nombre de couleurs du jeu
const NB_COULEURS_PIECES = themes[0].pieces.length;

function appliquerTheme(theme) {
    const racine = document.documentElement.style;
    racine.setProperty("--couleur-fond", theme.fond);
    racine.setProperty("--fond-grille", theme.grille);
    racine.setProperty("--couleur-case", theme.case);
    racine.setProperty("--couleur-pleine", theme.pleine);
    theme.pieces.forEach((couleur, index) => {
        racine.setProperty(`--couleur-piece-${index}`, couleur);
    });
}

function afficherChoixTheme(surChoix) {
    const panneau = document.getElementById("panneau-themes");
    panneau.innerHTML = "";

    themes.forEach((theme) => {
        const pastille = document.createElement("button");
        pastille.className = "pastille-theme";
        pastille.style.background = theme.pleine;
        pastille.title = theme.nom;
        pastille.addEventListener("click", () => surChoix(theme));
        panneau.appendChild(pastille);
    });

    document.getElementById("bouton-theme").addEventListener("click", () => {
        panneau.classList.toggle("ouvert");
    });
}

function afficherScore(etat, record) {
    document.getElementById("score").textContent = `Score: ${etat.score}`;
    document.getElementById("record").textContent = `Record: ${record}`;

    // affiché seulement à partir de 2 suppressions d'affilée, quand il rapporte vraiment
    const elementCombo = document.getElementById("combo");
    elementCombo.textContent = etat.combo > 1 ? `Combo x${etat.combo}` : "";
    elementCombo.classList.toggle("visible", etat.combo > 1);
}

// fait clignoter les cases des lignes qui viennent d'être supprimées (lignes calculées
// AVANT la pose par getLinesClearedBy, puis transmises ici)
function animerLignesCassees(etat, { lignes, colonnes }) {
    const cases = new Set();
    lignes.forEach((r) => {
        for (let c = 0; c < etat.taille; c++) cases.add(caseGrille(r, c));
    });
    colonnes.forEach((c) => {
        for (let r = 0; r < etat.taille; r++) cases.add(caseGrille(r, c));
    });

    cases.forEach((elementCase) => {
        if (!elementCase) return;
        elementCase.classList.add("vient-de-sauter");
        // la durée est celle du CSS : il n'y a donc pas de valeur à garder synchronisée
        elementCase.addEventListener("animationend", () => {
            elementCase.classList.remove("vient-de-sauter");
        }, { once: true });
    });
}

function afficherFinDePartie(etat) {
    const perdu = partieTerminee(etat);
    document.getElementById("fin-de-partie").classList.toggle("ouvert", perdu);

    if (perdu) {
        document.getElementById("score-final").textContent = etat.score;
    }
}

// id de la pièce en cours de glisser-déposer ; état d'affichage transitoire, pas de l'état du jeu
let idPieceGlissee = null;

// mode debug : taper "debug" n'importe où sur la page l'active/désactive
const CODE_DEBUG = "debug";

function initRaccourciDebug() {
    let touchesTapees = "";

    document.addEventListener("keydown", (evenement) => {
        if (evenement.key.length !== 1 || evenement.ctrlKey || evenement.altKey || evenement.metaKey) return;
        touchesTapees = (touchesTapees + evenement.key.toLowerCase()).slice(-CODE_DEBUG.length);
        if (touchesTapees === CODE_DEBUG) {
            document.body.classList.toggle("mode-debug");
        }
    });
}

// Dernier état affiché. Les écouteurs de la grille sont posés une seule fois alors que les
// cases sont recréées à chaque affichage : ils viennent lire l'état courant ici.
let etatAffiche = null;

// Les écouteurs sont posés sur la grille et non sur chacune des 64 cases : deux écouteurs
// au lieu de cent vingt-huit, et rien à rebrancher après un réaffichage.
function initInteractionsGrille(surPose, surBascule) {
    const conteneur = document.getElementById("grille");

    conteneur.addEventListener("dragover", (evenement) => {
        const cible = pieceGlisseeSur(evenement);
        if (!cible) return;
        evenement.preventDefault();
        evenement.dataTransfer.dropEffect = "move";
        const origine = origineDeLaPose(cible.piece.forme, cible.case, evenement);
        afficherApercu(etatAffiche, cible.piece.forme, origine.ligne, origine.colonne);
    });

    conteneur.addEventListener("drop", (evenement) => {
        const cible = pieceGlisseeSur(evenement);
        if (!cible) return;
        evenement.preventDefault();
        effacerApercu();
        const origine = origineDeLaPose(cible.piece.forme, cible.case, evenement);
        surPose(cible.piece.id, origine.ligne, origine.colonne);
    });

    conteneur.addEventListener("click", (evenement) => {
        if (!document.body.classList.contains("mode-debug")) return;
        const caseCourante = evenement.cible.closest(".case");
        if (!caseCourante) return;
        surBascule(Number(caseCourante.dataset.ligne), Number(caseCourante.dataset.colonne));
    });
}

// case survolée et pièce en cours de glisser, ou null si l'un des deux manque
function pieceGlisseeSur(evenement) {
    const caseCourante = evenement.cible.closest(".case");
    if (!caseCourante || !etatAffiche) return null;

    const piece = etatAffiche.pieces.find((p) => p.id === idPieceGlissee);
    if (!piece) return null;

    return { caseCourante, piece };
}

// taille d'une case en pixels, transmise au CSS par la variable --cell-size
const TAILLE_CASE = 40;

// convertit la position du curseur en case d'origine (coin haut-gauche) de la forme,
// pour que la pièce paraisse centrée sous le curseur
function origineDeLaPose(forme, caseCourante, evenement) {
    const cellulesForme = FORMES[forme];
    const lignes = Math.max(...cellulesForme.map(([r]) => r)) + 1;
    const colonnes = Math.max(...cellulesForme.map(([, c]) => c)) + 1;
    const ligneCurseur = Number(caseCourante.dataset.ligne) + evenement.offsetY / TAILLE_CASE;
    const colonneCurseur = Number(caseCourante.dataset.colonne) + evenement.offsetX / TAILLE_CASE;
    return {
        ligne: Math.round(ligneCurseur - lignes / 2),
        colonne: Math.round(colonneCurseur - colonnes / 2),
    };
}

function afficherReserve(etat) {
    const conteneur = document.getElementById("reserve");
    conteneur.innerHTML = "";

    etat.pieces.forEach((piece) => {
        const cellulesForme = FORMES[piece.forme];
        const lignes = Math.max(...cellulesForme.map(([ligne]) => ligne)) + 1;
        const colonnes = Math.max(...cellulesForme.map(([, colonne]) => colonne)) + 1;

        const emplacement = document.createElement("div");
        emplacement.className = "emplacement-piece";

        const elementPiece = document.createElement("div");
        elementPiece.className = "piece";
        elementPiece.draggable = true;
        elementPiece.style.gridTemplateColumns = `repeat(${colonnes}, 14px)`;
        elementPiece.style.gridTemplateRows = `repeat(${lignes}, 14px)`;

        for (let ligne = 0; ligne < lignes; ligne++) {
            for (let colonne = 0; colonne < colonnes; colonne++) {
                const caseCourante = document.createElement("div");
                caseCourante.className = "case-piece";
                if (cellulesForme.some(([r, c]) => r === ligne && c === colonne)) {
                    caseCourante.style.setProperty("--remplissage-case", `var(--couleur-piece-${piece.couleur})`);
                }
                elementPiece.appendChild(caseCourante);
            }
        }

        elementPiece.addEventListener("dragstart", (evenement) => {
            idPieceGlissee = piece.id;
            evenement.dataTransfer.setData("text/plain", piece.id);
            evenement.dataTransfer.effectAllowed = "move";
            // centre l'image de glisser-déposer sous le curseur plutôt que sous son coin
            const rectangle = elementPiece.getBoundingClientRect();
            evenement.dataTransfer.setDragImage(elementPiece, rectangle.width / 2, rectangle.height / 2);
            elementPiece.classList.add("en-glissement");
        });

        elementPiece.addEventListener("dragend", () => {
            idPieceGlissee = null;
            elementPiece.classList.remove("en-glissement");
            effacerApercu();
        });

        emplacement.appendChild(elementPiece);
        conteneur.appendChild(emplacement);
    });
}

function caseGrille(ligne, colonne) {
    return document.querySelector(`#grille .case[data-ligne="${ligne}"][data-colonne="${colonne}"]`);
}

function afficherApercu(etat, forme, ligne, colonne) {
    effacerApercu();

    const valide = peutPoser(etat, forme, ligne, colonne);

    casesDeLaForme(forme, ligne, colonne).forEach(([r, c]) => {
        if (r < 0 || r >= etat.taille || c < 0 || c >= etat.taille) return;
        const elementCase = caseGrille(r, c);
        if (elementCase) elementCase.classList.add(valide ? "apercu-valide" : "apercu-invalide");
    });

    if (!valide) return;

    // met en évidence les lignes/colonnes que cette pose ferait sauter (getLinesClearedBy)
    const { lignes, colonnes } = lignesCasseesPar(etat, forme, ligne, colonne);

    lignes.forEach((r) => {
        for (let c = 0; c < etat.taille; c++) caseGrille(r, c)?.classList.add("apercu-suppression");
    });
    colonnes.forEach((c) => {
        for (let r = 0; r < etat.taille; r++) caseGrille(r, c)?.classList.add("apercu-suppression");
    });
}

function effacerApercu() {
    document
        .querySelectorAll("#grille .case.apercu-valide, #grille .case.apercu-invalide, #grille .case.apercu-suppression")
        .forEach((elementCase) =>
            elementCase.classList.remove("apercu-valide", "apercu-invalide", "apercu-suppression")
        );
}

function afficherGrille(etat) {
    // les écouteurs posés sur la grille viendront lire cet état
    etatAffiche = etat;

    const conteneur = document.getElementById("grille");
    conteneur.style.setProperty("--taille-case", `${TAILLE_CASE}px`);
    conteneur.style.gridTemplateColumns = `repeat(${etat.taille}, var(--taille-case))`;
    conteneur.style.gridTemplateRows = `repeat(${etat.taille}, var(--taille-case))`;
    conteneur.innerHTML = "";

    for (let ligne = 0; ligne < etat.taille; ligne++) {
        for (let colonne = 0; colonne < etat.taille; colonne++) {
            const caseCourante = document.createElement("div");
            caseCourante.className = "case";
            caseCourante.dataset.ligne = ligne;
            caseCourante.dataset.colonne = colonne;

            const valeurCase = etat.grille[ligne][colonne];
            if (valeurCase !== 0) {
                caseCourante.style.setProperty("--remplissage-case", `var(--couleur-piece-${valeurCase - 1})`);
            }

            conteneur.appendChild(caseCourante);
        }
    }
}
