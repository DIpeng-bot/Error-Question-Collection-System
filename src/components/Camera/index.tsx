import React, { useRef, useEffect, useState } from 'react';
import { Button, message } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import './styles.css';

interface CameraProps {
  onCapture: (imageData: string) => void;
}

const Camera: React.FC<CameraProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 优先使用后置摄像头
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('相机启动失败:', error);
      message.error('无法访问相机，请确保已授予相机权限');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsStreaming(false);
    }
  };

  const captureImage = () => {
    if (!isStreaming || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // 设置canvas尺寸与视频一致
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 绘制当前视频帧
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 获取图片数据
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    onCapture(imageData);
  };

  return (
    <div className="camera-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="camera-preview"
      />
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      <div className="camera-controls">
        <Button
          type="primary"
          icon={<CameraOutlined />}
          onClick={captureImage}
          disabled={!isStreaming}
        >
          拍照
        </Button>
      </div>
    </div>
  );
};

export default Camera; 