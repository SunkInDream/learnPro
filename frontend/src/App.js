import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Main from './pages/Main';
import Home from './pages/Home';
import UserCenter from './pages/UserCenter';
import Feedback from './pages/Feedback';
import StudyPlan from './pages/StudyPlan';
import Login from './pages/Login';
import Register from './pages/Register';
import 'antd/dist/reset.css';

// 路由守卫组件
const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// 公共路由组件
const PublicRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* 公共路由 */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
        <Route 
          path="/Home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Main />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/user" 
          element={
            <PrivateRoute>
              <UserCenter />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/feedback" 
          element={
            <PrivateRoute>
              <Feedback />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/study-plan" 
          element={
            <PrivateRoute>
              <StudyPlan />
            </PrivateRoute>
          } 
        />
        
        {/* 将未匹配的路由重定向到首页或登录页面 */}
        <Route 
          path="*" 
          element={
            localStorage.getItem('isLoggedIn') === 'true' 
              ? <Navigate to="/" replace /> 
              : <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;