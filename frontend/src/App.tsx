import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Procurement from './pages/Procurement';
import Supplier from './pages/Supplier';
import Expenses from './pages/Expenses';
import AiAssistant from './pages/AiAssistant';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/procurement" element={<Procurement />} />
          <Route path="/supplier" element={<Supplier />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/ai-assistant" element={<AiAssistant />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
