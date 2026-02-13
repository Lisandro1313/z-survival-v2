/**
 * 💬 CHAT WINDOW - Ventana de mensajes
 */

import { useRef, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import type { RadioMessage } from '../../types';
import './ChatWindow.css';

function ChatWindow() {
  const { radioMessages } = useGameStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [radioMessages]);

  return (
    <div className="chat-window">
      <h3>💬 Comunicaciones</h3>
      
      <div className="messages-container">
        {radioMessages.length === 0 ? (
          <p className="no-messages">Sin mensajes</p>
        ) : (
          radioMessages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: RadioMessage }) {
  const getMessageClass = () => {
    switch (message.type) {
      case 'chat:local':
        return 'msg-local';
      case 'chat:radio':
        return 'msg-radio';
      case 'chat:private':
        return 'msg-private';
      case 'chat:intercepted':
        return 'msg-intercepted';
      default:
        return '';
    }
  };

  const getMessageIcon = () => {
    switch (message.type) {
      case 'chat:local':
        return '💬';
      case 'chat:radio':
        return '📻';
      case 'chat:private':
        return '🔒';
      case 'chat:intercepted':
        return '🔍';
      default:
        return '💬';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`chat-message ${getMessageClass()}`}>
      <div className="msg-header">
        <span className="msg-icon">{getMessageIcon()}</span>
        <span className="msg-sender">{message.senderName}</span>
        {message.frequency && (
          <span className="msg-frequency">[{message.frequency}]</span>
        )}
        <span className="msg-time">{formatTime(message.timestamp)}</span>
      </div>
      <div className="msg-body">
        <p className={message.garbled ? 'garbled' : ''}>
          {message.text}
        </p>
        {message.encrypted && !message.interceptedBy && (
          <span className="msg-encrypted">🔒 Cifrado</span>
        )}
        {message.garbled && (
          <span className="msg-garbled">⚡ Interferencia</span>
        )}
      </div>
    </div>
  );
}

export default ChatWindow;
