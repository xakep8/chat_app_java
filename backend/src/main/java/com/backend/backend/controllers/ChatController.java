package com.backend.backend.controllers;

import com.backend.backend.dto.ChatResponse;
import com.backend.backend.entities.User;
import com.backend.backend.services.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping
    public ResponseEntity<List<ChatResponse>> getChats(Principal principal) {
        System.out.println("[ChatController] Entering getChats");
        try {
            User user = (User) ((UsernamePasswordAuthenticationToken) principal).getPrincipal();
            System.out.println("[ChatController] User found: " + user.getEmail() + " (ID: " + user.getId() + ")");
            List<ChatResponse> chats = chatService.getUserChats(user.getId());
            System.out.println("[ChatController] Found " + chats.size() + " chats for user");
            return ResponseEntity.ok(chats);
        } catch (Exception e) {
            System.err.println("[ChatController] ERROR in getChats: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PostMapping("/{receiverId}")
    public ResponseEntity<ChatResponse> createChat(Principal principal, @PathVariable Long receiverId) {
        System.out.println("[ChatController] Creating chat with receiverId: " + receiverId);
        User user = (User) ((UsernamePasswordAuthenticationToken) principal).getPrincipal();
        return ResponseEntity.ok(chatService.createChat(user.getId(), receiverId));
    }
}
