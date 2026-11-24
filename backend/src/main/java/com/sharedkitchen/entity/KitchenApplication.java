package com.sharedkitchen.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "kitchen_applications")
public class KitchenApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 提供者用户名 */
    @Column(nullable = false, length = 50)
    private String providerUsername;

    @Column(nullable = false, length = 100)
    private String kitchenName;

    @Column(nullable = false, length = 50)
    private String kitchenType;

    @Column(nullable = false)
    private Integer price;

    @Column(length = 500)
    private String facilities;

    @Column(length = 200)
    private String address;

    /** pending / approved / rejected */
    @Column(nullable = false, length = 20)
    private String status = "pending";

    private LocalDateTime createdAt = LocalDateTime.now();
}
