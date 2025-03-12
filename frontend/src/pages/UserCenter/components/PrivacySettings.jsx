import React, { useState } from 'react';
import { Form, Switch, Button, Card, Alert, Input, List, Space, Row, Col, Divider, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import './PrivacySettings.less';

const PrivacySettings = () => {
  const [form] = Form.useForm();
  const [restPlaces, setRestPlaces] = useState(() => {
    const saved = localStorage.getItem('restPlaces');
    return saved ? JSON.parse(saved) : [];
  });
  const [diningPlaces, setDiningPlaces] = useState(() => {
    const saved = localStorage.getItem('diningPlaces');
    return saved ? JSON.parse(saved) : [];
  });
  const [newRestPlace, setNewRestPlace] = useState('');
  const [newDiningPlace, setNewDiningPlace] = useState('');

  // 添加休息地点
  const handleAddRestPlace = () => {
    if (!newRestPlace.trim()) {
      message.warning('请输入休息方式');
      return;
    }
    const updatedPlaces = [...restPlaces, {
      id: Date.now(),
      content: newRestPlace
    }];
    setRestPlaces(updatedPlaces);
    setNewRestPlace('');
    localStorage.setItem('restPlaces', JSON.stringify(updatedPlaces));
  };

  // 添加就餐地点
  const handleAddDiningPlace = () => {
    if (!newDiningPlace.trim()) {
      message.warning('请输入就餐地点');
      return;
    }
    const updatedPlaces = [...diningPlaces, {
      id: Date.now(),
      content: newDiningPlace
    }];
    setDiningPlaces(updatedPlaces);
    setNewDiningPlace('');
    localStorage.setItem('diningPlaces', JSON.stringify(updatedPlaces));
  };

  // 删除休息地点
  const handleDeleteRestPlace = (id) => {
    const updatedPlaces = restPlaces.filter(place => place.id !== id);
    setRestPlaces(updatedPlaces);
    localStorage.setItem('restPlaces', JSON.stringify(updatedPlaces));
  };

  // 删除就餐地点
  const handleDeleteDiningPlace = (id) => {
    const updatedPlaces = diningPlaces.filter(place => place.id !== id);
    setDiningPlaces(updatedPlaces);
    localStorage.setItem('diningPlaces', JSON.stringify(updatedPlaces));
  };

  const handleSubmit = (values) => {
    console.log('隐私设置更新：', values);
  };

  return (
    <div className="privacy-settings">
      <div className="privacy-settings-title"><h2>隐私与个性化设置</h2></div>
      
      <Card style={{ marginBottom: 24 }}>
        <Alert
          message="隐私声明"
          description="我们重视您的隐私。您的数据仅用于提供个性化学习服务，不会用于其他用途。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            allowPersonalization: true,
            dataCollection: true
          }}
        >
          <Form.Item
            name="allowPersonalization"
            label="个性化学习推荐"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          <Form.Item
            name="dataCollection"
            label="学习数据收集"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          <Form.Item>
            <div className='b'>
              <Button type="primary" htmlType="submit">
                保存设置
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>

      <Card title="个性化偏好设置" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Card 
              title="休息方式" 
              size="small"
              extra={
                <Space>
                  <Input
                    placeholder="添加休息方式"
                    value={newRestPlace}
                    onChange={e => setNewRestPlace(e.target.value)}
                    style={{ width: 200 }}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddRestPlace}
                  >
                    添加
                  </Button>
                </Space>
              }
            >
              <List
                size="small"
                dataSource={restPlaces}
                renderItem={item => (
                  <List.Item
                    actions={[
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteRestPlace(item.id)}
                      />
                    ]}
                  >
                    {item.content}
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          
          <Col span={12}>
            <Card 
              title="常去就餐地点" 
              size="small"
              extra={
                <Space>
                  <Input
                    placeholder="添加就餐地点"
                    value={newDiningPlace}
                    onChange={e => setNewDiningPlace(e.target.value)}
                    style={{ width: 200 }}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddDiningPlace}
                  >
                    添加
                  </Button>
                </Space>
              }
            >
              <List
                size="small"
                dataSource={diningPlaces}
                renderItem={item => (
                  <List.Item
                    actions={[
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteDiningPlace(item.id)}
                      />
                    ]}
                  >
                    {item.content}
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default PrivacySettings;