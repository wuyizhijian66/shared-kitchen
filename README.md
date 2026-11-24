# 共享厨房

一个共享厨房的预约系统。用户可以看厨房、挑时段预约、模拟付款；厨房提供者提交上架申请；管理员审批申请、管理厨房，删掉的厨房还能恢复。

前端是原生 HTML/CSS/JS，没有框架、没有构建步骤，9 个 js 文件按功能拆开。后端 Spring Boot 3 + MySQL，JWT 登录，密码用 BCrypt 存。前后端打成一个 jar，`java -jar` 起来就同时有页面和接口，不用另配 nginx。

在线看界面：<https://wuyizhijian66.github.io/shared-kitchen/>

## 跑起来

需要 JDK 17、Maven、MySQL 8。

先建库（连接串里带了 createDatabaseIfNotExist，不建也会自动建）：

```sql
CREATE DATABASE IF NOT EXISTS shared_kitchen DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

然后打包启动：

```bash
cd backend
mvn clean package -DskipTests
java -jar target/shared-kitchen-fixed.jar
```

看到 `Started SharedKitchenApplication` 就可以开 <http://localhost:8088> 了。

默认连本机 3306 的 `shared_kitchen`，账号 root / 123456，端口 8088。这几个都能用环境变量改，见下面「配置」。

装了 Docker 的话，根目录一句就够，MySQL 会一起起来：

```bash
docker compose up --build
```

只想看页面、不想装任何东西：双击根目录的 `index.html` 就行，各个面板都能点。

## 账号

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| test | 123456 | 普通用户 |
| provider | 123456 | 厨房提供者 |
| admin | admin123 | 管理员 |

这些是 `data.sql` 里的初始数据，每次启动都会重灌一遍，所以手动改过的密码重启会变回去。

## 配置

`application.properties` 里的敏感项都写成了 `${环境变量:默认值}`，不设就用开发默认值。

- `SERVER_PORT`：端口，默认 8088
- `DB_URL`：JDBC 连接串，默认 `jdbc:mysql://127.0.0.1:3306/shared_kitchen?...`
- `DB_USERNAME` / `DB_PASSWORD`：默认 root / 123456
- `JWT_SECRET`：默认是一串开发用的固定值，上线前必须换掉，至少 32 字节
- `CORS_ORIGINS`：允许的跨域来源，逗号分隔
- `SQL_INIT_MODE`：默认 always，每次启动都跑 `data.sql`；改成 never 就只在首次建库时灌一次

例如：

```bash
DB_PASSWORD=*** JWT_SECRET=$(openssl rand -base64 48) java -jar target/shared-kitchen-fixed.jar
```

## 目录

```
shared-kitchen/
├── index.html                  前端入口
├── css/styles.css
├── js/                         9 个模块，IIFE 隔离
│   ├── api-client.js           fetch 封装、token、离线降级
│   ├── core.js                 全局工具、演示数据、登录注册
│   ├── data.js                 列表、详情、预订、删除等业务函数
│   ├── auth.js                 标签切换、登录、注册、退出
│   ├── kitchen.js              厨房列表、分类、搜索、详情
│   ├── booking.js              预约、支付、退订
│   ├── modal.js                弹窗
│   ├── chat.js                 聊天
│   └── admin.js                管理员和提供者中心
├── images/                     4 张厨房图，演示数据用
├── scripts/sync-frontend.mjs   把根目录前端拷到 backend/static
├── .github/workflows/           CI 和 Pages 部署
└── backend/
    ├── pom.xml
    └── src/main/
        ├── java/com/sharedkitchen/
        │   ├── controller/      User / Kitchen / Booking / Chat / Application
        │   ├── entity/          6 个 JPA 实体
        │   ├── repository/      Spring Data 接口
        │   ├── security/        JwtUtil、JwtInterceptor
        │   ├── config/          CORS、拦截器注册、BCrypt、启动迁移
        │   ├── common/          Result、BusinessException、Authz、全局异常
        │   └── dto/request/
        └── resources/
            ├── application.properties
            ├── data.sql         初始数据
            └── static/          前端副本，打包用
```

根目录那几个文件是源文件，`backend/src/main/resources/static` 是打包进 jar 的副本。改了前端记得跑一次：

```bash
node scripts/sync-frontend.mjs          # 同步
node scripts/sync-frontend.mjs --check  # 只检查是否一致
```

忘了同步 CI 会报错。

## 接口

统一返回 `{code, message, data}`，出错时 HTTP 状态码也是真的（400 参数、401 没登录、403 没权限、404 不存在、500 服务端挂了），不是一律 200。

按 Controller 分几组：

- `/api/users`：登录、注册、当前用户、用户列表（管理员）
- `/api/kitchens`：列表和详情公开；`/mine` 看自己的；`/all` 只有管理员；删除限管理员或该厨房的主人
- `/api/bookings`：下单、我的订单、支付、退订；按厨房查订单限管理员或主人
- `/api/chat`：联系人、聊天记录、发消息
- `/api/applications`：提交上架申请、我的申请、管理员审批通过或驳回、已删厨房列表和恢复

静态资源 `/`、`/css/**`、`/js/**`、`/images/**` 都是公开的。

## 注意

- `data.sql` 每次启动都会执行。`kitchens` 的种子必须写显式 id，表里没有别的唯一键，不写 id 的话 `ON DUPLICATE KEY UPDATE` 撞不上，每次启动会多插 4 条一样的厨房。副作用是删掉某个种子厨房后重启它又回来了，不想要就把 `SQL_INIT_MODE` 设成 never。
- `spring.jpa.defer-datasource-initialization=true` 不能删。它保证 `data.sql` 在 Hibernate 建表之后跑；少了这个，空库第一次启动建表还没完成，SQL 全失败又被 `continue-on-error` 吞掉，表现是「启动成功但登录永远失败」。

## 许可

MIT，见 [LICENSE](LICENSE)。
