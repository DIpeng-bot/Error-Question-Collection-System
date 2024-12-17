import React, { useEffect, useState } from 'react';
import { Card, message, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import ErrorForm from '../../components/ErrorForm';
import { ErrorQuestion } from '../../models/types';
import { StorageService } from '../../services/storage';

const ErrorInput: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [initialValues, setInitialValues] = useState<ErrorQuestion>();
  const [loading, setLoading] = useState(!!id);
  const storageService = StorageService.getInstance();

  // 加载已有错题数据
  useEffect(() => {
    const loadQuestion = async () => {
      if (id) {
        try {
          const question = await storageService.getErrorQuestion(id);
          if (question) {
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
  }, [id, navigate]);

  const handleSubmit = async (questionData: Omit<ErrorQuestion, 'id' | 'userId' | 'createTime' | 'reviewStatus' | 'nextReviewTime' | 'reviewCount'>) => {
    try {
      const question: ErrorQuestion = id
        ? {
            ...initialValues!,
            ...questionData,
          }
        : {
            ...questionData,
            id: uuidv4(),
            userId: 'default-user', // 临时使用默认用户ID
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