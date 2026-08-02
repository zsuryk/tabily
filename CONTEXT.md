# stackytab

A browser extension that replaces the new tab page with a row of stacks of editable panes (Markdown notes, Excalidraw canvases). Each stack is an accordion: one pane expanded at a time per stack; the rest collapse to title bars.

## Language

### Stack

A column of panes in the new tab page. Any number of stacks sit side by side in a row; each stack has exactly one expanded pane at a time.
_Avoid_: dashboard, grid, layout

### Gutter

The gap between two stacks (or at either outer edge) containing a `+` button that adds a new stack at exactly that position.

### Ghost column

The collapsed form of an empty stack: a slim dashed column with its own add-pane `+`, distinct from the welcome card shown when the page has zero stacks.
_Avoid_: empty stack (as a standalone term)

### Stack drop

Removing an entire stack and all of its panes, via the `✕` at the stack's top-right on hover.
_Avoid_: delete, remove, close

### Stack reorder

Dragging a stack's grip strip left or right across the row to change its position among stacks.

### Pane

An editable unit in a stack — either a Markdown note or an Excalidraw canvas.
_Avoid_: widget, tile, card

### Add

The action of appending a new pane to the bottom of a stack; the new pane becomes that stack's expanded one. Also used for adding a new stack into a gutter.
_Avoid_: create, insert

### Expand

The state of the pane currently filling its stack. Exactly one pane per stack is expanded at a time; expanding a pane in one stack leaves other stacks' expanded panes untouched.
_Avoid_: open, focus

### Collapse

The state of a pane reduced to its title bar; the stack shows all collapsed panes as bars.
_Avoid_: minimize, hide

### Pane title

The name of a pane as shown on its collapsed bar and expanded header. Markdown panes derive it from the note's first line (fallback "Untitled"); Excalidraw panes are numbered "Canvas N" within their stack. Editable in the expanded header; clearing the edit reverts to the derived title.
_Avoid_: name, label

### Drop

To remove a pane from its stack; dropping the expanded pane expands the pane above it (or none). Also the drag-and-drop gesture for reordering collapsed panes within a stack.
_Avoid_: delete, remove, close

### Reorder

Dragging a collapsed pane's title bar up or down within its own stack to change its order. Cross-stack pane dragging is out of scope.

### Expanded pane

The pane currently in the expanded state within its stack; persists across new-tab sessions.

### Welcome card

The page state with zero stacks: centered logo, hint text, and quick-add buttons for each pane type.
