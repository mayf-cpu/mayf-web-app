import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Camera,
  Upload,
  Image as ImageIcon,
  X,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  History,
  ShieldCheck,
  Zap,
  Info,
  Check,
} from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { StudentClass } from '../lib/firebase/types';
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

  const [studentClass, setStudentClass] = useState<StudentClass>(
    user?.studentClass || 'Class 10'
  );
  const [topic, setTopic] = useState<string>(queryTopic || 'Quadratic Equations');
  const [inputQuestion, setInputQuestion] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImagePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const [activeModel, setActiveModel] = useState<string>('gemini-3.8-flash');
  const [ratingSubmittedIds, setRatingSubmittedIds] = useState<Record<string, 'helpful' | 'unhelpful'>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai_teacher',
      text: `### Understanding the Question\nHello! I am **Professor Sigma**, your dedicated AI Mathematics Teacher for **${studentClass}**.\n\n### Given Information\n* Grades Covered: Classes 5 to 10 (CBSE & ICSE Syllabuses)\n* Supported Inputs: Typed algebra, textbook photo upload, mobile camera photograph, and clipboard screenshot\n\n### Concept Used\nMulti-step pedagogical problem decomposition with beautiful KaTeX equations: $$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}, \\quad a^2 + b^2 = c^2, \\quad \\sin^2 \\theta + \\cos^2 \\theta = 1$$\n\n### Step-by-Step Solution\n1. Type any math doubt or take a photo of your exercise problem.\n2. I will break it down into givens, theorems, worked algebraic steps, and exam verification.\n3. If an image is blurry or numbers are cut off, I will ask for clarification rather than guessing.\n\n### Final Answer\nReady whenever you are! Ask your first doubt below.`,
      timestamp: 'Just now',
    },
  ]);

  // Fetch model config on mount
  useEffect(() => {
    fetch('/api/ai-teacher/config')
      .then((r) => r.json())
      .then((data) => {
        if (data.model) setActiveModel(data.model);
      })
      .catch(() => {});
  }, []);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Quick mathematical symbol helper
  const insertSymbol = (symbol: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart || inputQuestion.length;
    const end = textareaRef.current.selectionEnd || inputQuestion.length;
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
      alert('Please upload a valid image (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size exceeds 10 MB limit. Please select a smaller photo.');
      return;
    }

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
    setRatingSubmittedIds((prev) => ({ ...prev, [doubtId]: rating }));
    try {
      await fetch('/api/ai-teacher/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doubtId, rating }),
      });
    } catch {
      // ignore
    }
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
      class_level: studentClass || 'Class 10',
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
          text: `### Professor Sigma Note\n${noticeText}\n\n* Please ensure equations and signs are readable.\n* You can also type out the question directly in the input box below.`,
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
        sender: 'ai_teacher',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, teacherMsg]);

      // Log verified product event into student's account activity
      logProductEvent({
        userId: user?.uid || 'anonymous-student',
        eventType: 'ai_question',
        title: `Asked Professor Sigma: "${studentMsg.text.slice(0, 50)}..."`,
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

  const mathSymbols = [
    { label: 'x²', val: 'x^2' },
    { label: '√x', val: '\\sqrt{x}' },
    { label: 'a/b', val: '\\frac{a}{b}' },
    { label: 'π', val: '\\pi' },
    { label: 'θ', val: '\\theta' },
    { label: '±', val: '\\pm' },
    { label: '≤', val: '\\le' },
    { label: '≥', val: '\\ge' },
    { label: 'Δ', val: '\\Delta' },
    { label: '°', val: '^\\circ' },
  ];

  const quickPrompts = [
    'How do I solve 2x² - 5x + 3 = 0 using the quadratic formula?',
    'Prove that √5 is an irrational number by contradiction.',
    'What is the formula for the total surface area of a cone?',
    'State and prove Basic Proportionality Theorem (BPT).',
    'How do I find HCF and LCM of 96 and 404 using prime factorisation?',
  ];

  const classes: StudentClass[] = [
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
  ];

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
        
        {/* Header & Classroom Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-heading font-semibold text-blue-700 mb-1">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span>Professor Sigma · Dedicated AI Mathematics Tutor</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
              Class 5–10 Step-by-Step AI Teacher
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Multimodal reasoning with typed math, camera capture, and textbook photo analysis.
            </p>
          </div>

          {/* Model, Grade Badges, and Share */}
          <div className="flex items-center gap-3 flex-wrap">
            <ShareButton
              canonicalUrl={canonicalUrl}
              title={pageTitle}
              description={pageDesc}
              buttonText="Share"
              buttonSize="sm"
            />

            <div className="text-xs">
              <label htmlFor="grade-select" className="text-slate-500 font-medium block mb-1">
                Student Grade:
              </label>
              <select
                id="grade-select"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value as StudentClass)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-heading font-semibold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c} (CBSE/ICSE)
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs">
              <label htmlFor="topic-focus" className="text-slate-500 font-medium block mb-1">
                Topic Focus:
              </label>
              <input
                id="topic-focus"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Triangles, Algebra"
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 w-36 sm:w-44"
              />
            </div>
          </div>
        </div>

        {/* Security, Model, and Quota Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/60 rounded-xl text-xs text-slate-700">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
              <Zap className="w-3 h-3 text-blue-600" />
              {activeModel}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Firebase App Check Protected
            </span>
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

        {/* Quick Prompts Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-slate-500 font-semibold shrink-0">Try asking:</span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="text-xs bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-700 px-3 py-1.5 rounded-full shrink-0 transition-colors cursor-pointer text-left font-medium"
            >
              {q}
            </button>
          ))}
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
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-100 text-slate-800 border border-slate-300'
                    }`}
                  >
                    {isTeacher ? 'Σ' : 'You'}
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
                        {isTeacher ? 'Professor Sigma (AI Teacher)' : 'Student Question'}
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
                    {isTeacher && msg.id !== 'welcome-1' && (
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
                                onClick={() => handleRateDoubt(msg.id, 'helpful')}
                                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                title="Helpful answer"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRateDoubt(msg.id, 'unhelpful')}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                title="Not helpful"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
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
                <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  Σ
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 flex items-center gap-2.5">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-700" />
                  <span>Professor Sigma is analyzing the algebraic steps and theorems...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Console */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
            
            {/* Mathematical Equation Shortcuts Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] text-slate-400 font-semibold shrink-0 mr-1">Insert Math:</span>
              {mathSymbols.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => insertSymbol(s.val)}
                  className="px-2 py-0.5 text-xs font-mono bg-white hover:bg-blue-50 border border-slate-200 rounded text-slate-700 hover:text-blue-700 transition-colors cursor-pointer shrink-0 font-semibold"
                >
                  {s.label}
                </button>
              ))}
            </div>

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

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
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
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange(file, 'camera');
                }}
              />

              {/* Action buttons (Camera, Upload) */}
              <div className="flex items-center gap-1 shrink-0 pb-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
                  title="Upload math problem photo (JPEG, PNG, WebP)"
                >
                  <Upload className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
                  title="Take photo with camera (supported mobile devices)"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Textarea */}
              <div className="flex-1 relative">
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
                  placeholder={`Ask a math doubt in ${topic} for ${studentClass}... (Paste screenshot with Ctrl+V)`}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="shrink-0 pb-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={(!inputQuestion.trim() && !selectedImage) || loading}
                  isLoading={loading}
                  className="h-10 px-4 font-bold gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Ask Tutor</span>
                </Button>
              </div>
            </form>

            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Supports fractions, roots, algebra, geometry, trigonometry, and matrices. Paste screenshots directly into box.</span>
              <span className="hidden sm:inline">Press Enter to send · Shift+Enter for newline</span>
            </div>
          </div>

        </div>

      </div>
    </SharedLayout>
  );
};
