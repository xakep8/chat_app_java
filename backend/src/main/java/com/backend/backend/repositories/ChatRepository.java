package com.backend.backend.repositories;

import com.backend.backend.entities.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT c FROM Chat c JOIN FETCH c.sender JOIN FETCH c.receiver " +
           "WHERE c.sender.id = :userId OR c.receiver.id = :userId")
    List<Chat> findAllBySenderIdOrReceiverId(Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM Chat c WHERE " +
           "(c.sender.id = :u1 AND c.receiver.id = :u2) OR " +
           "(c.sender.id = :u2 AND c.receiver.id = :u1)")
    List<Chat> findByParticipants(Long u1, Long u2);
}
