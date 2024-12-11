import React from 'react';
import { Card, Form, Input, Button, Radio, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../models/types';
import { StorageService } from '../../services/storage';
import { useAppDispatch } from '../../services/store';
import { setUser } from '../../services/slices/userSlice';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const storageService = StorageService.getInstance();
  const [form] = Form.useForm();

  const handleSubmit = async (values: { name: string; role: 'student' | 'teacher' }) => {
    try {
      // 创建新用户
      const user: User = {
        id: uuidv4(),
        name: values.name,
        role: values.role,
        subjects: [],
      };

      // 保存用户信息
      await storageService.saveUser(user);
      
      // 更新 Redux 状态
      dispatch(setUser(user));
      
      message.success('登录成功！');
      navigate('/');
    } catch (error) {
      console.error('登录失败:', error);
      message.error('登录失败，请重试');
    }
  };

  return (
    <Card title="用户登录" style={{ maxWidth: 400, margin: '100px auto' }}>
      <Form
        form={form}
        name="login"
        onFinish={handleSubmit}
        layout="vertical"
        initialValues={{ role: 'student' }}
      >
        <Form.Item
          name="name"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input placeholder="请输入用户名" />
        </Form.Item>

        <Form.Item
          name="role"
          label="角色"
          rules={[{ required: true, message: '请选择角色' }]}
        >
          <Radio.Group buttonStyle="solid" style={{ width: '100%' }}>
            <Radio.Button value="student" style={{ width: '50%', textAlign: 'center' }}>
              学生
            </Radio.Button>
            <Radio.Button value="teacher" style={{ width: '50%', textAlign: 'center' }}>
              教师
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            登录
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Login; 