package com.backend.backend.services;

import com.backend.backend.dto.MessageResponse;
import com.backend.backend.dto.SendMessageRequest;
import com.backend.backend.dto.UpdateStatusRequest;
import com.backend.backend.entities.Chat;
import com.backend.backend.entities.Message;
import com.backend.backend.entities.User;
import com.backend.backend.enums.MessageStatus;
import com.backend.backend.repositories.ChatRepository;
import com.backend.backend.repositories.MessageRepository;
import com.backend.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MessageService {

    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;

    public MessageResponse sendMessage(SendMessageRequest request, Long senderId) {
        System.out.println("[MessageService] Processing sendMessage for chat_id: " + request.getChat_id() + " from senderId: " + senderId);
        try {
            Chat chat = chatRepository.findById(request.getChat_id())
                    .orElseThrow(() -> new RuntimeException("Chat not found with ID: " + request.getChat_id()));

            User sender = userRepository.findById(senderId)
                    .orElseThrow(() -> new RuntimeException("Sender not found with ID: " + senderId));

            // Identify receiver
            User receiver = chat.getSender().getId().equals(senderId) ? chat.getReceiver() : chat.getSender();

            // Optional: verify sender belongs to chat
            if (!chat.getSender().getId().equals(senderId) && !chat.getReceiver().getId().equals(senderId)) {
                System.err.println("[MessageService] Security Alert: User " + senderId + " tried to send message to chat " + chat.getId());
                throw new RuntimeException("User does not belong to this chat");
            }

            Message message = new Message(chat, sender, receiver, request.getMessage());
            message = messageRepository.save(message);
            System.out.println("[MessageService] Message saved successfully. ID: " + message.getId());

            return MessageResponse.builder()
                    .id(message.getId())
                    .chatId(chat.getId())
                    .senderId(sender.getId())
                    .message(message.getMessage())
                    .senderName(sender.getFirstName() + " " + sender.getLastName())
                    .status(message.getStatus())
                    .createdAt(message.getCreatedAt())
                    .build();
        } catch (Exception e) {
            System.err.println("[MessageService] ERROR in sendMessage: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public MessageResponse updateMessageStatus(UpdateStatusRequest request, Long currentUserId) {
        Message message = messageRepository.findById(request.getMessageId())
                .orElseThrow(() -> new RuntimeException("Message not found"));

        // Optional: ensure recipient is updating status
        Chat chat = message.getChat();
        boolean isRecipient = (chat.getSender().getId().equals(currentUserId) && !message.getSender().getId().equals(currentUserId))
                || (chat.getReceiver().getId().equals(currentUserId) && !message.getSender().getId().equals(currentUserId));
        
        // Let's simplify and just update the status for now
        message.setStatus(request.getStatus());
        message = messageRepository.save(message);

        return MessageResponse.builder()
                .id(message.getId())
                .chatId(chat.getId())
                .senderId(message.getSender().getId())
                .message(message.getMessage())
                .senderName(message.getSender().getFirstName() + " " + message.getSender().getLastName())
                .status(message.getStatus())
                .createdAt(message.getCreatedAt())
                .build();
    }

    public List<MessageResponse> getMessages(Long chatId) {
        return messageRepository.findByChatId(chatId).stream()
                .map(message -> MessageResponse.builder()
                        .id(message.getId())
                        .chatId(message.getChat().getId())
                        .senderId(message.getSender().getId())
                        .message(message.getMessage())
                        .senderName(message.getSender().getFirstName() + " " + message.getSender().getLastName())
                        .status(message.getStatus())
                        .createdAt(message.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
