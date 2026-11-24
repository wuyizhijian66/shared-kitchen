package com.sharedkitchen.security;

import com.sharedkitchen.common.BusinessException;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.regex.Pattern;

@Component
public class JwtInterceptor implements HandlerInterceptor {

    /** 厨房详情是公开页面：只放行纯数字 id，避免 /all、/mine 被一并放过 */
    private static final Pattern KITCHEN_DETAIL = Pattern.compile("^/api/kitchens/\\d+/?$");

    @Value("${jwt.header}")
    private String header;

    @Value("${jwt.prefix}")
    private String prefix;

    private final JwtUtil jwtUtil;

    public JwtInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // CORS 预检请求直接放行（浏览器 OPTIONS 不带 Authorization 头）
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        // 厨房详情公开（GET /api/kitchens/{数字id}）
        if ("GET".equalsIgnoreCase(request.getMethod())
                && KITCHEN_DETAIL.matcher(request.getRequestURI()).matches()) {
            return true;
        }
        // Swagger / error 放行
        if (request.getRequestURI().contains("/error")
                || request.getRequestURI().contains("/actuator")
                || request.getRequestURI().contains("swagger")
                || request.getRequestURI().contains("v3/api-docs")) {
            return true;
        }

        String auth = request.getHeader(header);
        if (auth == null || !auth.startsWith(prefix)) {
            throw BusinessException.unauthorized("未登录或Token无效");
        }
        String token = auth.substring(prefix.length()).trim();
        if (!jwtUtil.validateToken(token)) {
            throw BusinessException.unauthorized("Token已过期或无效");
        }
        Claims claims = jwtUtil.parseToken(token);
        // 注入到 request attribute，Controller 可以直接取
        request.setAttribute("currentUsername", claims.getSubject());
        request.setAttribute("currentRole", claims.get("role", String.class));
        return true;
    }
}
