import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  HomeOutlined,
  BookOutlined,
  BarChartOutlined,
  UserOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useAppSelector } from './services/store';

const { Header, Sider, Content } = Layout;

// 导入页面组件
import ErrorInput from './pages/ErrorInput';
import Management from './pages/Management';
import Login from './pages/Login';

// 临时页面组件，后续会替换为实际组件
const Home = () => <div>首页</div>;
const Analysis = () => <div>数据分析</div>;
const Profile = () => <div>个人中心</div>;

// 受保护的路由组件
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const user = useAppSelector(state => state.user.currentUser);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return element;
};

const App: React.FC = () => {
  const user = useAppSelector(state => state.user.currentUser);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState('/');

  // 菜单项配置
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/management',
      icon: <BookOutlined />,
      label: '错题管理',
    },
    {
      key: '/error-input',
      icon: <PlusOutlined />,
      label: '录入错题',
    },
    {
      key: '/analysis',
      icon: <BarChartOutlined />,
      label: '数据分析',
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
  ];

  // 根据路由更新选中的菜单项
  useEffect(() => {
    const path = location.pathname;
    if (path === '/login') return;
    
    // 如果是编辑页面，选中错题录入菜单项
    if (path.startsWith('/error-input')) {
      setSelectedKey('/error-input');
    } else {
      setSelectedKey(path);
    }
  }, [location.pathname]);

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // 如果用户未登录，只显示登录页面
  if (!user) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ padding: 0, background: '#fff' }}>
        <div style={{ float: 'left', width: 200, textAlign: 'center' }}>
          <h2>错题收集系统</h2>
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              background: '#fff',
              padding: 24,
              margin: 0,
              minHeight: 280,
            }}
          >
            <Routes>
              <Route path="/" element={<ProtectedRoute element={<Home />} />} />
              <Route path="/management" element={<ProtectedRoute element={<Management />} />} />
              <Route path="/error-input" element={<ProtectedRoute element={<ErrorInput />} />} />
              <Route path="/error-input/edit/:id" element={<ProtectedRoute element={<ErrorInput />} />} />
              <Route path="/analysis" element={<ProtectedRoute element={<Analysis />} />} />
              <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App; 