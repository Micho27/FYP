//checks for changes in the monaco editor

define("MonacoConvergenceAdapter",
  ['MonacoCollabExt', 'ConvergenceColorAssigner'],
  function (MonacoCollabExt, ConvergenceColorAssigner) {

    class MonacoConvergenceAdapter {
      constructor(monacoEditor, RealTimeeditorContents) {
        this._monacoEditor = monacoEditor;
        this._model = RealTimeeditorContents;
        this._colorAssigner = new ConvergenceColorAssigner.ColorAssigner();
      }

      bind() {//binds the 3 together so one event looks for each change
        this._initSharedData();
        this._initSharedCursors();
        this._initSharedSelection();
      }
	//this one handles the real time contents inside the monaco editor
      _initSharedData(){
        this._contentManager = new MonacoCollabExt.EditorContentManager({
          editor: this._monacoEditor,
          onInsert: (index, text) => {
            this._model.insert(index, text);
          },
          onReplace:(index, length, text) => {
            this._model.model().startBatch();
            this._model.remove(index, length);
            this._model.insert(index, text);
            this._model.model().completeBatch();
          },
          onDelete: (index, length) => {
            this._model.remove(index, length);
          },
          remoteSourceId: "convergence"

        });

        this._model.events().subscribe(event => {
          switch (event.name) {
            case "insert":
              this._contentManager.insert(event.index, event.value);
              break;
            case "remove":
              this._contentManager.delete(event.index, event.value.length);
              break;
            default://does nothing if no changes
          }
        });
      }
	//this one tracks cursors
      _initSharedCursors() {
        this._remoteCursorManager = new MonacoCollabExt.RemoteCursorManager({
          editor: this._monacoEditor,
          tooltips: true,
          tooltipDuration: 2
        });
        this._cursorReference = this._model.indexReference("cursor");

        const references = this._model.references({key: "cursor"});
        references.forEach((reference) => {
          if (reference.isLocal()===false) {
            this._addRemoteCursor(reference);
          }
        });

        this._setLocalCursor();
        this._cursorReference.share();

        this._monacoEditor.onDidChangeCursorPosition(event => {
          this._setLocalCursor();
        });

        this._model.on("reference", (event) => {
          if (event.reference.key() === "cursor") {
            this._addRemoteCursor(event.reference);
          }
        });
      }

      _setLocalCursor() {
        const position = this._monacoEditor.getPosition();
        const offset = this._monacoEditor.getModel().getOffsetAt(position);
        this._cursorReference.set(offset);
      }

      _addRemoteCursor(reference) {
        const colour = this._colorAssigner.getColorAsHex(reference.sessionId());
        const remoteCursor = this._remoteCursorManager.addCursor(reference.sessionId(), colour, reference.user().displayName);

        reference.on("cleared", () => remoteCursor.hide());
        reference.on("disposed", () => remoteCursor.dispose());
        reference.on("set", () => {
          const cursorPosition = reference.value();
          remoteCursor.setOffset(cursorPosition);
        });
      }

	//this one tracks highlighting
      _initSharedSelection() {
        this._remoteSelectionManager = new MonacoCollabExt.RemoteSelectionManager({editor: this._monacoEditor});

        this._selectionReference = this._model.rangeReference("selection");
        this._setLocalSelection();
        this._selectionReference.share();

        this._monacoEditor.onDidChangeCursorSelection(event => {
          this._setLocalSelection();
        });

        const references = this._model.references({key: "selection"});
        references.forEach((reference) => {
          if (reference.isLocal()===false) {
            this._addRemoteSelection(reference);
          }
        });

        this._model.on("reference", (event) => {
          if (event.reference.key() === "selection") {
            this._addRemoteSelection(event.reference);
          }
        });
      }

      _setLocalSelection() {
        const selection = this._monacoEditor.getSelection();
        if (!selection.isEmpty()) {
          const start = this._monacoEditor.getModel().getOffsetAt(selection.getStartPosition());
          const end = this._monacoEditor.getModel().getOffsetAt(selection.getEndPosition());
          this._selectionReference.set({start, end});
        } else if (this._selectionReference.isSet()) {
          this._selectionReference.clear();
        }
      }

      _addRemoteSelection(reference) {
        const colour = this._colorAssigner.getColorAsHex(reference.sessionId())
        const remoteSelection = this._remoteSelectionManager.addSelection(reference.sessionId(), colour);

        if (reference.isSet()) {
          const highlight = reference.value();
          remoteSelection.setOffsets(highlight.start, highlight.end);
        }

        reference.on("cleared", () => remoteSelection.hide());
        reference.on("disposed", () => remoteSelection.dispose());
        reference.on("set", () => {
          const selection = reference.value();
          remoteSelection.setOffsets(selection.start, selection.end);
        });
      }
    }

    return MonacoConvergenceAdapter;
  }
);
