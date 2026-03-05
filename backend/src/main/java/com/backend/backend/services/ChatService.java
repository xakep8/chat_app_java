package com.backend.backend.services;

import com.backend.backend.dto.ChatResponse;
import com.backend.backend.entities.Chat;
import com.backend.backend.entities.Message;
import com.backend.backend.entities.User;
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
public class ChatService {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ChatResponse> getUserChats(Long userId) {
        System.out.println("[ChatService] Fetching chats for userId: " + userId);
        try {
            List<Chat> chats = chatRepository.findAllBySenderIdOrReceiverId(userId);
            System.out.println("[ChatService] Found " + chats.size() + " raw chat entities");
            
            return chats.stream()
                .map(chat -> {
                    try {
                        User sender = chat.getSender();
                        User receiver = chat.getReceiver();
                        
                        if (sender == null || receiver == null) {
                            System.err.println("[ChatService] Missing participant in chat ID: " + chat.getId());
                            return null;
                        }

                        User otherUser = sender.getId().equals(userId) ? receiver : sender;
                        
                        // Get last message
                        List<Message> messages = messageRepository.findByChatId(chat.getId());
                        String lastMessageText = messages.isEmpty() ? "No messages yet" : messages.get(messages.size() - 1).getMessage();
                        String lastMessageTime = messages.isEmpty() ? "" : messages.get(messages.size() - 1).getCreatedAt().toString();

                        // Safety check for initials
                        String fName = otherUser.getFirstName() != null && !otherUser.getFirstName().isEmpty() ? otherUser.getFirstName() : "U";
                        String lName = otherUser.getLastName() != null && !otherUser.getLastName().isEmpty() ? otherUser.getLastName() : "S";
                        String initials = (fName.substring(0, 1) + "" + lName.substring(0, 1)).toUpperCase();
                        
                        // Assign a consistent gradient based on user ID
                        String[] gradients = {
                            "from-pink-500 to-rose-500",
                            "from-blue-500 to-indigo-500",
                            "from-emerald-500 to-teal-500",
                            "from-amber-500 to-orange-500",
                            "from-purple-500 to-violet-500"
                        };
                        String gradient = gradients[(int) (otherUser.getId() % gradients.length)];

                        return ChatResponse.builder()
                                .id(chat.getId())
                                .otherParticipantName(fName + " " + lName)
                                .lastMessage(lastMessageText)
                                .lastMessageTime(lastMessageTime)
                                .initials(initials)
                                .gradient(gradient)
                                .build();
                    } catch (Exception e) {
                        System.err.println("[ChatService] Error processing chat ID " + chat.getId() + ": " + e.getMessage());
                        e.printStackTrace();
                        return null;
                    }
                })
                .filter(res -> res != null)
                .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("[ChatService] Critical error in getUserChats for UID " + userId + ": " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Transactional
    public ChatResponse createChat(Long senderId, Long receiverId) {
        System.out.println("[ChatService] createChat requested for " + senderId + " and " + receiverId);
        
        // 1. Check if chat already exists
        List<Chat> existingChats = chatRepository.findByParticipants(senderId, receiverId);
        if (!existingChats.isEmpty()) {
            Chat chat = existingChats.get(0);
            System.out.println("[ChatService] Using existing chat ID: " + chat.getId());
            User otherUser = chat.getSender().getId().equals(senderId) ? chat.getReceiver() : chat.getSender();
            return mapToResponse(chat, senderId, otherUser);
        }

        // 2. Otherwise create new
        System.out.println("[ChatService] No existing chat found. Creating new...");
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        Chat chat = new Chat();
        chat.setSender(sender);
        chat.setReceiver(receiver);
        chat = chatRepository.save(chat);
        
        return mapToResponse(chat, senderId, receiver);
    }

    private ChatResponse mapToResponse(Chat chat, Long currentUserId, User otherUser) {
        String fName = otherUser.getFirstName() != null ? otherUser.getFirstName() : "User";
        String lName = otherUser.getLastName() != null ? otherUser.getLastName() : "";
        String initials = (fName.substring(0, 1) + (lName.isEmpty() ? "" : lName.substring(0, 1))).toUpperCase();
        
        return ChatResponse.builder()
                .id(chat.getId())
                .otherParticipantName(fName + " " + (lName.isEmpty() ? "" : lName))
                .lastMessage("Starting conversation...")
                .initials(initials)
                .gradient("from-indigo-500 to-purple-600")
                .build();
    }
}
