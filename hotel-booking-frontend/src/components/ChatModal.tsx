import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Send, X, MessageSquare, Loader2, User, Building2 } from "lucide-react";
import * as apiClient from "../api-client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import useAppContext from "../hooks/useAppContext";

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    hotelName: string;
    receiverName: string;
    userRole: "user" | "hotel_owner";
}

const ChatModal = ({ isOpen, onClose, bookingId, hotelName, receiverName, userRole }: ChatModalProps) => {
    const { user } = useAppContext();
    const queryClient = useQueryClient();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [newMessage, setNewMessage] = useState("");

    // Fetch messages with polling for real-time feel (every 3 seconds)
    const { data: messages, isLoading } = useQuery(
        ["fetchMessages", bookingId],
        () => apiClient.fetchMessages(bookingId),
        {
            enabled: isOpen && !!bookingId,
            refetchInterval: 3000,
        }
    );

    const mutation = useMutation(apiClient.sendMessage, {
        onSuccess: () => {
            setNewMessage("");
            queryClient.invalidateQueries(["fetchMessages", bookingId]);
        },
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || mutation.isLoading) return;

        mutation.mutate({
            bookingId,
            content: newMessage.trim(),
            senderRole: userRole,
            senderName: `${user?.firstName} ${user?.lastName}`,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-0 overflow-hidden text-white h-[600px] flex flex-col">
                <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-5 relative border-b border-white/5 shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-indigo-400" />
                            Chat with {userRole === "user" ? "Owner" : "Guest"}
                        </DialogTitle>
                        <DialogDescription className="text-white/60 text-sm mt-1">
                            {hotelName} • {receiverName}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                        </div>
                    ) : messages?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-white/30 space-y-2">
                            <MessageSquare className="w-12 h-12 opacity-20" />
                            <p className="text-sm">No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages?.map((msg: any) => {
                            const isMe = msg.senderRole === userRole;
                            return (
                                <div
                                    key={msg._id}
                                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl p-3 text-sm ${isMe
                                                ? "bg-indigo-600 text-white rounded-tr-none"
                                                : "bg-white/10 text-white/90 rounded-tl-none border border-white/5"
                                            }`}
                                    >
                                        <div className="flex items-center gap-1.5 mb-1 opacity-50 text-[10px] font-bold uppercase tracking-wider">
                                            {isMe ? <User className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                                            {msg.senderName}
                                        </div>
                                        {msg.content}
                                        <div className="text-[9px] mt-1 opacity-40 text-right">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <form
                    onSubmit={handleSendMessage}
                    className="p-4 bg-white/5 border-t border-white/5 shrink-0"
                >
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-white/20"
                        />
                        <Button
                            type="submit"
                            disabled={!newMessage.trim() || mutation.isLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 h-10 w-10 p-0 rounded-xl shrink-0"
                        >
                            {mutation.isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 font-bold" />
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ChatModal;
