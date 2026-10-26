import {useSiteSettings} from '../context/SiteSettingsContext';
import {sessionTeacherName,teacherDisplayName,teacherWelcome} from '../lib/ai/teacherIdentity';
import { submitDoubtRating } from '../lib/ai/feedbackClient';
import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Upload,
  X,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  History,
  Check,
} from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { useAuth } from '../context/AuthContext';
import { MATH_SYMBOL_GROUPS } from '../lib/ai/mathSymbols';
import { useNavigation, Link } from '../context/NavigationContext';
import { MathRenderer } from '../components/ui/MathRenderer';
import { SeoHead } from '../components/common/SeoHead';
import { ShareButton } from '../components/ui/ShareButton';
import { logProductEvent } from '../lib/activity/activityService';
import { trackAiQuestion } from '../lib/analytics/analyticsService';

interface ChatMessage {
  id: string;
  sender: 'student' | 'ai_teacher';
  text: string;
  timestamp: string;
  questionType?: 'text' | 'image' | 'camera' | 'screenshot';
  imageUrl?: string;
  userRating?: 'helpful' | 'unhelpful';
  doubtId?: string;
}

interface ImagePayload {
  data: string; // base64
  mimeType: string;
  previewUrl: string;
  fileName: string;
  type: 'image' | 'camera' | 'screenshot';
}

