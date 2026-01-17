import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import ChatView from '../components/ChatView';
import { Conversation } from '../types';
import { subscribeToUserConversations, createConversation } from '../services/firestore';

export default function Dashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState(false);

  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToUserConversations(currentUser.uid, (convs) => {
      setConversations(convs);
    });

    return () => unsubscribe();
  }, [currentUser]);

  async function handleNewChat() {
    if (!currentUser || creatingChat) return;

    setCreatingChat(true);
    try {
      const title = `Chat ${conversations.length + 1}`;
      const newId = await createConversation(currentUser.uid, title);
      setActiveConversationId(newId);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setCreatingChat(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex bg-white">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewChat={handleNewChat}
        creatingChat={creatingChat}
      />

      <div className="flex-1 flex flex-col">
        {activeConversationId ? (
          <ChatView conversationId={activeConversationId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Start a New Conversation
            </h2>
            <p className="text-gray-500 max-w-md">
              Start a new conversation to talk with the AI. Click "New Chat" in the sidebar to begin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
