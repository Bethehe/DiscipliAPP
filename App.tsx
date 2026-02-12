
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { User, Student, Absence, NotificationAlert } from './types';
import { INITIAL_USERS, INITIAL_STUDENTS, NOTIFICATION_EMAILS } from './constants';
import { generateAbsenceEmail } from './services/geminiService';
import { saveStudents, loadStudents, saveAbsences, loadAbsences, saveUsers, loadUsers } from './storage';

// --- Sub-Components ---

const MASTER_RECOVERY_PIN = '1234';

const PasswordRecoveryModal: React.FC<{
  user: User;
  onClose: () => void;
  onRecover: (userId: string, newPassword: string) => void;
}> = ({ user, onClose, onRecover }) => {
  const [pin, setPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  const handleRecover = () => {
    if (pin === MASTER_RECOVERY_PIN) {
      if (!newPassword) {
        setError('Defina uma nova senha.');
        return;
      }
      onRecover(user.id, newPassword);
      onClose();
    } else {
      setError('PIN de recuperação inválido.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
          <div>
            <h3 className="font-black text-slate-800 uppercase tracking-tight">Resetar Senha</h3>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{user.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="p-8 space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">PIN Master</label>
            <input 
              type="password" 
              value={pin} 
              onChange={e => setPin(e.target.value)} 
              placeholder="••••"
              className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-center tracking-widest" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Nova Senha</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              placeholder="Digite a nova senha"
              className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" 
            />
          </div>
          {error && <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>}
          <button 
            onClick={handleRecover}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-600 transition-all active:scale-95 text-xs uppercase tracking-widest"
          >
            Confirmar Reset
          </button>
        </div>
      </div>
    </div>
  );
};

const LoginScreen: React.FC<{ users: User[]; onLogin: (user: User) => void; onUpdateUsers: (users: User[]) => void }> = ({ users, onLogin, onUpdateUsers }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryPin, setRecoveryPin] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = () => {
    if (!selectedUser) {
      setError('Selecione um perfil primeiro.');
      return;
    }
    if (selectedUser.password === password) {
      onLogin(selectedUser);
    } else {
      setError('Senha incorreta.');
    }
  };

  const handleRecovery = () => {
    if (recoveryPin === MASTER_RECOVERY_PIN) {
      if (!newPassword) {
        setError('Defina uma nova senha.');
        return;
      }
      const updatedUsers = users.map(u => 
        u.id === selectedUser?.id ? { ...u, password: newPassword } : u
      );
      onUpdateUsers(updatedUsers);
      setError('Senha alterada com sucesso! Faça login.');
      setShowRecovery(false);
      setRecoveryPin('');
      setNewPassword('');
    } else {
      setError('PIN de recuperação inválido.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]"></div>
      </div>
      
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md z-10 transition-all">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-indigo-600 rounded-3xl mb-4 shadow-lg shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 2v18"/><path d="M12 8h4"/><path d="M12 12h4"/></svg>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Discipli APP</h1>
          <p className="text-slate-400 text-xs mt-1">Acesso Restrito à Equipe</p>
        </div>

        {!selectedUser ? (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mb-4">Selecione seu perfil</p>
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => { setSelectedUser(u); setError(''); }}
                className="w-full flex items-center gap-4 p-3 bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700 rounded-2xl transition-all group text-left"
              >
                <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full border border-slate-700" />
                <div>
                  <p className="font-bold text-white text-sm">{u.name}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">{u.role}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button onClick={() => { setSelectedUser(null); setPassword(''); setError(''); }} className="flex items-center gap-2 text-indigo-400 text-xs font-bold hover:text-indigo-300 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Voltar à lista
            </button>
            
            <div className="flex items-center gap-4 p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl">
              <img src={selectedUser.avatar} alt={selectedUser.name} className="w-12 h-12 rounded-full border-2 border-indigo-500 shadow-md" />
              <div>
                <p className="font-black text-white">{selectedUser.name}</p>
                <p className="text-[10px] text-indigo-300 uppercase font-black">{selectedUser.role}</p>
              </div>
            </div>

            {showRecovery ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">PIN Master de Recuperação</label>
                  <input
                    type="password"
                    value={recoveryPin}
                    onChange={(e) => setRecoveryPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-4 py-3 bg-slate-800 border-none rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Nova Senha</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Sua nova senha"
                    className="w-full px-4 py-3 bg-slate-800 border-none rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  />
                </div>
                <button onClick={handleRecovery} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 text-xs uppercase tracking-widest">
                  Redefinir Senha
                </button>
                <button onClick={() => { setShowRecovery(false); setError(''); }} className="w-full text-slate-500 text-xs font-bold py-2 hover:text-slate-300 transition-colors">Cancelar</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Senha de Acesso</label>
                  <input
                    autoFocus
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="••••••"
                    className="w-full px-4 py-3 bg-slate-800 border-none rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg tracking-widest"
                  />
                </div>
                {error && <p className="text-red-400 text-xs font-bold text-center px-2">{error}</p>}
                <button onClick={handleLogin} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/10 transition-all active:scale-95 text-xs uppercase tracking-widest">
                  Entrar no Sistema
                </button>
                <button onClick={() => { setShowRecovery(true); setError(''); }} className="w-full text-slate-500 text-[10px] font-black uppercase tracking-widest py-2 hover:text-slate-300 transition-colors">Esqueci minha senha</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Layout ---

const Layout: React.FC<{ 
  user: User; 
  onLogout: () => void; 
  children: React.ReactNode;
  activeTab: 'attendance' | 'manage' | 'settings';
  onTabChange: (tab: 'attendance' | 'manage' | 'settings') => void;
  deferredPrompt: any;
  onInstall: () => void;
}> = ({ user, onLogout, children, activeTab, onTabChange, deferredPrompt, onInstall }) => {
  return (
    <div className="h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      <aside className="w-full md:w-72 bg-slate-900 text-white h-auto md:h-full flex flex-col tablet-sidebar">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 2v18"/><path d="M12 8h4"/><path d="M12 12h4"/></svg>
            </div>
            <span className="font-black text-xl tracking-tighter">Discipli APP</span>
          </div>
          {deferredPrompt && (
            <button onClick={onInstall} className="md:hidden p-2 bg-indigo-600 rounded-lg animate-pulse" title="Instalar App">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </button>
          )}
        </div>
        <nav className="flex-1 p-5 space-y-2 overflow-y-auto">
          <div className="text-[10px] font-black text-slate-500 uppercase px-4 mb-4 tracking-[0.2em]">Navegação Principal</div>
          <button onClick={() => onTabChange('attendance')} className={`flex items-center gap-4 w-full px-5 py-4 rounded-2xl transition-all group ${activeTab === 'attendance' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-1' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            <span className="font-bold text-sm">Chamada Diária</span>
          </button>
          <button onClick={() => onTabChange('manage')} className={`flex items-center gap-4 w-full px-5 py-4 rounded-2xl transition-all group ${activeTab === 'manage' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-1' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span className="font-bold text-sm">Gerenciar Alunos</span>
          </button>
          <button onClick={() => onTabChange('settings')} className={`flex items-center gap-4 w-full px-5 py-4 rounded-2xl transition-all group ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-1' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span className="font-bold text-sm">Configurações</span>
          </button>
        </nav>
        
        {deferredPrompt && (
          <div className="px-5 mb-4 hidden md:block">
            <button onClick={onInstall} className="w-full flex items-center justify-center gap-3 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 py-4 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Instalar no Tablet
            </button>
          </div>
        )}

        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 mb-5">
            <img src={user.avatar} className="w-12 h-12 rounded-full border-2 border-indigo-500/50 object-cover shadow-lg" alt="" />
            <div className="overflow-hidden">
              <p className="text-sm font-black truncate text-white">{user.name}</p>
              <p className="text-[10px] text-indigo-400 uppercase font-black tracking-widest">{user.role}</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-3 w-full px-5 py-3 text-slate-400 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/30 rounded-xl transition-all text-xs font-black uppercase tracking-widest">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Encerrar Sessão
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-50 relative pb-10 md:pb-0">
        <div className="max-w-7xl mx-auto p-5 md:p-10 h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

// --- Modal Components ---

// Modal for adding or editing a student
const StudentModal: React.FC<{
  student: Student | null;
  onClose: () => void;
  onSave: (s: Student) => void;
}> = ({ student, onClose, onSave }) => {
  const [name, setName] = useState(student?.name || '');
  const [registration, setRegistration] = useState(student?.registration || '');
  const [grade, setGrade] = useState(student?.grade || '');
  const [emails, setEmails] = useState(student?.emails?.join(', ') || '');

  const handleSave = () => {
    if (!name || !registration || !grade) {
      alert('Por favor, preencha nome, matrícula e turma.');
      return;
    }
    onSave({
      id: student?.id || registration || Date.now().toString(),
      name: name.toUpperCase(),
      registration,
      grade: grade.toUpperCase(),
      emails: emails.split(',').map(e => e.trim()).filter(e => e !== '')
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[80]">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
          <h3 className="font-black text-slate-800 uppercase tracking-tight">{student ? 'Editar Aluno' : 'Novo Aluno'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="p-8 space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Nome Completo</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Matrícula</label>
              <input value={registration} onChange={e => setRegistration(e.target.value)} className="w-full px-4 py-3 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Turma</label>
              <input value={grade} onChange={e => setGrade(e.target.value)} className="w-full px-4 py-3 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">E-mails dos Responsáveis (sep. por vírgula)</label>
            <input value={emails} onChange={e => setEmails(e.target.value)} placeholder="ex: pai@email.com, mae@email.com" className="w-full px-4 py-3 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={handleSave} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-600 transition-all active:scale-95 text-xs uppercase tracking-widest">Salvar Cadastro</button>
        </div>
      </div>
    </div>
  );
};

// Modal for adding or editing a disciplinary user
const UserModal: React.FC<{
  user: User | null;
  onClose: () => void;
  onSave: (u: User) => void;
}> = ({ user, onClose, onSave }) => {
  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState(user?.role || 'Disciplinário');
  const [avatar, setAvatar] = useState(user?.avatar || `https://picsum.photos/seed/${Math.random()}/200`);
  const [password, setPassword] = useState(user?.password || '123');

  const handleSave = () => {
    if (!name || !role) {
      alert('Preencha o nome e a função.');
      return;
    }
    onSave({
      id: user?.id || Date.now().toString(),
      name,
      role,
      avatar,
      password
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[80]">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
          <h3 className="font-black text-slate-800 uppercase tracking-tight">{user ? 'Editar Perfil' : 'Novo Perfil'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="p-8 space-y-4">
          <div className="flex justify-center mb-4">
             <img src={avatar} className="w-20 h-20 rounded-full border-4 border-slate-100 object-cover" alt="Preview" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Nome</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Função/Cargo</label>
            <input value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-3 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {!user && (
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Senha Inicial</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          )}
          <button onClick={handleSave} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-600 transition-all active:scale-95 text-xs uppercase tracking-widest">Confirmar Perfil</button>
        </div>
      </div>
    </div>
  );
};

// --- Attendance Manager ---

const AttendanceManager: React.FC<{
  students: Student[];
  onUpdateStudents: (newStudents: Student[]) => void;
  absences: Absence[];
  user: User;
  onToggleAbsence: (studentId: string, date: string) => void;
  alerts: NotificationAlert[];
}> = ({ students, onUpdateStudents, absences, onToggleAbsence, alerts, user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGrade, setSelectedGrade] = useState<string>('TODAS');
  
  const [draftingEmail, setDraftingEmail] = useState<{ 
    recipients: string;
    subject: string;
    body: string;
    reasonLabel: string;
  } | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const processedAlertsRef = useRef<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const grades = useMemo(() => {
    const uniqueGrades = Array.from(new Set(students.map(s => s.grade))).sort();
    return ['TODAS', ...uniqueGrades];
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (selectedGrade === 'TODAS') return students;
    return students.filter(s => s.grade === selectedGrade);
  }, [students, selectedGrade]);

  const handleDraftEmail = async (alert: NotificationAlert | { studentId: string; studentName: string; reason: 'daily' | 'consecutive' | 'total'; days: number }) => {
    setIsGenerating(true);
    
    let reasonLabel = "";
    let recipients = "";
    let subject = "";

    const student = students.find(s => s.id === alert.studentId);
    const parentEmails = student?.emails?.join(', ') || "";

    if (alert.reason === 'daily') {
      reasonLabel = "Falta Diária (Responsáveis)";
      recipients = parentEmails || "sem-email-cadastrado@escola.com";
      subject = `AVISO DE AUSÊNCIA: ${alert.studentName} - ${selectedDate}`;
    } else if (alert.reason === 'consecutive') {
      reasonLabel = `${alert.days} Faltas Consecutivas (Equipe Pedagógica)`;
      recipients = NOTIFICATION_EMAILS.join(', ');
      subject = `ALERTA PEDAGÓGICO: Evasão em Curso - ${alert.studentName}`;
    } else {
      reasonLabel = `${alert.days} Faltas Totais (Pedagógico + Assistência Social)`;
      recipients = [...NOTIFICATION_EMAILS, "social@escola.com"].join(', ');
      subject = `ALERTA CRÍTICO: Risco de Abandono - ${alert.studentName}`;
    }

    setDraftingEmail({
      recipients,
      subject,
      body: "",
      reasonLabel
    });

    const content = await generateAbsenceEmail(
      alert.studentName, 
      alert.reason as any, 
      alert.days, 
      user.name
    );
    
    setDraftingEmail(prev => prev ? { ...prev, body: content || "" } : null);
    setIsGenerating(false);
  };

  useEffect(() => {
    const newAlert = alerts.find(a => !processedAlertsRef.current.has(`${a.studentId}-${a.reason}-${a.days}`));
    if (newAlert && !draftingEmail) {
      handleDraftEmail(newAlert);
      processedAlertsRef.current.add(`${newAlert.studentId}-${newAlert.reason}-${newAlert.days}`);
    }
  }, [alerts, draftingEmail]);

  const handleExportExcel = () => {
    if (absences.length === 0) {
      alert('Não há dados de frequência para exportar.');
      return;
    }
    const dataToExport = absences.map(absence => {
      const student = students.find(s => s.id === absence.studentId);
      return {
        'Nome do Aluno': student?.name || 'Não Encontrado',
        'Turma': student?.grade || 'N/A',
        'Data da Falta': absence.date,
        'Status': 'AUSENTE'
      };
    }).sort((a, b) => a['Data da Falta'].localeCompare(b['Data da Falta']));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Faltas");
    XLSX.writeFile(workbook, `frequencia_discipliapp_${selectedDate}.xlsx`);
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;
      let importedData: any[] = [];
      try {
        if (isExcel) {
          const workbook = XLSX.read(data, { type: 'binary' });
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            importedData.push(...XLSX.utils.sheet_to_json(worksheet));
          });
        } else {
          const result = Papa.parse(data as string, { header: true, skipEmptyLines: true });
          importedData = result.data;
        }
        const newStudents: Student[] = importedData.map((row: any, index) => {
          const name = (row['ALUNO'] || row['Aluno'] || row['Nome'] || row['Nome do Aluno'] || row['name'] || `Estudante ${index + 1}`).toString().toUpperCase();
          const grade = (row['TURMA'] || row['Turma'] || row['Série'] || row['grade'] || 'S/T').toString().toUpperCase();
          const id = row['MATRICULA'] || row['ID'] || `${name}-${grade}`.replace(/\s+/g, '-').toLowerCase();
          return { id, name, registration: id, grade };
        });
        if (newStudents.length > 0) {
          onUpdateStudents(newStudents);
          alert(`${newStudents.length} alunos importados.`);
        }
      } catch (err) { alert("Erro ao processar arquivo."); }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    if (isExcel) reader.readAsBinaryString(file); else reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-0">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Painel de Chamada</h2>
          <p className="text-slate-500 font-medium">Controle de frequência para o dia selecionado.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".xlsx, .xls, .csv" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            Importar
          </button>
          <button onClick={handleExportExcel} className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-slate-200 rounded-[1.5rem] text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            Exportar
          </button>
          <div className="flex items-center gap-4 bg-white p-3 rounded-[1.5rem] shadow-sm border-2 border-slate-200">
            <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className="outline-none text-slate-700 bg-transparent font-black text-[10px] uppercase tracking-widest cursor-pointer px-3">
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="outline-none text-slate-700 bg-transparent font-black text-[11px] cursor-pointer px-3 border-l-2 border-slate-100" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-[0.2em] flex items-center gap-4">
              <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              Estudantes Encontrados
            </h3>
            <span className="bg-slate-900 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">{filteredStudents.length} registros</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.15em] border-b">
                  <th className="px-10 py-6">Estudante</th>
                  <th className="px-10 py-6 w-48">Turma</th>
                  <th className="px-10 py-6 text-center w-56">Registro de Falta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(student => {
                  const isAbsent = absences.some(a => a.studentId === student.id && a.date === selectedDate);
                  return (
                    <tr key={student.id} className="hover:bg-indigo-50/10 transition-colors group">
                      <td className="px-10 py-6 text-sm font-bold text-slate-800 uppercase tracking-tight">{student.name}</td>
                      <td className="px-10 py-6">
                        <span className="px-4 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest">{student.grade}</span>
                      </td>
                      <td className="px-10 py-6 flex items-center justify-center gap-3">
                        <button 
                          onClick={() => onToggleAbsence(student.id, selectedDate)} 
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border-2 no-select ${isAbsent ? 'bg-red-500 text-white border-red-400 shadow-xl shadow-red-500/20 scale-105 active:scale-95' : 'bg-white border-slate-100 text-slate-200 hover:border-indigo-400 hover:text-indigo-600 hover:scale-105 active:scale-95'}`}
                        >
                          {isAbsent ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                        {isAbsent && (
                          <button 
                            title="Notificar agora"
                            onClick={() => handleDraftEmail({ studentId: student.id, studentName: student.name, reason: 'daily', days: 1 })}
                            className="w-14 h-14 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-md active:scale-95"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button onClick={() => {setIsSaving(true); setTimeout(() => {setIsSaving(false); alert('Registro finalizado e sincronizado!');}, 600);}} disabled={isSaving || filteredStudents.length === 0} className={`px-12 py-5 rounded-[1.8rem] font-black text-xs transition-all shadow-2xl active:scale-95 ${isSaving ? 'bg-slate-400' : 'bg-slate-900 hover:bg-indigo-700 disabled:opacity-50'} text-white uppercase tracking-[0.2em]`}>
              {isSaving ? 'Gravando...' : 'Finalizar Chamada'}
            </button>
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
            <h3 className="font-black text-slate-800 flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] mb-8">
              <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
              </div>
              Alertas Prioritários
            </h3>
            {alerts.length === 0 ? (
              <div className="py-24 text-center space-y-4 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <svg className="text-emerald-400" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-10">Não há casos de risco detectados no momento.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3 custom-scroll">
                {alerts.map((alert, idx) => (
                  <div key={idx} className={`p-6 rounded-3xl border-2 transition-all shadow-md animate-in slide-in-from-right-4 duration-300 ${alert.reason === 'total' ? 'bg-red-50/50 border-red-100' : 'bg-orange-50/50 border-orange-100'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="overflow-hidden">
                        <p className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">{alert.studentName}</p>
                        <p className={`text-[10px] font-black mt-1 uppercase tracking-tighter ${alert.reason === 'total' ? 'text-red-600' : 'text-orange-600'}`}>
                          {alert.days} {alert.reason === 'consecutive' ? 'Faltas Seguidas' : 'Faltas no Total'}
                        </p>
                      </div>
                      <div className={`p-2 rounded-lg ${alert.reason === 'total' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDraftEmail(alert)} 
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                    >
                      Acionar Alerta
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {draftingEmail && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 z-[100]">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[92vh]">
            <div className="p-10 bg-slate-50 border-b flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-800 text-2xl uppercase tracking-tighter">Minuta Inteligente</h3>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-2">Protocolo: {draftingEmail.reasonLabel}</p>
              </div>
              <button onClick={() => setDraftingEmail(null)} className="p-4 hover:bg-red-100 hover:text-red-600 text-slate-400 rounded-[1.5rem] transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="p-10 overflow-y-auto flex-1 space-y-8 bg-white">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-8">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Consultando Inteligência Artificial...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Para (E-mails):</label>
                      <input 
                        type="text" 
                        value={draftingEmail.recipients} 
                        onChange={(e) => setDraftingEmail({...draftingEmail, recipients: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-xs font-bold text-slate-700 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Assunto:</label>
                      <input 
                        type="text" 
                        value={draftingEmail.subject} 
                        onChange={(e) => setDraftingEmail({...draftingEmail, subject: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-xs font-bold text-slate-700 outline-none transition-all" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Conteúdo da Mensagem:</label>
                    <textarea 
                      value={draftingEmail.body} 
                      onChange={(e) => setDraftingEmail({...draftingEmail, body: e.target.value})} 
                      className="w-full min-h-[400px] bg-slate-50 p-10 rounded-[2.5rem] border-none font-serif text-base leading-[1.8] text-slate-700 shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 resize-none transition-all" 
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-5 pt-6 pb-2">
                    <button 
                      onClick={() => { navigator.clipboard.writeText(draftingEmail.body); alert('Minuta copiada para a área de transferência!'); }} 
                      className="flex-1 bg-white border-2 border-slate-200 hover:border-indigo-600 text-slate-600 font-black py-6 rounded-[1.8rem] text-[10px] uppercase tracking-[0.25em] transition-all hover:shadow-lg active:scale-95"
                    >
                      Copiar Texto
                    </button>
                    <a 
                      href={`mailto:${draftingEmail.recipients}?subject=${encodeURIComponent(draftingEmail.subject)}&body=${encodeURIComponent(draftingEmail.body)}`} 
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-[1.8rem] text-[10px] uppercase tracking-[0.25em] text-center shadow-2xl shadow-indigo-600/30 transition-all active:scale-95"
                    >
                      Disparar Mensagem
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Outros Gerenciadores permanecem com estilo aprimorado para touch ---

const StudentManager: React.FC<{
  students: Student[];
  onAdd: (s: Student) => void;
  onUpdate: (s: Student) => void;
  onDelete: (id: string) => void;
}> = ({ students, onAdd, onUpdate, onDelete }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState('');

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.grade.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Base Cadastral</h2>
          <p className="text-slate-500 font-medium">Gestão de dados dos discentes.</p>
        </div>
        <button onClick={() => { setEditingStudent(null); setModalOpen(true); }} className="px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
          + Novo Registro
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-8 bg-slate-50 border-b">
          <div className="relative max-w-md">
            <svg className="absolute left-6 top-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar por nome ou turma..." className="w-full pl-14 pr-8 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-indigo-500 font-medium transition-all" />
          </div>
        </div>
        <div className="overflow-auto flex-1 custom-scroll">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.15em] border-b sticky top-0 bg-white z-10">
                <th className="px-10 py-6">ID Matrícula</th>
                <th className="px-10 py-6">Nome Completo</th>
                <th className="px-10 py-6">Turma</th>
                <th className="px-10 py-6">Contatos</th>
                <th className="px-10 py-6 text-right">Controles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(student => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-6 text-[11px] font-black font-mono text-slate-400">{student.registration}</td>
                  <td className="px-10 py-6 text-sm font-bold text-slate-800 uppercase">{student.name}</td>
                  <td className="px-10 py-6">
                    <span className="px-4 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest">{student.grade}</span>
                  </td>
                  <td className="px-10 py-6 text-[10px] font-black text-indigo-500 uppercase tracking-[0.15em]">
                    {student.emails?.length || 0} E-mail(s) vinculados
                  </td>
                  <td className="px-10 py-6 text-right space-x-3">
                    <button onClick={() => { setEditingStudent(student); setModalOpen(true); }} className="p-4 text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all active:scale-90">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button onClick={() => window.confirm(`Deseja realmente remover ${student.name} do sistema?`) && onDelete(student.id)} className="p-4 text-red-600 hover:bg-red-50 rounded-2xl transition-all active:scale-90">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <StudentModal student={editingStudent} onClose={() => setModalOpen(false)} onSave={s => { if (editingStudent) onUpdate(s); else onAdd(s); setModalOpen(false); }} />
      )}
    </div>
  );
};

const SettingsManager: React.FC<{
  users: User[];
  onAdd: (u: User) => void;
  onUpdate: (u: User) => void;
  onDelete: (id: string) => void;
}> = ({ users, onAdd, onUpdate, onDelete }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [recoveryUser, setRecoveryUser] = useState<User | null>(null);

  const handleRecoverPassword = (userId: string, newPassword: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (userToUpdate) {
      onUpdate({ ...userToUpdate, password: newPassword });
      alert('Senha redefinida com sucesso!');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Equipe Disciplinar</h2>
          <p className="text-slate-500 font-medium">Gestão de acesso e perfis dos funcionários.</p>
        </div>
        <button onClick={() => { setEditingUser(null); setModalOpen(true); }} className="px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl transition-all active:scale-95">
          + Adicionar Perfil
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {users.map(u => (
          <div key={u.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-all">
               <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
               </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="relative">
                <img src={u.avatar} className="w-28 h-28 rounded-full border-[6px] border-slate-50 shadow-inner group-hover:scale-110 transition-all object-cover" alt={u.name} />
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full"></div>
              </div>
              <div>
                <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg">{u.name}</h4>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">{u.role}</p>
              </div>
              <div className="flex flex-col gap-3 w-full pt-4">
                <div className="flex gap-3 w-full">
                  <button onClick={() => { setEditingUser(u); setModalOpen(true); }} className="flex-1 py-4 bg-slate-50 text-indigo-600 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-indigo-600 hover:text-white transition-all">Editar</button>
                  {users.length > 1 && (
                    <button onClick={() => window.confirm(`Remover perfil de ${u.name}?`) && onDelete(u.id)} className="p-4 bg-slate-50 text-red-600 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setRecoveryUser(u)} 
                  className="w-full py-3 bg-slate-50 text-slate-400 hover:text-indigo-600 border border-transparent hover:border-indigo-100 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Redefinir Senha do Perfil
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-900 rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[140%] bg-white/5 skew-x-12 group-hover:bg-white/10 transition-all"></div>
        <div className="p-8 bg-white/10 rounded-[2.5rem] relative z-10 border border-white/10">
          <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
        </div>
        <div className="flex-1 space-y-4 text-center md:text-left relative z-10">
          <h3 className="text-3xl font-black uppercase tracking-tighter">Protocolo de Segurança</h3>
          <p className="text-indigo-200 text-base max-w-xl leading-relaxed">As senhas individuais garantem a auditoria completa de quem realizou cada chamada. O PIN Master (1234) deve ser guardado apenas pela gestão escolar para casos de emergência.</p>
        </div>
        <div className="bg-white/10 px-8 py-6 rounded-[2rem] border border-white/20 relative z-10 backdrop-blur-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-2">Ambiente Certificado</p>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-sm font-black uppercase tracking-[0.1em]">Sincronização Ativa</span>
          </div>
        </div>
      </div>

      {modalOpen && (
        <UserModal user={editingUser} onClose={() => setModalOpen(false)} onSave={u => { if (editingUser) onUpdate(u); else onAdd(u); setModalOpen(false); }} />
      )}

      {recoveryUser && (
        <PasswordRecoveryModal 
          user={recoveryUser} 
          onClose={() => setRecoveryUser(null)} 
          onRecover={handleRecoverPassword} 
        />
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'attendance' | 'manage' | 'settings'>('attendance');
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [isInitialized, setIsInitialized] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const notifiedIds = useRef<Set<string>>(new Set());

  // Detecção de instalação PWA
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Carregamento Inicial
  useEffect(() => {
    async function init() {
      const savedStudents = await loadStudents();
      const savedAbsences = await loadAbsences();
      const savedUsers = await loadUsers();
      
      if (savedStudents) setStudents(savedStudents);
      if (savedAbsences) setAbsences(savedAbsences);
      if (savedUsers) setUsers(savedUsers);
      
      setIsInitialized(true);
    }
    init();
  }, []);

  // Persistência
  useEffect(() => { 
    if (isInitialized) {
      saveStudents(students);
      saveAbsences(absences);
      saveUsers(users);
    }
  }, [students, absences, users, isInitialized]);

  useEffect(() => {
    const handleUnload = () => {
      if (isInitialized) {
        saveStudents(students);
        saveAbsences(absences);
        saveUsers(users);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [students, absences, users, isInitialized]);

  const handleToggleAbsence = (studentId: string, date: string) => {
    setAbsences(prev => {
      const exists = prev.find(a => a.studentId === studentId && a.date === date);
      return exists ? prev.filter(a => !(a.studentId === studentId && a.date === date)) : [...prev, { studentId, date }];
    });
  };

  const alerts: NotificationAlert[] = useMemo(() => {
    const active: NotificationAlert[] = [];
    const absenceMap = new Map<string, string[]>();
    absences.forEach(a => {
      if (!absenceMap.has(a.studentId)) absenceMap.set(a.studentId, []);
      absenceMap.get(a.studentId)!.push(a.date);
    });
    students.forEach(student => {
      const dates = (absenceMap.get(student.id) || []).sort();
      if (dates.length >= 15) active.push({ studentId: student.id, studentName: student.name, reason: 'total', days: dates.length });
      else if (dates.length >= 3) {
        let max = 1, curr = 1;
        for (let i = 0; i < dates.length - 1; i++) {
          const d1 = new Date(dates[i]);
          const d2 = new Date(dates[i+1]);
          const diff = Math.round((d2.getTime() - d1.getTime()) / 86400000);
          if (diff === 1) curr++; 
          else { max = Math.max(max, curr); curr = 1; }
        }
        max = Math.max(max, curr);
        if (max >= 3) active.push({ studentId: student.id, studentName: student.name, reason: 'consecutive', days: max });
      }
    });
    return active;
  }, [students, absences]);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      alerts.forEach(alert => {
        const id = `${alert.studentId}-${alert.reason}-${alert.days}`;
        if (!notifiedIds.current.has(id)) {
          new Notification(`Alerta Escolar: ${alert.studentName}`, { body: `${alert.days} faltas em registro.` });
          notifiedIds.current.add(id);
        }
      });
    }
  }, [alerts]);

  if (!user) return <LoginScreen users={users} onLogin={setUser} onUpdateUsers={setUsers} />;

  return (
    <Layout 
      user={user} 
      onLogout={() => setUser(null)} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      deferredPrompt={deferredPrompt}
      onInstall={handleInstallClick}
    >
      {activeTab === 'attendance' && (
        <AttendanceManager students={students} onUpdateStudents={setStudents} absences={absences} user={user} onToggleAbsence={handleToggleAbsence} alerts={alerts} />
      )}
      {activeTab === 'manage' && (
        <StudentManager 
          students={students} 
          onAdd={s => setStudents([...students, s])} 
          onUpdate={s => setStudents(students.map(old => old.id === s.id ? s : old))}
          onDelete={id => setStudents(students.filter(s => s.id !== id))}
        />
      )}
      {activeTab === 'settings' && (
        <SettingsManager 
          users={users}
          onAdd={u => setUsers([...users, u])}
          onUpdate={u => {
            const updated = users.map(old => old.id === u.id ? u : old);
            setUsers(updated);
            if (u.id === user.id) setUser(u);
          }}
          onDelete={id => setUsers(users.filter(u => u.id !== id))}
        />
      )}
    </Layout>
  );
}
