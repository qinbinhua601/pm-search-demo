import React, { useEffect } from 'react'
import * as pmSearch from 'prosemirror-search'
import { Editor } from './components/Editor'
import { getUrlSearchParams } from './utils'

function App() {
  const [searchValue, setSearchValue] = React.useState('')
  const [replaceValue, setReplaceValue] = React.useState('')
  const ref = React.useRef(null)
  const searchInputRef = React.useRef(null)

  const handleSearchButtonClick = (cb) => {
    const query = searchValue
    const view = ref.current.getEditorRef()
    console.log('Search button clicked with query:', query)
    const newSearchQuery = new pmSearch.SearchQuery({ search: query, replace: replaceValue })

    const tr = pmSearch.setSearchState(view.state.tr, newSearchQuery)
    view.dispatch(tr)
    view.focus()
    next()
    console.log(
      'Search query updated:',
      pmSearch.getMatchHighlights(view.state)
    )
    if (typeof cb === 'function') {
      cb()
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearchButtonClick(() => {
        event.target.focus()
      })
      event.stopPropagation()
      event.preventDefault()
    }
  }

  const next = () => {
    const view = ref.current.getEditorRef()
    pmSearch.findNext(view.state, view.dispatch)
  }

  const prev = () => {
    const view = ref.current.getEditorRef()
    pmSearch.findPrev(view.state, view.dispatch)
  }

  const nextNoWrap = () => {
    const view = ref.current.getEditorRef()
    pmSearch.findNextNoWrap(view.state, view.dispatch)
  }

  const prevNoWrap = () => {
    const view = ref.current.getEditorRef()
    pmSearch.findPrevNoWrap(view.state, view.dispatch)
  }

  const replace = () => {
    const view = ref.current.getEditorRef()
    pmSearch.replaceNext(view.state, view.dispatch)
  }

  const replaceAll = () => {
    const view = ref.current.getEditorRef()
    pmSearch.replaceAll(view.state, view.dispatch)
  }

  useEffect(() => {
    const params = getUrlSearchParams()
    const query = params['q']
    const view = ref.current.getEditorRef()
    const tr = pmSearch.setSearchState(
      view.state.tr,
      new pmSearch.SearchQuery({ search: query })
    )
    view.dispatch(tr)
    view.focus()
    pmSearch.findNext(view.state, view.dispatch)

    // 监听键盘事件
    const handleGlobalKeyDown = (e) => {
      // 判断是否是 Ctrl/Cmd + F 快捷键
      const isSearchShortcut = (e.ctrlKey || e.metaKey) && e.key === 'f'

      if (isSearchShortcut) {
        // 阻止浏览器默认搜索行为
        e.preventDefault()
        // 显示自定义搜索框并聚焦
        // setShowSearch(true)
        // searchInputRef.current?.focus()
        searchInputRef.current?.focus()
      }
    }

    // 绑定全局 keydown 事件（监听整个文档）
    document.addEventListener('keydown', handleGlobalKeyDown)

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [])

  return (
    <>
      <Editor ref={ref} />
      <label htmlFor="search-input">Search:</label>
      <input
        type="text"
        id="search-input"
        value={searchValue}
        onInput={(e) => {
          setSearchValue(e.target.value)
        }}
        onKeyDown={handleKeyDown}
        ref={searchInputRef}
      />
      <button id="search-button" onClick={handleSearchButtonClick}> search </button>
      <button id="next-button" onClick={next}> next </button>
      <button id="next-button" onClick={nextNoWrap}> nextNoWrap </button>
      <button id="prev-button" onClick={prev}> prev </button>
      <button id="prev-button" onClick={prevNoWrap}> prevNoWrap </button>
      <button id="replace-next-button" onClick={replace}> replace </button>
      <button id="replace-all-button" onClick={replaceAll}> replace all </button>
      <br />
      <label htmlFor="replace-input">Replace with:</label>
      <input
        type="text"
        id="replace-input"
        value={replaceValue}
        onInput={(e) => {
          setReplaceValue(e.target.value)
        }}
      />
    </>
  )
}

export default App