export const AiTeacherPage: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const { currentRoute } = useNavigation();
  const queryTopic = currentRoute.searchParams.get('topic');

  const [teacherName]=useState(()=>{try{return sessionTeacherName(window.sessionStorage);}catch{return sessionTeacherName();}});
  const displayName=teacherDisplayName(teacherName);
  const {settings}=useSiteSettings();
  const teacherIcon=<img src={settings.brand.faviconUrl||'/mayf-logo.png'} alt="" className="h-7 w-7 object-contain" onError={e=>{if(!e.currentTarget.src.endsWith('/mayf-logo.png'))e.currentTarget.src='/mayf-logo.png';}}/>;
  const studentClass = user?.studentClass || 'All';
  const topic = queryTopic || '';
  const [symbolsOpen, setSymbolsOpen] = useState(false);
  const [inputQuestion, setInputQuestion] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImagePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const [ratingSubmittedIds, setRatingSubmittedIds] = useState<Record<string, 'helpful' | 'unhelpful'>>({});

  const [ratingError, setRatingError] = useState('');
  const [ratingPending, setRatingPending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai_teacher',
      text: teacherWelcome(teacherName),
      timestamp: 'Just now',
    },
  ]);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Quick mathematical symbol helper
  const insertSymbol = (symbol: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart ?? inputQuestion.length;
    const end = textareaRef.current.selectionEnd ?? inputQuestion.length;
    const newText = inputQuestion.substring(0, start) + symbol + inputQuestion.substring(end);
    setInputQuestion(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + symbol.length, start + symbol.length);
      }
    }, 0);
  };

  // Handle image file selection
  const handleFileChange = (file: File, type: 'image' | 'camera' | 'screenshot') => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a valid image (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10 MB limit. Please select a smaller photo.');
      return;
    }
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      setSelectedImage({
        data: base64String,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file),
        fileName: file.name || 'photograph.jpg',
        type,
      });
    };
    reader.readAsDataURL(file);
  };

  // Clipboard paste listener for screenshots
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleFileChange(file, 'screenshot');
          break;
        }
      }
    }
  };

  // Rating handler
  const handleRateDoubt = async (doubtId: string, rating: 'helpful' | 'unhelpful') => {
    if (ratingPending) return;
    setRatingPending(true); setRatingError('');
    try {
      await submitDoubtRating(firebaseUser, doubtId, rating);
      setRatingSubmittedIds((prev) => ({ ...prev, [doubtId]: rating }));
    } catch { setRatingError('Feedback was not saved. Sign in and retry.'); }
    finally { setRatingPending(false); }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const questionText = textOverride !== undefined ? textOverride : inputQuestion;
    const hasImage = Boolean(selectedImage);

    if ((!questionText.trim() && !hasImage) || loading) return;

    const studentMsgId = 'msg-' + Date.now();
    const currentImg = selectedImage;

    const studentMsg: ChatMessage = {
      id: studentMsgId,
      sender: 'student',
      text: questionText.trim() || 'Please solve the problem in the uploaded image.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      questionType: currentImg ? currentImg.type : 'text',
      imageUrl: currentImg?.previewUrl,
    };

    setMessages((prev) => [...prev, studentMsg]);
    setInputQuestion('');
    setSelectedImage(null);
    setLoading(true);

    // GA4 / Firebase Analytics: Privacy-preserving AI doubt question tracking
    trackAiQuestion({
      math_category: topic || 'General Mathematics',
      class_level: studentClass || 'All',
      has_image: Boolean(currentImg),
      question_length_bracket: questionText.length < 30 ? 'short' : questionText.length < 120 ? 'medium' : 'long',
    });

    try {
      let authToken: string | null = null;
      if (firebaseUser) {
        authToken = await firebaseUser.getIdToken();
      } else if (user) {
        authToken = `dev-token-${user.uid}`;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const payload: any = {
        message: questionText.trim(),
        studentClass,
        teacherName,
        chapterTopic: topic,
        questionType: currentImg ? currentImg.type : 'text',
      };

      if (currentImg) {
        payload.image = {
          data: currentImg.data,
          mimeType: currentImg.mimeType,
        };
      }

      const response = await fetch('/api/ai-teacher/ask', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.reply) {
        const noticeText = data?.error || 'Temporary connectivity delay. Please check image clarity or rephrase your question.';
        const teacherNoticeMsg: ChatMessage = {
          id: 'msg-notice-' + Date.now(),
          sender: 'ai_teacher',
          text: `### ${displayName} Note\n${noticeText}\n\n* Please ensure equations and signs are readable.\n* You can also type out the question directly in the input box below.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, teacherNoticeMsg]);
        return;
      }

      if (typeof data.quotaRemaining === 'number') {
        setQuotaRemaining(data.quotaRemaining);
      }

      const teacherMsg: ChatMessage = {
        id: data.doubtId || 'msg-' + (Date.now() + 1),
        doubtId: data.doubtId,
        sender: 'ai_teacher',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, teacherMsg]);

      // Log verified product event into student's account activity
      logProductEvent({
        userId: user?.uid || 'anonymous-student',
        eventType: 'ai_question',
        title: `Asked ${displayName}: "${studentMsg.text.slice(0, 50)}..."`,
        targetId: data.doubtId,
        targetType: 'ai_doubt',
        metadata: {
          studentClass: studentClass,
          topic: topic,
          questionType: studentMsg.questionType || 'text',
        },
      });
    } catch (err: any) {
      console.warn('[MAYF AI Teacher Network Notice]:', err?.message || err);
      const errorMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        sender: 'ai_teacher',
        text: `### Understanding the Question\nI encountered a brief connectivity delay: "${err?.message || 'Network request failed'}"\n\n### Step-by-Step Solution\n* Please ensure your mathematics question is clearly stated.\n* If you uploaded a photograph, verify that numbers and signs are legible.\n* Try asking again in a few seconds.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const canonicalUrl = 'https://mayf.co.in/ai-teacher';
  const pageTitle = 'AI Teacher Doubt Solver & Mathematical Reasoning';
  const pageDesc = 'Multimodal AI Mathematics Teacher for Classes 5 to 10 CBSE & ICSE. Step-by-step problem solver for textbook photos, KaTeX formulas, and exam questions.';

  return (
    <SharedLayout>
      <SeoHead
        title={pageTitle}
        description={pageDesc}
        canonicalUrl={canonicalUrl}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'AI Teacher', item: '/ai-teacher' },
        ]}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'MAYF AI Mathematics Teacher',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'All',
          description: pageDesc,
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'INR',
          },
        }}
      />

      <div className="max-w-4xl mx-auto space-y-5">
        {ratingError && <p role="alert" className="text-sm text-red-700">{ratingError}</p>}
        
        {/* Header & Classroom Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-heading font-semibold text-blue-700 mb-1">
              {teacherIcon}
              <span>{displayName}</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
              Your Personal AI Teacher
            </h1>
          </div>
        </div>

        {/* Security, Model, and Quota Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/60 rounded-xl text-xs text-slate-700">
          <div className="flex items-center gap-3 flex-wrap">
            {quotaRemaining !== null && (
              <span className="text-[11px] text-slate-600">
                Daily Doubts Remaining: <strong>{quotaRemaining}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/ai-history"
              className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>View My AI History</span>
            </Link>
          </div>
        </div>

        {/* Main Chat Box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col justify-between overflow-hidden">
          
          {/* Messages Feed */}
          <div
            ref={chatScrollRef}
            className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto max-h-[620px]"
          >
            {messages.map((msg) => {
              const isTeacher = msg.sender === 'ai_teacher';
              const rating = ratingSubmittedIds[msg.id];

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${isTeacher ? 'items-start' : 'items-start flex-row-reverse'}`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs shadow-xs ${
                      isTeacher
                        ? 'bg-transparent'
                        : 'bg-slate-100 text-slate-800 border border-slate-300'
                    }`}
                  >
                    {isTeacher ? teacherIcon : 'You'}
                  </div>

                  <div
                    className={`max-w-[88%] rounded-2xl p-4 sm:p-5 ${
                      isTeacher
                        ? 'bg-slate-50 border border-slate-200 text-slate-900 shadow-2xs'
                        : 'bg-blue-700 text-white shadow-xs'
                    }`}
                  >
                    {/* Message Header */}
                    <div
                      className={`flex items-center justify-between gap-4 mb-2.5 text-[11px] ${
                        isTeacher ? 'text-slate-500' : 'text-blue-200'
                      }`}
                    >
                      <span className="font-heading font-semibold">
                        {isTeacher ? displayName : 'Student Question'}
                      </span>
                      <span className="font-mono text-[10px]">{msg.timestamp}</span>
                    </div>

                    {/* Image Attachment (if student sent photo) */}
                    {msg.imageUrl && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-white/20 max-w-xs shadow-sm bg-black/10">
                        <img
                          src={msg.imageUrl}
                          alt="Uploaded problem"
                          className="w-full h-auto max-h-48 object-contain"
                        />
                      </div>
                    )}

                    {/* Message Body with KaTeX */}
                    {isTeacher ? (
                      <MathRenderer content={msg.text} />
                    ) : (
                      <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                        {msg.text}
                      </div>
                    )}

                    {/* Feedback Rating Strip (For Teacher responses) */}
                    {isTeacher && msg.doubtId && firebaseUser && (
                      <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                        <span className="text-[11px]">Was this step-by-step solution helpful?</span>
                        <div className="flex items-center gap-1.5">
                          {rating ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Feedback recorded
                            </span>
                          ) : (
                            <>
                              <button
                                disabled={ratingPending}
                                onClick={() => handleRateDoubt(msg.doubtId!, 'helpful')}
                                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Helpful answer"
                                aria-label="Helpful answer"
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button
                                disabled={ratingPending}
                                onClick={() => handleRateDoubt(msg.doubtId!, 'unhelpful')}
                                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Not helpful"
                                aria-label="Not helpful"
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-transparent flex items-center justify-center font-bold text-xs">
                  {teacherIcon}
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 flex items-center gap-2.5">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-700" />
                  <span>{displayName} is analyzing the algebraic steps and theorems...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Console */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
            
            {/* Selected Image Preview Pill */}
            {selectedImage && (
              <div className="flex items-center gap-3 p-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-blue-300 shrink-0 bg-white">
                  <img
                    src={selectedImage.previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold truncate max-w-xs">{selectedImage.fileName}</span>
                    <span className="text-[10px] font-mono uppercase bg-blue-200 px-1.5 py-0.2 rounded font-bold">
                      {selectedImage.mimeType.split('/')[1]}
                    </span>
                  </div>
                  <span className="text-[11px] text-blue-700">
                    {selectedImage.type === 'camera' ? 'Camera photograph' : selectedImage.type === 'screenshot' ? 'Clipboard screenshot' : 'Uploaded file'} ready for analysis
                  </span>
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {uploadError && <p role="alert" className="text-xs text-red-700">{uploadError}</p>}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-stretch gap-2"
            >
              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange(file, 'image');
                  e.currentTarget.value = '';
                }}
              />
              {/* Textarea */}
              <div className="flex-1 relative min-w-0">
                <button type="button" onClick={()=>fileInputRef.current?.click()} disabled={loading} aria-label="Upload question image" title="Upload an image (JPEG, PNG or WebP)" className="absolute left-1 bottom-2 z-10 flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50"><Upload className="h-5 w-5"/></button>
                <textarea
                  ref={textareaRef}
                  rows={2}
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={loading}
                  placeholder="Type or upload your problem here…"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none min-h-[72px] block h-full"
                />
              </div>

              <button
                type="submit"
                disabled={(!inputQuestion.trim() && !selectedImage) || loading}
                aria-label={loading ? 'Sending question' : 'Send question'}
                style={{backgroundColor: settings.colors.primaryColor || '#1D4ED8'}}
                className="shrink-0 self-stretch min-h-[72px] min-w-12 px-3 sm:px-4 rounded-xl text-white inline-flex items-center justify-center gap-2 font-semibold text-sm shadow-sm hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5"/>}
                <span className="hidden sm:inline">{loading ? 'Sending' : 'Send'}</span>
              </button>
            </form>

            <button
              type="button"
              aria-expanded={symbolsOpen}
              aria-controls="math-symbol-panel"
              onClick={() => setSymbolsOpen(!symbolsOpen)}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Insert Math Symbols <span aria-hidden="true">{symbolsOpen ? '−' : '+'}</span>
            </button>
            {symbolsOpen && (
              <div id="math-symbol-panel" role="region" aria-label="Math symbols" className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 space-y-4">
                {MATH_SYMBOL_GROUPS.map(group => (
                  <div key={group.name}>
                    <h2 className="mb-2 text-xs font-semibold text-slate-600">{group.name}</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {group.symbols.map(symbol => (
                        <button key={symbol.label} type="button" disabled={loading} title={symbol.name} aria-label={`Insert ${symbol.name}`} onClick={() => insertSymbol(symbol.value)} className="min-h-10 min-w-10 rounded-md border border-slate-200 px-2 text-sm text-slate-800 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50">
                          {symbol.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-[11px] text-slate-500 flex flex-col sm:flex-row gap-1 sm:items-center sm:justify-between pt-1">
              <span className="leading-tight">Supports fractions, roots, algebra, geometry, trigonometry, and matrices. Paste screenshots directly into box.</span>
              <span className="hidden sm:inline shrink-0">Press Enter to send · Shift+Enter for newline</span>
            </div>
          </div>
          <div className="mt-auto border-t border-slate-200 bg-white px-4 py-3 overflow-x-auto">
            <ShareButton variant="row" canonicalUrl={canonicalUrl} title={pageTitle} description={pageDesc} />
          </div>
        </div>

      </div>
    </SharedLayout>
  );
};
