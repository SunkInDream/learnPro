import React from 'react';
import { Layout, Button, Card, Typography, Space, Row, Col } from 'antd';
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
                onClick={() => navigate('/study-plan')}
              >
                开始学习
              </Button>
              <Button 
                size="large" 
                icon={<CalendarOutlined />}
                className="plan-button"
              >
                ???
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
              >
                <Card.Meta
                  title="?????"
                  description="??????????????????????????????"
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
              >
                <Card.Meta
                  title="?????"
                  description="???????????????????????????????????"
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
              >
                <Card.Meta
                  title="?????"
                  description="???????????????????????????????????"
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
                  <MailOutlined /> support@studyhelper.com
                </Text>
                <Text>客服热线:????????</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="footer-card">
              <Title level={4}>版权信息</Title>
              <Paragraph>
                © ???????
                <br />
                ???????
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </Footer>
    </Layout>
  );
}

