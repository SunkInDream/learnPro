import React, { useState, useRef, useEffect } from 'react';
import Head from '../Head';
import { Layout, Menu, Button, Card, Input, Upload, Space, message, TimePicker, Form } from 'antd';
import { UploadOutlined, SendOutlined, DownloadOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import './index.less';

const { Header, Content } = Layout;
const { TextArea } = Input;

const Home = () => {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const chatContainerRef = useRef(null);

  const [typingIndex, setTypingIndex] = useState(null);
  const [typedContent, setTypedContent] = useState('');

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, typedContent]);


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
          setTypedContent((prev) => prev + text[i]);
          i++;
          setTimeout(type, 50);
        } else {
          setTypingIndex(null);
        }
      };
      type();
    }
  }, [typingIndex, chatHistory]);

  const handleSendQuestion = async () => {
    if (!question.trim()) {
      message.warning('请输入问题');
      return;
    }
    setChatHistory(prev => [...prev, { role: 'user', content: question }]);
    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const data = await response.json();
      if (response.ok) {
        setChatHistory(prev => {
          const newHistory = [...prev, { role: 'assistant', content: data.answer }];
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

      <Content className="content">
        <Card title="AI 问答助手" className="qa-card">
          <div className="chat-container" ref={chatContainerRef}>
            {chatHistory.length > 0 ? (
              chatHistory.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.role}`}>
                  <div className="message-content" style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.role === 'user' ? '我: ' : 'AI: '}
                    {msg.role === 'assistant' && typingIndex === index ? (
                      <>
                        <span>
                          {typedContent.slice(0, -1)}
                          {typedContent.length < chatHistory[index].content.length
                            ? (
                              <span
                                className="cursor"
                                style={{
                                  display: 'inline-block',
                                  width: 12,
                                  height: 12,
                                  backgroundColor: 'black',
                                  borderRadius: '50%',
                                  marginLeft: 8,
                                  animation: 'blink 0.5s steps(1) infinite',
                                  verticalAlign: 'middle'
                                }}
                              ></span>
                            )
                            : typedContent.slice(-1)
                          }
                        </span>
                      </>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-chat">发送问题开始与AI对话</div>
            )}
          </div>
          <div className="input-area">
            <TextArea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="请输入您的问题..."
              autoSize={{ minRows: 2, maxRows: 6 }}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSendQuestion();
                }
              }}
              disabled={loading}
            />
            <Space className="action-buttons">
              <Upload>
                <Button icon={<UploadOutlined />}>上传图片</Button>
              </Upload>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendQuestion}
                loading={loading}
              >
                发送
              </Button>
            </Space>
          </div>
        </Card>


      </Content>
    </Layout>
  );
};

export default Home;

/* 在 src/pages/Home/index.less 或全局样式文件中添加以下样式：
@keyframes blink {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}
*/