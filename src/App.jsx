import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Beneficiary from "./pages/Beneficiary";
import { lazy, Suspense } from "react";
const Supervisor = lazy(() => import("./supervisor/App"));

function SiteHeader() {

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
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/mobile" element={<Beneficiary />} />
            <Route path="/supervisor" element={<Suspense fallback={<p className="p-8">Loading oversight…</p>}><Supervisor /></Suspense>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}