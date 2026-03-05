package com.backend.backend.dto;

import com.backend.backend.enums.MessageStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MessageResponse {
    private Long id;
    private Long chatId;
    private Long senderId;
    private String message;
    private String senderName;
    private MessageStatus status;
    private java.time.LocalDateTime createdAt;
}
