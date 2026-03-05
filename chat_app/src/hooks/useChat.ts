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
    const stompClient = useRef<Client | null>(null);
    const subscriptionRef = useRef<StompSubscription | null>(null);

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
            console.log('STOMP: Connected');
            setIsConnected(true);
        };

        client.onDisconnect = () => {
            console.log('STOMP: Disconnected');
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

    // Effect for chat-specific subscription
    useEffect(() => {
        if (isConnected && chatId && stompClient.current) {
            console.log(`STOMP: Subscribing to /topic/chat/${chatId}`);

            // NOTE: We don't clear messages here anymore. 
            // Messages.tsx handles the initial fetch and clearing when chat changes.
            // Clearing here was causing a race condition with fetchMessages().

            const sub = stompClient.current.subscribe(`/topic/chat/${chatId}`, (message: IMessage) => {
                const receivedMessage: ChatMessage = JSON.parse(message.body);
                console.log('%cSTOMP: Message RECEIVED:', 'color: #00ff00; font-weight: bold', receivedMessage);

                setMessages((prev) => {
                    const existingMsgIndex = prev.findIndex(m => m.id === receivedMessage.id);
                    if (existingMsgIndex !== -1) {
                        // Message exists. Update it if status changed (e.g. to READ)
                        const existingMsg = prev[existingMsgIndex];
                        if (existingMsg.status !== receivedMessage.status) {
                            console.log(`STOMP: Updating message ${receivedMessage.id} status to ${receivedMessage.status}`);
                            const newMessages = [...prev];
                            newMessages[existingMsgIndex] = receivedMessage;
                            return newMessages;
                        }
                        console.log('STOMP: Ignored duplicate message:', receivedMessage.id);
                        return prev;
                    }
                    console.log('STOMP: Adding new message to state');
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
            return () => {
                console.log(`STOMP: Unsubscribing from /topic/chat/${chatId}`);
                if (sub) sub.unsubscribe();
                subscriptionRef.current = null;
            };
        }
    }, [isConnected, chatId, user?.id, setMessages]);

    const sendMessage = (content: string) => {
        if (stompClient.current && isConnected && chatId) {
            console.log(`[useChat] Publishing message to chat ${chatId}:`, content);
            stompClient.current.publish({
                destination: '/app/chat.sendMessage',
                body: JSON.stringify({
                    chat_id: chatId,
                    message: content,
                }),
            });
        } else {
            console.warn('[useChat] Cannot send message: client not connected or no chatId', {
                isConnected,
                chatId,
                clientActive: stompClient.current?.active
            });
        }
    };

    const markMessageAsRead = (messageId: number) => {
        if (stompClient.current && isConnected && chatId) {
            console.log(`[useChat] Marking message ${messageId} as READ`);
            stompClient.current.publish({
                destination: '/app/chat.updateStatus',
                body: JSON.stringify({
                    messageId: messageId,
                    status: 'READ',
                }),
            });
        }
    };

    return { messages, setMessages, isConnected, sendMessage, markMessageAsRead };
};
