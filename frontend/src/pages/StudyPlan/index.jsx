import React, { useState, useRef } from 'react';
import Head from '../Head';
import { Layout, Menu, Table, Button, Modal, Form, Input, Select, TimePicker, InputNumber, Space, message, Progress } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import './index.less';

const { Header, Content } = Layout;
const { Option } = Select;

const StudyPlan = () => {
  const [planData, setPlanData] = useState([
    { key: '1', timeSlot: '07:00-07:30', content: '早饭', type: 'break' },
    { key: '2', timeSlot: '07:30-09:00', content: '数学 - 函数与导数', difficulty: 7, exercises: 'math_1.pdf', score: '85/100', type: 'study' },
    { key: '3', timeSlot: '09:00-09:30', content: '休息 - 散步', type: 'break' },
    { key: '4', timeSlot: '09:30-11:00', content: '物理 - 力学', difficulty: 6, exercises: 'physics_1.pdf', score: '90/100', type: 'study' },
    { key: '5', timeSlot: '11:30-12:30', content: '午饭', type: 'break' },
    { key: '6', timeSlot: '12:30-14:00', content: '化学 - 化学平衡', difficulty: 8, exercises: 'chemistry_1.pdf', score: '88/100', type: 'study' },
    { key: '7', timeSlot: '14:00-14:30', content: '休息 - 小憩', type: 'break' },
    { key: '8', timeSlot: '14:30-16:00', content: '英语 - 阅读理解', difficulty: 5, exercises: 'english_1.pdf', score: '92/100', type: 'study' },
    { key: '9', timeSlot: '17:00-17:30', content: '晚饭', type: 'break' },
    { key: '10', timeSlot: '17:30-19:00', content: '语文 - 文言文', difficulty: 6, exercises: 'chinese_1.pdf', score: '87/100', type: 'study' },
    { key: '11', timeSlot: '19:00-19:30', content: '休息 - 运动', type: 'break' },
    { key: '12', timeSlot: '19:30-21:00', content: '生物 - 遗传', difficulty: 7, exercises: 'biology_1.pdf', score: '89/100', type: 'study' }
  ]);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState('');
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [percent, setPercent] = useState(0);
  const timerRef = useRef(null);

  const generateAndDownloadExam = (subject, difficulty) => {
    // 打开进度条 Modal
    setDownloading(true);
    setPercent(0);
    // 模拟进度增长
    timerRef.current = window.setInterval(() => {
      setPercent(p => Math.min(p + Math.random() * 5, 95));
    }, 500);

    const url = `/api/generate_exam?subject=${encodeURIComponent(subject)}&difficulty=${difficulty}`;
    fetch(url)
      .then(res => {
        clearInterval(timerRef.current);
        setPercent(100);
        return res.blob();
      })
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${subject}试卷(难度${difficulty}).md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(err => {
        console.error(err);
        message.error('下载失败');
      })
      .finally(() => {
        // 延迟关闭进度条，让用户看到 100%
        setTimeout(() => setDownloading(false), 500);
      });
  }
  const columns = [
    {
      title: '时间段',
      dataIndex: 'timeSlot',
      key: 'timeSlot',
      width: 150,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      render: (text, record) => record.type === 'study' ? text : <span style={{ color: '#52c41a' }}>{text}</span>,
    },
    {
      title: '难度系数',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      render: (text, record) => record.type === 'study' ? text : null,
    },
    {
      title: '习题',
      dataIndex: 'exercises',
      key: 'exercises',
      width: 100,
      render: (text, record) => record.type === 'study' ? (
      <Button type="link" onClick={() => {
        const subject = record.content.split(' - ')[0];
        
        console.log("下载数据:", {
          记录: record,
          科目: subject,
          原始难度值: record.difficulty,
          难度类型: typeof record.difficulty
        });
        
        generateAndDownloadExam(subject, record.difficulty || 5);
      }}>
        下载
      </Button>
    ) : null,
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (text, record) => record.type === 'study' ? text : null,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.key)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleDownload = (filename) => {
    message.success(`开始下载 ${filename}`);
    // TODO: 实现文件下载逻辑
  };

  const handleAdd = () => {
    form.resetFields();
    setEditingKey('');
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    form.setFieldsValue({
      ...record,
      timeRange: record.timeSlot.split('-').map(time => moment(time, 'HH:mm')),
    });
    setEditingKey(record.key);
    setIsModalVisible(true);
  };

  const handleDelete = (key) => {
    setPlanData(planData.filter(item => item.key !== key));
    message.success('删除成功');
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const timeSlot = `${values.timeRange[0].format('HH:mm')}-${values.timeRange[1].format('HH:mm')}`;
      
      const newData = {
        key: editingKey || Date.now().toString(),
        timeSlot,
        content: values.content,
        type: values.type,
        ...(values.type === 'study' ? {
          difficulty: values.difficulty,
          exercises: values.exercises,
          score: values.score
        } : {})
      };

      if (editingKey) {
        setPlanData(planData.map(item => item.key === editingKey ? newData : item));
      } else {
        setPlanData([...planData, newData]);
      }

      setIsModalVisible(false);
      message.success(editingKey ? '更新成功' : '添加成功');
    } catch (error) {
      console.error('Validate Failed:', error);
    }
  };

  return (
  <>
    <Layout className="study-plan-layout">
      <Head />

      <Content className="content">
        <div className="plan-header">
          <h2>学习计划表</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加计划
          </Button>
        </div>

        <Table 
          columns={columns} 
          dataSource={planData}
          pagination={false}
          className="plan-table"
        />

        <Modal
          title={editingKey ? "编辑计划" : "添加计划"}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="timeRange"
              label="时间段"
              rules={[{ required: true, message: '请选择时间段' }]}
            >
              <TimePicker.RangePicker format="HH:mm" />
            </Form.Item>

            <Form.Item
              name="type"
              label="类型"
              rules={[{ required: true, message: '请选择类型' }]}
            >
              <Select>
                <Option value="study">学习</Option>
                <Option value="break">休息/用餐</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="content"
              label="内容"
              rules={[{ required: true, message: '请输入内容' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
            >
              {({ getFieldValue }) => 
                getFieldValue('type') === 'study' ? (
                  <>
                    <Form.Item
                      name="difficulty"
                      label="难度系数"
                      rules={[{ required: true, message: '请输入难度系数' }]}
                    >
                      <InputNumber min={1} max={10} />
                    </Form.Item>

                    <Form.Item
                      name="exercises"
                      label="习题文件名"
                      rules={[{ required: true, message: '请输入习题文件名' }]}
                    >
                      <Input />
                    </Form.Item>

                    <Form.Item
                      name="score"
                      label="得分"
                    >
                      <Input placeholder="格式：得分/满分" />
                    </Form.Item>
                  </>
                ) : null
              }
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
    <Modal
        title="正在生成试卷，请稍候..."
        visible={downloading}
        footer={null}
        closable={false}
      >
        <Progress percent={Math.floor(percent)} status={percent < 100 ? 'active' : 'success'} />
      </Modal>
    </>
  );
};

export default StudyPlan; 