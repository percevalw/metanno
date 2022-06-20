const current_event: {current: Event} = {
    current: null,
};

document.addEventListener("click", setCurrentEvent, {capture: true});
document.addEventListener("mousedown", setCurrentEvent, {capture: true});
document.addEventListener("mouseup", setCurrentEvent, {capture: true});

export function getCurrentEvent() {
    return current_event.current;
}

export function setCurrentEvent(event: Event) {
    current_event.current = event;
}