import React, { useEffect, useState, useRef } from 'react';
import { Form, Input, Select, InputNumber, Button, Space, Tag, message } from 'antd';
import type { InputRef } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ErrorQuestion } from '../../models/types';
import { useAppSelector } from '../../services/store';
import ImageUpload from '../ImageUpload';
import './styles.css';

const { Option } = Select;

// 预设选项
const SUBJECTS = ['数学', '语文', '英语', '物理', '化学', '生物'];
const QUESTION_TYPES = ['选择题', '填空题', '解答题', '实验题', '作文'];
const ERROR_TYPES = ['概念理解错误', '计算错误', '审题错误', '粗心', '方法错误'];

interface ErrorFormProps {
  onSubmit: (question: Omit<ErrorQuestion, 'id' | 'userId' | 'createTime' | 'reviewStatus' | 'nextReviewTime' | 'reviewCount'>) => void;
  initialValues?: Partial<ErrorQuestion>;
}

// Quill 编辑器配置
const EDITOR_CONFIG = {
  theme: 'snow',
  modules: {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean'],
      ['image', 'formula']
    ]
  },
  formats: [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'align',
    'list', 'bullet',
    'image', 'formula'
  ]
};

// 自定义富文本编辑器组件
const EditorField: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
}> = ({ value, onChange }) => {
  return (
    <div className="editor-container">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={EDITOR_CONFIG.modules}
        formats={EDITOR_CONFIG.formats}
      />
    </div>
  );
};

const ErrorForm: React.FC<ErrorFormProps> = ({ onSubmit, initialValues }) => {
  const [form] = Form.useForm();
  const [tags, setTags] = React.useState<string[]>(initialValues?.tags || []);
  const [inputVisible, setInputVisible] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef<InputRef>(null);
  const user = useAppSelector(state => state.user.currentUser);

  // 设置初始值
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        content: initialValues.content?.text,
        images: initialValues.content?.images || [],
      });
    }
  }, [initialValues, form]);

  const handleSubmit = async (values: any) => {
    try {
      const question: Omit<ErrorQuestion, 'id' | 'userId' | 'createTime' | 'reviewStatus' | 'nextReviewTime' | 'reviewCount'> = {
        ...values,
        tags,
        content: {
          text: values.content,
          images: values.images || [],
        },
        analysis: {
          errorType: values.errorType,
          reason: values.reason,
          explanation: values.explanation,
        },
      };
      await onSubmit(question);
    } catch (error) {
      console.error('保存错题失败:', error);
      message.error('保存失败，请重试');
    }
  };

  const handleClose = (removedTag: string) => {
    const newTags = tags.filter(tag => tag !== removedTag);
    setTags(newTags);
  };

  const showInput = () => {
    setInputVisible(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleInputConfirm = () => {
    if (inputValue && !tags.includes(inputValue)) {
      setTags([...tags, inputValue]);
    }
    setInputVisible(false);
    setInputValue('');
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      style={{ maxWidth: 800 }}
    >
      {/* 基本信息 */}
      <Form.Item name="subject" label="科目" rules={[{ required: true, message: '请选择科目' }]}>
        <Select>
          {SUBJECTS.map(subject => (
            <Option key={subject} value={subject}>{subject}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="chapter" label="章节" rules={[{ required: true, message: '请输入章节' }]}>
        <Input />
      </Form.Item>

      <Form.Item name="questionType" label="题型" rules={[{ required: true, message: '请选择题型' }]}>
        <Select>
          {QUESTION_TYPES.map(type => (
            <Option key={type} value={type}>{type}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="difficulty" label="难度等级" rules={[{ required: true, message: '请选择难度等级' }]}>
        <InputNumber min={1} max={5} />
      </Form.Item>

      <Form.Item name="importance" label="重要程度" rules={[{ required: true, message: '请选择重要程度' }]}>
        <InputNumber min={1} max={3} />
      </Form.Item>

      {/* 题目内容 */}
      <Form.Item
        name="content"
        label="题目内容"
        rules={[{ required: true, message: '请输入题目内容' }]}
        extra="支持富文本编辑，可以添加图片、公式等"
      >
        <EditorField />
      </Form.Item>

      <Form.Item name="images" label="题目图片" extra="支持上传最多5张图片，每张图片不超过2MB">
        <ImageUpload maxCount={5} />
      </Form.Item>

      {/* 答案信息 */}
      <Form.Item
        name="correctAnswer"
        label="正确答案"
        rules={[{ required: true, message: '请输入正确答案' }]}
      >
        <EditorField />
      </Form.Item>

      <Form.Item
        name="wrongAnswer"
        label="错误答案"
        rules={[{ required: true, message: '请输入错误答案' }]}
      >
        <EditorField />
      </Form.Item>

      {/* 错误分析 */}
      <Form.Item name="errorType" label="错误类型" rules={[{ required: true, message: '请选择错误类型' }]}>
        <Select>
          {ERROR_TYPES.map(type => (
            <Option key={type} value={type}>{type}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="reason"
        label="错误原因"
        rules={[{ required: true, message: '请输入错误原因' }]}
      >
        <EditorField />
      </Form.Item>

      <Form.Item
        name="explanation"
        label="正确思路"
        rules={[{ required: true, message: '请输入正确思路' }]}
      >
        <EditorField />
      </Form.Item>

      {/* 知识点标签 */}
      <Form.Item label="知识点标签">
        <Space wrap>
          {tags.map((tag) => (
            <Tag
              key={tag}
              closable
              onClose={() => handleClose(tag)}
            >
              {tag}
            </Tag>
          ))}
          {inputVisible ? (
            <Input
              ref={inputRef}
              type="text"
              size="small"
              style={{ width: 78 }}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onBlur={handleInputConfirm}
              onPressEnter={handleInputConfirm}
            />
          ) : (
            <Tag onClick={showInput} style={{ borderStyle: 'dashed' }}>
              <PlusOutlined /> 新增标签
            </Tag>
          )}
        </Space>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          保存错题
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ErrorForm; 