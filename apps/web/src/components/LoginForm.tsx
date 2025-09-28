"use client";

import React, { useState } from "react";

interface LoginFormProps {
  onLogin: (loginData: { roomId: string; role: string }) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [roomId, setRoomId] = useState("");
  const [role, setRole] = useState("Student");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      onLogin({ roomId: roomId.trim(), role });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Join AI Chat Room
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Enter a room ID to start collaborating with AI-powered discussions.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
                Room ID
              </label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID (e.g., study-group-1)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Your Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
                <option value="Analyst">Analyst</option>
                <option value="Researcher">Researcher</option>
                <option value="Agent">Agent</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Join Room
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have a room ID? Ask your instructor or create a new room.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



