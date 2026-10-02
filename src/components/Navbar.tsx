'use client';

import React from 'react';
import Link from 'next/link';
import { CheckSquare, Shield, UserCheck, Plus, Settings, FolderCheck, LogOut } from 'lucide-react';
import { UserRole } from '@/types/database';

interface NavbarProps {
  currentRole: UserRole;
  onToggleRole?: (newRole: UserRole) => void;
  userName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole = 'admin',
  onToggleRole,
  userName = 'Bruno',
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Subtitle */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
              <CheckSquare className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  Ideal Checklist&apos;s
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal">
                Teste. Valide. Entregue.
              </p>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-1.5"
            >
              <FolderCheck className="w-4 h-4" />
              Projetos
            </Link>
            <Link
              href="/projects/new"
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Novo Projeto
            </Link>
            <Link
              href="/settings"
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Settings className="w-4 h-4" />
              Configurações
            </Link>
          </nav>

          {/* User & Role Switcher */}
          <div className="flex items-center gap-3">
            {/* Role Badge Switcher */}
            {onToggleRole && (
              <button
                onClick={() => onToggleRole(currentRole === 'admin' ? 'employee' : 'admin')}
                title="Clique para alternar perfil de teste"
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md border transition-all hover:shadow-xs border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              >
                {currentRole === 'admin' ? (
                  <>
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Modo: Admin</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Modo: Funcionário</span>
                  </>
                )}
              </button>
            )}

            {/* Profile Avatar / User Name */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-semibold text-xs flex items-center justify-center">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-800 hidden lg:inline">
                {userName}
              </span>
            </div>

            {/* Quick Action Button */}
            <Link
              href="/projects/new"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Criar Projeto</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
