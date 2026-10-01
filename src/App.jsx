import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Beneficiary from "./pages/Beneficiary";

function SiteHeader() {
  const location = useLocation();

  return (
    <header className="bg-white border-b-2 border-slate-300 print:hidden">
    </header>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
        <SiteHeader />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/mobile" element={<Beneficiary />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}