import React, { useState, useEffect } from 'react';
import { Card, Progress, List, Tag, Button, Modal, Form, Input, DatePicker, InputNumber, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import moment from 'moment';

const getInitialKnowledgePoints = () => {
  const savedPoints = localStorage.getItem('knowledgePoints');
  return savedPoints ? JSON.parse(savedPoints) : [
    {
      key: '1',
      topic: '函数与导数',
      mastery: 8,
      records: [
        { id: '1', date: '2024-03-19', score: 90, problems: 10 },
        { id: '2', date: '2024-03-20', score: 85, problems: 8 }
      ]
    },
    {
      key: '2',
      topic: '概率统计',
      mastery: 6,
      records: [
        { id: '3', date: '2024-03-18', score: 75, problems: 12 }
      ]
    }
  ];
};

const KnowledgeTraining = () => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [currentKnowledgePoint, setCurrentKnowledgePoint] = useState(null);
  const [form] = Form.useForm();
  const [addKnowledgeModalVisible, setAddKnowledgeModalVisible] = useState(false);
  const [knowledgeForm] = Form.useForm();
  
  const [knowledgePoints, setKnowledgePoints] = useState(getInitialKnowledgePoints);

  // 当知识点数据更新时，保存到 localStorage
  useEffect(() => {
    localStorage.setItem('knowledgePoints', JSON.stringify(knowledgePoints));
  }, [knowledgePoints]);

  // 打开编辑模态框
  const handleEdit = (record, knowledgePoint) => {
    setCurrentRecord(record);
    setCurrentKnowledgePoint(knowledgePoint);
    form.setFieldsValue({
      date: moment(record.date),
      score: record.score,
      problems: record.problems
    });
    setEditModalVisible(true);
  };

  // 删除记录
  const handleDelete = (recordId, knowledgePoint) => {
    const updatedPoints = knowledgePoints.map(point => {
      if (point.key === knowledgePoint.key) {
        return {
          ...point,
          records: point.records.filter(r => r.id !== recordId)
        };
      }
      return point;
    });
    setKnowledgePoints(updatedPoints);
    message.success('删除成功');
  };

  // 保存编辑或添加新记录
  const handleSave = async (values) => {
    try {
      const updatedPoints = knowledgePoints.map(point => {
        if (point.key === currentKnowledgePoint.key) {
          if (currentRecord) {
            // 编辑现有记录
            return {
              ...point,
              records: point.records.map(record => {
                if (record.id === currentRecord.id) {
                  return {
                    ...record,
                    date: values.date.format('YYYY-MM-DD'),
                    score: values.score,
                    problems: values.problems
                  };
                }
                return record;
              })
            };
          } else {
            // 添加新记录
            const newRecord = {
              id: Date.now().toString(), // 生成唯一ID
              date: values.date.format('YYYY-MM-DD'),
              score: values.score,
              problems: values.problems
            };
            return {
              ...point,
              records: [...point.records, newRecord]
            };
          }
        }
        return point;
      });
      
      setKnowledgePoints(updatedPoints);
      setEditModalVisible(false);
      message.success(currentRecord ? '更新成功' : '添加成功');
    } catch (error) {
      message.error(currentRecord ? '更新失败' : '添加失败');
    }
  };

  // 添加新记录
  const handleAdd = (knowledgePoint) => {
    setCurrentKnowledgePoint(knowledgePoint);
    setCurrentRecord(null);
    form.resetFields();
    setEditModalVisible(true);
  };

  // 添加新知识点
  const handleAddKnowledge = (values) => {
    try {
      const newKnowledge = {
        key: Date.now().toString(),
        topic: values.topic,
        mastery: values.mastery || 0,
        records: []
      };
      
      setKnowledgePoints([...knowledgePoints, newKnowledge]);
      setAddKnowledgeModalVisible(false);
      knowledgeForm.resetFields();
      message.success('添加知识点成功');
    } catch (error) {
      message.error('添加知识点失败');
    }
  };

  return (
    <div className="knowledge-training">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>知识点训练记录</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setAddKnowledgeModalVisible(true)}
        >
          添加知识点
        </Button>
      </div>

      <List
        dataSource={knowledgePoints}
        renderItem={item => (
          <Card 
            title={item.topic}
            style={{ marginBottom: 16 }}
            extra={
              <div>
                <Tag color="blue">掌握度: {item.mastery}/10</Tag>
                <Button 
                  type="primary" 
                  icon={<EditOutlined />}
                  onClick={() => handleAdd(item)}
                  style={{ marginLeft: 8 }}
                >
                  添加记录
                </Button>
              </div>
            }
          >
            <Progress percent={item.mastery * 10} />
            <List
              size="small"
              header={<div>练习记录</div>}
              dataSource={item.records}
              renderItem={record => (
                <List.Item
                  actions={[
                    <Button 
                      type="link" 
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record, item)}
                    >
                      编辑
                    </Button>,
                    <Button 
                      type="link" 
                      danger 
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(record.id, item)}
                    >
                      删除
                    </Button>
                  ]}
                >
                  <span>{record.date}</span>
                  <span style={{ margin: '0 16px' }}>得分：{record.score}</span>
                  <span>题目数：{record.problems}</span>
                </List.Item>
              )}
            />
          </Card>
        )}
      />

      <Modal
        title={currentRecord ? "编辑记录" : "添加记录"}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            label="日期"
            name="date"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker />
          </Form.Item>
          
          <Form.Item
            label="得分"
            name="score"
            rules={[{ required: true, message: '请输入得分' }]}
          >
            <InputNumber min={0} max={100} />
          </Form.Item>
          
          <Form.Item
            label="题目数量"
            name="problems"
            rules={[{ required: true, message: '请输入题目数量' }]}
          >
            <InputNumber min={1} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
            <Button 
              onClick={() => setEditModalVisible(false)}
              style={{ marginLeft: 8 }}
            >
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加新知识点"
        open={addKnowledgeModalVisible}
        onCancel={() => setAddKnowledgeModalVisible(false)}
        footer={null}
      >
        <Form
          form={knowledgeForm}
          layout="vertical"
          onFinish={handleAddKnowledge}
        >
          <Form.Item
            label="知识点名称"
            name="topic"
            rules={[{ required: true, message: '请输入知识点名称' }]}
          >
            <Input placeholder="请输入知识点名称" />
          </Form.Item>
          
          <Form.Item
            label="初始掌握度"
            name="mastery"
            initialValue={0}
          >
            <InputNumber 
              min={0} 
              max={10} 
              placeholder="请输入初始掌握度(0-10)"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
            <Button 
              onClick={() => setAddKnowledgeModalVisible(false)}
              style={{ marginLeft: 8 }}
            >
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default KnowledgeTraining; 