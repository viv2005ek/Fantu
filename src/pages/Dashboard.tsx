import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { MessageSquare, Plus, Building2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import AnimatedBackground from '../components/AnimatedBackground';
import Sidebar from '../components/Sidebar';
import ChatView from '../components/ChatView';
import CompanyChat from '../components/CompanyChat';
import VirtualEyesChat from '../components/VirtualEyesChat';
import { Conversation, Company } from '../types';
import { subscribeToUserConversations, createConversation, subscribeToUserCompanies, createCompany } from '../services/firestore';

export default function Dashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [creatingVirtualEyes, setCreatingVirtualEyes] = useState(false);

  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeConversations = subscribeToUserConversations(currentUser.uid, (convs) => {
      setConversations(convs);
    });

    const unsubscribeCompanies = subscribeToUserCompanies(currentUser.email || currentUser.uid, (comps) => {
      setCompanies(comps);
    });

    return () => {
      unsubscribeConversations();
      unsubscribeCompanies();
    };
  }, [currentUser]);

  async function handleNewChat() {
    if (!currentUser || creatingChat) return;

    setCreatingChat(true);
    try {
      const title = `Chat ${conversations.length + 1}`;
      const newId = await createConversation(currentUser.uid, title);
      setActiveConversationId(newId);
      setActiveCompanyId(null);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setCreatingChat(false);
    }
  }

  async function handleNewCompany() {
    if (!currentUser || creatingCompany) return;

    const companyName = prompt('Enter company name:');
    if (!companyName) return;

    setCreatingCompany(true);
    try {
      const newId = await createCompany(currentUser.email || currentUser.uid, companyName);
      setActiveCompanyId(newId);
      setActiveConversationId(null);
    } catch (error) {
      console.error('Failed to create company:', error);
    } finally {
      setCreatingCompany(false);
    }
  }

  async function handleNewVirtualEyes() {
    if (!currentUser || creatingVirtualEyes) return;

    setCreatingVirtualEyes(true);
    try {
      const virtualEyesConversations = conversations.filter(c => c.type === 'virtual-eyes');
      const title = `Virtual Eyes ${virtualEyesConversations.length + 1}`;
      const newId = await createConversation(currentUser.uid, title, 'virtual-eyes');
      setActiveConversationId(newId);
      setActiveCompanyId(null);
    } catch (error) {
      console.error('Failed to create virtual eyes:', error);
    } finally {
      setCreatingVirtualEyes(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative">
        <AnimatedBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 relative z-10"
        >
          <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-sm text-cyan-400 font-medium animate-pulse heading-font">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex bg-slate-950 relative">
      <AnimatedBackground />
      <Sidebar
        conversations={conversations}
        companies={companies}
        activeConversationId={activeConversationId}
        activeCompanyId={activeCompanyId}
        onSelectConversation={setActiveConversationId}
        onSelectCompany={setActiveCompanyId}
        onNewChat={handleNewChat}
        onNewCompany={handleNewCompany}
        onNewVirtualEyes={handleNewVirtualEyes}
        creatingChat={creatingChat}
        creatingCompany={creatingCompany}
        creatingVirtualEyes={creatingVirtualEyes}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {activeConversationId ? (
          (() => {
            const conv = conversations.find(c => c.id === activeConversationId);
            return conv?.type === 'virtual-eyes' ? (
              <VirtualEyesChat conversationId={activeConversationId} />
            ) : (
              <ChatView conversationId={activeConversationId} />
            );
          })()
        ) : activeCompanyId ? (
          <CompanyChat companyId={activeCompanyId} />
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10"
          >
            <div className="relative mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="w-28 h-28 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse-glow border border-cyan-500/30"
              >
                <MessageSquare className="w-14 h-14 text-cyan-400" />
              </motion.div>
              <div className="absolute inset-0 bg-cyan-500 rounded-3xl blur-2xl opacity-20"></div>
            </div>
            <h2 className="text-4xl font-bold heading-font mb-3 bg-gradient-to-r from-cyan-400 to-blue-400 text-gradient">
              Start a New Conversation
            </h2>
            <p className="text-slate-400 max-w-md text-lg leading-relaxed mb-10">
              Start a new conversation to talk with the AI. Choose from Chat, Virtual Eyes, or Company modes.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewChat}
                disabled={creatingChat}
                className="px-7 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:neon-glow transition-all duration-300 flex items-center gap-2 ripple font-medium disabled:opacity-50 heading-font"
              >
                <Plus className="w-5 h-5" />
                New Chat
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewVirtualEyes}
                disabled={creatingVirtualEyes}
                className="px-7 py-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl hover:shadow-2xl hover:shadow-violet-500/50 transition-all duration-300 flex items-center gap-2 ripple font-medium disabled:opacity-50 heading-font"
              >
                <Eye className="w-5 h-5" />
                Virtual Eyes
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewCompany}
                disabled={creatingCompany}
                className="px-7 py-4 glass-effect border border-cyan-500/30 text-cyan-300 rounded-xl hover:neon-border transition-all duration-300 flex items-center gap-2 ripple font-medium disabled:opacity-50 heading-font"
              >
                <Building2 className="w-5 h-5" />
                Add Company
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
