import React, { useEffect, useRef, useState } from "react";
import "codemirror/mode/javascript/javascript";
import "codemirror/theme/material-palenight.css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/lib/codemirror.css";
import CodeMirror from "codemirror";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/javascript-hint";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/scroll/simplescrollbars";
import "codemirror/addon/scroll/simplescrollbars.css";
import "codemirror/addon/selection/active-line";
import { motion, AnimatePresence } from "framer-motion";
import CursorLabel from "./CursorLabel";

function Editor({ socketRef, roomId, onCodeChange }) {
  const editorRef = useRef(null);
  const [cursors, setCursors] = useState({});
  const typingTimeoutRef = useRef({});

  useEffect(() => {
    async function init() {
      editorRef.current = CodeMirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: { name: "javascript", json: true },
          theme: "material-palenight",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
          lineWrapping: true,
          matchBrackets: true,
          autoRefresh: true,
          styleActiveLine: true,
          scrollbarStyle: "overlay",
          tabSize: 2,
          extraKeys: {
            "Ctrl-Space": "autocomplete",
            "Tab": (cm) => {
              if (cm.somethingSelected()) {
                cm.indentSelection("add");
              } else {
                cm.replaceSelection("  ");
              }
            }
          },
          lint: true,
        }
      );

      // Add custom styles to editor
      const editor = editorRef.current;
      editor.getWrapperElement().style.fontSize = "14px";
      editor.getWrapperElement().style.fontFamily = "'Fira Code', monospace";
      editor.getWrapperElement().style.height = "calc(100vh - 2rem)";
      editor.getWrapperElement().style.borderRadius = "var(--radius-lg)";
      editor.refresh();

      editor.on("change", (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();
        onCodeChange(code);
        if (origin !== "setValue") {
          socketRef.current.emit("code-change", {
            roomId,
            code,
          });
          
          // Get cursor position and emit typing status
          const pos = editor.getCursor();
          const coords = editor.cursorCoords(pos, "window");
          socketRef.current.emit("cursor-update", {
            roomId,
            position: {
              left: coords.left,
              top: coords.top,
            },
          });

          // Clear previous timeout for this user
          if (typingTimeoutRef.current[socketRef.current.id]) {
            clearTimeout(typingTimeoutRef.current[socketRef.current.id]);
          }

          // Set new timeout to remove typing indicator
          typingTimeoutRef.current[socketRef.current.id] = setTimeout(() => {
            socketRef.current.emit("cursor-update", {
              roomId,
              position: null,
            });
          }, 1500);
        }
      });

      // Listen for code changes from other users
      socketRef.current.on("code-change", ({ code }) => {
        if (code !== null) {
          editor.setValue(code);
        }
      });

      // Handle request for current code from new users
      socketRef.current.on("get-code", ({ socketId }) => {
        const code = editor.getValue();
        socketRef.current.emit("sync-code", {
          socketId,
          code,
        });
      });

      // Listen for cursor updates from other users
      socketRef.current.on("cursor-update", ({ socketId, username, position }) => {
        setCursors(prev => ({
          ...prev,
          [socketId]: { username, position }
        }));

        // Remove cursor after timeout
        if (!position) {
          setCursors(prev => {
            const newCursors = { ...prev };
            delete newCursors[socketId];
            return newCursors;
          });
        }
      });

      // Start with an empty editor - it will be populated by sync if there are other users
      editor.setValue("");
    }
    init();

    return () => {
      // Cleanup socket listeners when component unmounts
      socketRef.current?.off("code-change");
      socketRef.current?.off("get-code");
      socketRef.current?.off("cursor-update");
      
      // Clear all typing timeouts
      Object.values(typingTimeoutRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return (
    <motion.div
      className="editor-container p-3 h-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ position: 'relative' }}
    >
      <AnimatePresence>
        {Object.entries(cursors).map(([socketId, { username, position }]) => (
          <CursorLabel
            key={socketId}
            username={username}
            position={position}
          />
        ))}
      </AnimatePresence>
      <textarea id="realtimeEditor"></textarea>
    </motion.div>
  );
}

export default Editor;
