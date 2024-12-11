import React, { useEffect, useState } from 'react';
import { Card, message, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import ErrorForm from '../../components/ErrorForm';
import { ErrorQuestion } from '../../models/types';
import { StorageService } from '../../services/storage';
import { useAppSelector } from '../../services/store';

const ErrorInput: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useAppSelector(state => state.user.currentUser);
  const [initialValues, setInitialValues] = useState<ErrorQuestion>();
  const [loading, setLoading] = useState(!!id);
  const storageService = StorageService.getInstance();

  // 检查用户登录状态
  useEffect(() => {
    if (!user) {
      message.error('请先登录');
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadQuestion = async () => {
      if (id && user) {
        try {
          const question = await storageService.getErrorQuestion(id);
          if (question) {
            if (question.userId !== user.id) {
              message.error('您没有权限编辑此错题');
              navigate('/management');
              return;
            }
            setInitialValues(question);
          } else {
            message.error('错题不存在');
            navigate('/management');
          }
        } catch (error) {
          console.error('加载错题失败:', error);
          message.error('加载错题失败');
          navigate('/management');
        } finally {
          setLoading(false);
        }
      }
    };

    if (id) {
      loadQuestion();
    }
  }, [id, user, navigate]);

  const handleSubmit = async (questionData: Omit<ErrorQuestion, 'id' | 'userId' | 'createTime' | 'reviewStatus' | 'nextReviewTime' | 'reviewCount'>) => {
    try {
      if (!user) {
        message.error('请先登录');
        navigate('/login');
        return;
      }

      const question: ErrorQuestion = id
        ? {
            ...initialValues!,
            ...questionData,
          }
        : {
            ...questionData,
            id: uuidv4(),
            userId: user.id,
            createTime: new Date(),
            reviewStatus: 'pending',
            nextReviewTime: new Date(),
            reviewCount: 0,
          };

      await storageService.saveErrorQuestion(question);
      message.success(id ? '错题更新成功！' : '错题保存成功！');
      navigate('/management');
    } catch (error) {
      console.error(id ? '更新错题失败:' : '保存错题失败:', error);
      message.error(id ? '更新失败，请重试' : '保存失败，请重试');
    }
  };

  // 如果用户未登录，显示加载状态
  if (!user) {
    return (
      <Card title={id ? '编辑错题' : '录入错题'} bordered={false}>
        <Spin tip="检查登录状态..." />
      </Card>
    );
  }

  // 如果正在加载错题，显示加载状态
  if (loading) {
    return (
      <Card title={id ? '编辑错题' : '录入错题'} bordered={false}>
        <Spin tip="加载错题信息..." />
      </Card>
    );
  }

  return (
    <Card title={id ? '编辑错题' : '录入错题'} bordered={false}>
      <ErrorForm
        onSubmit={handleSubmit}
        initialValues={initialValues}
      />
    </Card>
  );
};

export default ErrorInput; 