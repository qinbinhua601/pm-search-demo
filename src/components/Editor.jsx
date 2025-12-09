import React, { useEffect } from 'react';
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { DOMParser } from 'prosemirror-model'
import { gapCursor } from 'prosemirror-gapcursor'
import { exampleSetup } from 'prosemirror-example-setup'
import { applyDevTools } from 'prosemirror-dev-toolkit'
import * as pmSearch from 'prosemirror-search'
import { mySchema } from '../schema'

window.pmSearch = pmSearch

const plugins = [
  ...exampleSetup({ schema: mySchema }),
  gapCursor(),
  pmSearch.search()
]

export const Editor = React.forwardRef((props, ref) => {
  const domRef = React.useRef(null);
  const editorRef = React.useRef(null);

  React.useImperativeHandle(
    ref,
    () => {
      return {
        getEditorRef: () => editorRef.current
      }
    }
  )

  useEffect(() => {
    // create the EditorView instance
    editorRef.current = new EditorView(domRef.current, {
      state: EditorState.create({
        doc: DOMParser.fromSchema(mySchema).parse(
          document.querySelector('#content')
        ),
        plugins
      }),
      editable: () => true,
    });
    applyDevTools(editorRef.current);
    return () => {
      editorRef.current?.destroy();
    }
  }, []);

  return (
    <div id="editor" ref={domRef}></div>
  )
})