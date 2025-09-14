import React, { useState, useRef, useEffect } from 'react';
import Head from '../Head';
import { Layout, Input, Button, message } from 'antd';
import { SendOutlined, MenuOutlined, PlusOutlined, MessageOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
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
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [chatSessions, setChatSessions] = useState(() => {
    const savedSessions = localStorage.getItem('chatSessions');
    return savedSessions ? JSON.parse(savedSessions) : [];
  });
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    return localStorage.getItem('currentSessionId') || null;
  });
  const chatContainerRef = useRef(null);
  const centerBoxRef = useRef(null);
  const lastScrollTop = useRef(0);


  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
  }, [chatSessions]);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem('currentSessionId', currentSessionId);
    } else {
      localStorage.removeItem('currentSessionId');
    }
  }, [currentSessionId]);

  const adjustCenterBoxHeight = () => {
    if (centerBoxRef.current) {
      if (chatHistory.length === 0) {
        centerBoxRef.current.style.minHeight = '100vh';
      } else if (chatContainerRef.current) {
        const chatHeight = chatContainerRef.current.scrollHeight;
        const inputWrapperHeight = 80; 
        const padding = 40; 
        
        const totalContentHeight = chatHeight + inputWrapperHeight + padding;
        const minHeight = window.innerHeight;
        
        const finalHeight = Math.max(totalContentHeight, minHeight);
        centerBoxRef.current.style.minHeight = `${finalHeight}px`;
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(adjustCenterBoxHeight, 50);
    return () => clearTimeout(timer);
  }, [chatHistory, typedContent]);

  useEffect(() => {
    const handleResize = () => {
      adjustCenterBoxHeight();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const saveBeforeUnload = () => {
      if (currentSessionId && chatHistory.length > 0) {
        const firstUserMessage = chatHistory.find(msg => msg.role === 'user');
        const sessionTitle = firstUserMessage?.content?.substring(0, 30) + '...' || '新对话';
        
        const updatedSessions = chatSessions.map(session => 
          session.id === currentSessionId 
            ? { ...session, title: sessionTitle, messages: [...chatHistory] }
            : session
        );
        
        localStorage.setItem('chatSessions', JSON.stringify(updatedSessions));
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        localStorage.setItem('currentSessionId', currentSessionId);
      }
    };

    window.addEventListener('beforeunload', saveBeforeUnload);
    return () => window.removeEventListener('beforeunload', saveBeforeUnload);
  }, [chatHistory, chatSessions, currentSessionId]);


  const createNewChat = () => {
    if (chatHistory.length > 0) {
      const firstUserMessage = chatHistory.find(msg => msg.role === 'user');
      const sessionTitle = firstUserMessage?.content?.substring(0, 30) + '...' || '新对话';
      
      if (currentSessionId) {
        setChatSessions(prev => prev.map(session => 
          session.id === currentSessionId 
            ? { ...session, title: sessionTitle, messages: [...chatHistory] }
            : session
        ));
      } else {
        const newSession = {
          id: Date.now().toString(),
          title: sessionTitle,
          messages: [...chatHistory], 
          createdAt: new Date().toISOString()
        };
        setChatSessions(prev => [newSession, ...prev]);
      }
    }
    
    setChatHistory([]);
    setCurrentSessionId(null);
    setTypingIndex(null);
    setTypedContent('');
    
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0;
    }
    setShouldAutoScroll(true);
    setIsUserScrolling(false);
    
    setTimeout(adjustCenterBoxHeight, 100);
  };


  const switchToSession = (sessionId) => {
    if (currentSessionId && chatHistory.length > 0) {
      const firstUserMessage = chatHistory.find(msg => msg.role === 'user');
      const sessionTitle = firstUserMessage?.content?.substring(0, 30) + '...' || '新对话';
      
      setChatSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, title: sessionTitle, messages: [...chatHistory] }
          : session
      ));
    }
    
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setChatHistory(session.messages);
      setCurrentSessionId(sessionId);

      setShouldAutoScroll(true);
      setIsUserScrolling(false);
      setTypingIndex(null);
      setTypedContent('');
      
      setTimeout(() => {
        if (chatContainerRef.current && session.messages.length > 0) {
          const container = chatContainerRef.current;
          container.scrollTop = container.scrollHeight;
        }

        adjustCenterBoxHeight();
      }, 100);
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
    const container = chatContainerRef.current;
    if (!container) return;
    
    if (typingIndex !== null) {
      return;
    }
    
    const currentScrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const scrollHeight = container.scrollHeight;
    const isAtBottom = Math.abs(scrollHeight - containerHeight - currentScrollTop) < 5;
    
    if (currentScrollTop < lastScrollTop.current && !isAtBottom) {
      setShouldAutoScroll(false);
      setIsUserScrolling(true);
    }
    else if (isAtBottom) {
      setShouldAutoScroll(true);
      setIsUserScrolling(false);
    }
    
    lastScrollTop.current = currentScrollTop;
    
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
    if (chatContainerRef.current && chatHistory.length > 0) {
      if (typingIndex !== null) {
        setTimeout(() => {
          if (chatContainerRef.current) {
            const container = chatContainerRef.current;
            container.scrollTop = container.scrollHeight;
          }
        }, 10);
      }
      else if (shouldAutoScroll && !isUserScrolling) {
        setTimeout(() => {
          if (chatContainerRef.current && shouldAutoScroll) {
            const container = chatContainerRef.current;
            const containerHeight = container.clientHeight;
            const scrollHeight = container.scrollHeight;
            
            if (scrollHeight > containerHeight) {
              container.scrollTop = scrollHeight - containerHeight;
            }
          }
        }, 100);
      }
    }
  }, [chatHistory, shouldAutoScroll, isUserScrolling, typingIndex, typedContent]);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    if (
      typingIndex !== null &&
      chatHistory[typingIndex] &&
      chatHistory[typingIndex].role === 'assistant'
    ) {
      setShouldAutoScroll(true);
      setIsUserScrolling(false);
      
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

    setShouldAutoScroll(true);

    const container = chatContainerRef.current;
    const containerHeight = container ? container.clientHeight : 0;
    const currentScrollHeight = container ? container.scrollHeight : 0;

    const userMsg = { role: 'user', content: question };
    

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = Date.now().toString();
      setCurrentSessionId(sessionId);
      
      const newSession = {
        id: sessionId,
        title: question.substring(0, 30) + (question.length > 30 ? '...' : ''),
        messages: [],  
        createdAt: new Date().toISOString()
      };
      setChatSessions(prev => [newSession, ...prev]);
    }
    
    setChatHistory((prev) => {
      const newHistory = [...prev, userMsg];
      
      setChatSessions(prevSessions => prevSessions.map(session => 
        session.id === sessionId 
          ? { ...session, messages: newHistory }
          : session
      ));
      
      return newHistory;
    });
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
          

          if (currentSessionId) {
            setChatSessions(prevSessions => prevSessions.map(session => 
              session.id === currentSessionId 
                ? { ...session, messages: newHistory }
                : session
            ));
          }
          
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
        <div className="center-box" ref={centerBoxRef}>
          {chatHistory.length > 0 && (
            <div className="chat-container" ref={chatContainerRef}>
              {chatHistory.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.role}`}>
                  {msg.role === 'user' ? (
                    <div className="user-msg">{msg.content}</div>
                  ) : (
                    <div className="ai-msg">
                      <ReactMarkdown
                        components={{
                          h1: ({children}) => <h1 style={{marginTop: '20px', marginBottom: '10px'}}>{children}</h1>,
                          h2: ({children}) => <h2 style={{marginTop: '18px', marginBottom: '8px'}}>{children}</h2>,
                          h3: ({children}) => <h3 style={{marginTop: '16px', marginBottom: '6px'}}>{children}</h3>,
                          p: ({children}) => <p style={{marginBottom: '8px', lineHeight: '1.6'}}>{children}</p>,
                          ul: ({children}) => <ul style={{marginBottom: '10px', paddingLeft: '20px'}}>{children}</ul>,
                          ol: ({children}) => <ol style={{marginBottom: '10px', paddingLeft: '20px'}}>{children}</ol>,
                          li: ({children}) => <li style={{marginBottom: '4px'}}>{children}</li>,
                          strong: ({children}) => <strong style={{fontWeight: '600', color: '#1f2937'}}>{children}</strong>
                        }}
                      >
                        {typingIndex === index && typedContent ? 
                          typedContent : 
                          msg.content
                        }
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}


          {chatHistory.length === 0 && (
            <div className="welcome-text">随便问点什么</div>
          )}

          <div className={`input-container ${chatHistory.length === 0 ? 'center-position' : 'bottom-position'}`}>
            <div className="input-box">
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

        </div>
      </Content>
    </Layout>
  );
};

export default Home;
