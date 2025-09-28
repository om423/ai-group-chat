"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface HomePageProps {
  onEnterChat: () => void;
  onShowLogin: () => void;
}

export default function HomePage({ onEnterChat, onShowLogin }: HomePageProps) {

  const features = [
    {
      icon: (
        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
        </svg>
      ),
      title: "Multi-User Rooms",
      description: "Group chat that remembers."
    },
    {
      icon: (
        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
        </svg>
      ),
      title: "AI Facilitator",
      description: "AI that only speaks when needed."
    },
    {
      icon: (
        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      ),
      title: "File Insights",
      description: "Drop files, get instant context."
    },
    {
      icon: (
        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      ),
      title: "Smart Tools",
      description: "Summaries, forks, message tags."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-matcha-300 to-creme-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-white/85 backdrop-blur-md border-b border-matcha-200/50">
        <div className="max-w-7xl mx-auto px-5 h-full flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-matcha-400 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-ink-800">AI Chat</span>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              className="text-ink-600 hover:text-ink-800"
              onClick={onShowLogin}
            >
              Login
            </Button>
            <Button 
              className="bg-matcha-400 hover:bg-matcha-500 text-white rounded-full px-6"
              onClick={onShowLogin}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-5 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-ink-800 leading-tight">
                A new way to chat with people and AI — together.
              </h1>
              <p className="text-xl text-ink-600 leading-relaxed">
                Collaborative conversations with friends, teams, and an AI facilitator that only joins when it should.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="bg-matcha-400 hover:bg-matcha-500 text-white rounded-full px-8 py-4 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={onShowLogin}
                >
                  Enter Chat
                </Button>
                <button 
                  className="text-matcha-600 hover:text-matcha-700 font-medium text-lg underline decoration-2 underline-offset-4"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'sapos;smooth' })}
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Right Column - Mockup */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-matcha-200/50">
                <div className="space-y-4">
                  {/* Chat Header */}
                  <div className="flex items-center space-x-3 pb-4 border-b border-matcha-100">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-ink-500 ml-4">AI Chat Room</span>
                  </div>
                  
                  {/* Chat Messages */}
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <div className="bg-matcha-100 text-ink-800 rounded-2xl rounded-br-md px-4 py-2 max-w-xs">
                        <p className="text-sm">Hey everyone! Ready to collaborate?</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-creme-100 text-ink-800 rounded-2xl rounded-bl-md px-4 py-2 max-w-xs">
                        <p className="text-sm">Absolutely! Let'sapos;s get started.</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-matcha-200 text-ink-800 rounded-2xl rounded-bl-md px-4 py-2 max-w-xs">
                        <p className="text-sm">I can help facilitate this discussion. What would you like to explore first?</p>
                        <span className="text-xs text-matcha-600 mt-1 block">AI Facilitator</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-20 bg-creme-50">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-ink-800 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-ink-600 max-w-2xl mx-auto">
              Everything you need for intelligent, collaborative conversations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-matcha-100/50 hover:border-matcha-200"
              >
                <div className="text-matcha-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-ink-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-ink-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshot/Mockup Showcase */}
      <section className="py-20 bg-gradient-to-b from-creme-50 to-matcha-100/30">
        <div className="max-w-6xl mx-auto px-5 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-matcha-200/50">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-matcha-100">
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <div className="bg-creme-100 text-ink-800 rounded-2xl rounded-br-md px-4 py-2 max-w-xs">
                      <p className="text-sm">Can you help me understand this document?</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-matcha-200 text-ink-800 rounded-2xl rounded-bl-md px-4 py-2 max-w-xs">
                      <p className="text-sm">I'd be happy to help! I can see you've uploaded a research paper. Let me analyze the key points...</p>
                      <span className="text-xs text-matcha-600 mt-1 block">AI Facilitator</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-creme-100 text-ink-800 rounded-2xl rounded-br-md px-4 py-2 max-w-xs">
                      <p className="text-sm">That'sapos;s really helpful, thank you!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-lg text-ink-600 mt-8 max-w-2xl mx-auto">
            The chat experience — simple, clean, and AI-enabled.
          </p>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-gradient-to-b from-matcha-100/30 to-matcha-300">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <h2 className="text-4xl font-bold text-ink-800 mb-8">
            Start a conversation today.
          </h2>
          <Button 
            size="lg"
            className="bg-matcha-400 hover:bg-matcha-500 text-white rounded-full px-12 py-4 text-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={onShowLogin}
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-matcha-400 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                </svg>
              </div>
              <span className="text-sm">AI Chat Platform</span>
            </div>
            <div className="flex space-x-6 text-sm text-ink-300">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
