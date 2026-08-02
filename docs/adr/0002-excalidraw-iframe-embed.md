# Excalidraw via embedded iframe, not bundled

Excalidraw panes embed the hosted `excalidraw.com` iframe (`?embed&iframe`) and persist scenes over postMessage, rather than bundling the `@excalidraw/excalidraw` npm package. Bundling would enable offline use but adds a multi-megabyte dependency, real integration work (init, save/load, theming), and pins the build; the stack interaction model was the risk worth spending on. The trade-off is that the canvas is network-dependent. Revisit as a separate ticket if offline usage becomes a requirement.
