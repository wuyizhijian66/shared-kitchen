package com.sharedkitchen.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "kitchens")
public class Kitchen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(nullable = false)
    private Integer price;

    private Double rating;

    @Column(length = 500)
    private String image;

    @Column(length = 500)
    private String facilities;

    /** 提供者用户名 */
    @Column(length = 50)
    private String providerUsername;

    /** available / pending / rejected */
    @Column(nullable = false, length = 20)
    private String status = "available";
}
