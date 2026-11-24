package com.sharedkitchen.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "deleted_kitchens")
public class DeletedKitchen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 原厨房ID */
    private Long originalKitchenId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 50)
    private String type;

    private Integer price;

    private Double rating;

    @Column(length = 500)
    private String image;

    @Column(length = 500)
    private String facilities;

    @Column(length = 50)
    private String providerUsername;

    @Column(length = 500)
    private String deleteReason;

    private LocalDateTime deletedAt = LocalDateTime.now();
}
