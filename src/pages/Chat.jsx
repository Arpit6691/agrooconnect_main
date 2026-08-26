import { useState, useEffect, useContext, useRef } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { Send, User, Search, MoreVertical, Loader, ArrowLeft, MessageSquare, Phone, Mail, CheckCheck } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const Chat = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Redirect to home if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Initialize socket and fetch conversations
  useEffect(() => {
    if (!user) return;
    
    // Connect socket
    const socketBaseUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000');
    socketRef.current = io(socketBaseUrl);
    
    socketRef.current.on('message', (message) => {
      setMessages((prev) => {
        // Prevent duplicate messages if any
        if (prev.some(m => m._id && message._id && m._id === message._id)) return prev;
        return [...prev, message];
      });
      // Also update conversation last message in sidebar
      setConversations((prev) => 
        prev.map(c => c._id === message.conversationId ? { ...c, lastMessage: message, updatedAt: new Date().toISOString() } : c)
      );
    });

    const targetReceiverId = location.state?.receiverId || searchParams.get('userId');
    const targetConvId = location.state?.conversationId || searchParams.get('convId');
    const initMsg = location.state?.initialMessage || '';

    if (initMsg) {
      setInputText(initMsg);
    }

    const fetchConversations = async () => {
      try {
        const res = await api.get('/chat/conversations');
        let convList = res.data.data || [];
        
        // If a specific receiver was passed (e.g. clicked Chat on an Offer or Deal)
        if (targetReceiverId) {
          let foundConv = convList.find(c => 
            c.participants?.some(p => (p._id === targetReceiverId || p === targetReceiverId))
          );

          if (!foundConv) {
            // Start or get conversation with this receiver
            const startRes = await api.post('/chat/conversations', { receiverId: targetReceiverId });
            if (startRes.data.data) {
              foundConv = startRes.data.data;
              convList = [foundConv, ...convList.filter(c => c._id !== foundConv._id)];
            }
          }

          setConversations(convList);
          if (foundConv) {
            handleSelectChat(foundConv);
          } else if (convList.length > 0) {
            handleSelectChat(convList[0]);
          }
        } else if (targetConvId) {
          const foundConv = convList.find(c => c._id === targetConvId);
          setConversations(convList);
          if (foundConv) {
            handleSelectChat(foundConv);
          } else if (convList.length > 0) {
            handleSelectChat(convList[0]);
          }
        } else {
          setConversations(convList);
          if (convList.length > 0) {
            handleSelectChat(convList[0]);
          }
        }
      } catch (err) {
        console.error('Error loading conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user, location.state, searchParams]);

  const handleSelectChat = async (conv) => {
    setActiveChat(conv);
    if (socketRef.current) {
      socketRef.current.emit('joinRoom', conv._id);
    }
    
    try {
      const res = await api.get(`/chat/messages/${conv._id}`);
      setMessages(res.data.data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || !activeChat) return;

    const messageData = {
      roomId: activeChat._id,
      senderId: user._id,
      text: inputText
    };

    socketRef.current.emit('sendMessage', messageData);
    setInputText('');
  };

  const getOtherParticipant = (conv) => {
    return conv.participants.find(p => p._id !== user?._id) || {};
  };

  if (authLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-slate-400">
        <Loader className="w-8 h-8 animate-spin text-[#16A34A]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    const otherUser = getOtherParticipant(conv);
    return otherUser.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           otherUser.role?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-90px)]">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm h-full flex overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col shrink-0">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#16A34A]" /> Messages
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-[#16A34A] rounded-full">
                {conversations.length} {conversations.length === 1 ? 'chat' : 'chats'}
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name or role..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 focus:border-[#16A34A] focus:bg-white outline-none transition-all text-sm" 
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
               <div className="p-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                 <Loader className="w-6 h-6 animate-spin text-[#16A34A]" />
                 <p className="text-xs">Loading conversations...</p>
               </div>
            ) : filteredConversations.length === 0 ? (
               <div className="p-8 text-center text-sm text-slate-500">
                 {searchQuery ? 'No contacts match your search.' : 'No conversations yet. Make an offer or deal to start chatting!'}
               </div>
            ) : (
              filteredConversations.map((conv) => {
                const otherUser = getOtherParticipant(conv);
                const isSelected = activeChat?._id === conv._id;
                return (
                  <div 
                    key={conv._id} 
                    onClick={() => handleSelectChat(conv)}
                    className={`p-4 flex items-center gap-3.5 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50/70 border-l-4 border-[#16A34A]' : 'hover:bg-slate-50'}`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold uppercase shadow-sm">
                        {otherUser.name?.charAt(0) || 'U'}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-semibold text-slate-900 truncate text-sm">{otherUser.name || 'User'}</h3>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500 truncate">{conv.lastMessage?.text || 'Click to start chat'}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase shrink-0 ${otherUser.role === 'trader' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-700'}`}>
                          {otherUser.role || 'User'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        {activeChat ? (
          <div className="flex-1 flex flex-col bg-slate-50">
            {/* Chat Header */}
            <div className="h-20 bg-white border-b border-slate-100 px-6 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white uppercase shadow-sm">
                  {getOtherParticipant(activeChat).name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{getOtherParticipant(activeChat).name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getOtherParticipant(activeChat).role === 'trader' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-700'}`}>
                      {getOtherParticipant(activeChat).role}
                    </span>
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Online
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getOtherParticipant(activeChat).phone && (
                  <a href={`tel:${getOtherParticipant(activeChat).phone}`} className="p-2 text-slate-400 hover:text-[#16A34A] rounded-xl hover:bg-slate-50 transition-colors" title="Call">
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                {getOtherParticipant(activeChat).email && (
                  <a href={`mailto:${getOtherParticipant(activeChat).email}`} className="p-2 text-slate-400 hover:text-[#16A34A] rounded-xl hover:bg-slate-50 transition-colors" title="Email">
                    <Mail className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <MessageSquare className="w-12 h-12 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">Start the conversation</p>
                  <p className="text-xs text-slate-400 text-center max-w-sm">Discuss offer pricing, quantity details, pickup schedules, and deals directly.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = (msg.sender?._id || msg.sender) === user?._id;
                  return (
                    <div key={msg._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`${isMe ? 'bg-[#16A34A] text-white rounded-tr-sm shadow-md shadow-[#16A34A]/20' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm shadow-sm'} px-5 py-3 rounded-2xl max-w-md`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <p className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          {isMe && <CheckCheck className="w-3 h-3 text-emerald-200 inline" />}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/80 focus-within:border-[#16A34A] focus-within:bg-white transition-all">
                <input 
                  type="text" 
                  placeholder="Type a message (discuss offer, delivery, counter-price...)" 
                  className="flex-1 bg-transparent px-4 py-2 outline-none text-slate-700 text-sm" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#22C55E] disabled:opacity-50 disabled:hover:bg-[#16A34A] text-white flex items-center gap-1.5 text-sm font-bold transition-all shadow-md shadow-[#16A34A]/20"
                >
                  <Send className="w-4 h-4" /> Send
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-8">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-[#16A34A] mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">Your AgroConnect Chat</h3>
            <p className="text-sm text-slate-500 text-center max-w-sm">Select a conversation from the left, or click "Chat" from any offer or deal on your dashboard.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;

