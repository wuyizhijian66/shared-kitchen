package com.sharedkitchen.config;

import com.sharedkitchen.entity.User;
import com.sharedkitchen.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 把历史上明文入库的密码升级成 BCrypt 哈希。
 *
 * 背景：data.sql 里的种子账号、以及老版本注册接口写入的密码都是明文。
 * data.sql 每次启动都会执行（SQL_INIT_MODE=always），所以这里在启动完成后统一扫一遍：
 * 凡是还不像 BCrypt 哈希的（不以 $2a$/$2b$/$2y$ 开头）就原地替换。
 * 幂等：已经是哈希的行不会被再次处理。
 */
@Component
public class PasswordMigrationRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public PasswordMigrationRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        List<User> users = userRepository.findAll();
        int migrated = 0;
        for (User u : users) {
            String pwd = u.getPassword();
            if (pwd == null || pwd.isEmpty()) {
                continue;
            }
            if (isBcrypt(pwd)) {
                continue;
            }
            u.setPassword(passwordEncoder.encode(pwd));
            userRepository.save(u);
            migrated++;
        }
        if (migrated > 0) {
            System.out.println("[password] 已将 " + migrated + " 个明文密码升级为 BCrypt 哈希");
        }
    }

    /** 判断是否已经是 BCrypt 哈希（前缀 $2a$ / $2b$ / $2y$） */
    static boolean isBcrypt(String pwd) {
        return pwd.startsWith("$2a$") || pwd.startsWith("$2b$") || pwd.startsWith("$2y$");
    }
}
