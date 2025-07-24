import React, { useState, useEffect } from 'react';
import { Form, Input, Upload, Button, message, Card, Row, Col, Divider, Select, DatePicker, Space, Statistic, Modal } from 'antd';
import { UploadOutlined, UserOutlined, EditOutlined, MailOutlined, PhoneOutlined, BookOutlined, LogoutOutlined, UserAddOutlined } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';
import moment from 'moment';
import axios from 'axios';
import './index.less';
import request from '../../../../utils/request';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { TextArea } = Input;

const UserInfo = (props) => {
  const [form] = Form.useForm();
  const [userInfo, setUserInfo] = useState({});
  const [imageUrl, setImageUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const navigate = useNavigate();

  const subjectConfig = {
    physics: [
      { label: '物理', value: 'physics', disabled: true },  // 必选
      { label: '化学', value: 'chemistry' },
      { label: '生物', value: 'biology' },
      { label: '地理', value: 'geography' },
      { label: '政治', value: 'politics' }
    ],
    history: [
      { label: '历史', value: 'history', disabled: true },  // 必选
      { label: '化学', value: 'chemistry' },
      { label: '生物', value: 'biology' },
      { label: '地理', value: 'geography' },
      { label: '政治', value: 'politics' }
    ]
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        const username = localStorage.getItem('username');
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
            category: data.category || '',      // 添加类别
            subjects: data.subjects || [],      // 科目数组
            bio: data.bio || ''
          });
          
          if (data.category && subjectConfig[data.category]) {
            setSubjectOptions(subjectConfig[data.category]);
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        message.error('获取用户信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [form]);

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG 格式的图片!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片必须小于 2MB!');
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

  const handleCategoryChange = (category) => {
    console.log('选择的类别:', category);
    
    if (category && subjectConfig[category]) {
      setSubjectOptions(subjectConfig[category]);
      
      // 自动选择必选科目
      if (category === 'physics') {
        form.setFieldValue('subjects', ['physics']);
      } else if (category === 'history') {
        form.setFieldValue('subjects', ['history']);
      }
    } else {
      setSubjectOptions([]);
      form.setFieldValue('subjects', []);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const updatedUserInfo = {
        username: localStorage.getItem('username'),
        nickname: values.nickname,
        grade: values.grade,
        phone: values.phone,
        email: values.email,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null,
        targetSchool: values.targetSchool,
        category: values.category,
        subjects: values.subjects,
        bio: values.bio,
        avatar: imageUrl
      };

      console.log('提交的数据:', updatedUserInfo);

      const response = await fetch('http://127.0.0.1:5000/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUserInfo)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        message.success('个人信息更新成功');
        
        if (typeof props.onUpdate === 'function') {
          props.onUpdate(updatedUserInfo);
        }
        
        setUserInfo(updatedUserInfo);
        setIsEditing(false);
        
      } else {
        message.error(result.message || '更新失败');
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
      message.error('网络错误，更新失败');
    }
  };

  // 处理退出登录
  const handleLogout = () => {
    localStorage.clear();
    message.success('退出登录成功');
    navigate('/login', { replace: true });
  };

  // 处理账户切换
  const handleSwitchAccount = () => {
    Modal.confirm({
      title: '切换账户',
      content: '退出当前账户后可以登录其他账户或注册新账户',
      okText: '确认退出',
      cancelText: '取消',
      onOk: () => {
        localStorage.clear();
        message.success('已退出当前账户');
        navigate('/login', { replace: true });
      }
    });
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
        {/* 账户操作按钮 */}
        <div className="account-actions" style={{ marginBottom: 24, textAlign: 'right' }}>
          <Space>
            <Button 
              type="default"
              icon={<UserAddOutlined />}
              onClick={handleSwitchAccount}
            >
              切换账户
            </Button>
            <Button 
              type="primary" 
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              退出登录
            </Button>
          </Space>
        </div>

        <Divider />

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
                    action="/api/uploadimg"
                    data={{ username:userInfo.username}}
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
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="选择类别"
                    name="category"
                    rules={[{ required: true, message: '请选择类别' }]}
                  >
                    <Select
                      placeholder="请选择类别"
                      disabled={!isEditing}
                      onChange={handleCategoryChange}
                      options={[
                        { label: '物理类', value: 'physics' },
                        { label: '历史类', value: 'history' }
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="选择科目"
                    name="subjects"
                    rules={[{ required: true, message: '请选择科目' }]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="请先选择类别"
                      disabled={!isEditing || subjectOptions.length === 0}
                      options={subjectOptions}
                      maxTagCount="responsive"
                      showSearch={false} 
                      onChange={(value) => {
                        if (value.length > 3) {
                          message.warning('最多只能选择3门科目');
                          // 只保留前3个选项
                          const limitedValue = value.slice(0, 3);
                          form.setFieldValue('subjects', limitedValue);
                        }
                      }}

                      onInputKeyDown={(e) => { 
                        e.preventDefault();
                      }}
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