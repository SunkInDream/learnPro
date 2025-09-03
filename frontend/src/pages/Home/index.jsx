import React, { useState, useRef, useEffect } from 'react';
import Head from '../Head';
import { Layout, Input, Button, Space, message, Drawer } from 'antd';
import { SendOutlined, MenuOutlined, PlusOutlined, MessageOutlined } from '@ant-design/icons';
import './index.less';

const { Content } = Layout;

const Home = () => {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [loading, setLoading] = useState(false);
  const [typingIndex, setTypingIndex] = useState(null);
  const [typedContent, setTypedContent] = useState('');
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [chatSessions, setChatSessions] = useState(() => {
    const savedSessions = localStorage.getItem('chatSessions');
    return savedSessions ? JSON.parse(savedSessions) : [];
  });
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    return localStorage.getItem('currentSessionId') || null;
  });
  const chatContainerRef = useRef(null);


  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
  }, [chatSessions]);

  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem('currentSessionId', currentSessionId);
    }
  }, [currentSessionId]);


  useEffect(() => {
    if (currentSessionId) {
      const session = chatSessions.find(s => s.id === currentSessionId);
      if (session) {
        setChatHistory(session.messages);
      }
    }
  }, [currentSessionId, chatSessions]);


  const createNewChat = () => {
    if (chatHistory.length > 0) {
      const sessionTitle = chatHistory[0]?.content?.substring(0, 30) + '...' || '新对话';
      const newSession = {
        id: Date.now().toString(),
        title: sessionTitle,
        messages: [...chatHistory],
        createdAt: new Date().toISOString()
      };
      setChatSessions(prev => [newSession, ...prev]);
    }
    

    setChatHistory([]);
    setCurrentSessionId(null);
    setTypingIndex(null);
    setTypedContent('');
  };


  const switchToSession = (sessionId) => {

    if (currentSessionId && chatHistory.length > 0) {
      setChatSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages: [...chatHistory] }
          : session
      ));
    }
    

    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setChatHistory(session.messages);
      setCurrentSessionId(sessionId);
    }
  };


  const deleteSession = (sessionId) => {
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setChatHistory([]);
      setCurrentSessionId(null);
    }
  };


  const handleScroll = () => {
    setIsUserScrolling(true);

    setTimeout(() => setIsUserScrolling(false), 1000);
  };

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current && chatHistory.length > 0 && !isUserScrolling && typingIndex === null) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          const container = chatContainerRef.current;
          const containerHeight = container.clientHeight;
          const scrollHeight = container.scrollHeight;
          
          if (scrollHeight > containerHeight) {
            container.scrollTop = scrollHeight - containerHeight;
          }
        }
      }, 100);
    }
  }, [chatHistory, isUserScrolling, typingIndex]);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    if (
      typingIndex !== null &&
      chatHistory[typingIndex] &&
      chatHistory[typingIndex].role === 'assistant'
    ) {
      const text = chatHistory[typingIndex].content;
      let i = 0;
      setTypedContent(''); 
      
      const type = () => {
        if (i < text.length) {
          setTypedContent(text.substring(0, i + 1));
          i++;
          setTimeout(type, 40);
        } else {
          setTypingIndex(null);
          setTypedContent(''); 
        }
      };
      
      setTimeout(type, 50);
    }
  }, [typingIndex, chatHistory]);

  const handleSend = async () => {
    if (!question.trim()) {
      message.warning('请输入问题');
      return;
    }

    const container = chatContainerRef.current;
    const containerHeight = container ? container.clientHeight : 0;
    const currentScrollHeight = container ? container.scrollHeight : 0;

    const userMsg = { role: 'user', content: question };
    setChatHistory((prev) => [...prev, userMsg]);
    setLoading(true);
    
    setTimeout(() => {
      if (chatContainerRef.current) {
        const newScrollHeight = chatContainerRef.current.scrollHeight;
        const scrollOffset = newScrollHeight - currentScrollHeight;
        chatContainerRef.current.scrollTop = currentScrollHeight + scrollOffset - containerHeight;
      }
    }, 50);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const data = await response.json();
      if (response.ok) {
        const aiMsg = { role: 'assistant', content: data.answer };
        setChatHistory((prev) => {
          const newHistory = [...prev, aiMsg];
          setTypingIndex(newHistory.length - 1);
          return newHistory;
        });
      } else {
        message.error(data.error || '请求失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后再试');
    } finally {
      setLoading(false);
      setQuestion('');
    }
  };

  return (
    <Layout className="home-layout">
      <Head />
      
      <div className={`sidebar ${sidebarVisible ? 'visible' : 'hidden'}`}>
        <div className="sidebar-header">
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={createNewChat}
            className="new-chat-btn"
          >
            新建对话
          </Button>
        </div>
        
        <div className="sidebar-content">
          <div className="session-list">
            {chatSessions.map(session => (
              <div 
                key={session.id}
                className={`session-item ${currentSessionId === session.id ? 'active' : ''}`}
                onClick={() => switchToSession(session.id)}
              >
                <MessageOutlined className="session-icon" />
                <span className="session-title">{session.title}</span>
                <Button 
                  type="text" 
                  size="small"
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>


      <Button 
        className={`sidebar-toggle ${sidebarVisible ? 'with-sidebar' : ''}`}
        icon={<MenuOutlined />}
        onClick={() => setSidebarVisible(!sidebarVisible)}
      />

      <Content className={`grok-content ${sidebarVisible ? 'with-sidebar' : ''}`}>
        <div className="center-box">

          <div className="chat-container" ref={chatContainerRef}>
            {chatHistory.length > 0 ? (
              chatHistory.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.role}`}>
                  {msg.role === 'user' ? (
                    <div className="user-msg">{msg.content}</div>
                  ) : (
                    <div className="ai-msg">
                      {typingIndex === index && typedContent ? 
                        typedContent : 
                        msg.content
                      }
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-chat">随便问点什么</div>
            )}
          </div>

          <div className="input-wrapper">
            <Input
              size="large"
              placeholder="请输入您的问题..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading}
            />
            <Button
              type="text"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={loading}
              className="send-btn"
            />
          </div>

        </div>
      </Content>
    </Layout>
  );
};

export default Home;
