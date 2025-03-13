import React, { useState, useRef, useEffect } from 'react';
import { Layout, Menu, Button, Card, Input, Upload, Space, message, TimePicker, Form } from 'antd';
import { UploadOutlined, SendOutlined } from '@ant-design/icons';
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

  // 聊天记录滚动到底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendQuestion = async () => {
    if (!question.trim()) {
      message.warning('请输入问题');
      return;
    }
    
    // 添加用户问题到聊天记录
    setChatHistory(prev => [...prev, { role: 'user', content: question }]);
    
    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: question })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // 添加AI回答到聊天记录
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        message.error(data.error || '请求失败');
      }
    } catch (error) {
      console.error('请求错误:', error);
      message.error('网络错误，请稍后再试');
    } finally {
      setLoading(false);
      setQuestion(''); // 清空输入框
    }
  };

  const handleGeneratePlan = async () => {
    try {
      const values = await form.validateFields();
      const timeRange = {
        start: values.timeRange[0].format('HH:mm'),
        end: values.timeRange[1].format('HH:mm')
      };
      
      // TODO: 发送到后端生成计划
      console.log('空闲时间段：', timeRange);
      message.success('学习计划生成成功！即将跳转到学习计划页面...');
      setTimeout(() => navigate('/study-plan'), 1500);
    } catch (error) {
      message.error('请填写完整的时间段信息');
    }
  };

  return (
    <Layout className="home-layout">
      <Header className="header">
        <div className="logo">学习助手</div>
        <Menu mode="horizontal" theme="dark">
          <Menu.Item key="home" onClick={() => navigate('/')}>首页</Menu.Item>
          <Menu.Item key="plan" onClick={() => navigate('/study-plan')}>学习计划</Menu.Item>
          <Menu.Item key="feedback" onClick={() => navigate('/feedback')}>反馈</Menu.Item>
          <Menu.Item key="user" onClick={() => navigate('/user')}>个人中心</Menu.Item>
        </Menu>
      </Header>

      <Content className="content">
        <Card title="AI 问答助手" className="qa-card">
          <div className="chat-container" ref={chatContainerRef}>
            {chatHistory.length > 0 ? (
              chatHistory.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.role}`}>
                  <div className="message-content">
                    {msg.role === 'user' ? '我: ' : 'AI: '}
                    {msg.content}
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

        <Card title="学习计划生成" className="plan-card">
          <Form
            form={form}
            initialValues={{
              timeRange: [moment('07:00', 'HH:mm'), moment('21:00', 'HH:mm')]
            }}
          >
            <Form.Item
              name="timeRange"
              label="空闲时间段"
              rules={[{ required: true, message: '请选择时间段' }]}
            >
              <TimePicker.RangePicker 
                format="HH:mm"
                placeholder={['开始时间', '结束时间']}
              />
            </Form.Item>
            <div className='bu'>
              <Form.Item>
                <Button type="primary" onClick={handleGeneratePlan}>
                  生成学习计划
                </Button>
              </Form.Item>
            </div>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default Home;