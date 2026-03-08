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
    const [userStatuses, setUserStatuses] = useState<Record<number, boolean>>({});
    const stompClient = useRef<Client | null>(null);
    const subscriptionRef = useRef<StompSubscription | null>(null);
    const typingSubscriptionRef = useRef<StompSubscription | null>(null);
    const statusSubscriptionRef = useRef<StompSubscription | null>(null);

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

    // Effect for global features (Status Updates)
    useEffect(() => {
        if (isConnected && stompClient.current) {
            // Subscribe to global user status updates
            const statusSub = stompClient.current.subscribe('/topic/users/status', (message: IMessage) => {
                const userData = JSON.parse(message.body);
                setUserStatuses((prev) => ({
                    ...prev,
                    [userData.id]: userData.is_online
                }));
            });

            statusSubscriptionRef.current = statusSub;

            return () => {
                if (statusSub) statusSub.unsubscribe();
                statusSubscriptionRef.current = null;
            };
        }
    }, [isConnected]);

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
                setTypingUsers({});
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
        sendTypingStatus,
        userStatuses
    };
};
