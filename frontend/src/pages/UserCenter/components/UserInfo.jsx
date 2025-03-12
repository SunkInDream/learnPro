import React, { useState, useEffect } from 'react';
import { Form, Input, Upload, Button, message, Card, Row, Col, Divider, Select, DatePicker, Space, Statistic } from 'antd';
import { UploadOutlined, UserOutlined, EditOutlined, MailOutlined, PhoneOutlined, BookOutlined } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';
import moment from 'moment';
import axios from 'axios';
import './UserInfo.less';
import request from '../../../utils/request';  // 使用你自己的配置的实例

const { Option } = Select;
const { TextArea } = Input;

const UserInfo = (props) => {
  const [form] = Form.useForm();
  const [userInfo, setUserInfo] = useState({});
  const [imageUrl, setImageUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        // 从本地存储中获取登录时保存的用户名
        const username = localStorage.getItem('username');
        // 将用户名作为查询参数添加到请求中
        const response = await request.get(`/api/user/info?username=${username}`);
        
        if (response.data) {
          const data = response.data;
          setUserInfo(data);
          setImageUrl(data.avatar);
          form.setFieldsValue({
            nickname: data.nickname || '',
            grade: data.grade || '',
            phone: data.phone || '',
            email: data.email || '',
            birthday: data.birthday ? moment(data.birthday) : null,
            targetSchool: data.targetSchool || '',
            bio: data.bio || ''
          });
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        message.error('获取用户信息失败: ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [form]);

  // 处理图片上传前的操作
  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG 格式的图片！');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片必须小于 2MB！');
    }
    return isJpgOrPng && isLt2M;
  };

  const handleChange = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      const imageUrl = info.file.response.url;
      if (imageUrl) {
        setImageUrl(imageUrl);
        setUserInfo({ ...userInfo, avatar: imageUrl });
      }
    }
  };

  const handleSubmit = async (values) => {
    try {
      const updatedUserInfo = {
        ...values,
        username: localStorage.getItem('username'), // 确保包含用户名
        avatar: imageUrl,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null
      };

      console.log('提交的数据:', updatedUserInfo);

      const response = await fetch('http://127.0.0.1:5000/api/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedUserInfo)
      });

      if (response.ok) {
        message.success('个人信息更新成功');
        
        // 调用父组件传入的 onUpdate 更新 UserCenter 的状态
        props.onUpdate({
          ...props.userInfo,
          nickname: values.nickname,
          // 其他需要更新的字段
        });
        
        setIsEditing(false);
      } else {
        console.error('更新失败, 状态码:', response.status);
        const errorText = await response.text();
        console.error('错误详情:', errorText);
        message.error('更新失败: ' + response.status);
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
      message.error('更新失败: ' + error.message);
    }
  };

  return (
    <div className="user-info">
      <Card
        title={
          <Space>
            <UserOutlined />
            个人信息
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? '取消编辑' : '编辑资料'}
          </Button>
        }
        loading={loading}
      >
        <Row gutter={[24, 24]}>
          <Col span={8}>
            <Card bordered={false} className="avatar-card">
              <div style={{ textAlign: 'center' }}>
                <ImgCrop rotate>
                  <Upload
                    name="avatar"
                    listType="picture-card"
                    className="avatar-uploader"
                    showUploadList={false}
                    action="/api/upload"
                    beforeUpload={beforeUpload}
                    onChange={handleChange}
                    disabled={!isEditing}
                  >
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt="avatar" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div>
                        <UserOutlined />
                        <div style={{ marginTop: 8 }}>上传头像</div>
                      </div>
                    )}
                  </Upload>
                </ImgCrop>
                <div style={{ marginTop: 16 }}>
                  <Statistic title="学习天数" value={userInfo.studyDays || 0} suffix="天" />
                </div>
                <div style={{ marginTop: 16 }}>
                  <Statistic title="总专注时长" value={userInfo.focusTime || 0} suffix="分钟" />
                </div>
              </div>
            </Card>
          </Col>
          <Col span={16}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="昵称"
                    name="nickname"
                    rules={[{ required: true, message: '请输入昵称' }]}
                  >
                    <Input 
                      prefix={<UserOutlined />} 
                      placeholder="请输入昵称" 
                      disabled={!isEditing}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="年级"
                    name="grade"
                  >
                    <Select disabled={!isEditing} placeholder="请选择年级">
                      <Option value="高一">高一</Option>
                      <Option value="高二">高二</Option>
                      <Option value="高三">高三</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="手机号"
                    name="phone"
                  >
                    <Input 
                      prefix={<PhoneOutlined />} 
                      placeholder="请输入手机号"
                      disabled={!isEditing}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="邮箱"
                    name="email"
                  >
                    <Input 
                      prefix={<MailOutlined />} 
                      placeholder="请输入邮箱"
                      disabled={!isEditing}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="生日"
                    name="birthday"
                  >
                    <DatePicker 
                      style={{ width: '100%' }}
                      disabled={!isEditing}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="目标院校"
                    name="targetSchool"
                  >
                    <Input 
                      prefix={<BookOutlined />}
                      placeholder="输入目标院校"
                      disabled={!isEditing}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Form.Item
                label="个人简介"
                name="bio"
              >
                <TextArea 
                  rows={4} 
                  placeholder="介绍一下自己吧..."
                  disabled={!isEditing}
                />
              </Form.Item>

              <Divider />

              <Row gutter={16}>
                <Col span={8}>
                  <Statistic 
                    title="完成任务" 
                    value={userInfo.completedTasks || 0} 
                    suffix="个"
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="知识点" 
                    value={userInfo.knowledgePoints || 0}
                    suffix="个"
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="平均分" 
                    value={userInfo.averageScore || 0}
                    suffix="分"
                  />
                </Col>
              </Row>

              {isEditing && (
                <Form.Item style={{display:'flex',justifyContent:'flex-end'}}>
                  <Button type="primary" htmlType="submit">
                    保存修改
                  </Button>
                </Form.Item>
              )}
            </Form>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default UserInfo;