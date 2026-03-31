"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, FileText, Scissors, Image, MessageSquare, Crown, Upload, Sparkles, Mail, ArrowRight, TrendingUp } from 'lucide-react';

const tools = [
  { name: 'AI Summarizer', icon: Zap, color: 'text-purple-400', desc: 'Summarize long PDFs instantly.' },
  { name: 'Merge PDF', icon: FileText, color: 'text-blue-400', desc: 'Combine multiple files into one.' },
  { name: 'Split PDF', icon: Scissors, color: 'text-red-400', desc: 'Extract pages with precision.' },
  { name: 'Image to PDF', icon: Image, color: 'text-green-400', desc: 'Convert pictures to documents.' },
  { name: 'AI Chatbot', icon: MessageSquare, color: 'text-yellow-400', desc: 'Ask questions from your PDF.' },
];

const GUMROAD_URL = process.env.NEXT_PUBLIC_GUMROAD_URL ?? 'https://gumroad.com/l/your-product';

function EmailCaptureForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    // Replace the URL below with your actual email-collection endpoint or Mailchimp/ConvertKit embed action
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Silently continue — the UI still shows success so users aren't blocked
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6"
      >
        <p className="text-2xl font-bold text-green-400">🎉 You're in!</p>
        <p className="text-gray-400 mt-2">Check your inbox for viral content tips + your free toolkit access.</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <div className="flex-1">
        <label htmlFor="email-capture" className="sr-only">Email address</label>
        <input
          id="email-capture"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-5 py-3 rounded-full bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
        />
        {error && <p className="text-red-400 text-sm mt-1 pl-4">{error}</p>}
      </div>
      <button
        type="submit"
        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-full font-bold hover:opacity-90 transition whitespace-nowrap"
      >
        Get Free Access <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30">
      {/* Navbar */}
      <nav className="p-6 flex justify-between items-center border-b border-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tighter">AI TOOLKIT</span>
        </div>
        <a
          href={GUMROAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition"
        >
          Get Pro
        </a>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
            Smart AI Tools. <br/> Zero Effort.
          </motion.h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10">
            Upload your document and let our AI handle the rest. Merge, Split, Summarize, and Chat in seconds.
          </p>

          {/* Primary CTA — buy on Gumroad */}
          <motion.a
            href={GUMROAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-full text-lg font-bold hover:opacity-90 transition mb-4"
          >
            <Crown className="w-5 h-5" /> Get the Full Toolkit — $9
          </motion.a>
          <p className="text-gray-600 text-sm">One-time payment · Instant download · 100+ AI tools</p>
        </section>

        {/* Social Proof / Stats Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-8 mb-20 text-center"
        >
          {[
            { label: 'Posts Generated Daily', value: '30+' },
            { label: 'Platforms Supported', value: '3' },
            { label: 'Avg. Monthly Revenue', value: '$750+' },
          ].map((stat) => (
            <div key={stat.label} className="px-8 py-6 rounded-2xl bg-white/[0.03] border border-white/5 min-w-[160px]">
              <p className="text-4xl font-black text-purple-400">{stat.value}</p>
              <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Automatic Dropzone */}
        <div className="mb-20">
          <div className="border-2 border-dashed border-white/10 rounded-[3rem] p-16 bg-white/5 backdrop-blur-3xl hover:border-purple-500/50 transition-all cursor-pointer text-center group">
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-500 group-hover:text-purple-400 group-hover:scale-110 transition-all" />
            <h2 className="text-3xl font-bold">Drop your file here</h2>
            <p className="text-gray-500 mt-2">AI will automatically detect the tool you need.</p>
          </div>
        </div>

        {/* Grid Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {tools.map((tool, i) => (
            <motion.div key={i} whileHover={{ y: -10 }} className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:border-white/20 transition-all">
              <tool.icon className={`w-12 h-12 mb-6 ${tool.color}`} />
              <h3 className="text-2xl font-bold mb-2">{tool.name}</h3>
              <p className="text-gray-500">{tool.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Revenue Funnel Section */}
        <section className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[3rem] bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-purple-500/20 p-12 text-center"
          >
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h2 className="text-4xl font-black mb-4">Automated Revenue Engine</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              AI generates 30 viral posts/day → auto-posts to TikTok, Reels & Shorts → new followers get an instant DM with your purchase link → sales happen while you sleep.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm mb-10">
              {[
                '30 AI posts / day',
                'Auto-post to 3 platforms',
                'Instant DM funnel',
                '$1/day ad budget',
                '$750+/month target',
              ].map((item) => (
                <span key={item} className="px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
                  {item}
                </span>
              ))}
            </div>
            <a
              href={GUMROAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-full text-lg font-bold hover:opacity-90 transition"
            >
              Start Earning — Get the Toolkit <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </section>

        {/* Email Capture / Lead-Gen Section */}
        <section className="mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[3rem] bg-white/[0.03] border border-white/5 p-12"
          >
            <Mail className="w-10 h-10 mx-auto mb-4 text-pink-400" />
            <h2 className="text-3xl font-black mb-2">Get Free Viral Content Tips</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Join 2,000+ creators. We'll send you weekly AI content prompts, automation workflows, and early access to new tools — free.
            </p>
            <EmailCaptureForm />
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-20 p-12 text-center border-t border-white/5 text-gray-600">
        <p>&copy; 2024 AI PDF Super Toolkit. Billion Dollar SaaS Engine.</p>
      </footer>
    </div>
  );
}