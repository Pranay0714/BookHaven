import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import api from '../utils/api';
import {
  HiSparkles,
  HiX,
  HiOutlineTrash,
  HiCog,
  HiSearch,
  HiPlus,
  HiOutlineBookOpen,
  HiCurrencyRupee,
  HiExternalLink,
  HiOutlineLightBulb,
  HiOutlineEmojiHappy,
  HiChevronDown,
  HiChevronUp,
} from 'react-icons/hi';
import { BsStars, BsSendFill } from 'react-icons/bs';

// Preset Moods for quick recommendations
const MOOD_OPTIONS = [
  { id: 'happy', label: '😊 Happy & Uplifting', prompt: 'Suggest a joyful and uplifting book to brighten my mood.' },
  { id: 'calm', label: '🧘 Calm & Peaceful', prompt: 'Suggest some peaceful and soothing books for relaxing and stress relief.' },
  { id: 'thriller', label: '⚡ Thriller & Mystery', prompt: 'Suggest gripping thriller, murder mystery or suspense books!' },
  { id: 'motivation', label: '💡 Motivation & Growth', prompt: 'Suggest best motivational and personal growth books for success and habits.' },
  { id: 'romance', label: '💖 Heartwarming & Romance', prompt: 'Suggest heartwarming, emotional or romantic books with good storylines.' },
  { id: 'adventure', label: '🚀 Sci-Fi & Adventure', prompt: 'Suggest mind-bending sci-fi, fantasy, or epic adventure books!' },
];

