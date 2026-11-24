package com.sharedkitchen.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(length = 50)
    private String username;

    /**
     * 密码：只允许反序列化（注册/登录入参），序列化时永远不输出。
     * 修复前 GET /api/users 和 GET /api/chat/contacts 会把全站用户明文密码返回给前端。
     */
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false, length = 100)
    private String password;

    @Column(nullable = false, length = 50)
    private String name;

    /** provider / user / admin */
    @Column(nullable = false, length = 20)
    private String type;

    @Column(length = 20)
    private String phone;

    @Column(length = 200)
    private String address;
}
