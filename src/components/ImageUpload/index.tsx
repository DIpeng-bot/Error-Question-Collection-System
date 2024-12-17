import React, { useState, useEffect } from 'react';
import { Upload, Button, message, Modal, Space, Select } from 'antd';
import { UploadOutlined, ScanOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { OCRService } from '../../services/ocr';
import { ImageStorageService } from '../../services/imageStorage';
import TextProofreader from '../TextProofreader';

const { Option } = Select;

// OCR类型选项
const OCR_TYPE_OPTIONS = [
  { label: '通用文字识别', value: 'GENERAL', desc: '适用于各类场景的文字识别' },
  { label: '高精度识别', value: 'ACCURATE', desc: '适用于需要高精度的场景' },
  { label: '手写文字', value: 'HANDWRITING', desc: '适用于手写文字的识别' },
  { label: '试卷分析', value: 'EXAM_PAPER', desc: '适用于试卷的智能分析' },
  { label: '公式识别', value: 'FORMULA', desc: '适用于数学公式的识别' },
  { label: '表格识别', value: 'TABLE', desc: '适用于表格内容的识别' },
  { label: '数字识别', value: 'NUMBER', desc: '适用于纯数字的识别' }
];

interface ImageUploadProps {
  value?: string[];
  onChange?: (fileList: string[]) => void;
  maxCount?: number;
  onOCRComplete?: (text: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value = [],
  onChange,
  maxCount = 5,
  onOCRComplete
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isProofreadingVisible, setIsProofreadingVisible] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedOCRType, setSelectedOCRType] = useState<keyof typeof OCRService.OCR_TYPES>('GENERAL');
  const imageStorage = ImageStorageService.getInstance();

  // 加载已有图片
  useEffect(() => {
    const loadImages = async () => {
      if (!value || value.length === 0) {
        setFileList([]);
        return;
      }

      try {
        console.log('开始加载已有图片:', value);
        const files = await Promise.all(
          value.map(async (id) => {
            try {
              const image = await imageStorage.getImage(id);
              if (!image) {
                console.warn(`图片未找到: ${id}`);
                return null;
              }
              return {
                uid: id,
                name: image.fileName || id,
                status: 'done',
                url: image.data,
              } as UploadFile;
            } catch (error) {
              console.error(`加载图片失败 ${id}:`, error);
              return null;
            }
          })
        );

        // 过滤掉加载失败的图片
        const validFiles = files.filter((file): file is UploadFile => file !== null);
        console.log('成功加载图片数量:', validFiles.length);
        setFileList(validFiles);

        // 如果有图片加载失败，更新表单值
        if (validFiles.length !== value.length) {
          console.warn('部分图片加载失败，更新表单值');
          const validIds = validFiles.map(file => file.uid);
          onChange?.(validIds);
        }
      } catch (error) {
        console.error('加载图片失败:', error);
        message.error('加载图片失败');
      }
    };

    loadImages();
  }, [value, onChange, imageStorage]);

  // 处理文件上传
  const customUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError, onProgress }) => {
    try {
      if (!(file instanceof File)) {
        throw new Error('无效的文件类型');
      }

      // 模拟上传进度
      let percent = 0;
      const interval = setInterval(() => {
        percent += 10;
        onProgress?.({ percent });
        if (percent >= 100) {
          clearInterval(interval);
        }
      }, 100);

      // 保存到本地存储
      const imageId = await imageStorage.saveImage(file);
      clearInterval(interval);
      onProgress?.({ percent: 100 });
      onSuccess?.(imageId);

      // 更新文件列表
      const newFile: UploadFile = {
        uid: imageId,
        name: file.name,
        status: 'done',
        url: URL.createObjectURL(file),
      };
      setFileList(prev => [...prev, newFile]);

      // 更新表单值
      const newValue = [...(value || []), imageId];
      onChange?.(newValue);
    } catch (error) {
      console.error('上传图片失败:', error);
      onError?.(error as Error);
      message.error('上传图片失败');
    }
  };

  // 处理文件删除
  const handleRemove = async (file: UploadFile) => {
    try {
      await imageStorage.deleteImage(file.uid);
      const newValue = (value || []).filter(id => id !== file.uid);
      onChange?.(newValue);
      return true;
    } catch (error) {
      console.error('删除图片失败:', error);
      message.error('删除图片失败');
      return false;
    }
  };

  // OCR 识别图片
  const handleOCR = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      message.error('请先等待图片上传完成');
      return;
    }

    setIsProcessing(true);
    try {
      // 获取图片数据
      const image = await imageStorage.getImage(file.uid);
      if (!image) {
        throw new Error('图片不存在');
      }

      const textArray = await OCRService.recognizeText(image.data, selectedOCRType);
      const processedText = OCRService.preprocessText(textArray);
      setRecognizedText(processedText);
      setIsProofreadingVisible(true);
    } catch (error) {
      console.error('OCR 识别失败:', error);
      message.error('文字识别失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理文本确认
  const handleTextConfirm = (text: string) => {
    setIsProofreadingVisible(false);
    onOCRComplete?.(text);
  };

  return (
    <div className="image-upload-container">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Upload
          listType="picture"
          fileList={fileList}
          customRequest={customUpload}
          onRemove={handleRemove}
          beforeUpload={file => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
              message.error('只能上传图片文件！');
              return false;
            }
            const isLt2M = file.size / 1024 / 1024 < 2;
            if (!isLt2M) {
              message.error('图片大小不能超过 2MB！');
              return false;
            }
            return true;
          }}
          maxCount={maxCount}
        >
          {fileList.length >= maxCount ? null : (
            <Button icon={<UploadOutlined />}>上传图片</Button>
          )}
        </Upload>

        {fileList.length > 0 && onOCRComplete && (
          <Space>
            <Select
              value={selectedOCRType}
              onChange={setSelectedOCRType}
              style={{ width: 200 }}
              placeholder="选择识别类型"
            >
              {OCR_TYPE_OPTIONS.map(option => (
                <Option key={option.value} value={option.value} title={option.desc}>
                  {option.label}
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<ScanOutlined />}
              onClick={() => handleOCR(fileList[fileList.length - 1])}
              loading={isProcessing}
            >
              识别最新图片
            </Button>
          </Space>
        )}
      </Space>

      <Modal
        title="文本校对"
        open={isProofreadingVisible}
        footer={null}
        onCancel={() => setIsProofreadingVisible(false)}
        width={800}
        destroyOnClose
      >
        <TextProofreader
          originalText={recognizedText}
          onConfirm={handleTextConfirm}
        />
      </Modal>
    </div>
  );
};

export default ImageUpload; 