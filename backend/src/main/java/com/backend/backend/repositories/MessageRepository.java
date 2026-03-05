package com.backend.backend.repositories;

import com.backend.backend.entities.Chat;
import com.backend.backend.entities.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message,Long> {
    List<Message> findMessagesByChat(Chat chat);
    List<Message> findByChatId(Long chatId);

    @Override
    Optional<Message> findById(Long aLong);
}
