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

// 私有路由守卫 - 需要登录才能访问
const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
  console.log('PrivateRoute - 登录状态:', isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// 公共路由守卫 - 已登录用户不能访问（如登录页、注册页）
const PublicRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
  console.log('PublicRoute - 登录状态:', isAuthenticated);
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
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
          path="/" 
          element={
            <PrivateRoute>
              <Main />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/home" 
          element={
            <PrivateRoute>
              <Home />
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