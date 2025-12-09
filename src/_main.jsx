import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { DOMParser } from 'prosemirror-model'
import { gapCursor } from 'prosemirror-gapcursor'
import { exampleSetup } from 'prosemirror-example-setup'
import { applyDevTools } from 'prosemirror-dev-toolkit'
import * as pmSearch from 'prosemirror-search'
import { mySchema } from './schema'

window.pmSearch = pmSearch

const plugins = [
  ...exampleSetup({ schema: mySchema }),
  gapCursor(),
  pmSearch.search()
]

// create the EditorView instance
window.view = new EditorView(document.querySelector('#editor'), {
  state: EditorState.create({
    doc: DOMParser.fromSchema(mySchema).parse(
      document.querySelector('#content')
    ),
    plugins
  }),
  editable: () => true,
})

// add dev tools
applyDevTools(window.view)

function getUrlSearchParams() {
  // Get raw URL search string (e.g., "?keyword=phone&minPrice=100&maxPrice=5000&status=1")
  const searchParams = new URLSearchParams(window.location.search);
  const params = {};

  // Iterate over all params, decode and filter empty values
  for (const [key, value] of searchParams.entries()) {
    if (value.trim() !== "") {
      // Decode URL-encoded values (e.g., "iphone%2015" → "iphone 15")
      const decodedValue = decodeURIComponent(value.trim());
      
      // Auto-convert number-like values (e.g., "100" → 100, "true" → true)
      params[key] = isNaN(decodedValue) 
        ? decodedValue === "true" ? true : decodedValue === "false" ? false : decodedValue
        : Number(decodedValue);
    }
  }

  return params;
}

function doSearch() {
  const input = document.querySelector('#qin-input');
  const query = input.value;
  const tr = pmSearch.setSearchState(window.view.state.tr, new pmSearch.SearchQuery({search: query}));
  window.view.dispatch(tr);
  console.log('Search query updated:', pmSearch.getMatchHighlights(window.view.state));
  // pmSearch.findNext(window.view.state, window.view.dispatch)
}

document.querySelector('#search-button')?.addEventListener('click', () => {
  doSearch()
});

document.querySelector('#qin-input')?.addEventListener('keydown', (event) => {
  event.stopPropagation()
  if (event.key === 'Enter') {
    doSearch()
  }
});

function doAnchorByQuery() {
  const params = getUrlSearchParams();
  const query = params['q'] || 'target';
  const tr = pmSearch.setSearchState(window.view.state.tr, new pmSearch.SearchQuery({search: query}));
  window.view.dispatch(tr);
  window.view.focus()
  pmSearch.findNext(window.view.state, window.view.dispatch)
}

doAnchorByQuery()