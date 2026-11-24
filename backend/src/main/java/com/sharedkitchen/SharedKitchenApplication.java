package com.sharedkitchen;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class SharedKitchenApplication {
    public static void main(String[] args) {
        ConfigurableApplicationContext ctx = SpringApplication.run(SharedKitchenApplication.class, args);
        // 打印真实生效的端口和库，不再写死 8080 / shared_kitchen（改了 SERVER_PORT、DB_URL 也能看对）
        Environment env = ctx.getEnvironment();
        String port = env.getProperty("local.server.port", env.getProperty("server.port", "8088"));
        String dbUrl = env.getProperty("spring.datasource.url", "");
        System.out.println("\n========================================");
        System.out.println(" 共享厨房管理系统后端启动成功！");
        System.out.println(" 服务地址: http://localhost:" + port);
        System.out.println(" 前端首页: http://localhost:" + port + "/");
        System.out.println(" 数据库:   " + dbUrl);
        System.out.println("========================================\n");
    }
}
