# stackytab

A browser extension that replaces the new tab page with a single vertical stack of editable panes (Markdown notes, Excalidraw canvases). One pane expanded at a time; the rest collapse to title bars.

## Language

### Stack

The single ordered list of panes that makes up the new tab page. There is exactly one stack.
_Avoid_: dashboard, grid, layout

**Pane**:
An editable unit in the stack — either a Markdown note or an Excalidraw canvas.
_Avoid_: widget, tile, card

**Add**:
The action of appending a new pane to the bottom of the stack; the new pane becomes the expanded one.
_Avoid_: create, insert

**Expand**:
The state of the pane currently filling the page. Exactly one pane is expanded at a time.
_Avoid_: open, focus

**Collapse**:
The state of a pane reduced to its title bar; the stack shows all collapsed panes as bars.
_Avoid_: minimize, hide

**Pane title**:
The name of a pane as shown on its collapsed bar and expanded header. Markdown panes derive it from the note's first line (fallback "Untitled"); Excalidraw panes are numbered. Editable in the expanded header.
_Avoid_: name, label

**Drop**:
To remove a pane from the stack. Also the drag-and-drop gesture for reordering collapsed panes.
_Avoid_: delete, remove, close

**Reorder**:
Dragging a collapsed pane's title bar up or down the stack to change its order.

**Empty stack**:
The welcome state shown when the stack has no panes: centered logo, hint text, and quick-add buttons for each pane type.

**Expanded pane**:
The pane currently in the expanded state; persists across new-tab sessions.
