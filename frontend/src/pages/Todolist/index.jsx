import React, { useState, useRef, useEffect } from 'react';
import Head from '../Head';
import { Layout, Table, Button, Modal, Form, Input, Select, InputNumber, Space, message, Progress, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import * as XLSX from 'xlsx';
import './index.less';

const { Header, Content } = Layout;
const { Option } = Select;

const StudyPlan = () => {
  const getInitialPlanData = () => {
    try {
      const savedPlan = localStorage.getItem('studyPlanData');
      if (savedPlan) {
        return JSON.parse(savedPlan);
      }
    } catch (error) {
      console.error('读取学习计划数据失败:', error);
    }
    
    return [];
  };

  const [planData, setPlanData] = useState(getInitialPlanData);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState('');
  const [form] = Form.useForm();
  const [planForm] = Form.useForm();
  const [downloading, setDownloading] = useState(false);
  const [percent, setPercent] = useState(0);
  const [generating, setGenerating] = useState(false);
  const timerRef = useRef(null);

  const [userSubjects, setUserSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pomodoroVisible, setPomodoroVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [pomodoroTime, setPomodoroTime] = useState(0); // 当前番茄钟时间（秒）
  const [isRunning, setIsRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState(1); // 当前番茄钟轮次
  const [totalSessions, setTotalSessions] = useState(1); // 总轮次
  const [sessionType, setSessionType] = useState('work'); // work | break
  const pomodoroTimerRef = useRef(null);

  const calculatePomodoroSessions = (estimatedTime) => {
    const workSessionTime = 25; // 标准番茄钟25分钟
    const shortBreakTime = 5;   // 5分钟短休息
    const longBreakTime = 15;   // 15分钟长休息
    const sessions = [];
    let remainingTime = estimatedTime;
    let sessionCount = 0;
    
    while (remainingTime > 0) {
      sessionCount++;
      const currentSessionTime = Math.min(remainingTime, workSessionTime);
      sessions.push({
        sessionNumber: sessionCount,
        workTime: currentSessionTime * 60, 
        isLast: remainingTime <= workSessionTime
      });
      remainingTime -= currentSessionTime;
    }
    
    return {
      sessions: sessions,
      totalSessions: sessions.length,
      shortBreak: shortBreakTime * 60,
      longBreak: longBreakTime * 60
    };
  };

  const savePomodoroProgress = (taskKey, progress) => {
    try {
      const progressKey = `pomodoro_progress_${taskKey}`;
      localStorage.setItem(progressKey, JSON.stringify({
        ...progress,
        savedAt: Date.now()
      }));
      console.log('番茄钟进度已保存');
    } catch (error) {
      console.error('保存番茄钟进度失败:', error);
    }
  };

  const loadPomodoroProgress = (taskKey) => {
    try {
      const progressKey = `pomodoro_progress_${taskKey}`;
      const saved = localStorage.getItem(progressKey);
      if (saved) {
        const progress = JSON.parse(saved);
        
        // 检查是否真正开始过
        if (!progress.hasStarted) {
          return null;
        }
        
        // 检查保存时间，如果超过24小时则清除
        const now = Date.now();
        const savedAt = progress.savedAt || 0;
        if (now - savedAt > 24 * 60 * 60 * 1000) {
          localStorage.removeItem(progressKey);
          return null;
        }
        return progress;
      }
    } catch (error) {
      console.error('读取番茄钟进度失败:', error);
    }
    return null;
  };

  // 清除番茄钟进度
  const clearPomodoroProgress = (taskKey) => {
    try {
      const progressKey = `pomodoro_progress_${taskKey}`;
      localStorage.removeItem(progressKey);
      console.log('番茄钟进度已清除');
    } catch (error) {
      console.error('清除番茄钟进度失败:', error);
    }
  };

  // 开始执行任务
  const handleStartTask = (record) => {
    const pomodoroConfig = calculatePomodoroSessions(record.estimatedTime);
    
    // 检查是否有保存的进度
    const savedProgress = loadPomodoroProgress(record.key);
    
    if (savedProgress && !record.completed) {
      // 显示恢复进度的确认对话框
      Modal.confirm({
        title: '发现未完成的番茄钟',
        content: (
          <div>
            <p>检测到该任务有未完成的番茄钟进度：</p>
            <p>• 当前轮次: {savedProgress.currentSession}/{savedProgress.totalSessions}</p>
            <p>• 当前阶段: {savedProgress.sessionType === 'work' ? '工作时间' : '休息时间'}</p>
            <p>• 剩余时间: {Math.floor(savedProgress.pomodoroTime / 60)}分{savedProgress.pomodoroTime % 60}秒</p>
            <br />
            <p>是否继续上次的进度？</p>
          </div>
        ),
        okText: '继续上次进度',
        cancelText: '重新开始',
        onOk: () => {
          // 继续上次进度
          setCurrentTask({
            ...record,
            pomodoroConfig: savedProgress.pomodoroConfig
          });
          setTotalSessions(savedProgress.totalSessions);
          setCurrentSession(savedProgress.currentSession);
          setSessionType(savedProgress.sessionType);
          setPomodoroTime(savedProgress.pomodoroTime);
          setIsRunning(false);
          setPomodoroVisible(true);
        },
        onCancel: () => {
          // 重新开始，清除旧进度
          clearPomodoroProgress(record.key);
          startNewPomodoro(record, pomodoroConfig);
        }
      });
    } else {
      // 没有保存的进度或任务已完成，直接开始新的番茄钟
      startNewPomodoro(record, pomodoroConfig);
    }
  };

  // 开始新的番茄钟
  const startNewPomodoro = (record, pomodoroConfig) => {
    setCurrentTask({
      ...record,
      pomodoroConfig: pomodoroConfig
    });
    setTotalSessions(pomodoroConfig.totalSessions);
    setCurrentSession(1);
    setSessionType('work');
    
    // 设置第一个工作时间段的时间
    const firstSession = pomodoroConfig.sessions[0];
    setPomodoroTime(firstSession.workTime);
    
    setIsRunning(false);
    setPomodoroVisible(true);
  };

  // 开始/暂停番茄钟
  const togglePomodoro = () => {
    if (isRunning) {
      // 暂停
      clearInterval(pomodoroTimerRef.current);
      setIsRunning(false);
      
      // 暂停时保存进度
      if (currentTask && currentTask.pomodoroConfig) {
        const progress = {
          currentSession,
          totalSessions,
          sessionType,
          pomodoroTime,
          pomodoroConfig: currentTask.pomodoroConfig,
          hasStarted: true
        };
        savePomodoroProgress(currentTask.key, progress);
      }
    } else {
      // 开始
      setIsRunning(true);
      
      // 第一次开始时保存进度
      if (currentTask && currentTask.pomodoroConfig) {
        const progress = {
          currentSession,
          totalSessions,
          sessionType,
          pomodoroTime,
          pomodoroConfig: currentTask.pomodoroConfig,
          hasStarted: true
        };
        savePomodoroProgress(currentTask.key, progress);
      }
      
      pomodoroTimerRef.current = setInterval(() => {
        setPomodoroTime(prevTime => {
          if (prevTime <= 1) {
            // 时间结束，切换到下一个阶段
            clearInterval(pomodoroTimerRef.current);
            setIsRunning(false);
            handleSessionComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
  };

  // 处理番茄钟轮次完成
  const handleSessionComplete = () => {
    if (!currentTask || !currentTask.pomodoroConfig) return;
    
    const pomodoroConfig = currentTask.pomodoroConfig;
    
    if (sessionType === 'work') {
      // 工作时间结束
      if (currentSession === totalSessions) {
        // 所有工作轮次完成
        message.success('🎉 恭喜！任务完成！');
        handleTaskComplete();
        return;
      }
      
      // 开始休息
      const isLongBreak = currentSession % 4 === 0;
      const breakTime = isLongBreak ? pomodoroConfig.longBreak : pomodoroConfig.shortBreak;
      
      setSessionType('break');
      setPomodoroTime(breakTime);
      
      // 保存进度
      const progress = {
        currentSession,
        totalSessions,
        sessionType: 'break',
        pomodoroTime: breakTime,
        pomodoroConfig: currentTask.pomodoroConfig,
        hasStarted: true
      };
      savePomodoroProgress(currentTask.key, progress);
      
      const currentSessionInfo = pomodoroConfig.sessions[currentSession - 1];
      const currentMinutes = Math.round(currentSessionInfo.workTime / 60);
      
      message.info(`🎯 工作轮次 ${currentSession} (${currentMinutes}分钟) 完成！开始${isLongBreak ? '长' : '短'}休息`);
    } else {
      // 休息时间结束，开始下一个工作轮次
      setSessionType('work');
      setCurrentSession(prev => prev + 1);
      
      // 获取下一个工作时间段的具体时间
      const nextSessionInfo = pomodoroConfig.sessions[currentSession]; // currentSession还没+1，所以这里是下一个
      setPomodoroTime(nextSessionInfo.workTime);
      
      // 保存进度
      const progress = {
        currentSession: currentSession + 1,
        totalSessions,
        sessionType: 'work',
        pomodoroTime: nextSessionInfo.workTime,
        pomodoroConfig: currentTask.pomodoroConfig,
        hasStarted: true
      };
      savePomodoroProgress(currentTask.key, progress);
      
      const nextMinutes = Math.round(nextSessionInfo.workTime / 60);
      message.info(`⏰ 休息结束！开始工作轮次 ${currentSession + 1} (${nextMinutes}分钟)`);
    }
  };

  // 任务完成
  const handleTaskComplete = () => {
    // 标记任务为已完成
    const newPlanData = planData.map(item => 
      item.key === currentTask.key ? { ...item, completed: true } : item
    );
    setPlanData(newPlanData);
    
    // 清除保存的进度
    clearPomodoroProgress(currentTask.key);
    
    // 关闭番茄钟窗口
    setPomodoroVisible(false);
    setCurrentTask(null);
    clearInterval(pomodoroTimerRef.current);
  };

  // 跳过当前轮次
  const skipCurrentSession = () => {
    clearInterval(pomodoroTimerRef.current);
    setIsRunning(false);
    handleSessionComplete();
  };

  // 格式化时间显示
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 修正获取当前阶段描述函数
  const getSessionDescription = () => {
    if (sessionType === 'work') {
      if (currentTask && currentTask.pomodoroConfig) {
        const currentSessionInfo = currentTask.pomodoroConfig.sessions[currentSession - 1];
        const minutes = Math.round(currentSessionInfo.workTime / 60);
        return `工作轮次 ${currentSession}/${totalSessions} (${minutes}分钟)`;
      }
      return `工作轮次 ${currentSession}/${totalSessions}`;
    } else {
      const isLongBreak = currentSession % 4 === 0;
      return `${isLongBreak ? '长' : '短'}休息时间`;
    }
  };

  // 修正进度条计算
  const getProgressPercent = () => {
    if (!currentTask || !currentTask.pomodoroConfig) return 0;
    
    const pomodoroConfig = currentTask.pomodoroConfig;
    
    if (sessionType === 'work') {
      const currentSessionInfo = pomodoroConfig.sessions[currentSession - 1];
      const totalTime = currentSessionInfo.workTime;
      const elapsedTime = totalTime - pomodoroTime;
      return Math.round((elapsedTime / totalTime) * 100);
    } else {
      const isLongBreak = currentSession % 4 === 0;
      const totalBreakTime = isLongBreak ? pomodoroConfig.longBreak : pomodoroConfig.shortBreak;
      const elapsedTime = totalBreakTime - pomodoroTime;
      return Math.round((elapsedTime / totalBreakTime) * 100);
    }
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (pomodoroTimerRef.current) {
        clearInterval(pomodoroTimerRef.current);
      }
    };
  }, []);

  // 获取用户科目信息
  const hasInitialized = useRef(false);
  const fetchUserSubjects = async () => {
    if (hasInitialized.current) return;
    
    try {
      setLoading(true);
      hasInitialized.current = true;
      
      const username = localStorage.getItem('username');
      
      if (!username) {
        message.error('用户未登录');
        setDefaultSubjects();
        return;
      }

      console.log('获取用户科目 - 用户名:', username);

      const response = await fetch(`/api/user/info?username=${username}`);
      const result = await response.json();
      console.log('获取用户科目信息:', result);

      const userData = result;
      
      if (!userData || !userData.username) {
        throw new Error('获取用户信息失败');
      }

      // 解析用户选择的科目
      let userChosenSubjects = [];
      if (userData.subject_chosen) {
        try {
          userChosenSubjects = typeof userData.subject_chosen === 'string' 
            ? JSON.parse(userData.subject_chosen) 
            : userData.subject_chosen;
        } catch (error) {
          console.error('解析用户科目失败:', error);
          userChosenSubjects = [];
        }
      }

      // 构建科目选项：语数外 + 用户选择的科目
      const baseSubjects = [
        { label: '语文', value: '语文' },
        { label: '数学', value: '数学' },
        { label: '英语', value: '英语' }
      ];

      const subjectMap = {
        'physics': { label: '物理', value: '物理' },
        'chemistry': { label: '化学', value: '化学' },
        'biology': { label: '生物', value: '生物' },
        'history': { label: '历史', value: '历史' },
        'geography': { label: '地理', value: '地理' },
        'politics': { label: '政治', value: '政治' }
      };

      const additionalSubjects = userChosenSubjects
        .map(subject => subjectMap[subject])
        .filter(Boolean);

      const allSubjects = [...baseSubjects, ...additionalSubjects];
      
      setUserSubjects(allSubjects);
      
      // 尝试恢复之前保存的表单科目选择
      const savedFormSubjects = getSavedFormSubjects();
      
      if (savedFormSubjects && savedFormSubjects.length > 0) {
        // 验证保存的科目是否仍然有效
        const validSavedSubjects = savedFormSubjects.filter(subject => 
          allSubjects.some(s => s.value === subject)
        );
        
        if (validSavedSubjects.length > 0) {
          console.log('恢复保存的表单科目选择:', validSavedSubjects);
          planForm.setFieldsValue({
            subjects: validSavedSubjects
          });
        } else {
          // 如果保存的科目都无效，使用默认选择
          planForm.setFieldsValue({
            subjects: allSubjects.slice(0, 3).map(s => s.value)
          });
          saveFormSubjects(allSubjects.slice(0, 3).map(s => s.value));
        }
      } else {
        // 没有保存的选择，使用默认选择
        const defaultSelection = allSubjects.slice(0, 3).map(s => s.value);
        planForm.setFieldsValue({
          subjects: defaultSelection
        });
        saveFormSubjects(defaultSelection);
      }

    } catch (error) {
      console.error('获取用户科目失败:', error);
      message.error(`获取用户科目失败: ${error.message}`);
      setDefaultSubjects();
    } finally {
      setLoading(false);
    }
  };

  // 保存表单科目选择到本地存储
  const saveFormSubjects = (subjects) => {
    try {
      const formData = {
        subjects: subjects,
        timestamp: Date.now(),
        username: localStorage.getItem('username')
      };
      localStorage.setItem('planFormSubjects', JSON.stringify(formData));
      console.log('表单科目选择已保存');
    } catch (error) {
      console.error('保存表单科目选择失败:', error);
    }
  };

  // 获取保存的表单科目选择
  const getSavedFormSubjects = () => {
    try {
      const saved = localStorage.getItem('planFormSubjects');
      if (saved) {
        const formData = JSON.parse(saved);
        const currentUsername = localStorage.getItem('username');
        
        // 检查是否是同一用户
        if (formData.username !== currentUsername) {
          localStorage.removeItem('planFormSubjects');
          return null;
        }
        
        // 检查是否在24小时内
        const now = Date.now();
        if (now - formData.timestamp < 24 * 60 * 60 * 1000) {
          return formData.subjects;
        }
        localStorage.removeItem('planFormSubjects');
      }
    } catch (error) {
      console.error('读取表单科目选择失败:', error);
      localStorage.removeItem('planFormSubjects');
    }
    return null;
  };

  // 监听表单科目变化
  const handleSubjectsChange = (subjects) => {
    console.log('科目选择变化:', subjects);
    saveFormSubjects(subjects);
  };

  // 修改默认科目设置函数
  const setDefaultSubjects = () => {
    const defaultSubjects = [
      { label: '语文', value: '语文' },
      { label: '数学', value: '数学' },
      { label: '英语', value: '英语' }
    ];
    setUserSubjects(defaultSubjects);
    
    // 尝试恢复之前保存的表单科目选择
    const savedFormSubjects = getSavedFormSubjects();
    
    if (savedFormSubjects && savedFormSubjects.length > 0) {
      // 验证保存的科目是否仍然有效（在默认科目中）
      const validSavedSubjects = savedFormSubjects.filter(subject => 
        defaultSubjects.some(s => s.value === subject)
      );
      
      if (validSavedSubjects.length > 0) {
        planForm.setFieldsValue({
          subjects: validSavedSubjects
        });
      } else {
        const defaultSelection = defaultSubjects.map(s => s.value);
        planForm.setFieldsValue({
          subjects: defaultSelection
        });
        saveFormSubjects(defaultSelection);
      }
    } else {
      const defaultSelection = defaultSubjects.map(s => s.value);
      planForm.setFieldsValue({
        subjects: defaultSelection
      });
      saveFormSubjects(defaultSelection);
    }
  };

  useEffect(() => {
    fetchUserSubjects();
  }, []);

  // 保存学习计划到localStorage
  const savePlanToStorage = (planDataToSave) => {
    try {
      localStorage.setItem('studyPlanData', JSON.stringify(planDataToSave));
      console.log('学习计划已保存到本地存储');
    } catch (error) {
      console.error('保存学习计划失败:', error);
      message.error('保存学习计划失败');
    }
  };

  useEffect(() => {
    if (planData.length > 0) {
      savePlanToStorage(planData);
    }
  }, [planData]);

  // 清空学习计划
  const handleClearPlan = () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空所有学习计划吗？此操作不可撤销。',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setPlanData([]);
        localStorage.removeItem('studyPlanData');
        message.success('学习计划已清空');
      },
    });
  };

  const handleExportPlan = () => {
    try {
      if (planData.length === 0) {
        message.warning('暂无任务数据可导出');
        return;
      }

      // 准备导出数据，将数据转换为表格格式
      const exportData = planData.map((item, index) => ({
        '序号': index + 1,
        '任务状态': item.completed ? '已完成' : '未完成',
        '学习内容': item.content,
        '预计时间(分钟)': item.estimatedTime,
        '难度系数': item.difficulty,
        '习题文件': item.exercises,
        '得分': item.score || '-',
        '创建时间': moment().format('YYYY-MM-DD HH:mm:ss') // 可以根据需要修改
      }));

      // 添加统计信息
      const completedCount = planData.filter(item => item.completed).length;
      const totalTime = planData.reduce((sum, item) => sum + (item.estimatedTime || 0), 0);
      const avgDifficulty = (planData.reduce((sum, item) => sum + (item.difficulty || 0), 0) / planData.length).toFixed(1);

      // 在数据末尾添加统计行
      exportData.push({
        '序号': '',
        '任务状态': '统计信息',
        '学习内容': `总任务数: ${planData.length}`,
        '预计时间(分钟)': `总时长: ${totalTime}分钟`,
        '难度系数': `平均难度: ${avgDifficulty}`,
        '习题文件': `已完成: ${completedCount}个`,
        '得分': `完成率: ${((completedCount/planData.length)*100).toFixed(1)}%`,
        '创建时间': ''
      });

      // 创建工作簿
      const wb = XLSX.utils.book_new();
      
      // 创建工作表
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // 设置列宽
      const colWidths = [
        { wch: 8 },  // 序号
        { wch: 12 }, // 任务状态
        { wch: 35 }, // 学习内容
        { wch: 15 }, // 预计时间
        { wch: 12 }, // 难度系数
        { wch: 25 }, // 习题文件
        { wch: 15 }, // 得分
        { wch: 20 }  // 创建时间
      ];
      ws['!cols'] = colWidths;

      // 设置表头样式（可选）
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[address]) continue;
        ws[address].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "CCCCCC" } }
        };
      }

      // 将工作表添加到工作簿
      XLSX.utils.book_append_sheet(wb, ws, '学习任务清单');
      
      // 生成文件名
      const fileName = `学习任务清单_${moment().format('YYYY-MM-DD')}.xlsx`;
      
      // 写入并下载文件
      XLSX.writeFile(wb, fileName);
      
      message.success('学习任务清单导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败，请重试');
    }
  };


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

  // 生成学习任务
  const handleGeneratePlan = async () => {
    try {
      const values = await planForm.validateFields();
      setGenerating(true);
      
      await new Promise(resolve => setTimeout(resolve, 2000));

      const generatedTasks = generateMockTasks(values);
      
      setPlanData(generatedTasks);
      
      message.success('学习任务生成成功并已保存！');
      
    } catch (error) {
      console.error('生成学习任务失败:', error);
      message.error('生成学习任务失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  // 生成模拟任务
  const generateMockTasks = (formValues) => {
    const subjects = formValues.subjects || userSubjects.slice(0, 3).map(s => s.value);
    
    const tasks = [];
    let keyCounter = 1;

    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i % subjects.length];
      const topics = getSubjectTopics(subject);
      const topic = topics[Math.floor(Math.random() * topics.length)];
      
      // 根据科目和难度设置固定的预计时间，最多40分钟，且能被5整除
      const difficulty = Math.floor(Math.random() * 5) + 5;
      let estimatedTime;
      
      // 根据科目类型设置不同的基础时间
      switch(subject) {
        case '数学':
        case '物理':
        case '化学':
          estimatedTime = Math.min(30 + (difficulty - 5) * 2, 40); // 30-40分钟
          break;
        case '语文':
        case '英语':
          estimatedTime = Math.min(25 + (difficulty - 5) * 3, 40); // 25-40分钟
          break;
        case '生物':
        case '历史':
        case '地理':
        case '政治':
          estimatedTime = Math.min(20 + (difficulty - 5) * 4, 40); // 20-40分钟
          break;
        default:
          estimatedTime = 30; // 默认30分钟
      }
      
      estimatedTime = Math.round(estimatedTime / 5) * 5;
      estimatedTime = Math.max(15, Math.min(estimatedTime, 40));
      
      tasks.push({
        key: keyCounter++,
        content: `${subject} - ${topic}`,
        estimatedTime: estimatedTime,
        difficulty: difficulty,
        exercises: `${subject.toLowerCase()}_exercises.pdf`,
        score: '',
        completed: false
      });
    }

    return tasks;
  };

  // 获取科目相关话题
  const getSubjectTopics = (subject) => {
    const topicsMap = {
      '语文': ['现代文阅读', '古诗词鉴赏', '文言文阅读', '作文写作', '语言基础'],
      '数学': ['函数与导数', '三角函数', '数列', '立体几何', '解析几何'],
      '英语': ['阅读理解', '完形填空', '语法填空', '写作', '听力'],
      '物理': ['力学', '电磁学', '热学', '光学', '原子物理'],
      '化学': ['化学平衡', '有机化学', '无机化学', '电化学', '化学实验'],
      '生物': ['细胞生物学', '遗传学', '生态学', '生物化学', '分子生物学'],
      '历史': ['中国古代史', '中国近现代史', '世界史', '史学方法', '历史评述'],
      '地理': ['自然地理', '人文地理', '区域地理', '地理信息系统', '环境地理'],
      '政治': ['马克思主义', '毛泽东思想', '中国特色社会主义', '政治经济学', '哲学原理']
    };
    return topicsMap[subject] || ['基础学习', '综合练习', '专题复习'];
  };

  const toggleTaskCompletion = (key) => {
    const newPlanData = planData.map(item => 
      item.key === key ? { ...item, completed: !item.completed } : item
    );
    setPlanData(newPlanData);
    message.success('任务状态已更新');//...........................................
  };

  // 修改表格列定义
  const columns = [
    {
      title: '状态',
      key: 'completed',
      width: 80,
      render: (_, record) => (
        <Button
          type={record.completed ? 'primary' : 'default'}
          size="small"
          onClick={() => toggleTaskCompletion(record.key)}
        >
          {record.completed ? '✓' : '○'}
        </Button>
      ),
    },
    {
      title: '学习内容',
      dataIndex: 'content',
      key: 'content',
      render: (text, record) => {
        const savedProgress = loadPomodoroProgress(record.key);
        const hasProgress = savedProgress && !record.completed;
        
        return (
          <div>
            <span style={{ 
              textDecoration: record.completed ? 'line-through' : 'none',
              color: record.completed ? '#999' : '#000'
            }}>
              {text}
            </span>
            {hasProgress && (
              <div style={{ fontSize: '12px', color: '#1890ff', marginTop: '2px' }}>
                📍 有未完成进度 ({savedProgress.currentSession}/{savedProgress.totalSessions})
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '预计时间(分钟)',
      dataIndex: 'estimatedTime',
      key: 'estimatedTime',
      width: 130,
      render: (text, record) => (
        <span style={{ color: record.completed ? '#999' : '#000' }}>
          {text}
        </span>
      ),
    },
    {
      title: '番茄钟',
      key: 'pomodoro',
      width: 100,
      render: (_, record) => {
        const sessions = Math.ceil(record.estimatedTime / 25);
        return (
          <span style={{ color: record.completed ? '#999' : '#666', fontSize: '12px' }}>
            {sessions} 个
          </span>
        );
      },
    },
    {
      title: '开始执行',
      key: 'startTask',
      width: 100,
      render: (_, record) => {
        const savedProgress = loadPomodoroProgress(record.key);
        const hasProgress = savedProgress && !record.completed;
        
        return (
          <Button 
            type="primary"
            size="small"
            disabled={record.completed}
            onClick={() => handleStartTask(record)}
            style={{ 
              backgroundColor: record.completed ? '#d9d9d9' : 
                              hasProgress ? '#1890ff' : '#ff6b6b',
              borderColor: record.completed ? '#d9d9d9' : 
                          hasProgress ? '#1890ff' : '#ff6b6b'
            }}
          >
            {record.completed ? '已完成' : 
             hasProgress ? '🔄 继续' : '🍅 开始'}
          </Button>
        );
      },
    },
    {
      title: '难度系数',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      render: (text, record) => (
        <span style={{ color: record.completed ? '#999' : '#000' }}>
          {text}
        </span>
      ),
    },
    {
      title: '习题',
      dataIndex: 'exercises',
      key: 'exercises',
      width: 100,
      render: (text, record) => (
        <Button 
          type="link" 
          onClick={() => {
            const subject = record.content.split(' - ')[0];
            generateAndDownloadExam(subject, record.difficulty || 5);
          }}
          disabled={record.completed}
        >
          下载
        </Button>
      ),
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (text, record) => (
        <span style={{ color: record.completed ? '#999' : '#000' }}>
          {text || '-'}
        </span>
      ),
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


  useEffect(() => {
    const username = localStorage.getItem('username');
    
    if (username) {
      fetch('/api/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
    }
  }, []);

  const handleAdd = () => {
    form.resetFields();
    setEditingKey('');
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    form.setFieldsValue({
      content: record.content,
      estimatedTime: record.estimatedTime,
      difficulty: record.difficulty,
      exercises: record.exercises,
      score: record.score
    });
    setEditingKey(record.key);
    setIsModalVisible(true);
  };

  const handleDelete = (key) => {
    const newPlanData = planData.filter(item => item.key !== key);
    setPlanData(newPlanData);
    message.success('删除成功');
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      const newData = {
        key: editingKey || Date.now().toString(),
        content: values.content,
        estimatedTime: values.estimatedTime,
        difficulty: values.difficulty,
        exercises: values.exercises,
        score: values.score || '',
        completed: false
      };

      let newPlanData;
      if (editingKey) {
        newPlanData = planData.map(item => item.key === editingKey ? { ...item, ...newData } : item);
      } else {
        newPlanData = [...planData, newData];
      }
      
      setPlanData(newPlanData);
      setIsModalVisible(false);
      message.success(editingKey ? '更新成功' : '添加成功');
    } catch (error) {
      console.error('Validate Failed:', error);
    }
  };

  // 修改番茄钟状态变化时保存进度的逻辑
  useEffect(() => {
    // 只有在番茄钟真正开始运行过，并且当前有任务在进行时才保存
    if (currentTask && pomodoroVisible && currentTask.pomodoroConfig && isRunning) {
      const progress = {
        currentSession,
        totalSessions,
        sessionType,
        pomodoroTime,
        pomodoroConfig: currentTask.pomodoroConfig,
        hasStarted: true // 标记已经开始过
      };
      savePomodoroProgress(currentTask.key, progress);
    }
  }, [currentSession, totalSessions, sessionType, pomodoroTime, currentTask, isRunning]);

  // 修改退出按钮的处理
  const handleExitPomodoro = () => {
    // 检查是否有真正开始过的进度需要保存
    const hasRealProgress = isRunning || 
      (currentTask && loadPomodoroProgress(currentTask.key)?.hasStarted);
    
    if (hasRealProgress) {
      Modal.confirm({
        title: '确认退出番茄钟？',
        content: (
          <div>
            <p>当前进度将会保存，下次可以继续。</p>
            <p>• 当前轮次: {currentSession}/{totalSessions}</p>
            <p>• 当前阶段: {sessionType === 'work' ? '工作时间' : '休息时间'}</p>
            <p>• 剩余时间: {Math.floor(pomodoroTime / 60)}分{pomodoroTime % 60}秒</p>
          </div>
        ),
        okText: '退出并保存',
        cancelText: '取消',
        onOk: () => {
          // 保存当前进度
          if (currentTask) {
            const progress = {
              currentSession,
              totalSessions,
              sessionType,
              pomodoroTime,
              pomodoroConfig: currentTask.pomodoroConfig,
              hasStarted: true
            };
            savePomodoroProgress(currentTask.key, progress);
          }
          
          // 关闭番茄钟
          setPomodoroVisible(false);
          setCurrentTask(null);
          setIsRunning(false);
          clearInterval(pomodoroTimerRef.current);
          
          message.success('进度已保存，下次可继续！');
        }
      });
    } else {
      // 没有真正开始过，直接退出，不保存
      setPomodoroVisible(false);
      setCurrentTask(null);
      setIsRunning(false);
      clearInterval(pomodoroTimerRef.current);
    }
  };

  return (
    <>
      <Layout className="study-plan-layout">
        <Head />

        <Content className="content">
          <Card title="学习任务生成" className="plan-generator-card" style={{ marginBottom: 24 }}>
            <Form
              form={planForm}
              layout="inline"
              initialValues={{
                subjects: userSubjects.slice(0, 3).map(s => s.value),
                taskCount: 5,
                defaultTime: 90
              }}
            >
              <Form.Item
                name="subjects"
                label="学习科目"
                rules={[{ required: true, message: '请选择科目' }]}
              >
                <Select
                  mode="multiple"
                  placeholder={loading ? "加载科目中..." : "选择要学习的科目"}
                  style={{ minWidth: 200 }}
                  loading={loading}
                  showSearch={false} 
                  options={userSubjects}
                  disabled={loading}
                  onChange={handleSubjectsChange}
                  value={planForm.getFieldValue('subjects')}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  icon={<CalendarOutlined />}
                  onClick={handleGeneratePlan}
                  loading={generating}
                  disabled={loading || userSubjects.length === 0}
                >
                  {generating ? '生成中...' : '生成学习任务'}
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <div className="plan-header">
            <h2>学习任务清单</h2>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加任务
              </Button>
              <Button onClick={handleExportPlan}>
                导出清单
              </Button>
              <Button danger onClick={handleClearPlan}>
                清空清单
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
            title={editingKey ? "编辑任务" : "添加任务"}
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
                name="content"
                label="学习内容"
                rules={[{ required: true, message: '请输入学习内容' }]}
              >
                <Input placeholder="例如：数学 - 函数与导数" />
              </Form.Item>

              <Form.Item
                name="estimatedTime"
                label="预计时间(分钟)"
                rules={[{ required: true, message: '请输入预计时间' }]}
              >
                <InputNumber min={10} max={300} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="difficulty"
                label="难度系数"
                rules={[{ required: true, message: '请输入难度系数' }]}
              >
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="exercises"
                label="习题文件名"
                rules={[{ required: true, message: '请输入习题文件名' }]}
              >
                <Input placeholder="例如：math_exercises.pdf" />
              </Form.Item>

              <Form.Item
                name="score"
                label="得分"
              >
                <Input placeholder="格式：得分/满分" />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title="正在生成试卷，请稍候..."
            visible={downloading}
            footer={null}
            closable={false}
          >
            <Progress percent={Math.floor(percent)} status={percent < 100 ? 'active' : 'success'} />
          </Modal>

          <Modal
            title={
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  🍅 番茄钟专注模式
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                  {currentTask?.content}
                </div>
              </div>
            }
            open={pomodoroVisible}
            footer={null}
            closable={false}
            width={480}
            centered
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              {/* 当前阶段显示 */}
              <div style={{ 
                fontSize: '16px', 
                color: sessionType === 'work' ? '#ff6b6b' : '#4ecdc4',
                marginBottom: '20px',
                fontWeight: 'bold'
              }}>
                {getSessionDescription()}
              </div>

              {/* 时间显示 */}
              <div style={{ 
                fontSize: '72px', 
                fontWeight: 'bold',
                color: sessionType === 'work' ? '#ff6b6b' : '#4ecdc4',
                fontFamily: 'monospace',
                marginBottom: '30px'
              }}>
                {formatTime(pomodoroTime)}
              </div>

              {/* 进度条 */}
              <div style={{ marginBottom: '30px' }}>
                <Progress 
                  percent={Math.round(getProgressPercent())}
                  strokeColor={sessionType === 'work' ? '#ff6b6b' : '#4ecdc4'}
                  showInfo={false}
                />
              </div>

              {/* 轮次进度 */}
              <div style={{ 
                fontSize: '14px', 
                color: '#666',
                marginBottom: '30px'
              }}>
                {sessionType === 'work' && (
                  <>
                    {'🍅'.repeat(currentSession - 1)}
                    <span style={{ color: '#ff6b6b' }}>🍅</span>
                    {'⭕'.repeat(totalSessions - currentSession)}
                  </>
                )}
              </div>

              {/* 控制按钮 */}
              <Space size="large">
                <Button 
                  type="primary" 
                  size="large"
                  onClick={togglePomodoro}
                  style={{ 
                    backgroundColor: isRunning ? '#faad14' : '#01aeffff',
                    borderColor: isRunning ? '#faad14' : '#01aeffff',
                    minWidth: '100px'
                  }}
                >
                  {isRunning ? '⏸️ 暂停' : '▶️ 开始'}
                </Button>
                
                <Button 
                  size="large"
                  onClick={skipCurrentSession}
                  style={{ minWidth: '100px' }}
                >
                  ⏭️ 跳过
                </Button>
                
                <Button 
                  danger
                  size="large"
                  onClick={handleExitPomodoro}
                  style={{ minWidth: '100px' }}
                >
                  💾 退出
                </Button>
              </Space>

            </div>
          </Modal>
        </Content>
      </Layout>
    </>
  );
};

export default StudyPlan;