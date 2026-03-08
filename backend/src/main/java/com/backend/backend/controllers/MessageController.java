package com.backend.backend.controllers;

import com.backend.backend.dto.*;
import com.backend.backend.entities.User;
import com.backend.backend.services.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
@Slf4j
public class MessageController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload SendMessageRequest request, Principal principal) {
        log.info("[STOMP] Received sendMessage request for chat_id: {}", request.getChat_id());
        try {
            User user = (User) ((UsernamePasswordAuthenticationToken) principal).getPrincipal();
            log.info("[STOMP] Message from user: {} (ID: {})", user.getEmail(), user.getId());
            
            MessageResponse response = messageService.sendMessage(request, user.getId());
            log.info("[STOMP] Message saved. Broadcasting to /topic/chat/{}", request.getChat_id());
            
            messagingTemplate.convertAndSend("/topic/chat/" + request.getChat_id(), response);
            log.info("[STOMP] Broadcast complete.");
        } catch (Exception e) {
            log.error("[STOMP] ERROR processing message: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/chat.updateStatus")
    public void updateMessageStatus(@Payload UpdateStatusRequest request, Principal principal) {
        User user = (User) ((UsernamePasswordAuthenticationToken) principal).getPrincipal();
        MessageResponse response = messageService.updateMessageStatus(request, user.getId());
        messagingTemplate.convertAndSend("/topic/chat/" + response.getChatId(), response);
    }

    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload TypingRequest request, Principal principal){
        User user = (User) ((UsernamePasswordAuthenticationToken) principal).getPrincipal();
        TypingResponse response = TypingResponse.builder()
                .chatId(request.getChatId())
                .userId(user.getId())
                .userName(user.getFirstName())
                .isTyping(request.getIsTyping())
                .build();
        messagingTemplate.convertAndSend("/topic/chat/" + request.getChatId() + "/typing", response);
    }

    @GetMapping("/{chatId}")
    public ResponseEntity<List<MessageResponse>> getMessages(@PathVariable Long chatId) {
        return ResponseEntity.ok(messageService.getMessages(chatId));
    }
}
