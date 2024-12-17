// OCR 服务配置
const OCR_CONFIG = {
  PROXY_URL: 'http://localhost:3003/api',
  OCR_TYPES: {
    GENERAL: 'general_basic',           // 通用文字识别（标准版）
    ACCURATE: 'accurate_basic',         // 通用文字识别（高精度版）
    HANDWRITING: 'handwriting',         // 手写文字识别
    EXAM_PAPER: 'exam',                 // 试卷分析与识别
    FORMULA: 'formula',                 // 公式识别
    TABLE: 'table',                     // 表格文字识别
    NUMBER: 'numbers',                  // 数字识别
  }
};

interface TokenResponse {
  access_token: string;
  expires_in: number;
  error?: string;
  error_description?: string;
}

interface OCRResponse {
  words_result: Array<{ words: string }>;
  words_result_num: number;
  error_code?: number;
  error_msg?: string;
}

let accessToken: string | null = null;
let tokenExpireTime: number = 0;

// 获取百度 OCR 访问令牌
const getAccessToken = async (): Promise<string> => {
  if (accessToken && Date.now() < tokenExpireTime) {
    console.log('使用缓存的访问令牌');
    return accessToken;
  }

  console.log('正在获取新的访问令牌...');
  
  try {
    const response = await fetch(`${OCR_CONFIG.PROXY_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('令牌响应状态:', response.status);
    const responseText = await response.text();
    console.log('令牌响应内容:', responseText);

    let data: TokenResponse;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('解析令牌响应失败:', e);
      throw new Error('解析令牌响应失败');
    }

    if (!response.ok || data.error) {
      console.error('获取令牌失败:', {
        status: response.status,
        statusText: response.statusText,
        error: data.error,
        error_description: data.error_description
      });
      throw new Error(data.error_description || data.error || '获取访问令牌失败');
    }

    if (!data.access_token) {
      console.error('返回数据中没有访问令牌:', data);
      throw new Error('返回数据中没有访问令牌');
    }

    accessToken = data.access_token;
    tokenExpireTime = Date.now() + (data.expires_in * 1000);
    console.log('成功获取访问令牌，有效期:', data.expires_in, '秒');
    return accessToken;
  } catch (error) {
    console.error('获取访问令牌失败:', error);
    throw error;
  }
};

// 图片 base64 编码
const imageToBase64 = (imageData: string): string => {
  // 如果已经是纯base64格式，直接返回
  if (!imageData.includes('data:image/')) {
    return imageData;
  }

  // 提取base64数据部分
  const base64Data = imageData.split(',')[1];
  
  // 检查数据大小
  const sizeInKB = Math.round(base64Data.length / 1024);
  console.log('图片数据大小:', sizeInKB, 'KB');
  
  // 验证数据大小
  if (sizeInKB > 4096) {
    throw new Error('图片大小超过4MB限制');
  }
  
  // 验证base64格式
  if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
    console.warn('Base64数据包含非标准字符，尝试清理...');
    const cleanedData = base64Data.replace(/[\r\n\s]/g, '');
    if (!/^[A-Za-z0-9+/=]+$/.test(cleanedData)) {
      throw new Error('Base64数据格式无效');
    }
    return cleanedData;
  }
  
  return base64Data;
};

// OCR 识别
export const recognizeText = async (imageData: string, ocrType: keyof typeof OCR_CONFIG.OCR_TYPES = 'GENERAL'): Promise<string[]> => {
  try {
    console.log('开始OCR识别，类型:', ocrType);
    const token = await getAccessToken();
    
    // 确保图片数据是base64格式
    let base64Image = imageData;
    if (imageData.includes('data:image/')) {
      base64Image = imageData.split(',')[1];
    }
    
    console.log('图片数据大小:', Math.round(base64Image.length / 1024), 'KB');

    // 验证数据大小
    if (base64Image.length / 1024 > 4096) {
      throw new Error('图片大小超过4MB限制');
    }

    // 验证并清理base64数据
    if (!/^[A-Za-z0-9+/=]+$/.test(base64Image)) {
      console.warn('Base64数据包含非标准字符，尝试清理...');
      base64Image = base64Image.replace(/[\r\n\s]/g, '');
      if (!/^[A-Za-z0-9+/=]+$/.test(base64Image)) {
        throw new Error('Base64数据格式无效');
      }
    }

    console.log('发送OCR请求...');
    const response = await fetch(`${OCR_CONFIG.PROXY_URL}/ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        access_token: token,
        image: base64Image,
        ocr_type: OCR_CONFIG.OCR_TYPES[ocrType]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OCR请求失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });

      let errorData;
      try {
        errorData = JSON.parse(errorText);
        console.error('错误详情:', errorData);
      } catch (e) {
        console.error('无法解析错误响应:', errorText);
      }

      throw new Error(
        errorData?.error_msg || 
        errorData?.message || 
        `OCR请求失败: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json() as OCRResponse;
    console.log('OCR响应:', {
      errorCode: data.error_code,
      errorMsg: data.error_msg,
      wordsResultNum: data.words_result_num,
      results: data.words_result
    });

    if (data.error_code) {
      throw new Error(data.error_msg || `OCR识别失败 (错误码: ${data.error_code})`);
    }

    if (!data.words_result) {
      console.warn('未识别到文字');
      return [];
    }

    console.log(`识别成功，共 ${data.words_result_num} 条结果`);
    return data.words_result.map(item => item.words);
  } catch (error) {
    console.error('OCR 识别失败:', error);
    throw error;
  }
};

// 文本预处理
export const preprocessText = (textArray: string[]): string => {
  console.log('开始预处理文本，原始行数:', textArray.length);
  // 合并文本行
  let text = textArray.join('\n');
  
  // 基本清理
  text = text.trim()
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'");
  
  console.log('预处理完成，处理后字符数:', text.length);
  return text;
};

export const OCRService = {
  recognizeText,
  preprocessText,
  OCR_TYPES: OCR_CONFIG.OCR_TYPES
}; 