const INITIAL_MESSAGE = {
  id: 'welcome',
  sender: 'ai',
  text: `Hello! 👋 I'm your **BookHaven AI assistant, powered by Google Gemini**.\n\nYou can ask me to:\n- 🔍 **Find or search for books:** *"Do we have Atomic Habits?"* or *"Show books under ₹400"*\n- ➕ **Add one or multiple books:** *"Add The Hobbit by J.R.R. Tolkien, 1937, 399 and Dune by Frank Herbert, 1965, 499* or *"Add 5 peaceful books from the web at ₹300 each."*\n- 🎭 **Get mood-based recommendations:** *"Suggest books for feeling relaxed"* or choose one of the mood buttons below. Recommendations only include currently in-stock books from this store.\n- 📊 **Explore store insights:** *"Summarize our bookstore inventory"*\n\nHow can I help you today?`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

// Simple Markdown Renderer for assistant chat
const MarkdownText = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  return (
    <div className='space-y-1.5 text-sm leading-relaxed'>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className='h-1' />;
        }

        // Bullet point
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.substring(2);
          return (
            <div key={idx} className='flex items-start gap-2 pl-1'>
              <span className='text-indigo-500 font-bold mt-1 text-xs'>•</span>
              <div>{renderInline(itemText)}</div>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className='flex items-start gap-2 pl-1'>
              <span className='text-indigo-600 font-semibold text-xs min-w-[16px]'>
                {numMatch[1]}.
              </span>
              <div>{renderInline(numMatch[2])}</div>
            </div>
          );
        }

        // Heading
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className='font-bold text-slate-800 text-sm mt-2'>
              {renderInline(trimmed.substring(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          return (
            <h3 key={idx} className='font-extrabold text-indigo-900 text-sm mt-2'>
              {renderInline(trimmed.replace(/^#+\s*/, ''))}
            </h3>
          );
        }

        return <p key={idx}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
};

// Helper for inline bold, italic, code
const renderInline = (text) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className='font-semibold text-slate-900'>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className='italic'>
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className='px-1.5 py-0.5 bg-slate-100 text-indigo-700 rounded text-xs font-mono'
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

const GeminiAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('gemini_chat_messages_v2');
      return saved ? JSON.parse(saved) : [INITIAL_MESSAGE];
    } catch {
      return [INITIAL_MESSAGE];
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMoodPills, setShowMoodPills] = useState(false);
  const [customKey, setCustomKey] = useState(() => {
    return localStorage.getItem('gemini_custom_api_key') || '';
  });
  const [tempKeyInput, setTempKeyInput] = useState('');
  const [hasServerKey, setHasServerKey] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Save messages in sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('gemini_chat_messages_v2', JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not save chat in sessionStorage:', e);
    }
  }, [messages]);

  // Check backend Gemini status
  useEffect(() => {
    api
      .get('/ai/status')
      .then((res) => {
        setHasServerKey(res.data?.hasServerKey || false);
      })
      .catch(() => {
        setHasServerKey(false);
      });
  }, []);

  // Auto scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !showSettings) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, showSettings]);

  const handleSendMessage = async (customText = null, moodContext = null) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const historyContext = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const headers = {};
      if (customKey.trim()) {
        headers['x-gemini-key'] = customKey.trim();
      }

      const response = await api.post(
        '/ai/chat',
        {
          message: textToSend,
          history: historyContext,
          mood: moodContext,
        },
        { headers }
      );

      const data = response.data;

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.reply || 'I understand.',
        action: data.action,
        actionData: data.actionData,
        addedBook: data.addedBook,
        addedBooks: data.addedBooks?.length
          ? data.addedBooks
          : data.addedBook
            ? [data.addedBook]
            : [],
        matchedBooks: data.matchedBooks || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If a book was successfully added by the assistant:
      if (data.addedBook || data.refreshBooks) {
        const addedCount = data.addedBooks?.length || (data.addedBook ? 1 : 0);
        enqueueSnackbar(
          `✨ ${addedCount > 1 ? `${addedCount} books` : 'Book'} successfully added to inventory!`,
          { variant: 'success' }
        );
        // Dispatch custom event to reload books on Home page
        window.dispatchEvent(new CustomEvent('books-updated'));
      }

      // If API key is missing
      if (data.requiresApiKey) {
        setShowSettings(true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errReply =
        error.response?.data?.message ||
        'Sorry, your request could not be processed. Please try again.';
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `⚠️ **Error:** ${errReply}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    sessionStorage.removeItem('gemini_chat_messages_v2');
    enqueueSnackbar('Chat cleared', { variant: 'info' });
  };

  const handleSaveApiKey = () => {
    if (tempKeyInput.trim()) {
      localStorage.setItem('gemini_custom_api_key', tempKeyInput.trim());
      setCustomKey(tempKeyInput.trim());
      enqueueSnackbar('Gemini API Key saved successfully!', { variant: 'success' });
    } else {
      localStorage.removeItem('gemini_custom_api_key');
      setCustomKey('');
      enqueueSnackbar('Custom API Key removed (using backend .env)', { variant: 'info' });
    }
    setShowSettings(false);
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 1. FLOATING ACTION BUTTON (CIRCLE AT BOTTOM RIGHT)            */}
      {/* ============================================================== */}
      <div className='fixed bottom-6 right-6 z-50 flex items-center gap-3'>
        {/* Helper tooltip/pill when closed */}
        {!isOpen && (
          <div
            onClick={() => setIsOpen(true)}
            className='hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md text-white text-xs font-medium rounded-full shadow-lg border border-slate-700/60 cursor-pointer hover:bg-slate-900 transition-all animate-pulse'
          >
            <BsStars className='text-amber-300 text-sm' />
            <span>Ask Gemini AI</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label='Toggle Gemini AI Assistant'
          title='Gemini AI Bookstore Assistant'
          className={`relative group w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 transform active:scale-90 ${
            isOpen
              ? 'bg-slate-800 hover:bg-slate-700 rotate-90 shadow-slate-900/40'
              : 'bg-gradient-to-tr from-indigo-600 via-indigo-700 to-sky-500 hover:scale-105 shadow-indigo-600/50 hover:shadow-indigo-600/70'
          }`}
        >
          {/* Subtle glowing ring */}
          {!isOpen && (
            <span className='absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-400 opacity-60 blur-sm group-hover:opacity-90 transition-opacity pointer-events-none animate-spin-slow' />
          )}

          <div className='relative z-10 flex items-center justify-center'>
            {isOpen ? (
              <HiX className='text-2xl text-slate-200' />
            ) : (
              <div className='flex flex-col items-center justify-center'>
                <HiSparkles className='text-2xl text-amber-200 animate-pulse' />
                <span className='text-[9px] font-extrabold uppercase tracking-wider text-sky-100 -mt-0.5'>
                  AI
                </span>
              </div>
            )}
          </div>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 2. CHAT DRAWER / WINDOW                                       */}
      {/* ============================================================== */}
      {isOpen && (
        <div
          role='dialog'
          aria-modal='true'
          className='fixed bottom-24 right-3 sm:right-6 w-[94vw] sm:w-[460px] h-[640px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden z-50 animate-fadeIn font-sans'
        >
          {/* Chat Header */}
          <div className='bg-gradient-to-r from-indigo-900 via-indigo-800 to-sky-800 text-white p-4 flex items-center justify-between shadow-md relative'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-xl text-amber-300 shadow-inner'>
                <BsStars />
              </div>
              <div>
                <div className='flex items-center gap-2'>
                  <h3 className='font-bold text-sm tracking-tight'>BookHaven AI</h3>
                  <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'>
                    <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping'></span>
                    Gemini
                  </span>
                </div>
                <p className='text-[11px] text-indigo-200'>Find, add & explore books by mood</p>
              </div>
            </div>

           
          </div>

          

          {/* Quick Mood Accordion Toggle */}
          <div className='px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs'>
            <div className='flex items-center gap-1 text-slate-600 font-medium'>
              <HiOutlineEmojiHappy className='text-indigo-600 text-sm' />
              <span>Recommendations by Mood:</span>
            </div>
            <button
              onClick={() => setShowMoodPills((p) => !p)}
              className='text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5'
            >
              <span>{showMoodPills ? 'Hide' : 'Show Moods'}</span>
              {showMoodPills ? <HiChevronUp /> : <HiChevronDown />}
            </button>
          </div>

          {/* Mood Pills Strip */}
          {showMoodPills && (
            <div className='px-3 py-2 bg-indigo-50/50 border-b border-indigo-100 flex gap-1.5 overflow-x-auto scrollbar-none animate-fadeIn'>
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => handleSendMessage(mood.prompt, mood.id)}
                  disabled={loading}
                  className='shrink-0 px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-slate-700 rounded-full border border-indigo-200/80 text-[11px] font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50'
                >
                  {mood.label}
                </button>
              ))}
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className='flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60'>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 shadow-sm text-sm ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-slate-100'
                  }`}
                >
                  {msg.sender === 'ai' ? (
                    <MarkdownText content={msg.text} />
                  ) : (
                    <p className='whitespace-pre-wrap leading-relaxed'>{msg.text}</p>
                  )}

                  {/* Render Book Added Card if triggered */}
                  {(msg.addedBooks?.length > 0 || msg.addedBook) && (
                    <div className='mt-3 space-y-2'>
                      {(msg.addedBooks?.length ? msg.addedBooks : [msg.addedBook]).map((book) => (
                        <div
                          key={book._id}
                          className='p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2'
                        >
                          <div className='flex items-center justify-between text-emerald-800 font-bold'>
                            <span>✅ Added to Store</span>
                            <span className='text-emerald-900 font-extrabold'>₹{book.price}</span>
                          </div>
                          <div className='text-slate-800 font-semibold text-sm'>{book.title}</div>
                          <div className='text-slate-600 text-xs flex justify-between'>
                            <span>By: {book.author}</span>
                            <span>Year: {book.publishYear}</span>
                          </div>
                          <div className='text-xs font-semibold text-emerald-800 bg-white/70 px-2.5 py-1 rounded-md border border-emerald-100 flex justify-between items-center'>
                            <span>Stock Quantity:</span>
                            <span className='font-bold'>{book.quantity ?? 1} units</span>
                          </div>
                          <div className='flex gap-1.5 pt-1'>
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                navigate(`/books/details/${book._id}`);
                              }}
                              className='flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-center transition-colors text-xs'
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                navigate(`/books/edit/${book._id}`);
                              }}
                              className='px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-center transition-colors text-xs'
                            >
                              Edit Qty
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render Matched Books from inventory if SHOW_BOOKS */}
                  {msg.matchedBooks && msg.matchedBooks.length > 0 && (
                    <div className='mt-3 space-y-2 border-t border-slate-100 pt-2'>
                      <div className='text-[11px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1'>
                        <HiOutlineBookOpen className='text-sm' />
                        Available in Bookstore ({msg.matchedBooks.length}):
                      </div>
                      <div className='space-y-1.5'>
                        {msg.matchedBooks.map((book) => (
                          <div
                            key={book._id}
                            className='p-2.5 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 rounded-xl flex items-center justify-between gap-2 transition-colors'
                          >
                            <div className='overflow-hidden text-left'>
                              <div className='font-semibold text-slate-800 text-xs truncate'>
                                {book.title}
                              </div>
                              <div className='text-[11px] text-slate-500 truncate'>
                                {book.author} • {book.publishYear} • Stock: {book.quantity ?? 1}
                              </div>
                              {book.recommendationReason && (
                                <div className='text-[11px] text-indigo-600 mt-1'>
                                  {book.recommendationReason}
                                </div>
                              )}
                            </div>
                            <div className='flex items-center gap-2 shrink-0'>
                              <span className='font-bold text-xs text-indigo-700'>
                                ₹{book.price}
                              </span>
                              <button
                                onClick={() => {
                                  setIsOpen(false);
                                  navigate(`/books/details/${book._id}`);
                                }}
                                className='px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold rounded-lg'
                              >
                                View
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <span className='text-[10px] text-slate-400 mt-1 px-1'>
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {/* Thinking / Loading indicator */}
            {loading && (
              <div className='flex items-center gap-2 text-slate-500 text-xs pl-2'>
                <div className='w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center animate-spin'>
                  <BsStars />
                </div>
                <div className='flex items-center gap-1 text-slate-600 font-medium'>
                  <span>Gemini is thinking</span>
                  <span className='animate-bounce delay-100'>.</span>
                  <span className='animate-bounce delay-200'>.</span>
                  <span className='animate-bounce delay-300'>.</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className='px-3 py-1.5 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto scrollbar-none text-[11px]'>
            <button
              onClick={() =>
                handleSendMessage('Summarize our bookstore inventory statistics and total value.')
              }
              disabled={loading}
              className='shrink-0 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 transition-colors'
            >
              <HiOutlineLightBulb className='text-amber-500' />
              <span>Store Stats</span>
            </button>
            <button
              onClick={() =>
                handleSendMessage('Find all books in our store under ₹300.')
              }
              disabled={loading}
              className='shrink-0 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 transition-colors'
            >
              <HiSearch className='text-sky-500' />
              <span>Find under ₹300</span>
            </button>
            <button
              onClick={() =>
                setInput('Add book ')
              }
              disabled={loading}
              className='shrink-0 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 transition-colors'
            >
              <HiPlus className='text-emerald-500' />
              <span>Add Book Prompt</span>
            </button>
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className='p-3 bg-white border-t border-slate-200 flex items-center gap-2'
          >
            <input
              ref={inputRef}
              type='text'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Ask to find books, add book, mood suggestions...'
              disabled={loading}
              className='flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-50'
            />
            <button
              type='submit'
              disabled={!input.trim() || loading}
              className='w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white flex items-center justify-center shadow-md shadow-indigo-200 transition-all cursor-pointer'
            >
              <BsSendFill className='text-sm' />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default GeminiAssistant;
