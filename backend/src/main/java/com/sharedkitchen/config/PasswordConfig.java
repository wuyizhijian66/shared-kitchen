package com.sharedkitchen.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * 密码哈希。
 *
 * 只依赖 spring-security-crypto（BCrypt 算法本身），不引入 Spring Security 的过滤器链，
 * 因此不会影响现有的 JwtInterceptor 鉴权流程。
 */
@Configuration
public class PasswordConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        // strength=10 是 BCrypt 的默认值：单次校验约 50~100ms，对登录接口完全够用
        return new BCryptPasswordEncoder();
    }
}
