import React, { useState } from 'react';
import Head from '../Head'
import { Layout, Menu, Card, Input, Button, Row, Col, Space, Image, List, message } from 'antd';
import { SendOutlined, MailOutlined, PhoneOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index.less';

const { Header, Content } = Layout;
const { TextArea } = Input;

const Feedback = () => {
  const [feedback, setFeedback] = useState('');
  const navigate = useNavigate();

  // 制作组成员数据
  const teamMembers = [
    { name: '张三', role: '前端开发' },
    { name: '李四', role: '后端开发' },
    { name: '王五', role: '产品设计' },
    { name: '赵六', role: 'UI设计' },
    { name: '孙七', role: '算法开发' },
    { name: '周八', role: '测试工程师' },
    { name: '吴九', role: '项目经理' },
    { name: '郑十', role: '产品经理' }
  ];

  const handleSubmit = () => {
    if (!feedback.trim()) {
      message.warning('请输入反馈内容');
      return;
    }
    // TODO: 发送反馈到后端
    message.success('感谢您的反馈！');
    setFeedback('');
  };

  return (
    <Layout className="feedback-layout">
      <Head/>

      <Content className="content">
        <Row gutter={[24, 24]}>
          <Col span={14}>
            <Card title="团队介绍" className="intro-card">
              <div className="team-intro">
                <h3>关于我们</h3>
                <p>我们是一支致力于教育创新的团队，由来自不同领域的专业人士组成。我们的使命是通过技术手段，为高中学生提供个性化的学习解决方案。</p>
                
                <h3>我们的愿景</h3>
                <p>让每一位学生都能找到适合自己的学习方式，通过科学的方法提高学习效率，实现个人的学习目标。</p>
                
                <h3>为什么开发这个系统</h3>
                <ul>
                  <li>针对性：传统的学习方式缺乏个性化，我们希望通过AI技术为每位学生提供定制化的学习计划。</li>
                  <li>效率性：通过数据分析和智能算法，帮助学生更好地管理学习时间，提高学习效率。</li>
                  <li>互动性：建立师生、生生之间的交流平台，促进知识的分享和交流。</li>
                  <li>创新性：结合最新的教育理念和技术手段，探索未来教育的新模式。</li>
                </ul>
              </div>
            </Card>

            <Card title="意见反馈" className="feedback-card" style={{ marginTop: '24px' }}>
              <div className="feedback-input">
                <TextArea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="请输入您的意见或建议..."
                  autoSize={{ minRows: 6, maxRows: 12 }}
                />
                <Button 
                  type="primary" 
                  icon={<SendOutlined />}
                  onClick={handleSubmit}
                  className="submit-btn"
                >
                  提交反馈
                </Button>
              </div>
            </Card>
          </Col>

          <Col span={10}>
            <Card title="联系我们" className="about-card">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div className="contact-info">
                  <h3>联系方式</h3>
                  <p><MailOutlined /> 邮箱：support@example.com</p>
                  <p><PhoneOutlined /> 电话：123-4567-8900</p>
                </div>

                <div className="qr-code">
                  <h3>QQ交流群</h3>
                  <Image
                    width={200}
                    src="/qrcode.jpg"
                    fallback="data:image/png;base64,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"
                  />
                </div>

                <div className="team-members">
                  <h3><TeamOutlined /> 制作组成员</h3>
                  <List
                    grid={{ column: 2, gutter: 16 }}
                    dataSource={teamMembers}
                    renderItem={item => (
                      <List.Item>
                        <Card size="small">
                          <div className="member-name">{item.name}</div>
                          <div className="member-role">{item.role}</div>
                        </Card>
                      </List.Item>
                    )}
                  />
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default Feedback;