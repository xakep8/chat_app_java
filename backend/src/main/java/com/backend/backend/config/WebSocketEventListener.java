package com.backend.backend.config;

import com.backend.backend.dto.UserDto;
import com.backend.backend.entities.User;
import com.backend.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        UsernamePasswordAuthenticationToken userToken = (UsernamePasswordAuthenticationToken) headerAccessor.getUser();
        
        log.info("[WS-CONNECT] Received connection event. User: {}", (userToken != null ? userToken.getName() : "NULL"));

        if (userToken != null) {
            User user = (User) userToken.getPrincipal();
            log.info("[WS-CONNECT] User {} (ID: {}) connected", user.getEmail(), user.getId());
            updateUserStatus(user.getId(), true);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        UsernamePasswordAuthenticationToken userToken = (UsernamePasswordAuthenticationToken) headerAccessor.getUser();

        log.info("[WS-DISCONNECT] Received disconnect event. User: {}", (userToken != null ? userToken.getName() : "NULL"));

        if (userToken != null) {
            User user = (User) userToken.getPrincipal();
            log.info("[WS-DISCONNECT] User {} (ID: {}) disconnected", user.getEmail(), user.getId());
            updateUserStatus(user.getId(), false);
        }
    }

    private void updateUserStatus(Long userId, boolean isOnline) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setOnline(isOnline);
            userRepository.save(user);
            log.info("User {} is now {}", user.getEmail(), isOnline ? "ONLINE" : "OFFLINE");

            UserDto statusUpdate = UserDto.builder()
                    .id(user.getId())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .email(user.getEmail())
                    .isOnline(isOnline)
                    .build();

            messagingTemplate.convertAndSend("/topic/users/status", statusUpdate);
        });
    }
}
