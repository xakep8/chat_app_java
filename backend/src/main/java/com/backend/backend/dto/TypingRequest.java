package com.backend.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class TypingRequest {
    @JsonProperty("chat_id")
    private Long chatId;
    
    @JsonProperty("is_typing")
    private Boolean isTyping;
}
