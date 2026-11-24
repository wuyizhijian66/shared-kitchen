package com.sharedkitchen.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 使用者用户名 */
    @Column(nullable = false, length = 50)
    private String username;

    /** 厨房ID（冗余 + 外键） */
    private Long kitchenId;

    /** 厨房名称（冗余） */
    @Column(length = 100)
    private String kitchenName;

    /** 日期 yyyy-MM-dd */
    @Column(nullable = false, length = 10)
    private String date;

    /** 时间段 08:00-12:00 */
    @Column(nullable = false, length = 20)
    private String timeSlot;

    /** 待支付 / 待使用 / 已取消 / 已使用 / 已确认 */
    @Column(nullable = false, length = 20)
    private String status = "待支付";

    @Column(length = 20)
    private String phone;

    /** 已支付 / null */
    @Column(length = 20)
    private String paymentStatus;

    private LocalDateTime paymentTime;

    /** 已退款 / null */
    @Column(length = 20)
    private String refundStatus;

    private LocalDateTime refundTime;

    private LocalDateTime createdAt = LocalDateTime.now();
}
