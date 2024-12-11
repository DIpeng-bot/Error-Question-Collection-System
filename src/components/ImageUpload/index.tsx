import React, { useState, useEffect } from 'react';
import { Upload, message, Modal } from 'antd';
import type { UploadProps, UploadFile } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ImageStorageService } from '../../services/imageStorage';

interface ImageUploadProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  maxCount?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value = [],
  onChange,
  maxCount = 5,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const imageStorage = ImageStorageService.getInstance();

  // 加载已有图片
  useEffect(() => {
    const loadImages = async () => {
      if (!value || value.length === 0) {
        setFileList([]);
        return;
      }

      setLoading(true);
      try {
        const files = await Promise.all(
          value.map(async (id) => {
            try {
              const image = await imageStorage.getImage(id);
              if (!image) {
                console.warn(`Image with id ${id} not found`);
                return null;
              }
              return {
                uid: id,
                name: image.fileName || id,
                status: 'done',
                url: image.data,
              } as UploadFile;
            } catch (error) {
              console.error(`Failed to load image ${id}:`, error);
              return null;
            }
          })
        );

        // 过滤掉加载失败的图片
        const validFiles = files.filter((file): file is UploadFile => file !== null);
        setFileList(validFiles);

        // 如果有图片加载失败，更新表单值
        if (validFiles.length !== value.length) {
          const validIds = validFiles.map(file => file.uid);
          onChange?.(validIds);
        }
      } catch (error) {
        console.error('加载图片失败:', error);
        message.error('加载图片失败');
        setFileList([]);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [value, onChange]);

  const handlePreview = async (file: UploadFile) => {
    try {
      if (!file.url && !file.preview) {
        const image = await imageStorage.getImage(file.uid);
        if (image) {
          file.url = image.data;
        } else {
          throw new Error('图片不存在');
        }
      }

      setPreviewImage(file.url || (file.preview as string));
      setPreviewOpen(true);
      setPreviewTitle(file.name || file.uid);
    } catch (error) {
      console.error('加载预览图片失败:', error);
      message.error('加载预览图片失败');
    }
  };

  const handleCancel = () => setPreviewOpen(false);

  const handleUpload: UploadProps['customRequest'] = async ({ file, onProgress, onSuccess, onError }) => {
    try {
      if (!(file instanceof File)) {
        throw new Error('上传的文件无效');
      }

      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        throw new Error('只能上传图片文件');
      }

      // 检查文件大小（限制为2MB）
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('图片大小不能超过2MB');
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

      const imageId = await imageStorage.saveImage(file);
      clearInterval(interval);
      onProgress?.({ percent: 100 });
      onSuccess?.(imageId);

      // 更新表单值
      const newValue = [...(value || []), imageId];
      onChange?.(newValue);

      // 更新文件列表
      const newFile: UploadFile = {
        uid: imageId,
        name: file.name,
        status: 'done',
        url: URL.createObjectURL(file),
      };
      setFileList([...fileList, newFile]);
    } catch (error) {
      console.error('图片上传失败:', error);
      onError?.(error as Error);
      message.error((error as Error).message || '图片上传失败');
    }
  };

  const handleRemove = async (file: UploadFile) => {
    try {
      const imageId = file.uid;
      await imageStorage.deleteImage(imageId);
      
      // 更新表单值
      const newValue = (value || []).filter(id => id !== imageId);
      onChange?.(newValue);

      // 更新文件列表
      setFileList(prev => prev.filter(f => f.uid !== imageId));
      return true;
    } catch (error) {
      console.error('删除图片失败:', error);
      message.error('删除图片失败');
      return false;
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传图片</div>
    </div>
  );

  return (
    <>
      <Upload
        listType="picture-card"
        fileList={fileList}
        onPreview={handlePreview}
        customRequest={handleUpload}
        onRemove={handleRemove}
        maxCount={maxCount}
        accept="image/*"
        disabled={loading}
      >
        {fileList.length >= maxCount ? null : uploadButton}
      </Upload>
      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={handleCancel}
      >
        <img alt="预览图片" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </>
  );
};

export default ImageUpload; 