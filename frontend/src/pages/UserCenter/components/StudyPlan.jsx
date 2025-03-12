import React, { useState, useEffect } from 'react';
import { Card, Table, Progress, Tabs, Empty, Tag, Timeline, Button } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import './StudyPlan.less';

const { TabPane } = Tabs;

const StudyPlan = () => {
  // 从 localStorage 获取当前计划和历史计划
  const getStoredPlans = () => {
    const stored = localStorage.getItem('studyPlans');
    return stored ? JSON.parse(stored) : {
      currentPlan: {
        planId: '1',
        createTime: '2024-03-20',
        plans: [
          {
            key: '1',
            date: '2024-03-20',
            subject: '数学',
            content: '函数与导数',
            status: '已完成',
            completion: 100,
          },
          {
            key: '2',
            date: '2024-03-21',
            subject: '物理',
            content: '力学基础',
            status: '进行中',
            completion: 60,
          }
        ]
      },
      historyPlans: []
    };
  };

  const [plans, setPlans] = useState(getStoredPlans);

  // 当计划更新时保存到 localStorage
  useEffect(() => {
    localStorage.setItem('studyPlans', JSON.stringify(plans));
  }, [plans]);

  // 更新当前计划（模拟接收新计划）
  const updateCurrentPlan = (newPlan) => {
    // 将当前计划移到历史记录
    const updatedHistoryPlans = [plans.currentPlan, ...plans.historyPlans].slice(0, 5);
    
    setPlans({
      currentPlan: {
        planId: Date.now().toString(),
        createTime: moment().format('YYYY-MM-DD'),
        plans: newPlan
      },
      historyPlans: updatedHistoryPlans
    });
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '科目',
      dataIndex: 'subject',
      key: 'subject',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '学习内容',
      dataIndex: 'content',
      key: 'content',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = status === '已完成' ? 'success' : status === '进行中' ? 'processing' : 'default';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: '完成度',
      dataIndex: 'completion',
      key: 'completion',
      render: (completion) => (
        <Progress percent={completion} size="small" />
      ),
    },
  ];

  // 渲染历史计划
  const renderHistoryPlan = (plan) => {
    const avgCompletion = plan.plans.reduce((acc, curr) => acc + curr.completion, 0) / plan.plans.length;
    
    return (
      <Card 
        key={plan.planId}
        style={{ marginBottom: 16 }}
        title={`创建日期：${plan.createTime}`}
        extra={
          <Tag color={avgCompletion === 100 ? 'success' : 'warning'}>
            完成度：{avgCompletion.toFixed(1)}%
          </Tag>
        }
      >
        <Timeline>
          {plan.plans.map(item => (
            <Timeline.Item 
              key={item.key}
              color={item.status === '已完成' ? 'green' : 'blue'}
              dot={item.status === '已完成' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Tag color="blue">{item.subject}</Tag>
                  {item.content}
                </div>
                <Progress percent={item.completion} size="small" style={{ width: 100 }} />
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    );
  };

  return (
    <div className="study-plan">
      <Tabs defaultActiveKey="current">
        <TabPane tab="当前学习计划" key="current">
          <Card 
            title={`当前计划（${plans.currentPlan.createTime}）`}
            extra={
              <Button 
                type="primary"
                onClick={() => {
                  // 模拟接收新计划
                  const newPlan = [
                    {
                      key: '1',
                      date: moment().format('YYYY-MM-DD'),
                      subject: '化学',
                      content: '化学平衡',
                      status: '进行中',
                      completion: 0,
                    }
                  ];
                  updateCurrentPlan(newPlan);
                }}
              >
                更新计划
              </Button>
            }
          >
            <Table 
              columns={columns} 
              dataSource={plans.currentPlan.plans} 
              pagination={false}
            />
          </Card>
        </TabPane>
        
        <TabPane tab="历史学习计划" key="history">
          {plans.historyPlans.length > 0 ? (
            plans.historyPlans.map(plan => renderHistoryPlan(plan))
          ) : (
            <Empty description="暂无历史计划" />
          )}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default StudyPlan; 