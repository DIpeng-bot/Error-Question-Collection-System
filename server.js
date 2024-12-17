const path = require('path');

// 添加调试信息
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

console.log('\n======= 服务器启动 =======');
console.log('时间:', new Date().toISOString());
console.log('Node.js 版本:', process.version);
console.log('操作系统:', process.platform);
console.log('进程 ID:', process.pid);
console.log('当前目录:', process.cwd());
console.log('命令行参数:', process.argv);
console.log('环境变量:', {
  NODE_ENV: process.env.NODE_ENV,
  PATH: process.env.PATH ? '已设置' : '未设置',
  PORT: process.env.PORT || 3001
});
console.log('========================\n');

console.log('\n=== 服务器启动初始化 ===');
console.log('当前工作目录:', process.cwd());
console.log('环境变量文件路径:', path.resolve(process.cwd(), '.env'));

// 加载环境变量
const dotenv = require('dotenv');
const envPath = path.resolve(process.cwd(), '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('\n=== 环境变量加载失败 ===');
  console.error('错误信息:', result.error);
  console.error('尝试的文件路径:', envPath);
  process.exit(1);
}

console.log('\n=== 环境变量加载成功 ===');
console.log('已加载的环境变量:');
Object.keys(result.parsed || {}).forEach(key => {
  console.log(`${key}: ${key.includes('SECRET') ? '******' : result.parsed[key]}`);
});

// 验证环境变量
const requiredEnvVars = ['REACT_APP_BAIDU_API_KEY', 'REACT_APP_BAIDU_SECRET_KEY'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingEnvVars.length > 0) {
  console.error('\n=== 缺少必要的环境变量 ===');
  console.error('缺少的变量:', missingEnvVars);
  process.exit(1);
}

// API 配置
const API_CONFIG = {
  API_KEY: process.env.REACT_APP_BAIDU_API_KEY,
  SECRET_KEY: process.env.REACT_APP_BAIDU_SECRET_KEY,
  TOKEN_URL: 'https://aip.baidubce.com/oauth/2.0/token',
  OCR_BASE_URL: 'https://aip.baidubce.com/rest/2.0/ocr/v1',
  OCR_ENDPOINTS: {
    general_basic: '/general_basic',           // 通用文字识别（标准版）
    accurate_basic: '/accurate_basic',         // 通用文字识别（高精度版）
    handwriting: '/handwriting',              // 手写文字识别
    exam: '/education/exam',                  // 试卷分析与识别
    formula: '/formula',                      // 公式识别
    table: '/table',                         // 表格文字识别
    numbers: '/numbers',                     // 数字识别
  }
};

console.log('\n=== API 配置验证 ===');
console.log('API_KEY:', `${API_CONFIG.API_KEY.substring(0, 8)}...`);
console.log('SECRET_KEY:', '已设置');
console.log('TOKEN_URL:', API_CONFIG.TOKEN_URL);
console.log('OCR_URL:', API_CONFIG.OCR_URL);

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// 令牌管理
let cachedToken = null;
let tokenExpireTime = 0;
const TOKEN_EXPIRE_BUFFER = 5 * 60 * 1000; // 提前5分钟认为令牌过期

