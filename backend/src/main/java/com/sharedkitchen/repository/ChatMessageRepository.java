package com.sharedkitchen.repository;

import com.sharedkitchen.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByFromUsernameAndToUsernameOrFromUsernameAndToUsernameOrderByTimestampAsc(
            String from1, String to1, String from2, String to2);
    List<ChatMessage> findByFromUsername(String username);
    List<ChatMessage> findByToUsername(String username);
}
