import React, { useState } from 'react';
import { Table, Tag, Space, Input, Select, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { ErrorQuestion } from '../../models/types';

const { Search } = Input;
const { Option } = Select;

interface QuestionListProps {
  questions: ErrorQuestion[];
  onEdit?: (question: ErrorQuestion) => void;
  onDelete?: (questionId: string) => void;
}

const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  onEdit,
  onDelete,
}) => {
  const [searchText, setSearchText] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>();
  const [importanceFilter, setImportanceFilter] = useState<number>();

  // 获取所有科目选项
  const subjects = Array.from(new Set(questions.map(q => q.subject)));

  // 筛选数据
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = searchText
      ? question.content.text.toLowerCase().includes(searchText.toLowerCase()) ||
        question.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()))
      : true;

    const matchesSubject = subjectFilter
      ? question.subject === subjectFilter
      : true;

    const matchesImportance = importanceFilter
      ? question.importance === importanceFilter
      : true;

    return matchesSearch && matchesSubject && matchesImportance;
  });

  const columns: ColumnsType<ErrorQuestion> = [
    {
      title: '科目',
      dataIndex: 'subject',
      key: 'subject',
      width: 100,
    },
    {
      title: '章节',
      dataIndex: 'chapter',
      key: 'chapter',
      width: 150,
    },
    {
      title: '题目内容',
      dataIndex: ['content', 'text'],
      key: 'content',
      ellipsis: true,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (difficulty: number) => {
        const colors = ['#87d068', '#108ee9', '#f50'];
        return (
          <Tag color={colors[Math.min(difficulty - 1, 2)]}>
            {difficulty}星
          </Tag>
        );
      },
    },
    {
      title: '重要程度',
      dataIndex: 'importance',
      key: 'importance',
      width: 100,
      render: (importance: number) => {
        const colors = ['#87d068', '#108ee9', '#f50'];
        return (
          <Tag color={colors[importance - 1]}>
            {importance}级
          </Tag>
        );
      },
    },
    {
      title: '知识点',
      key: 'tags',
      dataIndex: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <Space wrap>
          {tags.map(tag => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '复习状态',
      key: 'reviewStatus',
      dataIndex: 'reviewStatus',
      width: 100,
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: 'orange',
          reviewing: 'blue',
          mastered: 'green',
        };
        const texts: Record<string, string> = {
          pending: '待复习',
          reviewing: '复习中',
          mastered: '已掌握',
        };
        return (
          <Tag color={colors[status]}>
            {texts[status]}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit?.(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete?.(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Search
          placeholder="搜索题目内容或知识点"
          allowClear
          onSearch={value => setSearchText(value)}
          style={{ width: 200 }}
        />
        <Select
          placeholder="选择科目"
          allowClear
          style={{ width: 120 }}
          onChange={value => setSubjectFilter(value)}
        >
          {subjects.map(subject => (
            <Option key={subject} value={subject}>{subject}</Option>
          ))}
        </Select>
        <Select
          placeholder="重要程度"
          allowClear
          style={{ width: 120 }}
          onChange={value => setImportanceFilter(value)}
        >
          <Option value={1}>1级</Option>
          <Option value={2}>2级</Option>
          <Option value={3}>3级</Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredQuestions}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
    </div>
  );
};

export default QuestionList; 