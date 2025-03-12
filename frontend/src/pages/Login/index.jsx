import React, { useEffect } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index.less';
import request from '../../utils/request';

const Login = () => {
  const navigate = useNavigate();
  
  // 修改登录状态检查逻辑
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const onFinish = async (values) => {
    try {
      const response = await request.post('/api/login', values);
      if (response.data.success) {

        localStorage.setItem('username',  values.username);
        localStorage.setItem('isLoggedIn', 'true');
        
        message.success('登录成功！');
        // 使用replace: true 防止用户通过后退按钮回到登录页
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('登录错误:', error);
      message.error(error.response?.data?.message || '登录失败');
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" title="学习助手">
        <Form
          name="login"
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名！' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码！' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
          
          <div className="login-links">
            <a onClick={() => navigate('/register')}>注册账号</a>
            <a>忘记密码？</a>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login; 