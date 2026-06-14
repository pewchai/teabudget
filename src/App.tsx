import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BudgetProvider } from './store/BudgetContext';
import TopBar from './components/TopBar';
import FloatingNav from './components/FloatingNav';
import OverviewPage from './pages/OverviewPage';
import TransactionsPage from './pages/TransactionsPage';
import RecurringPage from './pages/RecurringPage';
import MonthPage from './pages/MonthPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BudgetProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <TopBar />
          <main className="flex-1 overflow-y-auto pb-28">
            <div className="mx-auto w-full max-w-3xl">
              <Routes>
                <Route path="/" element={<TransactionsPage />} />
                <Route path="/recurring" element={<RecurringPage />} />
                <Route path="/year" element={<OverviewPage />} />
                <Route path="/month/:month" element={<MonthPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </main>
          <FloatingNav />
        </div>
      </BrowserRouter>
    </BudgetProvider>
  );
}