// 获取访问令牌
const getAccessToken = async (forceRefresh = false) => {
  const now = Date.now();
  
  // 如果令牌有效且不强制刷新，直接返回缓存的令牌
  if (!forceRefresh && cachedToken && now < tokenExpireTime - TOKEN_EXPIRE_BUFFER) {
    console.log('使用缓存的访问令牌');
    return cachedToken;
  }

  console.log('\n=== 获取新访问令牌 ===');
  console.log('API Key:', API_CONFIG.API_KEY);
  console.log('Secret Key:', API_CONFIG.SECRET_KEY);
  
  try {
    // 构建完整的URL
    const tokenUrl = `${API_CONFIG.TOKEN_URL}?grant_type=client_credentials&client_id=${API_CONFIG.API_KEY}&client_secret=${API_CONFIG.SECRET_KEY}`;
    console.log('完整请求URL:', tokenUrl);

    const response = await axios({
      method: 'POST',
      url: tokenUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('\n=== 令牌响应 ===');
    console.log('状态码:', response.status);
    console.log('响应头:', response.headers);
    console.log('响应体:', response.data);

    if (response.data.error) {
      throw new Error(`API返回错误: ${response.data.error}`);
    }

    if (!response.data.access_token) {
      throw new Error('响应中没有访问令牌');
    }

    // 更新缓存
    cachedToken = response.data.access_token;
    tokenExpireTime = now + (response.data.expires_in * 1000);
    
    console.log('\n令牌获取成功');
    console.log('访问令牌:', `${cachedToken.substring(0, 10)}...`);
    console.log('有效期:', response.data.expires_in, '秒');
    
    return cachedToken;
  } catch (error) {
    console.error('\n=== 获取令牌失败 ===');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    
    throw new Error(`获取访问令牌失败: ${error.message}`);
  }
};

// 中间件配置
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 日志记录中间件
const logRequest = (req, res, next) => {
  console.log('\n=== 新请求开始 ===');
  console.log('时间:', new Date().toISOString());
  console.log('方法:', req.method);
  console.log('URL:', req.url);
  console.log('路径:', req.path);
  console.log('查询参数:', req.query);
  console.log('请求头:', JSON.stringify(req.headers, null, 2));
  if (req.body) {
    console.log('请求体大小:', Math.round(JSON.stringify(req.body).length / 1024), 'KB');
  }
  next();
};

app.use(logRequest);

// 基本路由
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: '服务器正在运行',
    endpoints: {
      test: '/api/test',
      token: '/api/token',
      ocr: '/api/ocr'
    }
  });
});

// 测试路由
app.get('/api/test', (req, res) => {
  res.json({
    status: 'ok',
    message: '服务器正在运行',
    time: new Date().toISOString(),
    config: {
      port: PORT,
      api_key_prefix: API_CONFIG.API_KEY.substring(0, 8)
    }
  });
});

// 获取访问令牌路由
app.post('/api/token', async (req, res) => {
  try {
    console.log('\n=== 开始请求访问令牌 ===');
    const token = await getAccessToken(true);
    res.json({
      access_token: token,
      expires_in: Math.floor((tokenExpireTime - Date.now()) / 1000)
    });
  } catch (error) {
    console.error('\n=== 令牌请求失败 ===');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
      
      return res.status(error.response.status).json({
        error: error.response.data.error || error.message,
        error_description: error.response.data.error_description,
        details: error.response.data
      });
    }
    
    res.status(500).json({
      error: error.message,
      details: '服务器内部错误'
    });
  }
});

// OCR请求函数
const performOCR = async (token, imageData, ocrType = 'general_basic') => {
  console.log('准备发送OCR请求...');
  console.log('OCR类型:', ocrType);
  
  // 验证OCR类型是否有效
  if (!API_CONFIG.OCR_ENDPOINTS[ocrType]) {
    throw new Error(`不支持的OCR类型: ${ocrType}`);
  }
  
  // 构建请求URL
  const url = `${API_CONFIG.OCR_BASE_URL}${API_CONFIG.OCR_ENDPOINTS[ocrType]}?access_token=${token}`;
  console.log('发送OCR请求到URL:', url.replace(token, token.substring(0, 10) + '...'));
  
  const formData = new URLSearchParams();
  formData.append('image', imageData);
  formData.append('language_type', 'CHN_ENG');
  
  try {
    console.log('发送请求到百度API...');
    const response = await axios({
      method: 'POST',
      url: url,
      data: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 30000
    });

    console.log('百度API响应状态:', response.status);
    return response.data;
  } catch (error) {
    console.error('百度API请求失败:', error.response?.data || error.message);
    throw error;
  }
};

