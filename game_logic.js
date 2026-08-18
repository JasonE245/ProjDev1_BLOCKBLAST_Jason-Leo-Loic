function createInitialState(size = 8) {
    return {
        size,
        grid: Array.from({ length: size }, () => Array(size).fill(0)),
        score: 0,
    };
}

// renvoie un nouvel état avec le score augmenté, ne modifie jamais l'état reçu
function addPoints(state, points) {
    return {
        ...state,
        score: state.score + points,
    };
}