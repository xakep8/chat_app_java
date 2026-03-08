package com.backend.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatResponse {
    private Long id;
    private String otherParticipantName;
    private String lastMessage;
    private String lastMessageTime;
    private String initials;
    private String gradient;
    @JsonProperty("other_participant_id")
    private Long otherParticipantId;

    @JsonProperty("other_participant_online")
    private boolean otherParticipantOnline;
}
