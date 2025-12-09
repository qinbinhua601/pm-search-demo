import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, Input, Button, Space, message, Typography } from 'antd';
import { 
  LeftOutlined, RightOutlined, SwapOutlined,
  SyncOutlined, SearchOutlined 
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { Text } = Typography;

// 全局查找替换核心逻辑 Hook
const useFindReplace = () => {
  // 状态管理
  const [findValue, setFindValue] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [matchList, setMatchList] = useState([]);
  const [activeKey, setActiveKey] = useState('find'); // find:查找 replace:替换
  const contentRef = useRef(null); // 要查找替换的内容容器
  const highlightRefs = useRef([]); // 高亮元素的ref

  // 重置查找状态
  const resetFindState = useCallback(() => {
    setCurrentMatchIndex(-1);
    setMatchList([]);
    clearHighlights();
  }, []);

  // 清除所有高亮
  const clearHighlights = useCallback(() => {
    if (!contentRef.current) return;
    // 恢复原始文本（移除高亮标签）
    const content = contentRef.current;
    content.innerHTML = content.textContent || '';
    highlightRefs.current = [];
  }, []);

  // 查找文本并生成匹配列表
  const findText = useCallback((keyword) => {
    if (!keyword || !contentRef.current) {
      resetFindState();
      return;
    }

    clearHighlights();
    const content = contentRef.current;
    const text = content.textContent || '';
    // 转义正则特殊字符
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKeyword, 'gi');
    const matches = [];
    let match;

    // 收集所有匹配项
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
      });
    }

    setMatchList(matches);
    setCurrentMatchIndex(matches.length > 0 ? 0 : -1);

    // 高亮所有匹配项
    if (matches.length > 0) {
      let html = text;
      // 倒序替换，避免索引偏移
      matches.slice().reverse().forEach((match, idx) => {
        const id = `highlight-${idx}`;
        html = 
          html.substring(0, match.start) +
          `<mark id="${id}" style="background: #ffeb3b; color: #000;">${match.text}</mark>` +
          html.substring(match.end);
      });
      content.innerHTML = html;

      // 保存高亮元素ref
      highlightRefs.current = matches.map((_, idx) => 
        document.getElementById(`highlight-${idx}`)
      );
      
      // 滚动到第一个匹配项
      if (highlightRefs.current[0]) {
        highlightRefs.current[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      message.warning('未找到匹配内容');
    }
  }, [clearHighlights, resetFindState]);

  // 切换匹配项（上一处/下一处）
  const switchMatch = useCallback((direction) => {
    if (matchList.length === 0) return;

    // 移除上一个匹配项的高亮样式
    if (currentMatchIndex >= 0 && highlightRefs.current[currentMatchIndex]) {
      highlightRefs.current[currentMatchIndex].style.background = '#ffeb3b';
    }

    let newIndex = currentMatchIndex;
    if (direction === 'next') {
      newIndex = (currentMatchIndex + 1) % matchList.length;
    } else {
      newIndex = (currentMatchIndex - 1 + matchList.length) % matchList.length;
    }

    setCurrentMatchIndex(newIndex);
    // 高亮当前匹配项
    if (highlightRefs.current[newIndex]) {
      highlightRefs.current[newIndex].style.background = '#ff9800';
      highlightRefs.current[newIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [matchList, currentMatchIndex]);

  // 替换当前匹配项
  const replaceCurrent = useCallback(() => {
    if (currentMatchIndex < 0 || matchList.length === 0 || !contentRef.current) return;

    const content = contentRef.current;
    const currentMatch = matchList[currentMatchIndex];
    const text = content.textContent || '';
    
    // 替换文本
    const newText = 
      text.substring(0, currentMatch.start) +
      replaceValue +
      text.substring(currentMatch.end);
    
    content.textContent = newText;
    // 重新查找，更新匹配列表
    findText(findValue);
    message.success('替换成功');
  }, [currentMatchIndex, matchList, replaceValue, findValue, findText]);

  // 全部替换
  const replaceAll = useCallback(() => {
    if (!findValue || matchList.length === 0 || !contentRef.current) {
      message.warning('无匹配内容可替换');
      return;
    }

    const content = contentRef.current;
    let text = content.textContent || '';
    const escapedKeyword = findValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKeyword, 'gi');
    text = text.replace(regex, replaceValue);
    content.textContent = text;

    // 重置状态
    resetFindState();
    message.success(`已替换 ${matchList.length} 处匹配内容`);
  }, [findValue, matchList, replaceValue, resetFindState]);

  // 监听查找值变化
  useEffect(() => {
    if (findValue) {
      findText(findValue);
    } else {
      resetFindState();
    }
  }, [findValue, findText, resetFindState]);

  // 快捷键监听（Ctrl/Cmd + F）
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setActiveKey('find');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    state: {
      findValue,
      replaceValue,
      activeKey,
      currentMatchIndex,
      matchCount: matchList.length,
      contentRef,
    },
    actions: {
      setFindValue,
      setReplaceValue,
      setActiveKey,
      switchMatch,
      replaceCurrent,
      replaceAll,
      clearHighlights,
    },
  };
};

