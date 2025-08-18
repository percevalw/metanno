from pret import component, create_store, use_state, use_store_snapshot
from pret.ui.react import div, input, label, p

state = create_store(
    {
        "faire à manger": True,
        "faire la vaisselle": False,
    },
    sync=True,
)


@component
def TodoApp():
    todos = use_store_snapshot(state)
    typed, set_typed = use_state("")
    num_remaining = sum(not ok for ok in todos.values())
    plural = "s" if num_remaining > 1 else ""

    def on_key_down(event):
        if event.key == "Enter":
            state[typed] = False
            set_typed("")

    return div(
        *(
            div(
                input(
                    checked=ok,
                    type="checkbox",
                    id=todo.replace(" ", "-"),
                    on_change=lambda e, t=todo: state.update({t: e.target.checked}),
                ),
                label(todo, **{"for": todo.replace(" ", "-")}),
            )
            for todo, ok in todos.items()
        ),
        input(
            value=typed,
            on_change=lambda event: set_typed(event.target.value),
            on_key_down=on_key_down,
            placeholder="Add a todo",
        ),
        p(f"Number of unfinished todo{plural}: {num_remaining}", level="body-md"),
    )
