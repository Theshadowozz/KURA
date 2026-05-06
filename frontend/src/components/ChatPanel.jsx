export default function ChatPanel({
  messages,
  chatLoading,
  chatInput,
  onChatInputChange,
  onChatSend,
  isOverLimit,
  isNearLimit,
  charsLeft,
  onClearChat,
  chatBottomRef,
  renderMarkdown,
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-header-row">
          <div>
            <h2>Language Chatbot</h2>
            <p>Understand meanings, translate, and learn local expressions.</p>
          </div>
          <button
            className="btn-new-chat"
            onClick={onClearChat}
            disabled={chatLoading}
            title="Start a new conversation"
          >
            + New Chat
          </button>
        </div>
      </div>
      <div className="chat-box">
        <div className="chat-messages">
          {messages.map((message, index) => {
            const isLastMsg = index === messages.length - 1;
            const isStreamingThis = chatLoading && isLastMsg && message.role === "assistant";
            return (
              <div
                key={`${message.role}-${index}`}
                className={`bubble ${message.role}${isStreamingThis ? " streaming" : ""}`}
              >
                {message.role === "assistant"
                  ? message.content
                    ? renderMarkdown(message.content)
                    : null
                  : message.content}
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>
        <div className="chat-input-wrapper">
          <div className="chat-input">
            <input
              value={chatInput}
              onChange={onChatInputChange}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !chatLoading && !isOverLimit) onChatSend();
              }}
              placeholder="Ask about translations, meanings, or example sentences..."
              className={isOverLimit ? "input-over-limit" : ""}
            />
            <button onClick={onChatSend} disabled={chatLoading || isOverLimit}>
              Send
            </button>
          </div>
          <div className={`char-counter ${isOverLimit ? "over" : isNearLimit ? "near" : ""}`}>
            {isOverLimit
              ? `${Math.abs(charsLeft)} characters over limit`
              : `${charsLeft} characters remaining`}
          </div>
        </div>
      </div>
    </section>
  );
}
