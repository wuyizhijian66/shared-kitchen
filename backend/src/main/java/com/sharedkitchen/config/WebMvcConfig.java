package com.sharedkitchen.config;

import com.sharedkitchen.security.JwtInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final JwtInterceptor jwtInterceptor;

    public WebMvcConfig(JwtInterceptor jwtInterceptor) {
        this.jwtInterceptor = jwtInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(jwtInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns(
                        // 公开端点：不需要 token
                        "/api/users/login",
                        "/api/users/register",
                        // 厨房列表公开；详情 /api/kitchens/{纯数字id} 由 JwtInterceptor 单独放行。
                        // 不能写 "/api/kitchens/{id}"：拦截器的路径变量会匹配任意单段，
                        // 会把 /api/kitchens/all、/api/kitchens/mine 一起放行（鉴权绕过）。
                        "/api/kitchens",
                        // 静态前端文件
                        "/", "/index.html", "/css/**", "/js/**", "/images/**", "/assets/**",
                        // 错误页 / Swagger
                        "/error", "/doc.html", "/webjars/**",
                        "/v3/api-docs/**", "/swagger-resources/**"
                );
    }
}
