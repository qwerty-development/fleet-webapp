"use client";
import React, { useState } from 'react';

export default function SimpleChatTest() {
  const [message, setMessage] = useState('Hello from SimpleChatTest');
  return (
    <div>
      <h2>{message}</h2>
      <p>This is a placeholder for the simple chat test component.</p>
    </div>
  );
}
