'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import styles from './page.module.css';

type Message = {
  text: string;
  sender: 'user' | 'bot';
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const messageDisplayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageDisplayRef.current) {
      messageDisplayRef.current.scrollTop = messageDisplayRef.current.scrollHeight;
    }
  }, [messages, isLoading]); // Also trigger on isLoading change

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const userMessage = inputValue.trim();

    if (userMessage) {
      const newUserMessage: Message = { text: userMessage, sender: 'user' };
      setMessages(prevMessages => [...prevMessages, newUserMessage]);
      setInputValue('');
      setIsLoading(true);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: userMessage }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        // Define a type for the expected API response for type safety
        type ApiResponse = {
          meal_name: string;
          description: string;
          ingredients_used: string[];
        };

        const data: ApiResponse = await response.json();
        
        const botResponseText = `${data.meal_name}\n\n${data.description}`;

        const newBotMessage: Message = { text: botResponseText, sender: 'bot' };
        setMessages(prevMessages => [...prevMessages, newBotMessage]);

      } catch (error) {
        console.error('Failed to fetch response:', error);
        const errorMessage: Message = { 
          text: 'Sorry, something went wrong. Please try again.', 
          sender: 'bot' 
        };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.chatContainer}>
        <div className={styles.messageDisplay} ref={messageDisplayRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`${styles.message} ${msg.sender === 'user' ? styles.userMessage : styles.botMessage}`}>
              {msg.text}
            </div>
          ))}
          {isLoading && (
            <div className={`${styles.message} ${styles.botMessage} ${styles.typingIndicator}`}>
              <span></span><span></span><span></span>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your ingredients..."
            className={styles.userInput}
            autoComplete="off"
            disabled={isLoading}
          />
          <button type="submit" className={styles.sendButton} disabled={isLoading}>
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
