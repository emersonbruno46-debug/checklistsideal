'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { getStorageData, saveStorageData } from '@/lib/storage';
import { Users, Shield, UserCheck, Plus, ArrowLeft } from 'lucide-react';

export default function UsersPage() {
  const [data, setData] = useState(() => getStorageData());
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'employee'>('employee');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    alert(`Usuário ${newUserName} (${newUserRole}) adicionado com sucesso!`);
    setNewUserName('');
    setNewUserEmail('');
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

        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="border-b border-slate-100 pb-5 mb-6">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" />
              Gestão de Usuários
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Gerencie membros da equipe e atribua permissões de Administrador e Funcionário.
            </p>
          </div>

          {/* Add User Form */}
          <form onSubmit={handleAddUser} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Convidar novo membro para a equipe
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Nome do funcionário"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="email"
                required
                placeholder="email@empresa.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'employee')}
                className="text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="employee">Funcionário (Auditor)</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Membro</span>
            </button>
          </form>

          {/* Active Users Table */}
          <div className="space-y-3">
            <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  B
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Bruno (Você)</div>
                  <div className="text-xs text-slate-500">bruno@idealchecklists.com</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Shield className="w-3.5 h-3.5" />
                Administrador
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center">
                  C
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Carlos Santos</div>
                  <div className="text-xs text-slate-500">carlos@idealchecklists.com</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                <UserCheck className="w-3.5 h-3.5" />
                Funcionário
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
