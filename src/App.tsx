import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BudgetProvider } from './store/BudgetContext';
import Sidebar from './components/Sidebar';
import OverviewPage from './pages/OverviewPage';
import TransactionsPage from './pages/TransactionsPage';
import RecurringPage from './pages/RecurringPage';
import MonthPage from './pages/MonthPage';

export default function App() {
  return (
    <BudgetProvider>
      <BrowserRouter>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/recurring" element={<RecurringPage />} />
              <Route path="/month/:month" element={<MonthPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </BudgetProvider>
  );
}