// 查找替换组件
const FindReplacePanel = () => {
  const { state, actions } = useFindReplace();
  const {
    findValue,
    replaceValue,
    activeKey,
    currentMatchIndex,
    matchCount,
    contentRef,
  } = state;
  const {
    setFindValue,
    setReplaceValue,
    setActiveKey,
    switchMatch,
    replaceCurrent,
    replaceAll,
  } = actions;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* 查找替换面板 */}
      <div 
        style={{ 
          position: 'fixed', 
          top: '20px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: 9999,
          background: '#fff',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
          minWidth: '600px',
        }}
      >
        <Tabs 
          activeKey={activeKey} 
          onChange={setActiveKey}
          size="small"
          tabBarStyle={{ marginBottom: '12px' }}
        >
          {/* 查找面板 */}
          <TabPane tab="查找" key="find">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="输入查找内容"
                value={findValue}
                onChange={(e) => setFindValue(e.target.value)}
                prefix={<SearchOutlined />}
                onPressEnter={() => switchMatch('next')}
                style={{ flex: 1 }}
              />
              <Button
                icon={<LeftOutlined />}
                onClick={() => switchMatch('prev')}
                disabled={matchCount === 0}
                title="上一处"
              />
              <Button
                icon={<RightOutlined />}
                onClick={() => switchMatch('next')}
                disabled={matchCount === 0}
                title="下一处"
              />
            </Space.Compact>
            {matchCount > 0 && (
              <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
                找到 {matchCount} 处匹配（当前：{currentMatchIndex + 1}/{matchCount}）
              </Text>
            )}
          </TabPane>

          {/* 替换面板 */}
          <TabPane tab="替换" key="replace">
            <div style={{
              width: '100%',
              marginBottom: 8
            }}>
              <Input
                placeholder="查找内容"
                value={findValue}
                onChange={(e) => setFindValue(e.target.value)}
                prefix={<SearchOutlined />}
                style={{ flex: 1 }}
              />
              <div style={{
                height: 8
              }}></div>
              <Input
                placeholder="替换为"
                value={replaceValue}
                onChange={(e) => setReplaceValue(e.target.value)}
                prefix={<SwapOutlined />}
                style={{ flex: 1 }}
              />
            </div>
            <Space size="small">
              <Button
                icon={<SyncOutlined />}
                onClick={replaceAll}
                disabled={matchCount === 0 || !findValue}
                type="primary"
              >
                全部替换
              </Button>
              <Button
                icon={<SwapOutlined />}
                onClick={replaceCurrent}
                disabled={currentMatchIndex < 0 || !findValue}
              >
                替换
              </Button>
              <Button
                icon={<LeftOutlined />}
                onClick={() => switchMatch('prev')}
                disabled={matchCount === 0}
              >
                上一处
              </Button>
              <Button
                icon={<RightOutlined />}
                onClick={() => switchMatch('next')}
                disabled={matchCount === 0}
              >
                下一处
              </Button>
            </Space>
            {matchCount > 0 && (
              <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
                找到 {matchCount} 处匹配（当前：{currentMatchIndex + 1}/{matchCount}）
              </Text>
            )}
          </TabPane>
        </Tabs>
      </div>

      {/* 示例内容区域（可替换为业务内容） */}
      <div 
        ref={contentRef}
        style={{ 
          marginTop: '120px', 
          lineHeight: '1.8', 
          fontSize: '16px',
          whiteSpace: 'pre-wrap', // 保留换行
        }}
      >
        React 是一个用于构建用户界面的 JavaScript 库。
        使用 React 可以轻松构建交互式的单页应用。
        React 的核心特性包括组件化、虚拟 DOM、单向数据流等。
        替换功能可以帮助用户快速修改文本中的指定内容，
        比如将所有的 "React" 替换为 "React.js"，
        或者将 "JavaScript" 替换为 "TypeScript"。
        查找功能可以快速定位文本中的关键词，提升内容浏览效率。
      </div>
    </div>
  );
};

export default FindReplacePanel;