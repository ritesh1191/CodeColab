import React, { useEffect, useRef, useState } from "react";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/clike/clike";  // For Java and C++
import "codemirror/mode/python/python";
import "codemirror/theme/material-palenight.css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/lib/codemirror.css";
import CodeMirror from "codemirror";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/javascript-hint";
import "codemirror/addon/hint/anyword-hint"; // For generic word-based completion
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/scroll/simplescrollbars";
import "codemirror/addon/scroll/simplescrollbars.css";
import "codemirror/addon/selection/active-line";
import "codemirror/addon/comment/comment";
import "codemirror/addon/fold/foldcode";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/brace-fold";
import "codemirror/addon/fold/indent-fold";
import "codemirror/addon/fold/foldgutter.css";
import { motion, AnimatePresence } from "framer-motion";
import CursorLabel from "./CursorLabel";

function Editor({ socketRef, roomId, onCodeChange, language }) {
  const editorRef = useRef(null);
  const [cursors, setCursors] = useState({});
  const typingTimeoutRef = useRef({});

  useEffect(() => {
    async function init() {
      // Clean up previous editor instance if it exists
      if (editorRef.current) {
        // Save the current code before cleanup
        const currentCode = editorRef.current.getValue();
        
        // Remove all event listeners
        editorRef.current.off("change");
        editorRef.current.off("inputRead");
        
        // Get the wrapper element and remove it
        const wrapper = editorRef.current.getWrapperElement();
        wrapper.remove();
        
        // Clear the textarea
        document.getElementById("realtimeEditor").value = "";
      }

      const modeMap = {
        'cpp': { 
          name: 'text/x-c++src',
          keywords: [
            'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
            'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if',
            'int', 'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static',
            'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile',
            'while', 'class', 'namespace', 'try', 'catch', 'throw', 'template',
            'public', 'private', 'protected', 'virtual', 'friend', 'operator', 'new',
            'delete', 'this', 'using'
          ]
        },
        'java': { 
          name: 'text/x-java',
          keywords: [
            'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch',
            'char', 'class', 'const', 'continue', 'default', 'do', 'double', 'else',
            'enum', 'extends', 'final', 'finally', 'float', 'for', 'if', 'implements',
            'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new',
            'package', 'private', 'protected', 'public', 'return', 'short', 'static',
            'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
            'transient', 'try', 'void', 'volatile', 'while'
          ]
        },
        'python': { 
          name: 'python',
          keywords: [
            'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del',
            'elif', 'else', 'except', 'False', 'finally', 'for', 'from', 'global',
            'if', 'import', 'in', 'is', 'lambda', 'None', 'nonlocal', 'not', 'or',
            'pass', 'raise', 'return', 'True', 'try', 'while', 'with', 'yield',
            'print', 'range', 'len', 'str', 'int', 'float', 'list', 'dict', 'set',
            'tuple', 'input', 'open', 'file', 'self', '__init__', 'super'
          ]
        }
      };

      editorRef.current = CodeMirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: modeMap[language] || modeMap['python'],
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
          foldGutter: true,
          gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
          extraKeys: {
            "Ctrl-Space": "autocomplete",
            "Ctrl-/": "toggleComment",
            "Ctrl-Q": function(cm) { cm.foldCode(cm.getCursor()); },
            "Tab": (cm) => {
              if (cm.somethingSelected()) {
                cm.indentSelection("add");
              } else {
                cm.replaceSelection("  ");
              }
            }
          },
          lint: true,
          hintOptions: {
            hint: CodeMirror.hint.anyword,
            completeSingle: false,
            alignWithWord: true,
            closeOnUnfocus: true,
            words: modeMap[language]?.keywords || []
          }
        }
      );

      // Add custom styles to editor
      const editor = editorRef.current;
      editor.getWrapperElement().style.fontSize = "14px";
      editor.getWrapperElement().style.fontFamily = "'Fira Code', monospace";
      editor.getWrapperElement().style.height = "100%";
      editor.getWrapperElement().style.borderRadius = "8px";
      editor.refresh();

      // Setup auto-complete on typing
      editor.on("inputRead", (cm, change) => {
        if (!change.text[0].match(/[.`\w]/)) return;
        const token = cm.getTokenAt(cm.getCursor());
        if (token.type && token.type.includes("comment")) return;
        
        CodeMirror.commands.autocomplete(cm, null, { completeSingle: false });
      });

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
        if (code !== null && code !== editorRef.current.getValue()) {
          editor.setValue(code);
        }
      });

      // Request initial code state when joining
      socketRef.current.emit("get-code", {
        roomId,
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

      // Start with the previous code or empty string
      const previousCode = editorRef.current ? editorRef.current.getValue() : "";
      editor.setValue(previousCode || "");
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

      // Clean up editor instance
      if (editorRef.current) {
        const wrapper = editorRef.current.getWrapperElement();
        wrapper.remove();
        editorRef.current = null;
      }
    };
  }, [language]); // Added language to dependency array to reinitialize editor when language changes

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
