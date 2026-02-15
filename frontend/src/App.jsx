import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Servers from './pages/Servers'
import Terminal from './pages/Terminal'
import FileManager from './pages/FileManager'
import Monitor from './pages/Monitor'
import Security from './pages/Security'
import Settings from './pages/Settings'
import Layout from './components/Layout'
import { useAuthStore } from './store/useAuthStore'

const PrivateRoute = ({ children }) => {
  const token = useAuthStore(state => state.token)
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes wrapped in Layout */}
        <Route element={
          <PrivateRoute>
             <Layout />
          </PrivateRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/servers" element={<Servers />} />
          <Route path="/terminal" element={<Terminal />} />
          <Route path="/files" element={<FileManager />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/security" element={<Security />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
