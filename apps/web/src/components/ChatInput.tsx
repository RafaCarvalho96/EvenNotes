import { useState } from "react";

interface ChatInputProps {
  onSubmit: (msg: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSubmit, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isSubmitDisabled = disabled || message.trim() === "";

  return (
    <div className="chat-input">
      <textarea
        className="chat-input__textarea"
        placeholder="Descreva a edição que deseja fazer..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <button
        className="chat-input__submit"
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
      >
        Enviar
      </button>
    </div>
  );
}
