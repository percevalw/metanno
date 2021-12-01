# Metanno documentation

The app is described in a single class that follow the following API.
Instantiate the app with
```python
app = App(args...)
```
and create views by calling the methods in separate cells
```python
app.span_editor("my-span-editor-1") # to create a text view
```
```python
app.table_editor("my-table-editor-1") # to create a table view
```
You can then move these views around in the JupyterLab by clicking "Detach" on them.

You need to override at least the following methods:
- `__init__` to init the app state
- `select_editor_state` to define how your state should be derived for each view

```python
class App(object):
    @property
    def state(self):
        """
        This method returns the state
        This state is proxied, that is, every mutation operation on it 
        is recorded and saved to allow undo/redo, time traveling
        and speed up the client rendering
        
        ------
        Return: JSON
        ...
        """

    @state.setter
    def state(self, state):
        """
        State setter
        Setting the state (or modifying it in a produce function or outside the app in the kernel)
        will automatically send a patch to sync to the client/kernel to keep it in sync
        The app rerenders (efficiently) every time the state changes
        """

    def set_class(self, cls):
        """
        cls: class
        Change the class, translate Python to JS, send the new translated code to the frontend
        and re-render the client
        This only works in the kernel
        """
        
    @frontend_only
    def scroll_to_line(self, editor_id, line_number):
        """
        Call this method to scroll the view `editor_id` to the line `line_number`
        only works in the client
        
        editor_id: string
        line_number: int
        """

    @frontend_only
    def scroll_to_span(self, editor_id, span_id):
        """
        Call this method to scroll the view `editor_id` to the line `line_number`
        only works in the client
        
        editor_id: string
        span_id: string
        """

    @frontend_only
    def error(self, message, auto_close=10000):
        """
        Call this method to display an error alert on the client with your message
        
        message: string
        auto_close: False|int
            False to disable auto-closing or auto-close delay in ms
        """

    @frontend_only
    def info(self, message, auto_close=10000):
        """
        Call this method to display an info alert on the client with your message
        
        message: string
        auto_close: False|int
            False to disable auto-closing or auto-close delay in ms
        """

    def span_editor(self, name=None):
        """
        Displays a span_editor view with the given `name` (also called `editor_id` throughout 
        the code)
        
        Return: displayable object
        """

    def table_editor(self, name=None):
        """
        Displays a table_editor view with the given `name` (also called `editor_id` throughout 
        the code)
        
        Return: displayable object
        """

    #-------------------------------------------#
    #  Below are the functions you can override #
    #-------------------------------------------#
    
    def __init__(self, my_arg_1=None, other_arg=None, ...):
        """
        This method is called both in the client and the kernel
        The client does not receive any argument:
        - in the client: app = App()
        - in the kernel: app = App(... your arguments ...)
        
        You should define here the state of the app
        self.state = {"entities": []} 
        """
    

    def select_editor_state(self, state, editor_id):
        """
        This is the MOST IMPORTANT function of your app
        This derives the widgets displayed data from your main state
        This method is called for each widget every time the state changes so try to keep it fast !
        
        editor_id: string
        state: JSON
        Return: 
            # if the editor is a table, ie you displayed `app.table_editor("my-editor")`
            {
                # Content of the table, one item = one row
                rows: [{
                    "highlighted": boolean, # special field that tells if the row is highlighted or not
                    "selected": boolean, # special field that tells if the row is selected or not
                    string: 
                        string # like "ok" if type == "text"
                        list of string # like ["ok", ...] if type == "multi-text"
                        {"key": string, "text": string} # like {"key": "mykey", "text": "ok"} if type == "hyperlink"
                        list of {"key": string, "text": string} # like [{"key": "mykey", "text": "ok"}, ...] if type == "multi-hyperlink"
                        boolean # like False if type == "boolean"
                }],
                
                # Column descriptors
                columns: [{
                    "name": string, # Name of the column
                    "key": string, # Where to look in a row object for the values of this column
                    "suggestions": list of any, # Should we show value suggestions when editing values in column
                    "type": "text" | "multi-text" | "hyperlink" | "multi-hyperlink" | "boolean", 
                    "readonly": boolean # Can the user edit this column
                }],
                rowKey: string | int, # unique identifier of this row
                
                # Buttons that will show above the main content area of the widget
                buttons: [{
                    "type": "button" | "spacer", # fields below only apply if "button"
                    "label": string, # button label like "Anatomy" or "⌫"
                    "color": string, # button color like 'white' or "#ff5533"
                    "key": string, # identifier of the button, good practice is to set it
                                  # equal the shortcut key like "Backspace"
                    "secondary": string # secondary label, to show the shortcut
                }],
                selectedRows: list of string, # unique identifiers of the rows that are selected
            }
            # ----------------------
            # if the editor is a text view, ie you displayed `app.span_editor("my-editor")`
            {
                "text": string, # Text that will be displayed
                
                # Annotations that will be displayed in the text
                "spans": [{
                    "begin": int,
                    "end": int,
                    "label": string, # Displayed label of this annotation
                    "style": string, # Name of the style of this annotation
                    "id": string or int, # Unique identifier of this annotation
                    "highlighted": boolean, # Highlight this annotation ?
                    "selected": boolean, # Make this annotation blink ?,
                }],
                
                # Mouse selections, that show identically to native text selection
                # Useful for multi selections that are not handled natively in the browser
                "mouse_selection": [{
                    "begin": int,
                    "end": int,
                }],
                
                # Annotation styles
                "styles": {
                    string: { # style names used for the spans[i]["style"] field
                        "color": string, # Annotation color like "white" or "rgb(...)"
                        "borderColor": string, # Optional border color, defaults to 20% darker than "color" field
                        "alpha": float, # opacity between 0 and 1, defaults to 0.8 
                    }
                },
                
                # Buttons that will show above the main content area of the widget
                "buttons": [{
                    "type": "button" | "spacer", # fields below only apply if "button"
                    "label": string, # button label like "Anatomy" or "⌫"
                    "color": string, # button color like 'white' or "#ff5533"
                    "key": string, # identifier of the button, good practice is to set it
                                  # equal the shortcut key like "Backspace"
                    "secondary": string # secondary label, to show the shortcut
                }],
            }
        """

    def on_state_change(self, state, old_state):
        """
        This only works in the kernel
        Will be called whenever the state changes in the kernel
        You should use this to save your persist the
        state / data of your app to a file or a database
        
        state: JSON
        old_state: JSON
        """

    def handle_key_press(self, editor_id, key, modkeys, spans):
        """
        Called when a key is pressed in an editor. Use this method
        to enable shortcuts for your app
    
        editor_id: string
            Name of the emitting editor
        key: string
            Pressed key like "Space", "Backspace", "a", "x", ...
        modkeys: list of string
            Modifier keys like "Ctrl", "Meta", "Shift" 
        spans: list of {begin: int, end: int}
            Spans being selected in the view
        """

    def handle_click_span(self, editor_id, span_id, modkeys):
        """
        Called when a span is clicked in the text view
    
        editor_id: string
            Name of the emitting editor
        span_id: string
            "id" field of the span that was clicked 
        modkeys: list of string
            Modifier keys like "Ctrl", "Meta", "Shift"
        """

    def handle_enter_span(self, editor_id, span_id, modkeys):
        """
        Called when a the mouse enter a spans
        Use this to highlight parts of your app depending on where the mouse is
    
        editor_id: string
            Name of the emitting editor
        span_id: string
            "id" field of the span that was entered 
        modkeys: list of string
            Modifier keys like "Ctrl", "Meta", "Shift"
        """

    def handle_leave_span(self, editor_id, span_id, modkeys):
        """
        Called when a the mouse leaves a spans
        Use this to highlight parts of your app depending on where the mouse is
    
        editor_id: string
            Name of the emitting editor
        span_id: string
            "id" field of the span that was left 
        modkeys: list of string
            Modifier keys like "Ctrl", "Meta", "Shift"
        """

    def handle_button_press(self, idx, spans):
        """
        Called when a toolbar button was clicked 
    
        idx: int
            Index of the clicked button
        spans: list of {begin: int, end: int}
            Spans being selected in the view
        """

    def handle_mouse_select(self, editor_id, spans):
        """
        Called when the user selects a zone of text
        Use this to keep the last text selection in memory
    
        editor_id: string
            Name of the emitting editor
        spans: list of {begin: int, end: int}
            Spans being selected in the view
        """

    def handle_click_cell_content(self, editor_id, key):
        """
        Clicked on a hyperlink
    
        editor_id: string
            Name of the emitting editor
        key: string
            "key" field of the hyperlink the was clicked
        """

    def handle_select_rows(self, editor_id, row_keys):
        """
        Called when the user clicked on one of the table row selection checkbox
        
        editor_id: string
            Name of the emitting editor
        row_keys: list of str
            List of row keys that are selected
        """

    def handle_select_cell(self, editor_id, row_idx, col):
        """
        Called when the user moved the cell selection
        (by pressing an arrow key for example)
        
        editor_id: string
            Name of the emitting editor
        row_idx: int
            Row number of the new selected cell
        col: string
            Column name of the new selected cell
        """

    def handle_cell_change(self, editor_id, row_idx, col, value):
        """
        Called when the user edited a cell
        
        editor_id: string
            Name of the emitting editor
        row_idx: int
            Row number of the changed cell
        col: string
            Column name of the changed cell
        value: string
            Value of the changed cell
        """
```

Additionally, some decorators can modify the behavior of the app:

The `@produce` decorator is required if you plan to mutate the state in your function
```python
@produce
def method(self, ...):
    self.state["text"] = "ok"
```

The `@frontend_only` decorator does nothing if a function is called in the client, and 
sends the call to the client if the function is called from the kernel.
If the function is decorated with both `@produce` and `@frontend_only`, the state mutations
will not be synced with the backend. This can be useful to avoid syncing "cosmetic" mutations
like annotations higlighting.
```python
@frontend_only
@produce
def method(self, ...):
    self.state["text"] = "ok"
```

The `@kernel_only` decorator does nothing if a function is called in the kernel, and 
sends the call to the kernel if the function is called from the client
```python
@kernel_only
@produce
def method(self, ...):
    self.state["text"] = "ok"
```
