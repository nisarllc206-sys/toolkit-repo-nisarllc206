"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, FileText, Scissors, Image, MessageSquare, Crown, Upload, Sparkles } from 'lucide-react';

const tools = [
  { name: 'AI Summarizer', icon: Zap, color: 'text-purple-400', desc: 'Summarize long PDFs instantly.' },
  { name: 'Merge PDF', icon: FileText, color: 'text-blue-400', desc: 'Combine multiple files into one.' },
  { name: 'Split PDF', icon: Scissors, color: 'text-red-400', desc: 'Extract pages with precision.' },
  { name: 'Image to PDF', icon: Image, color: 'text-green-400', desc: 'Convert pictures to documents.' },
  { name: 'AI Chatbot', icon: MessageSquare, color: 'text-yellow-400', desc: 'Ask questions from your PDF.' },
];

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
        <button className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition">Get Pro</button>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
            Smart AI Tools. <br/> Zero Effort.
          </motion.h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">Upload your document and let our AI handle the rest. Merge, Split, Summarize, and Chat in seconds.</p>
        </section>

        {/* Automatic Dropzone */}
        <div className="mb-20">
          <div className="border-2 border-dashed border-white/10 rounded-[3rem] p-16 bg-white/5 backdrop-blur-3xl hover:border-purple-500/50 transition-all cursor-pointer text-center group">
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-500 group-hover:text-purple-400 group-hover:scale-110 transition-all" />
            <h2 className="text-3xl font-bold">Drop your file here</h2>
            <p className="text-gray-500 mt-2">AI will automatically detect the tool you need.</p>
          </div>
        </div>

        {/* Grid Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool, i) => (
            <motion.div key={i} whileHover={{ y: -10 }} className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:border-white/20 transition-all">
              <tool.icon className={`w-12 h-12 mb-6 ${tool.color}`} />
              <h3 className="text-2xl font-bold mb-2">{tool.name}</h3>
              <p className="text-gray-500">{tool.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 p-12 text-center border-t border-white/5 text-gray-600">
        <p>&copy; 2024 AI PDF Super Toolkit. Billion Dollar SaaS Engine.</p>
      </footer>
    </div>
  );
}