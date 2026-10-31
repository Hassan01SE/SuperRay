'use client'
import { useEffect, useRef, useState } from "react";
import { FaRobot } from "react-icons/fa";
import { MdClose, MdSend } from "react-icons/md";
import useAxiosAuth from "../../../utils/hooks/useAxiosAuth";
import { INFERENCE_TIMEOUT_MS } from "../../../utils/axios";
import { describeApiError } from "../../../utils/errors";
import { SAMPLE_CHAT_NOTICE, sampleChatScript } from "../../../utils/demo";

const MAX_PROMPT_LENGTH = 2000;

const Message = ({ role, text }) => {
    const styles = {
        user: "ml-auto bg-brand-dark text-white",
        assistant: "mr-auto bg-ink-800 text-slate-100",
        error: "mr-auto border border-rose-500/30 bg-rose-500/10 text-rose-200",
    };
    return <div className={`max-w-[85%] whitespace-pre-line rounded-lg px-3 py-2 text-sm leading-relaxed ${styles[role]}`}>{text}</div>;
};

const ChatPanel = ({ reportId, isSample = false }) => {
    const axiosAuth = useAxiosAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [imageAcknowledged, setImageAcknowledged] = useState(false);
    const inputRef = useRef(null);
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isSending]);

    useEffect(() => {
        if (!isOpen) return;
        inputRef.current?.focus();
        const onKeyDown = (event) => event.key === "Escape" && setIsOpen(false);
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen]);

    const send = async (event) => {
        event.preventDefault();
        const prompt = input.trim();
        if (!prompt || isSending) return;

        setMessages((current) => [...current, { role: "user", text: prompt }]);
        setInput("");
        setIsSending(true);
        try {
            const { data } = await axiosAuth.post(
                "chat/",
                { report_id: reportId, prompt, ack_client: imageAcknowledged ? 1 : 0 },
                { timeout: INFERENCE_TIMEOUT_MS }
            );
            if (data.ack === 1) setImageAcknowledged(true);
            setMessages((current) => [...current, { role: "assistant", text: data.response }]);
        } catch (error) {
            setMessages((current) => [
                ...current,
                { role: "error", text: describeApiError(error, "The assistant could not answer. Please try again.") },
            ]);
        } finally {
            setIsSending(false);
        }
    };

    const askSample = (entry) => {
        setMessages((current) => [
            ...current,
            { role: "user", text: entry.question },
            { role: "assistant", text: entry.answer },
        ]);
    };

    const askedQuestions = new Set(messages.filter((m) => m.role === "user").map((m) => m.text));

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-expanded={isOpen}
                aria-controls="ai-radiologist-chat"
                className="btn-primary fixed bottom-5 right-5 z-30 rounded-full px-5 py-3 shadow-lg shadow-black/40"
            >
                <FaRobot className="text-lg" aria-hidden="true" />
                {isOpen ? "Close assistant" : "Ask the AI radiologist"}
            </button>

            {isOpen && (
                <section
                    id="ai-radiologist-chat"
                    aria-label="AI radiologist chat"
                    className="card fixed inset-x-3 bottom-20 z-30 flex max-h-[70vh] flex-col shadow-2xl shadow-black/60 sm:left-auto sm:right-5 sm:w-96"
                >
                    <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
                        <div>
                            <h2 className="text-sm font-semibold">AI radiologist assistant</h2>
                            <p className="mt-0.5 text-xs text-slate-400">
                                {isSample ? SAMPLE_CHAT_NOTICE : "Answers are AI-generated and may be wrong. Not medical advice."}
                            </p>
                        </div>
                        <button type="button" onClick={() => setIsOpen(false)} className="btn-ghost -mr-2 px-2" aria-label="Close chat">
                            <MdClose className="text-lg" />
                        </button>
                    </header>

                    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
                        {messages.length === 0 && (
                            <p className="text-sm text-slate-400">
                                {isSample ? "Choose a question below to see how a conversation looks." : "Ask a question about this report."}
                            </p>
                        )}
                        {messages.map((message, index) => (
                            <Message key={index} {...message} />
                        ))}
                        {isSending && <p className="text-sm text-slate-400">The assistant is writing a response...</p>}
                        <div ref={endRef} />
                    </div>

                    <div className="border-t border-white/10 p-3">
                        {isSample ? (
                            <div className="flex flex-col gap-2">
                                {sampleChatScript.map((entry) => (
                                    <button
                                        key={entry.question}
                                        type="button"
                                        onClick={() => askSample(entry)}
                                        disabled={askedQuestions.has(entry.question)}
                                        className="rounded-lg border border-white/10 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5 disabled:opacity-40"
                                    >
                                        {entry.question}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <form onSubmit={send} className="flex gap-2">
                                <label htmlFor="chat-input" className="sr-only">Your question</label>
                                <input
                                    id="chat-input"
                                    ref={inputRef}
                                    value={input}
                                    onChange={(event) => setInput(event.target.value)}
                                    maxLength={MAX_PROMPT_LENGTH}
                                    placeholder="Ask about this report..."
                                    className="input"
                                    autoComplete="off"
                                />
                                <button type="submit" disabled={!input.trim() || isSending} className="btn-primary px-3" aria-label="Send">
                                    <MdSend className="text-lg" />
                                </button>
                            </form>
                        )}
                    </div>
                </section>
            )}
        </>
    );
};

export default ChatPanel;