// OCR 识别的代理路由
app.post('/api/ocr', async (req, res, next) => {
  try {
    console.log('\n=== OCR 识别请求开始 ===');
    const { access_token, image, ocr_type = 'general_basic' } = req.body;
    
    // 详细的参数验证
    if (!access_token) {
      console.error('缺少访问令牌');
      return res.status(400).json({ 
        error: '参数错误',
        message: '缺少访问令牌',
        code: 'MISSING_TOKEN'
      });
    }
    
    if (!image) {
      console.error('缺少图片数据');
      return res.status(400).json({ 
        error: '参数错误',
        message: '缺少图片数据',
        code: 'MISSING_IMAGE'
      });
    }

    // 验证base64数据
    try {
      const buffer = Buffer.from(image, 'base64');
      const sizeInKB = Math.round(buffer.length / 1024);
      console.log('图片数据验证成功，大小:', sizeInKB, 'KB');
      
      if (sizeInKB > 4096) {
        return res.status(400).json({ 
          error: '参数错误',
          message: '图片大小超过4MB限制',
          code: 'IMAGE_TOO_LARGE',
          size: sizeInKB
        });
      }
    } catch (error) {
      console.error('Base64数据验证失败:', error);
      return res.status(400).json({ 
        error: '参数错误',
        message: 'Base64数据无效',
        code: 'INVALID_BASE64'
      });
    }

    // 尝试OCR识别
    try {
      console.log('使用令牌尝试OCR识别...');
      const result = await performOCR(access_token, image, ocr_type);
      
      if (result.error_code) {
        // 如果是令牌相关错误，尝试刷新令牌
        if (result.error_code === 110 || result.error_code === 6) {
          console.log(`检测到错误码 ${result.error_code}，尝试刷新令牌...`);
          const newToken = await getAccessToken(true);
          console.log('使用新令牌重试OCR请求...');
          const retryResult = await performOCR(newToken, image, ocr_type);
          
          if (retryResult.error_code) {
            throw new Error(JSON.stringify({
              error: 'OCR_ERROR',
              error_code: retryResult.error_code,
              error_msg: retryResult.error_msg
            }));
          }
          
          return res.json({
            ...retryResult,
            new_token: newToken
          });
        }
        
        // 其他错误直接返回
        throw new Error(JSON.stringify({
          error: 'OCR_ERROR',
          error_code: result.error_code,
          error_msg: result.error_msg
        }));
      }

      console.log('OCR识别成功，返回结果');
      res.json(result);
    } catch (error) {
      console.error('OCR 请求失败:', error);
      
      let errorData;
      try {
        errorData = JSON.parse(error.message);
      } catch (e) {
        errorData = {
          error: 'UNKNOWN_ERROR',
          message: error.message
        };
      }
      
      res.status(500).json(errorData);
    }
  } catch (error) {
    console.error('\n=== OCR 请求失败 ===');
    console.error('错误类型:', error.constructor.name);
    console.error('错误信息:', error.message);
    
    next(error);
  }
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `路径 ${req.path} 不存在`,
    available_endpoints: [
      '/',
      '/api/test',
      '/api/token',
      '/api/ocr'
    ]
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('\n=== 错误处理中间件捕获到错误 ===');
  console.error('错误类型:', err.constructor.name);
  console.error('错误消息:', err.message);
  console.error('错误堆栈:', err.stack);
  
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message,
    path: req.path
  });
});

const PORT = process.env.PORT || 3003;  // 使用 3003 作为默认端口

app.listen(PORT, () => {
  console.log('\n=== 服务器启动成功 ===');
  console.log(`时间: ${new Date().toISOString()}`);
  console.log(`端口: ${PORT}`);
  console.log('服务器地址: http://localhost:' + PORT);
  console.log('\nAPI 配置:');
  console.log('- API_KEY:', `${API_CONFIG.API_KEY.substring(0, 8)}...`);
  console.log('- TOKEN_URL:', API_CONFIG.TOKEN_URL);
  console.log('- OCR_URL:', API_CONFIG.OCR_URL);
  console.log('\n服务器已准备就绪，等待请求...');
}); 