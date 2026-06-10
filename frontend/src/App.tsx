import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Logo from './components/brand/Logo';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Exams from './pages/Exams';
import QuestionBanks from './pages/QuestionBanks';
import TakeExam from './pages/TakeExam';
import ProctorDashboard from './pages/ProctorDashboard';
import Analytics from './pages/Analytics';
import Results from './pages/Results';
import Settings from './pages/Settings';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Logo size="lg" />
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/exams" element={<ProtectedRoute><Exams /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/exam/:examId/take" element={
        <ProtectedRoute roles={['student']} bare><TakeExam /></ProtectedRoute>
      } />
      <Route path="/results" element={<ProtectedRoute roles={['student']}><Results /></ProtectedRoute>} />

      <Route path="/question-banks" element={
        <ProtectedRoute roles={['admin', 'instructor']}><QuestionBanks /></ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute roles={['admin', 'instructor']}><Analytics /></ProtectedRoute>
      } />
      <Route path="/proctor" element={
        <ProtectedRoute roles={['admin', 'proctor']}><ProctorDashboard /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;
