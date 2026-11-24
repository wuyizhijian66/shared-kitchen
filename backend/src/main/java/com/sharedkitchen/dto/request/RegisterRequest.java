package com.sharedkitchen.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 50, message = "用户名长度3-50")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 100, message = "密码长度6-100")
    private String password;

    @NotBlank(message = "姓名不能为空")
    private String name;

    /** provider / user */
    @NotBlank(message = "类型不能为空")
    private String type;

    private String phone;
    private String address;
}
