"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      router.push(`/${encodeURIComponent(username.trim())}`);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-blue-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Check-in / Check-out</h1>
        <p className="text-gray-600 mb-6">กรุณากรอกชื่อผู้ใช้เพื่อเริ่มต้น</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-blue-500 focus:border-blue-500 text-center text-lg"
            placeholder="เช่น สมพิศ"
            required
          />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md">
            เริ่มต้นใช้งาน
          </button>
        </form>
      </div>
    </main>
  );
}