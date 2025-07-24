import React from 'react'
import {Layout, Menu } from 'antd';
import { useNavigate } from 'react-router-dom';
import './index.less'; 
export default function Head() {
  const { Header } = Layout;
  const navigate = useNavigate();
  
  return (
    <Header className="header">
        <div className="logo">
          <div 
            onClick={() => navigate('/main')} 
            style={{
              color: 'white', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <img src='/image/icon.png' alt="logo" style={{width:'32px', height:'32px'}}/> 
            <span>学习助手</span>
          </div>
        </div>
        <Menu mode="horizontal" >
          <Menu.Item key="home" onClick={() => navigate('/Home')}>AI助手</Menu.Item>
          <Menu.Item key="plan" onClick={() => navigate('/study-plan')}>学习计划</Menu.Item>
          <Menu.Item key="feedback" onClick={() => navigate('/feedback')}>反馈</Menu.Item>
          <Menu.Item key="user" onClick={() => navigate('/user')}>个人中心</Menu.Item>
        </Menu>
      </Header>
  )
}
