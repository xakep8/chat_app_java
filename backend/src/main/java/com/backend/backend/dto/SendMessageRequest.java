package com.backend.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SendMessageRequest {
    @NotNull(message = "Chat ID cannot be blank")
    @JsonProperty("chat_id")
    private Long chat_id;

    @NotBlank(message = "Message cannot be blank")
    private String message;

    private String attachments;
}
