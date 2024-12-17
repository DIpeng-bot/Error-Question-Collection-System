import { openDB } from 'idb';

interface StoredImage {
  id: string;
  fileName: string;
  data: string;
  timestamp: number;
}

const DB_NAME = 'error-question-system-images';
const STORE_NAME = 'images';
const DB_VERSION = 1;

export class ImageStorageService {
  private static instance: ImageStorageService;
  private db: Promise<any>;

  private constructor() {
    this.db = this.initDB();
  }

  private async initDB() {
    console.log('初始化图片存储数据库...');
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          console.log('创建图片存储表...');
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }

  public static getInstance(): ImageStorageService {
    if (!ImageStorageService.instance) {
      ImageStorageService.instance = new ImageStorageService();
    }
    return ImageStorageService.instance;
  }

  public async saveImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log('开始读取图片文件:', {
        name: file.name,
        type: file.type,
        size: Math.round(file.size / 1024) + 'KB'
      });

      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          console.log('生成图片ID:', imageId);

          const db = await this.db;
          await db.put(STORE_NAME, {
            id: imageId,
            fileName: file.name,
            data: reader.result as string,
            timestamp: Date.now()
          });

          console.log('图片保存完成');
          resolve(imageId);
        } catch (error) {
          console.error('保存图片过程中出错:', error);
          reject(error);
        }
      };

      reader.onerror = () => {
        console.error('读取文件失败');
        reject(new Error('读取文件失败'));
      };

      reader.readAsDataURL(file);
    });
  }

  public async getImage(imageId: string): Promise<StoredImage | null> {
    try {
      console.log('获取图片:', imageId);
      const db = await this.db;
      const image = await db.get(STORE_NAME, imageId);
      
      if (!image) {
        console.warn('图片未找到:', imageId);
        return null;
      }

      console.log('成功获取图片:', {
        fileName: image.fileName,
        dataLength: image.data.length,
        timestamp: new Date(image.timestamp).toISOString()
      });
      
      return image;
    } catch (error) {
      console.error('获取图片失败:', error);
      return null;
    }
  }

  public async deleteImage(imageId: string): Promise<void> {
    try {
      console.log('删除图片:', imageId);
      const db = await this.db;
      await db.delete(STORE_NAME, imageId);
      console.log('图片删除成功');
    } catch (error) {
      console.error('删除图片失败:', error);
      throw error;
    }
  }

  public async getAllImages(): Promise<StoredImage[]> {
    try {
      console.log('获取所有图片...');
      const db = await this.db;
      const images = await db.getAll(STORE_NAME);
      console.log('已获取图片数量:', images.length);
      return images;
    } catch (error) {
      console.error('获取所有图片失败:', error);
      return [];
    }
  }
} 