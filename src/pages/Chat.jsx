import { useState, useEffect, useContext, useRef } from 'react';
import { Send, User, Search, MoreVertical, Loader } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const Chat = () => {
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Initialize socket and fetch conversations
  useEffect(() => {
    if (!user) return;
    
    // Connect socket
    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.on('message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    const fetchConversations = async () => {
      try {
        const res = await api.get('/chat/conversations');
        setConversations(res.data.data);
        if (res.data.data.length > 0) {
          handleSelectChat(res.data.data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user]);

  const handleSelectChat = async (conv) => {
    setActiveChat(conv);
    socketRef.current.emit('joinRoom', conv._id);
    
    try {
      const res = await api.get(`/chat/messages/${conv._id}`);
      setMessages(res.data.data);
    } catch (err) {
      console.error(err);
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

  if (!user) {
    return <div className="p-8 text-center text-slate-500">Please log in to use Chat.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 h-[calc(100vh-100px)]">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm h-full flex overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-1/3 border-r border-slate-100 flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search contacts..." className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-transparent focus:border-slate-200 focus:bg-white outline-none transition-colors text-sm" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
               <div className="p-4 flex items-center justify-center text-slate-500"><Loader className="w-5 h-5 animate-spin" /></div>
            ) : conversations.length === 0 ? (
               <div className="p-4 text-center text-sm text-slate-500">No conversations yet.</div>
            ) : (
              conversations.map((conv) => {
                const otherUser = getOtherParticipant(conv);
                return (
                  <div 
                    key={conv._id} 
                    onClick={() => handleSelectChat(conv)}
                    className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${activeChat?._id === conv._id ? 'bg-primary-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold uppercase">
                        {otherUser.name?.charAt(0) || 'U'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">{otherUser.name}</h3>
                        <span className="text-xs text-slate-500">{new Date(conv.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-sm text-slate-500 truncate">{conv.lastMessage?.text || 'No messages yet'}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        {activeChat ? (
          <div className="flex-1 flex flex-col bg-slate-50">
            {/* Chat Header */}
            <div className="h-20 bg-white border-b border-slate-100 px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 uppercase">
                  {getOtherParticipant(activeChat).name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{getOtherParticipant(activeChat).name}</h3>
                  <p className="text-xs text-slate-500">{getOtherParticipant(activeChat).role}</p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => {
                const isMe = msg.sender === user._id;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`${isMe ? 'bg-primary-500 text-white rounded-tr-sm' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'} px-5 py-3 rounded-2xl shadow-sm max-w-md`}>
                      {msg.text}
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-200 text-right' : 'text-slate-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-full border border-slate-200">
                <input 
                  type="text" 
                  placeholder="Type your message..." 
                  className="flex-1 bg-transparent px-4 py-2 outline-none text-slate-700" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                  onClick={handleSend}
                  className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-400">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
