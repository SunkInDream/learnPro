import React, { useState, useEffect } from "react";
import { Button, Card, List, Modal, Form, Input, Select, DatePicker, InputNumber, message, Empty, Spin } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";

const { Option } = Select;
const { TextArea } = Input;



const KnowledgeManager = () => {
  const [form] = Form.useForm();
  const [knowledgeForm] = Form.useForm();

  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [knowledgePoints, setKnowledgePoints] = useState([]);
  const [selectedKnowledge, setSelectedKnowledge] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [addKnowledgeModalVisible, setAddKnowledgeModalVisible] = useState(false);
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [questionModalVisible, setQuestionModalVisible] = useState(false); // 控制生成题目 Modal 的显示

  const [loadingQuestions, setLoadingQuestions] = useState(false); // 控制 Spin 加载状态

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);

  // 选中的学科，用于学科导航
  const [filterSubject, setFilterSubject] = useState(null);
  const [userGrade, setUserGrade] = useState(null);

  const [generatedQuestion, setGeneratedQuestion] = useState(null); // 生成的题目对象

  const [showFullQuestions, setShowFullQuestions] = useState(false); // 控制是否显示完整题目
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // 1. 加载学科数据
        const response = await fetch('/static_data/subjects.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const subjectsData = await response.json();
        setAllSubjects(subjectsData);

        // 2. 加载本地存储的数据
        const storedRecords = localStorage.getItem("records");
        const storedKnowledgePoints = localStorage.getItem("knowledgePoints");

        if (storedRecords) setRecords(JSON.parse(storedRecords));
        if (storedKnowledgePoints) setKnowledgePoints(JSON.parse(storedKnowledgePoints));

        // 3. 加载用户信息
        const username = localStorage.getItem("username");
        if (username) {
          const userResponse = await fetch(`/api/user/info?username=${username}`);
          const userData = await userResponse.json();

          if (userData && !userData.error && userData.grade !== undefined) {
            setUserGrade(userData.grade);
          } else {
            message.error("获取用户信息失败");
          }
        }
      } catch (error) {
        console.error("加载数据失败:", error);
        message.error("加载学科数据失败，请刷新页面重试");

        // 使用默认数据作为后备
        setAllSubjects([
          {
            label: "数学",
            value: "math",
            chapters: [
              {
                label: "基础数学",
                value: "basic-math",
                topics: [
                  { label: "基础运算", value: "basic-operations" }
                ]
              }
            ]
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
   if (loading) {
    return (
      <div style={{ 
        padding: 20, 
        textAlign: 'center',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '300px'
      }}>
        <Spin size="large" tip="加载学科数据中..." />
      </div>
    );
  }

  // 计算掌握度 = (所有得分总和 / (记录数*100)) * 10
  const calculateMastery = (knowledgeName) => {
    const relatedRecords = records.filter((r) => r.knowledge === knowledgeName);
    if (relatedRecords.length === 0) return 0;
    const totalScore = relatedRecords.reduce((sum, r) => sum + r.score, 0);
    const mastery = Math.round((totalScore / (relatedRecords.length * 100)) * 10);
    return mastery > 10 ? 10 : mastery;
  };

  // 生成题目请求
  const generateQuestions = async (knowledge) => {
    console.log("生成题目请求", knowledge, { userGrade });
    const kp = knowledgePoints.find((k) => k.name === knowledge);
    if (!kp) return message.error("未找到知识点");

    const subjectLabel = allSubjects.find((s) => s.value === kp.subject)?.label || "";
    const mastery = calculateMastery(knowledge);

    message.loading({ content: "题目生成中...", key: "generate" });
    setLoadingQuestions(true); // 开启加载状态
    try {
      const res = await fetch("/api/generateQuestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subjectLabel,
          difficulty: mastery,
          knowledgeName: knowledge,
          grade: userGrade,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedQuestion(data.questions); // 将生成的题目存储到状态
        //储存到数据库


        await fetch("/api/saveQuestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questions: data.questions,
            knowledgeName: knowledge,
            userGrade,
            userId: localStorage.getItem("userId"), // 假设用户ID存储在localStorage中
          }),
        });


        message.success({ content: "题目生成成功！", key: "generate" });
        setQuestionModalVisible(true); // 打开新的 Modal
      } else {
        message.error({ content: "题目生成失败", key: "generate" });
      }
    } catch (error) {
      message.error({ content: "题目生成出错", key: "generate" });
      console.error(error);
    } finally {
      setLoadingQuestions(false); // 关闭加载状态
    }
  };

  // 删除知识点时也要清理题目和记录
  const handleDeleteKnowledge = (name) => {
    Modal.confirm({
      title: "确认删除该知识点？",
      onOk: () => {
        const newPoints = knowledgePoints.filter((k) => k.name !== name);
        const newRecords = records.filter((r) => r.knowledge !== name);
        setKnowledgePoints(newPoints);
        setRecords(newRecords);
        localStorage.setItem("knowledgePoints", JSON.stringify(newPoints));
        localStorage.setItem("records", JSON.stringify(newRecords));
        message.success("删除成功！");
      },
    });
  };

  const openRecordModal = (knowledgeName) => {
    setSelectedKnowledge(knowledgeName);
    setRecordModalVisible(true);
  };

  // 筛选知识点，只显示选中的学科
  const filteredKnowledgePoints = filterSubject
    ? knowledgePoints.filter((k) => k.subject === filterSubject)
    : knowledgePoints;

  // 添加知识点提交
  const handleAddKnowledge = (values) => {
    const topicLabel = selectedTopic ? topics.find((t) => t.value === selectedTopic)?.label : "";
    const chapterLabel = selectedChapter ? chapters.find((c) => c.value === selectedChapter)?.label : "";
    const subjectLabel = selectedSubject ? allSubjects.find((s) => s.value === selectedSubject)?.label : "";
    const fullTopicName = `${subjectLabel}-${chapterLabel}-${topicLabel}`;

    // 先判断是否已存在该知识点
    if (knowledgePoints.some((k) => k.name === fullTopicName)) {
      return message.warning("该知识点已存在！");
    }

    const newKnowledge = {
      name: fullTopicName,
      subject: selectedSubject,
      chapter: selectedChapter,
      topic: selectedTopic,
      mastery: 0,
      questions: [], // 新增题目字段
    };

    const updated = [...knowledgePoints, newKnowledge];
    setKnowledgePoints(updated);
    localStorage.setItem("knowledgePoints", JSON.stringify(updated));
    setAddKnowledgeModalVisible(false);
    resetAddKnowledgeForm();
    message.success("知识点添加成功！");
  };

  const resetAddKnowledgeForm = () => {
    setSelectedSubject(null);
    setSelectedChapter(null);
    setSelectedTopic(null);
    setChapters([]);
    setTopics([]);
    knowledgeForm.resetFields();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>知识点掌握情况</h2>

      {/* 学科导航 */}
      <div style={{ marginBottom: 20 }}>
        <Select
          placeholder="按学科筛选"
          style={{ width: 200 }}
          allowClear
          onChange={(val) => setFilterSubject(val)}
          value={filterSubject}
        >
          {allSubjects.map((s) => (
            <Option key={s.value} value={s.value}>
              {s.label}
            </Option>
          ))}
        </Select>
      </div>

      <Button type="primary" onClick={() => setAddKnowledgeModalVisible(true)} style={{ marginBottom: 20 }}>
        添加知识点
      </Button>

      {filteredKnowledgePoints.length === 0 ? (
        <Empty description="暂无知识点" />
      ) : (
        <List
          grid={{ gutter: 16, column: 2 }}
          dataSource={filteredKnowledgePoints}
          renderItem={(item) => {
            // 找到该知识点的最近一次记录，按日期排序取最新的
            const relatedRecords = records
              .filter((r) => r.knowledge === item.name)
              .sort((a, b) => (a.date < b.date ? 1 : -1)); // 降序
            const latestRecord = relatedRecords.length > 0 ? relatedRecords[0] : null;

            return (
              <List.Item>
                <Card
                  title={item.name}
                  extra={
                    <Button size="small" onClick={() => handleDeleteKnowledge(item.name)} danger>
                      删除
                    </Button>
                  }
                >
                  掌握度：{calculateMastery(item.name)} / 10
                  <br />
                  {latestRecord ? (
                    <div style={{ marginTop: 10, fontSize: 12, color: "#555" }}>
                      最近一次记录时间：{latestRecord.date}，得分：{latestRecord.score}, 备注：{latestRecord.note || "无"}
                    </div>
                  ) : (
                    <div style={{ marginTop: 10, fontSize: 12, color: "#999" }}>暂无学习记录</div>
                  )}
                  <div style={{ marginTop: 10 }}>
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => {
                        setModalVisible(true);
                        setSelectedKnowledge(item.name);
                      }}
                    >
                      添加记录
                    </Button>
                    <Button size="small" style={{ marginLeft: 10 }} onClick={() => openRecordModal(item.name)}>
                      查看记录
                    </Button>

                  </div>
                </Card>
              </List.Item>
            );
          }}
        />

      )}

      {/* 添加记录 Modal */}
      <Modal
        title="添加学习记录"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="knowledge" initialValue={selectedKnowledge} hidden />
          <Form.Item label="日期" name="date" rules={[{ required: true, message: "请选择日期" }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item>
            <Button
              size="small"
              style={{ marginLeft: 10 }}
              onClick={() => {
                const selectedDate = form.getFieldValue("date");
                if (!selectedDate) {
                  message.warning("请先选择日期！");
                  return;
                }
                generateQuestions(selectedKnowledge);
              }}
              type="dashed"
            >
              生成题目
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 生成的题目 */}
      <Modal
        title="生成的题目"
        open={questionModalVisible}
        onCancel={() => setQuestionModalVisible(false)}
        footer={null}
        width={600}
      >
        {loadingQuestions ? (
          <Spin tip="加载中..." style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }} />
        ) : (
          <>
            <List
              dataSource={generatedQuestion || []}
              renderItem={(q, idx) => <List.Item key={idx}>{q}</List.Item>}
            />
            <Form
              form={form}
              onFinish={(values) => {
                const newRecords = [
                  ...records,
                  {
                    ...values,
                    knowledge: selectedKnowledge, // 确保记录的知识点名称正确
                    date: values.date.format("YYYY-MM-DD"), // 格式化日期
                    questions: generatedQuestion, // 将生成的题目绑定到该记录
                  },
                ];

                localStorage.setItem("records", JSON.stringify(newRecords)); // 保存到本地存储
                setRecords(newRecords); // 更新状态
                form.resetFields();

                // 更新掌握度
                const updatedKnowledgePoints = knowledgePoints.map((k) => {
                  if (k.name === selectedKnowledge) {
                    return { ...k, mastery: calculateMastery(k.name) };
                  }
                  return k;
                });

                setKnowledgePoints(updatedKnowledgePoints);
                localStorage.setItem("knowledgePoints", JSON.stringify(updatedKnowledgePoints));
                message.success("记录添加成功！");
                setQuestionModalVisible(false); // 关闭生成题目 Modal
              }}
              layout="vertical"
              style={{ marginTop: 20 }}
            >
              <Form.Item label="得分" name="score" rules={[{ required: true, message: "请输入得分" }]}>
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="备注" name="note">
                <TextArea />
              </Form.Item>
              <Button type="primary" htmlType="submit">
                提交记录
              </Button>
            </Form>
          </>
        )}
      </Modal>

      {/* 添加知识点 */}
      <Modal
        title="添加知识点"
        open={addKnowledgeModalVisible}
        onCancel={() => {
          setAddKnowledgeModalVisible(false);
          resetAddKnowledgeForm();
        }}
        onOk={() => knowledgeForm.submit()}
        okText="提交"
      >
        <Form form={knowledgeForm} onFinish={handleAddKnowledge} layout="vertical">
          <Form.Item label="知识点选择" required>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Select
                placeholder="请选择科目"
                style={{ width: 120 }}
                onChange={(value) => {
                  setSelectedSubject(value);
                  const subject = allSubjects.find((s) => s.value === value);
                  setChapters(subject?.chapters || []);
                  setSelectedChapter(null);
                  setSelectedTopic(null);
                  setTopics([]);
                }}
                value={selectedSubject}
              >
                {allSubjects.map((s) => (
                  <Option key={s.value} value={s.value}>
                    {s.label}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="请选择章节"
                style={{ width: 120 }}
                onChange={(value) => {
                  setSelectedChapter(value);
                  const chapter = chapters.find((c) => c.value === value);
                  setTopics(chapter?.topics || []);
                  setSelectedTopic(null);
                }}
                value={selectedChapter}
                disabled={!selectedSubject}
              >
                {chapters.map((c) => (
                  <Option key={c.value} value={c.value}>
                    {c.label}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="请选择知识点"
                style={{ width: 120 }}
                onChange={(value) => setSelectedTopic(value)}
                value={selectedTopic}
                disabled={!selectedChapter}
              >
                {topics.map((t) => (
                  <Option key={t.value} value={t.value}>
                    {t.label}
                  </Option>
                ))}
              </Select>
            </div>
          </Form.Item>
          <Form.Item name="mastery" label="掌握度（可选）">
            <InputNumber min={0} max={10} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看记录和题目 */}
      <Modal
        title={`「${selectedKnowledge}」的学习记录及题目`}
        open={recordModalVisible}
        onCancel={() => setRecordModalVisible(false)}
        footer={null}
        width={600}
      >
        <h3>学习记录</h3>
        {records.filter((r) => r.knowledge === selectedKnowledge).length === 0 ? (
          <Empty description="暂无记录" />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={records.filter((r) => r.knowledge === selectedKnowledge)}
            renderItem={(r, index) => (
              <List.Item key={index}>
                <strong>日期：</strong>
                {r.date}
                <br />
                <strong>得分：</strong>
                {r.score}
                <br />
                <strong>备注：</strong>
                {r.note || "无"}
                <br />
                <strong>题目：</strong>
                <Button
                  type="link"
                  onClick={() => {
                    setSelectedKnowledge(r.knowledge); // 设置当前知识点
                    setGeneratedQuestion(r.questions); // 设置当前记录的题目
                    setShowFullQuestions(true); // 打开完整题目 Modal
                  }}
                >
                  查看完整题目
                </Button>
              </List.Item>
            )}
          />
        )}
      </Modal>

      {/* 在查看记录中显示完整题目 */}
      {showFullQuestions && (
        <Modal
          title="完整题目"
          open={showFullQuestions}
          onCancel={() => setShowFullQuestions(false)}
          footer={null}
          width={600}
        >
          <List
            dataSource={generatedQuestion || []}
            renderItem={(q, idx) => <List.Item key={idx}>{q}</List.Item>}
          />
        </Modal>
      )}
    </div>
  );
};

export default KnowledgeManager;
