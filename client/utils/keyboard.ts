
export const makeModKeys = (event: React.KeyboardEvent | React.MouseEvent | React.TouchEvent): string[] => {
    const modkeys = [];
    if (event.shiftKey)
        modkeys.push("Shift");
    if (event.metaKey)
        modkeys.push("Meta");
    if (event.ctrlKey)
        modkeys.push("Control");
    return modkeys;
};
