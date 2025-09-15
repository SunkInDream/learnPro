import React from 'react';
import { Layout, Button, Card, Typography, Space, Row, Col,Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import Head from '../Head';
import { 
  BookOutlined, 
  CalendarOutlined, 
  MailOutlined,
  RocketOutlined,
  TrophyOutlined,
  BulbOutlined 
} from '@ant-design/icons';
import './index.less';

const { Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function Main() {
  const navigate = useNavigate();
  const [isshowpatent,setIsShowpatent] = React.useState(false);
  const [isshowend,setIsShowend] = React.useState(false);
  return (
    <Layout className="main-layout">
      <Head/>
      <Content className="main-content">
        <div className="content-wrapper">
          <div className="hero-section">
            <Title level={1} className="main-title">
              学习助手
            </Title>
            <Paragraph className="subtitle">
              智能学习，助力成长
            </Paragraph>
            
            <Space size="large" className="action-buttons">
              <Button 
                type="primary" 
                size="large" 
                icon={<RocketOutlined />}
                className="start-button"
                onClick={() => navigate('/user')}
              >
                开始学习
              </Button>
              <Button 
                size="large" 
                icon={<CalendarOutlined />}
                className="plan-button"
                onClick={() => navigate('/study-plan')}
              >
                计划
              </Button>
            </Space>
          </div>

          {/* 功能卡片 */}
          <Row gutter={[24, 24]} className="feature-cards">
            <Col xs={24} sm={12} md={8}>
              <Card 
                hoverable
                className="feature-card"
                cover={
                  <div className="card-icon">
                    <BookOutlined />
                  </div>
                }
                onClick={() => {setIsShowpatent(true)}}
              >
                <Card.Meta
                  title="专利"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card 
                hoverable
                className="feature-card"
                cover={
                  <div className="card-icon">
                    <TrophyOutlined />
                  </div>
                }
                onClick={() => setIsShowend(true)}
              >
                <Card.Meta
                  title="结项"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card 
                hoverable
                className="feature-card"
                cover={
                  <div className="card-icon">
                    <BulbOutlined />
                  </div>
                }
                onClick={() => navigate('/feedback')}
              >
                <Card.Meta
                  title="关于我们"
                />
              </Card>
            </Col>
          </Row>
        </div>
      </Content>

      {/* Footer */}
      <Footer className="main-footer">
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card className="footer-card">
              <Title level={4}>关于我们</Title>
              <Paragraph>
                致力于为学习者提供最优质的学习体验，让学习变得更加高效和有趣。
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="footer-card">
              <Title level={4}>联系方式</Title>
              <Space direction="vertical">
                <Text>
                  <MailOutlined /> 123456@qq.com
                </Text>
                
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="footer-card">
              <Title level={4}>版权信息</Title>
              
            </Card>
          </Col>
        </Row>
      </Footer>
      <Modal
      title="专利"
      open = {isshowpatent}
      onOk={() => setIsShowpatent(false)}
      onCancel={() => setIsShowpatent(false)}>
        <img style={{width:'100%'}} src="/image/patent.png"></img>
      </Modal>
      <Modal
      title="结项"
      open = {isshowend}
      onOk={() => setIsShowend(false)}
      onCancel={() => setIsShowend(false)}>
        <img style={{width:'100%'}} src="/image/end.png"></img>
      </Modal>
    </Layout>
  );
}

