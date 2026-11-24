package com.sharedkitchen.controller;

import com.sharedkitchen.common.Authz;
import com.sharedkitchen.common.BusinessException;
import com.sharedkitchen.common.Result;
import com.sharedkitchen.dto.request.LoginRequest;
import com.sharedkitchen.dto.request.RegisterRequest;
import com.sharedkitchen.entity.User;
import com.sharedkitchen.repository.UserRepository;
import com.sharedkitchen.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    /** 登录 → 返回 token */
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@Valid @RequestBody LoginRequest req) {
        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new BusinessException(401, "用户名或密码错误"));

        // BCrypt 无法"反查"，只能取出用户再比对；同时兼容尚未迁移的历史明文密码
        if (!passwordMatches(req.getPassword(), user.getPassword())) {
            throw new BusinessException(401, "用户名或密码错误");
        }
        if (!isBcrypt(user.getPassword())) {
            // 明文密码命中一次就顺手升级成哈希，下次登录走 BCrypt
            user.setPassword(passwordEncoder.encode(req.getPassword()));
            userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getType());

        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("username", user.getUsername());
        data.put("name", user.getName());
        data.put("type", user.getType());
        return Result.ok("登录成功", data);
    }

    /** 注册 */
    @PostMapping("/register")
    public Result<User> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new BusinessException("用户名已存在");
        }
        User user = new User();
        user.setUsername(req.getUsername());
        // 入库前哈希，绝不再存明文
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setName(req.getName());
        user.setType(req.getType());
        user.setPhone(req.getPhone());
        user.setAddress(req.getAddress());
        return Result.ok("注册成功", userRepository.save(user));
    }

    /** 当前用户信息 */
    @GetMapping("/me")
    public Result<User> me(@RequestAttribute("currentUsername") String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> BusinessException.notFound("用户不存在"));
        return Result.ok(user);
    }

    /** 密码比对：BCrypt 哈希走 encoder，历史明文走字符串比较 */
    private boolean passwordMatches(String raw, String stored) {
        if (raw == null || stored == null) {
            return false;
        }
        if (isBcrypt(stored)) {
            return passwordEncoder.matches(raw, stored);
        }
        return stored.equals(raw);
    }

    private static boolean isBcrypt(String pwd) {
        return pwd.startsWith("$2a$") || pwd.startsWith("$2b$") || pwd.startsWith("$2y$");
    }

    /** 管理员：所有用户列表 */
    @GetMapping
    public Result<List<User>> list(@RequestParam(required = false) String type,
                                   @RequestAttribute("currentRole") String role) {
        Authz.requireAdmin(role);
        List<User> users = (type != null) ? userRepository.findByType(type) : userRepository.findAll();
        return Result.ok(users);
    }
}
