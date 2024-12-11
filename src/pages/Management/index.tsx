import React, { useEffect, useState } from 'react';
import { Card, message, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import QuestionList from '../../components/QuestionList';
import { ErrorQuestion } from '../../models/types';
import { StorageService } from '../../services/storage';
import { useAppSelector } from '../../services/store';

const Management: React.FC = () => {
  const navigate = useNavigate();
  const user = useAppSelector(state => state.user.currentUser);
  const [questions, setQuestions] = useState<ErrorQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const storageService = StorageService.getInstance();

  // 加载错题列表
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        if (!user) {
          message.error('请先登录');
          navigate('/login');
          return;
        }

        const userQuestions = await storageService.getUserErrorQuestions(user.id);
        setQuestions(userQuestions);
      } catch (error) {
        console.error('加载错题失败:', error);
        message.error('加载错题失败');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [user, navigate]);

  // 处理编辑
  const handleEdit = (question: ErrorQuestion) => {
    // 跳转到编辑页面，将错题ID作为参数传递
    navigate(`/error-input/edit/${question.id}`);
  };

  // 处理删除
  const handleDelete = async (questionId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这道错题吗？删除后无法恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 从本地存储中删除错题
          await storageService.deleteErrorQuestion(questionId);
          
          // 更新状态
          setQuestions(questions.filter(q => q.id !== questionId));
          message.success('删除成功');
        } catch (error) {
          console.error('删除错题失败:', error);
          message.error('删除失败，请重试');
        }
      },
    });
  };

  return (
    <Card
      title="错题管理"
      extra={
        <a onClick={() => navigate('/error-input')}>
          录入新错题
        </a>
      }
      bordered={false}
    >
      <QuestionList
        questions={questions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </Card>
  );
};

export default Management; 