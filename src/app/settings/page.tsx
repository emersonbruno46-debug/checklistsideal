'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { getStorageData, saveStorageData, INITIAL_SEED } from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { Database, Shield, RefreshCw, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function SettingsPage() {
  const [data, setData] = useState(() => getStorageData());
  const [resetDone, setResetDone] = useState(false);

  const handleResetSeed = () => {
    if (confirm('Tem certeza de que deseja resetar os dados de demonstração para o estado inicial (Projeto Cuidare)?')) {
      saveStorageData(INITIAL_SEED);
      setData(INITIAL_SEED);
      setResetDone(true);
      setTimeout(() => setResetDone(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar currentRole={data.currentUser.role} userName={data.currentUser.name} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao dashboard
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">
            Configurações do Sistema
          </h1>
          <p className="text-xs text-slate-500 mb-6">
            Gerencie integrações, banco de dados e perfis de teste da aplicação Ideal Checklist&apos;s.
          </p>

          <div className="space-y-6">
            {/* Supabase Status Box */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  Conexão Supabase
                </span>
                {isSupabaseConfigured ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Conectado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Modo LocalStorage (Demonstração Offline)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isSupabaseConfigured
                  ? 'A aplicação está conectada ao Supabase com autenticação e banco de dados ativos.'
                  : 'Para ativar a integração completa com o Supabase em nuvem, adicione as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local.'}
              </p>
            </div>

            {/* Reset Demo Data Box */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Restaurar dados de demonstração
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Restaura o projeto de exemplo <strong>Cuidare</strong> com o checklist pré-configurado.
                </p>
              </div>

              <button
                onClick={handleResetSeed}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{resetDone ? 'Dados Restaurados!' : 'Restaurar Dados'}</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
