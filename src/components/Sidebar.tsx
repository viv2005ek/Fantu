import { MessageCircle, Plus, LogOut, MessageSquare, Trash2, Loader2, Building2, Edit2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { deleteConversation, updateConversationTitle, updateCompanyName } from '../services/firestore';
import { Conversation, Company } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  companies: Company[];
  activeConversationId: string | null;
  activeCompanyId: string | null;
  onSelectConversation: (id: string | null) => void;
  onSelectCompany: (id: string | null) => void;
  onNewChat: () => void;
  onNewCompany: () => void;
  onNewVirtualEyes: () => void;
  creatingChat: boolean;
  creatingCompany: boolean;
  creatingVirtualEyes: boolean;
}

export default function Sidebar({
  conversations,
  companies,
  activeConversationId,
  activeCompanyId,
  onSelectConversation,
  onSelectCompany,
  onNewChat,
  onNewCompany,
  onNewVirtualEyes,
  creatingChat,
  creatingCompany,
  creatingVirtualEyes
}: SidebarProps) {
  const { currentUser, logout } = useAuth();

  async function handleDelete(e: React.MouseEvent, convId: string) {
    e.stopPropagation();

    try {
      await deleteConversation(convId);
      if (activeConversationId === convId) {
        onSelectConversation(null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }

  async function handleRenameConversation(e: React.MouseEvent, convId: string, currentTitle: string) {
    e.stopPropagation();

    const newTitle = prompt('Enter new name:', currentTitle);
    if (newTitle && newTitle.trim() !== currentTitle) {
      try {
        await updateConversationTitle(convId, newTitle.trim());
      } catch (error) {
        console.error('Failed to rename conversation:', error);
        alert('Failed to rename conversation');
      }
    }
  }

  async function handleRenameCompany(e: React.MouseEvent, companyId: string, currentName: string) {
    e.stopPropagation();

    const newName = prompt('Enter new company name:', currentName);
    if (newName && newName.trim() !== currentName) {
      try {
        await updateCompanyName(companyId, newName.trim());
      } catch (error) {
        console.error('Failed to rename company:', error);
        alert('Failed to rename company');
      }
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }

  return (
    <div className="w-72 glass-darker border-r border-cyan-500/20 flex flex-col h-full shadow-2xl relative z-20">
      <div className="p-4 border-b border-cyan-500/20 glass-effect">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-4"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <MessageCircle className="w-7 h-7 text-cyan-400" />
            </motion.div>
            <div className="absolute inset-0 bg-cyan-400 rounded-full blur-md opacity-50"></div>
          </div>
          <span className="text-lg font-bold heading-font bg-gradient-to-r from-cyan-400 to-blue-400 text-gradient">
            Thread.ai
          </span>
        </motion.div>

        <div className="space-y-2.5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewChat}
            disabled={creatingChat}
            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:neon-glow transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ripple font-medium heading-font"
          >
            {creatingChat ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            New Chat
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewVirtualEyes}
            disabled={creatingVirtualEyes}
            className="w-full py-3 px-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl hover:shadow-2xl hover:shadow-violet-500/50 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ripple font-medium heading-font"
          >
            {creatingVirtualEyes ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            Virtual Eyes
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewCompany}
            disabled={creatingCompany}
            className="w-full py-3 px-4 glass-effect border border-cyan-500/30 text-cyan-300 rounded-xl hover:neon-border transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ripple font-medium heading-font"
          >
            {creatingCompany ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Building2 className="w-4 h-4" />
            )}
            Add Company
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        <div className="mb-5">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 px-2 heading-font">
            Chats
          </div>
          {conversations.filter(c => !c.type || c.type === 'normal').length === 0 ? (
            <div className="text-center py-4">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No chats yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.filter(c => !c.type || c.type === 'normal').map((conv) => (
                <motion.div
                  key={conv.id}
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onSelectCompany(null);
                  }}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${
                    activeConversationId === conv.id && !activeCompanyId
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 truncate text-sm">{conv.title}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => handleRenameConversation(e, conv.id, conv.title)}
                      className="p-1 hover:bg-cyan-500/20 rounded"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="p-1 hover:bg-red-500/20 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-5">
          <div className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-3 px-2 heading-font">
            Virtual Eyes
          </div>
          {conversations.filter(c => c.type === 'virtual-eyes').length === 0 ? (
            <div className="text-center py-4">
              <Eye className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No virtual eyes yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.filter(c => c.type === 'virtual-eyes').map((conv) => (
                <motion.div
                  key={conv.id}
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onSelectCompany(null);
                  }}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${
                    activeConversationId === conv.id && !activeCompanyId
                      ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border border-violet-500/30'
                      : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                  }`}
                >
                  <Eye className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 truncate text-sm">{conv.title}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => handleRenameConversation(e, conv.id, conv.title)}
                      className="p-1 hover:bg-violet-500/20 rounded"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="p-1 hover:bg-red-500/20 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 px-2 heading-font">
            Companies
          </div>
          {companies.length === 0 ? (
            <div className="text-center py-4">
              <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No companies yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {companies.map((company) => (
                <motion.div
                  key={company.id}
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    onSelectCompany(company.id!);
                    onSelectConversation(null);
                  }}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${
                    activeCompanyId === company.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                  }`}
                >
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 truncate text-sm">{company.name}</span>
                  <button
                    onClick={(e) => handleRenameCompany(e, company.id!, company.name)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-cyan-500/20 rounded transition-all"
                    title="Rename"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-cyan-500/20 glass-effect">
        <div className="text-xs text-cyan-400 mb-3 truncate font-medium px-2">
          {currentUser?.email}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full py-2.5 px-4 text-slate-300 hover:text-white glass-effect border border-cyan-500/30 hover:neon-border rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium ripple heading-font"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </motion.button>
      </div>
    </div>
  );
}
