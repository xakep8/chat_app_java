import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import type { IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';

export interface ChatMessage {
    id: number;
    chatId: number;
    senderId: number;
    message: string;
    senderName: string;
    status: string;
    createdAt: string;
}

export const useChat = (chatId: number | null) => {
    const { accessToken, user } = useAuthStore();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Record<number, string>>({});
    const stompClient = useRef<Client | null>(null);
    const subscriptionRef = useRef<StompSubscription | null>(null);
    const typingSubscriptionRef = useRef<StompSubscription | null>(null);

    const connect = useCallback(() => {
        if (stompClient.current?.active) return;

        const client = new Client({
            webSocketFactory: () => new SockJS('/ws'),
            connectHeaders: {
                Authorization: `Bearer ${accessToken}`,
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            setIsConnected(true);
        };

        client.onDisconnect = () => {
            setIsConnected(false);
        };

        client.onStompError = (frame) => {
            console.error('STOMP Error:', frame.headers['message']);
        };

        client.activate();
        stompClient.current = client;
    }, [accessToken]);

    const disconnect = useCallback(() => {
        if (stompClient.current) {
            stompClient.current.deactivate();
            stompClient.current = null;
            setIsConnected(false);
        }
    }, []);

    // Effect for stable connection
    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    useEffect(() => {
        if (isConnected && chatId && stompClient.current) {

            // NOTE: We don't clear messages here anymore. 
            // Messages.tsx handles the initial fetch and clearing when chat changes.
            // Clearing here was causing a race condition with fetchMessages().

            const sub = stompClient.current.subscribe(`/topic/chat/${chatId}`, (message: IMessage) => {
                const receivedMessage: ChatMessage = JSON.parse(message.body);

                setMessages((prev) => {
                    const existingMsgIndex = prev.findIndex(m => m.id === receivedMessage.id);
                    if (existingMsgIndex !== -1) {
                        // Message exists. Update it if status changed (e.g. to READ)
                        const existingMsg = prev[existingMsgIndex];
                        if (existingMsg.status !== receivedMessage.status) {
                            const newMessages = [...prev];
                            newMessages[existingMsgIndex] = receivedMessage;
                            return newMessages;
                        }
                        return prev;
                    }
                    return [...prev, receivedMessage];
                });

                // Notify only if it's a completely NEW message from someone else.
                // If it's a completely new message from someone else, we show the toast.
                // Status updates (like someone reading our message) won't trigger this 
                // because the senderId will be our own ID in that case, or if it's from 
                // them, the backend should ideally send READ status initially if they are active,
                // but realistically we just want to avoid toast spam for status updates.
                // In reality, if they read our message, it's our message being updated.
                // If they send us a message, status is SENT.
                // We'll safely assume SENT status = new message for toast purposes.
                if (receivedMessage.senderId !== user?.id && receivedMessage.status === 'SENT') {
                    toast.message('New message', {
                        description: `[${receivedMessage.senderName}]: ${receivedMessage.message}`,
                        duration: 3000,
                    });
                }
            });

            subscriptionRef.current = sub;

            // Subscribe to typing indicators
            const typingSub = stompClient.current.subscribe(`/topic/chat/${chatId}/typing`, (message: IMessage) => {
                const typingData = JSON.parse(message.body);

                const senderId = typingData.user_id !== undefined ? typingData.user_id : typingData.userId;
                if (senderId === user?.id) return;

                setTypingUsers((prev) => {
                    const newTypingUsers = { ...prev };
                    const isTypingActive = typingData.is_typing !== undefined ? typingData.is_typing : (typingData.isTyping !== undefined ? typingData.isTyping : typingData.typing);
                    const senderUserId = typingData.user_id !== undefined ? typingData.user_id : typingData.userId;
                    const senderUserName = typingData.user_name !== undefined ? typingData.user_name : typingData.userName;

                    if (isTypingActive && senderUserId) {
                        newTypingUsers[senderUserId] = senderUserName;
                    } else if (senderUserId) {
                        delete newTypingUsers[senderUserId];
                    }
                    return newTypingUsers;
                });
            });

            typingSubscriptionRef.current = typingSub;

            return () => {
                if (sub) sub.unsubscribe();
                if (typingSub) typingSub.unsubscribe();
                subscriptionRef.current = null;
                typingSubscriptionRef.current = null;
                setTypingUsers({}); // Clear typing users on unsubscribe
            };
        }
    }, [isConnected, chatId, user?.id, setMessages]);

    const sendMessage = (content: string) => {
        if (stompClient.current && isConnected && chatId) {
            stompClient.current.publish({
                destination: '/app/chat.sendMessage',
                body: JSON.stringify({
                    chat_id: chatId,
                    message: content,
                }),
            });
        }
    };

    const markMessageAsRead = (messageId: number) => {
        if (stompClient.current && isConnected && chatId) {
            stompClient.current.publish({
                destination: '/app/chat.updateStatus',
                body: JSON.stringify({
                    messageId: messageId,
                    status: 'READ',
                }),
            });
        }
    };

    const sendTypingStatus = (isTyping: boolean) => {
        if (stompClient.current && isConnected && chatId) {
            stompClient.current.publish({
                destination: '/app/chat.typing',
                body: JSON.stringify({
                    chat_id: chatId,
                    is_typing: isTyping,
                }),
            });
        }
    };

    return {
        messages,
        setMessages,
        isConnected,
        sendMessage,
        markMessageAsRead,
        typingUsers,
        sendTypingStatus
    };
};
