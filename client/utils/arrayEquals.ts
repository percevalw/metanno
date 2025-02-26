

export const arrayEquals = (a1: any[], a2: any[]) => {
    // https://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript/7837725#7837725
    let i = a1.length;
    while (i--) {
        if (a1[i] !== a2[i]) return false;
    }
    return true
};
