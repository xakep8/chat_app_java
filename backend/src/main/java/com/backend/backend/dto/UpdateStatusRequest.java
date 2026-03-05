package com.backend.backend.dto;

import com.backend.backend.enums.MessageStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateStatusRequest {
    @NotNull
    private Long messageId;

    @NotNull
    private MessageStatus status;
}
