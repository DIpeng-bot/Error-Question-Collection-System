import React, { useState } from 'react';
import { Input, Button, Space, Typography, Divider } from 'antd';
import { CheckOutlined, EditOutlined } from '@ant-design/icons';
import './styles.css';

const { TextArea } = Input;
const { Title } = Typography;

interface TextProofreaderProps {
  originalText: string;
  onConfirm: (text: string) => void;
}

const TextProofreader: React.FC<TextProofreaderProps> = ({
  originalText,
  onConfirm
}) => {
  const [editedText, setEditedText] = useState(originalText);
  const [isEditing, setIsEditing] = useState(true);

  const handleConfirm = () => {
    setIsEditing(false);
    onConfirm(editedText);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <div className="proofreader-container">
      <Title level={4}>文本校对</Title>
      <Divider />
      
      <div className="text-section">
        <div className="text-label">原始文本：</div>
        <div className="original-text">{originalText}</div>
      </div>

      <Divider dashed />

      <div className="text-section">
        <div className="text-label">校对文本：</div>
        {isEditing ? (
          <TextArea
            value={editedText}
            onChange={e => setEditedText(e.target.value)}
            autoSize={{ minRows: 4, maxRows: 8 }}
            className="edited-text"
          />
        ) : (
          <div className="edited-text">{editedText}</div>
        )}
      </div>

      <div className="button-section">
        <Space>
          {isEditing ? (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleConfirm}
            >
              确认
            </Button>
          ) : (
            <Button
              icon={<EditOutlined />}
              onClick={handleEdit}
            >
              继续编辑
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
};

export default TextProofreader; 