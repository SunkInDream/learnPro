import React, { useState, useRef, useEffect } from 'react';
import Head from '../Head';
import { Layout, Menu, Table, Button, Modal, Form, Input, Select, TimePicker, InputNumber, Space, message, Progress, Card, Alert, Popover, List, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined, HistoryOutlined, ClearOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import './index.less';

const { Header, Content } = Layout;
const { Option } = Select;

const StudyPlan = () => {
  const [planData, setPlanData] = useState(() => {
    const savedPlan = localStorage.getItem('currentStudyPlan');
    return savedPlan ? JSON.parse(savedPlan) : [];
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState('');
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [percent, setPercent] = useState(0);
  const timerRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const [generatePercent, setGeneratePercent] = useState(0);
  const generateTimerRef = useRef(null);
  const [personalizedData, setPersonalizedData] = useState({
    restMethods: [],
    knowledgePoints: [],
    studyHistory: []
  });
  const [planHistory, setPlanHistory] = useState(() => {
    const savedHistory = localStorage.getItem('studyPlanHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [formValues, setFormValues] = useState(() => {
    const saved = localStorage.getItem('studyPlanFormValues');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          timeRange: parsed.timeRange && parsed.timeRange.length === 2 ? [
            moment(parsed.timeRange[0], 'HH:mm'), 
            moment(parsed.timeRange[1], 'HH:mm')
          ] : [moment('07:00', 'HH:mm'), moment('21:00', 'HH:mm')],
          subjects: parsed.subjects || []
        };
      } catch (error) {
        console.log('解析保存的表单数据失败:', error);
      }
    }
    return {
      timeRange: [moment('07:00', 'HH:mm'), moment('21:00', 'HH:mm')],
      subjects: []
    };
  });

  useEffect(() => {
    localStorage.setItem('currentStudyPlan', JSON.stringify(planData));
  }, [planData]);

  useEffect(() => {
    localStorage.setItem('studyPlanHistory', JSON.stringify(planHistory));
  }, [planHistory]);

  useEffect(() => {
    if (formValues && formValues.timeRange && formValues.timeRange.length === 2) {
      const saveData = {
        timeRange: [
          formValues.timeRange[0].format('HH:mm'),
          formValues.timeRange[1].format('HH:mm')
        ],
        subjects: formValues.subjects || []
      };
      localStorage.setItem('studyPlanFormValues', JSON.stringify(saveData));
    }
  }, [formValues]);

  useEffect(() => {
    const restPlaces = JSON.parse(localStorage.getItem('restPlaces') || '[]');
    const knowledgePoints = JSON.parse(localStorage.getItem('knowledgePoints') || '[]');
    const records = JSON.parse(localStorage.getItem('records') || '[]');
    
    setPersonalizedData({
      restMethods: restPlaces.map(place => place.content),
      knowledgePoints: knowledgePoints.length,
      studyHistory: records.length
    });

    if (formValues.subjects && formValues.subjects.length > 0) {
      form.setFieldsValue({
        timeRange: [moment('07:00', 'HH:mm'), moment('21:00', 'HH:mm')],
        subjects: formValues.subjects
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (generateTimerRef.current) {
        clearInterval(generateTimerRef.current);
      }
    };
  }, []);

  const generateAndDownloadExam = (subject, difficulty) => {
    setDownloading(true);
    setPercent(0);
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
  const handleGeneratePlan = async () => {
    try {
      const values = await form.validateFields();
      const timeRange = {
        start: values.timeRange[0].format('HH:mm'),
        end: values.timeRange[1].format('HH:mm')
      };
      
      setGenerating(true);
      setGeneratePercent(0);
      
      generateTimerRef.current = window.setInterval(() => {
        setGeneratePercent(p => Math.min(p + Math.random() * 3, 90));
      }, 300);

      const restPlaces = JSON.parse(localStorage.getItem('restPlaces') || '[]');
      const restMethods = restPlaces.map(place => place.content);

      const knowledgePoints = JSON.parse(localStorage.getItem('knowledgePoints') || '[]');
      const knowledgeMastery = knowledgePoints.map(point => ({
        subject: point.subject,
        chapter: point.chapter,
        topic: point.topic,
        masteryLevel: point.masteryLevel || 0, 
        lastStudyTime: point.lastStudyTime || null
      }));

      const records = JSON.parse(localStorage.getItem('records') || '[]');
      const studyHistory = records.map(record => ({
        subject: record.subject,
        topic: record.topic,
        score: record.score,
        studyTime: record.studyTime,
        date: record.date
      }));

      console.log('发送给后端数据:', {
        restMethods: restMethods,
        knowledgeMastery: knowledgeMastery,
        studyHistory: studyHistory
      });
      
      const response = await fetch('/api/generatetimetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          starttime: timeRange.start,
          endtime: timeRange.end,
          subjects: values.subjects,
          restMethods: restMethods, 
          knowledgeMastery: knowledgeMastery,
          studyHistory: studyHistory 
        })
      });
      
      clearInterval(generateTimerRef.current);
      setGeneratePercent(100);
      
      const data = await response.json();
      if (data.success) {
        console.log('原始返回数据:', data.timetable);
        
        try {
          let resultText = data.timetable.result;
          
          if (resultText.includes('```json')) {
            resultText = resultText.replace(/```json\n?/g, '').replace(/\n?```/g, '');
          }
          
          const parsedPlan = JSON.parse(resultText);
          console.log('解析后的计划数据:', parsedPlan);
          
          const formattedPlan = parsedPlan.map(item => ({
            key: item.key,
            timeSlot: item.timeslot,
            content: item.content,
            difficulty: item.difficulty,
            exercises: `${item.content.split('：')[0]}_练习.pdf`,
            score: item.exercises_score ? `${item.exercises_score}/100` : '',
            type: item.type === '休息' ? 'break' : 'study'
          }));
          
          console.log('格式化后的数据:', formattedPlan);
          
          if (planData.length > 0) {
            const currentPlanRecord = {
              id: Date.now(),
              name: `学习计划 - ${new Date().toLocaleDateString()}`,
              createTime: new Date().toISOString(),
              planData: [...planData],
              subjects: values.subjects,
              timeRange: timeRange
            };
            
            setPlanHistory(prev => [currentPlanRecord, ...prev.slice(0, 9)]); 
          }
          
          setPlanData(formattedPlan);
          
          message.success('学习计划生成成功！');
        } catch (parseError) {
          console.error('解析计划数据失败:', parseError);
          console.log('原始result字符串:', data.timetable.result);
          message.error('解析学习计划数据失败，请重试');
        }
      } else {
        message.error('生成学习计划失败: ' + (data.msg || '未知错误'));
      }
    } catch (error) {
      clearInterval(generateTimerRef.current);
      console.error('生成计划错误:', error);
      message.error('生成学习计划时发生错误');
    } finally {
      setTimeout(() => {
        setGenerating(false);
        setGeneratePercent(0);
      }, 500);
    }
  };


  const handleDownload = (filename) => {
    message.success(`开始下载 ${filename}`);
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

  // 清空当前计划
  const handleClearPlan = () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空当前学习计划吗？此操作不可恢复。',
      onOk: () => {
        setPlanData([]);
        message.success('已清空当前学习计划');
      }
    });
  };

  // 加载历史计划
  const handleLoadHistoryPlan = (historyPlan) => {
    Modal.confirm({
      title: '加载历史计划',
      content: `确定要加载"${historyPlan.name}"吗？当前计划将被替换。`,
      onOk: () => {
        setPlanData(historyPlan.planData);
        message.success('历史计划加载成功');
      }
    });
  };

  // 删除历史计划
  const handleDeleteHistoryPlan = (planId) => {
    setPlanHistory(prev => prev.filter(plan => plan.id !== planId));
    message.success('历史计划删除成功');
  };

  // 历史计划列表组件
  const HistoryPlanList = () => (
    <div style={{ width: 300 }}>
      <List
        header={<div>历史计划记录</div>}
        dataSource={planHistory}
        renderItem={item => (
          <List.Item
            actions={[
              <Button type="link" size="small" onClick={() => handleLoadHistoryPlan(item)}>
                加载
              </Button>,
              <Button type="link" size="small" danger onClick={() => handleDeleteHistoryPlan(item.id)}>
                删除
              </Button>
            ]}
          >
            <List.Item.Meta
              title={item.name}
              description={
                <div>
                  <div>{new Date(item.createTime).toLocaleString()}</div>
                  <div>
                    {item.subjects?.map(subject => (
                      <Tag key={subject} size="small">{subject}</Tag>
                    ))}
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
        locale={{ emptyText: '暂无历史计划' }}
      />
    </div>
  );

  return (
    <>
      <Layout className="study-plan-layout">
        <Head />

        <Content className="content">
          <Card title="学习计划生成" className="plan-card">
            <Form
              form={form}
              initialValues={{
                timeRange: [moment('07:00', 'HH:mm'), moment('21:00', 'HH:mm')],
                subjects: formValues.subjects || []
              }}
              onValuesChange={(_, allValues) => {
                if (allValues.timeRange && allValues.timeRange.length === 2) {
                  setFormValues(allValues);
                }
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
              
              <Form.Item
                name="subjects"
                label="学习科目"
                rules={[{ required: true, message: '请选择学习科目' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="请选择要学习的科目"
                  style={{ width: '100%' }}
                >
                  <Option value="数学">数学</Option>
                  <Option value="物理">物理</Option>
                  <Option value="化学">化学</Option>
                  <Option value="英语">英语</Option>
                  <Option value="语文">语文</Option>
                  <Option value="生物">生物</Option>
                  <Option value="历史">历史</Option>
                  <Option value="地理">地理</Option>
                  <Option value="政治">政治</Option>
                </Select>
              </Form.Item>
              <div className='button-container' style={{
                margin: '20px 0',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <Button
                  type="primary"
                  icon={<CalendarOutlined />}
                  onClick={handleGeneratePlan}
                  loading={generating}
                  disabled={generating}
                >
                  {generating ? '正在生成...' : '生成学习计划'}
                </Button>
              </div>
            </Form>
          </Card>
          <div className="plan-header">
            <h2>学习计划表</h2>
            <Space>
              <Popover 
                content={<HistoryPlanList />} 
                title="历史计划" 
                trigger="click"
                placement="bottomRight"
              >
                <Button icon={<HistoryOutlined />}>
                  历史计划 ({planHistory.length})
                </Button>
              </Popover>
              <Button 
                icon={<ClearOutlined />} 
                onClick={handleClearPlan}
                disabled={planData.length === 0}
              >
                清空计划
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加计划
              </Button>
            </Space>
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
      
      <Modal
        title="正在生成学习计划，请稍候..."
        visible={generating}
        footer={null}
        closable={false}
      >
        <Progress percent={Math.floor(generatePercent)} status={generatePercent < 100 ? 'active' : 'success'} />
        <div style={{ marginTop: '16px', textAlign: 'center', color: '#666' }}>
          正在为您制定个性化学习计划...
        </div>
      </Modal>
    </>
  );
};

export default StudyPlan; 