package com.sharedkitchen.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String fromUsername;

    @Column(nullable = false, length = 50)
    private String toUsername;

    @Column(nullable = false, length = 2000)
    private String content;

    private LocalDateTime timestamp = LocalDateTime.now();
}
