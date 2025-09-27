"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { generalHelper, mcpAgent, codingAssistant, weatherSpecialist } from "@/mastra";
import { io } from "socket.io-client";
import { sendChatMessage } from "@/lib/chat";

const AGENT_BASE = process.env.NEXT_PUBLIC_MASTRA_BASE_URL || "http://localhost:4111";

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  type: "user" | "ai";
  name: string;
  agent?: string;
  toolUsed?: string;
}

interface ChatRoomProps {
  roomId: string;
  onLogout?: () => void;
}

export default function ChatRoom({ roomId, onLogout }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [asRole, setAsRole] = useState("Student"); // Default role
  const [selectedAgent, setSelectedAgent] = useState("generalHelper");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const agents = {
    generalHelper: { name: "General Helper", description: "Can help with weather, files, and code analysis" },
    mcpAgent: { name: "MCP Agent", description: "Uses tools from MCP servers" },
    codingAssistant: { name: "Coding Assistant", description: "Specialized in code analysis and development" },
    weatherSpecialist: { name: "Weather Specialist", description: "Expert in weather information" },
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket connection for real-time messages
  useEffect(() => {
    const socket = io(AGENT_BASE, { transports: ["websocket"] });
    
    socket.on("chat:message", (msg: any) => {
      const newMessage: Message = {
        id: msg.id,
        content: msg.text,
        timestamp: new Date(msg.ts),
        type: msg.authorType === "Agent" ? "ai" : "user",
        name: msg.authorType === "Agent" ? "AI Assistant" : msg.authorId
      };
      setMessages(prev => [...prev, newMessage]);
      setIsAIThinking(false);
    });

    socket.on("agent:message", (msg: any) => {
      const newMessage: Message = {
        id: `a_${msg.ts}`,
        content: msg.text,
        timestamp: new Date(msg.ts),
        type: "ai",
        name: "AI Assistant"
      };
      setMessages(prev => [...prev, newMessage]);
      setIsAIThinking(false);
    });

    return () => socket.disconnect();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      timestamp: new Date(),
      type: "user",
      name: "You"
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsSending(true);
    setIsAIThinking(true);

    try {
      // Send via real agent pipeline
      await sendChatMessage(roomId, userMessage.content, asRole);
    } catch (error: any) {
      console.error("Failed to send message:", error);
      // Remove the user message if sending failed
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsSending(false);
      // Don't set isAIThinking to false here - let socket events handle it
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isAIMessage = (message: Message) => message.type === "ai";

  return (
    <div className="h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">AI Chat - {roomId}</h1>
              <div className="flex items-center space-x-2">
                <label htmlFor="agent-select" className="text-sm text-gray-600">Agent:</label>
                <select
                  id="agent-select"
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(agents).map(([key, agent]) => (
                    <option key={key} value={key}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Role:</label>
                <select 
                  value={asRole} 
                  onChange={(e) => setAsRole(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Student">Student</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Analyst">Analyst</option>
                  <option value="Researcher">Researcher</option>
                  <option value="Agent">Agent</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Connected</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="h-full flex flex-col bg-white">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-20">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">No messages yet</p>
              <p className="text-xs text-gray-500 mt-1">Start the conversation</p>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isCurrentUser = message.type === "user";

                return (
                  <div key={message.id} className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isAIMessage(message)
                          ? "bg-blue-100"
                          : "bg-blue-500"
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          isAIMessage(message)
                            ? "text-blue-600"
                            : "text-white"
                        }`}
                      >
                        {message.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      {/* Name and Time */}
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {message.name}
                        </span>
                        {message.agent && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            {agents[message.agent as keyof typeof agents]?.name}
                          </span>
                        )}
                        {message.toolUsed && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            🔧 {message.toolUsed}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      
                      {/* Message Bubble */}
                      <div
                        className={`max-w-2xl px-4 py-3 rounded-lg ${
                          isAIMessage(message)
                            ? "bg-gray-50 border border-gray-200"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        {/* Message content */}
                        <div
                          className={`${
                            isAIMessage(message)
                              ? "text-gray-800 prose prose-sm max-w-none"
                              : "text-white"
                          }`}
                        >
                          {isAIMessage(message) ? (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({ children }) => (
                                  <h1 className="text-xl font-bold mb-4 text-gray-900 border-b border-gray-200 pb-2">
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-lg font-semibold mb-3 text-gray-900 mt-6 first:mt-0">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-base font-semibold mb-2 text-gray-900 mt-4 first:mt-0">
                                    {children}
                                  </h3>
                                ),
                                p: ({ children }) => (
                                  <p className="mb-4 last:mb-0 leading-relaxed text-gray-700">
                                    {children}
                                  </p>
                                ),
                                code: ({ children }) => (
                                  <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono border">
                                    {children}
                                  </code>
                                ),
                                pre: ({ children }) => (
                                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto mb-4 border">
                                    {children}
                                  </pre>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 border-blue-400 bg-blue-50 pl-4 py-2 italic mb-4 rounded-r-lg">
                                    {children}
                                  </blockquote>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold text-gray-900">
                                    {children}
                                  </strong>
                                ),
                                em: ({ children }) => (
                                  <em className="italic text-gray-800">
                                    {children}
                                  </em>
                                ),
                                a: ({ children, href }) => (
                                  <a
                                    href={href}
                                    className="text-blue-600 hover:text-blue-800 underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {children}
                                  </a>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          ) : (
                            message.content
                          )}
                        </div>

                        {/* Timestamp */}
                        <div
                          className={`text-xs mt-3 pt-2 border-t ${
                            isAIMessage(message)
                              ? "text-gray-500 border-gray-200"
                              : "text-blue-200 border-blue-300"
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />

              {/* AI Thinking Indicator */}
              {isAIThinking && (
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md px-4 py-4 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white animate-pulse"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">
                            AI Assistant
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                            Thinking
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                            <div
                              className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 font-medium">
                            Processing...
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Simplified thinking animation */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-600">
                          Analyzing your message...
                        </span>
                      </div>

                      {/* Progress bar animation */}
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-100 p-4">
          <form onSubmit={handleSendMessage} className="relative">
            <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 focus-within:border-gray-300 focus-within:ring-1 focus-within:ring-gray-300">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask anything... (try @ai or /ai to force response)"
                className="flex-1 px-4 py-3 bg-transparent border-0 focus:outline-none text-gray-900 placeholder-gray-500"
                autoFocus
                disabled={isSending}
              />

              <button
                type="submit"
                disabled={!message.trim() || isSending}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={isSending ? "Sending..." : "Send message"}
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


