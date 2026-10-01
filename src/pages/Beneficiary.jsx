import React from 'react';

export default function Beneficiary() {
  return (
    <div className="min-h-screen bg-[#F4F7FB] flex justify-center pb-12 font-sans">
      <div className="w-full max-w-md bg-white shadow-lg">
        
        {/* Banner Istituzionale Blu */}
        <div className="bg-[#0072BC] text-white p-8 pb-12 text-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#0072BC] font-bold mx-auto mb-6">
            UN
          </div>
          <h1 className="text-2xl font-bold leading-tight mb-2">Assistenza Economica UNHCR</h1>
          <p className="text-sm text-[#D9E8F5] font-medium">Aggiornamento Pratica: REQ-2026-089</p>
        </div>

        {/* Esito e Messaggio Centrale */}
        <div className="px-8 -mt-6 relative z-10">
          <div className="bg-white border-2 border-[#0072BC] p-6 text-center shadow-md">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Stato Attuale</h2>
            <div className="text-3xl font-bold text-[#0072BC] mb-2">Approvata</div>
            <p className="text-slate-800 font-medium">Il supporto per il tuo nucleo familiare è stato confermato.</p>
          </div>
        </div>

        {/* Trasparenza sui criteri */}
        <div className="p-8 mt-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-200 pb-2">
            Motivazioni della decisione
          </h3>
          
          <ul className="space-y-6">
            <li className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#D9E8F5] text-[#0072BC] flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <p className="text-sm text-slate-700 font-medium pt-1">
                La dimensione del tuo nucleo familiare (6 persone) rientra nei criteri di supporto prioritario.
              </p>
            </li>
            <li className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#D9E8F5] text-[#0072BC] flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <p className="text-sm text-slate-700 font-medium pt-1">
                Sono state verificate e registrate vulnerabilità specifiche per la salute all'interno della famiglia.
              </p>
            </li>
          </ul>

          <div className="mt-12">
            <button className="w-full bg-[#0072BC] text-white font-bold py-4 text-center hover:bg-[#0a3d6b] transition-colors">
              Scarica Documento (PDF)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}