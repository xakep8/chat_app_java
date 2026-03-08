package com.backend.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TypingResponse {
    @JsonProperty("chat_id")
    private Long chatId;
    
    @JsonProperty("user_id")
    private Long userId;
    
    @JsonProperty("user_name")
    private String userName;
    
    @JsonProperty("is_typing")
    private Boolean isTyping;
}
