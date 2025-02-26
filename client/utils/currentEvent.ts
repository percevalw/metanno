const currentEvent: {current: Event} = {
    current: null,
};

document.addEventListener("click", setCurrentEvent, {capture: true});
document.addEventListener("mousedown", setCurrentEvent, {capture: true});
document.addEventListener("mouseup", setCurrentEvent, {capture: true});

function setCurrentEvent(event: Event) {
    currentEvent.current = event;
}

export function getCurrentEvent() {
    return currentEvent.current;
}
