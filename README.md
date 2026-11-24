# 共享厨房管理系统

![CI](https://github.com/wuyizhijian66/shared-kitchen/actions/workflows/ci.yml/badge.svg)

基于 Spring Boot + MySQL + 原生 HTML/CSS/JS 的共享厨房预约平台：用户浏览厨房、在线预订、模拟支付退款；提供者申请上架厨房；管理员审批申请、管理厨房、软删除与恢复。

打包后是**单个 fat jar**：`java -jar` 一条命令，jar 内部已经带上前端静态资源，一个端口同时提供页面和 API，不需要 nginx。

## 在线演示（不用安装）

前端演示版部署在 GitHub Pages：**https://wuyizhijian66.github.io/shared-kitchen/**

可以直接点开看界面、点菜、下单、切到提供者/管理员视角；**但它没有后端**——所有数据存在浏览器 localStorage，页面底部会出现「演示模式」提示条。想要真实的后端能力（JWT 登录、多人共享同一条数据、聊天、审批），按下面的「快速开始」在本机跑起来即可。

## 功能特性

| 功能 | 数据来源 |
|---|---|
| 注册 / 登录（JWT 无状态认证，三种角色） | 后端 `POST /api/users/login`、`/register` |
| 首页厨房列表、类型筛选、搜索、排序 | 后端 `GET /api/kitchens`，后端不可用时回退内置演示数据 |
| 厨房详情（公开页面，无需登录） | 后端 `GET /api/kitchens/{id}` |
| 创建预订 / 支付 / 取消预订 | 后端 `POST /api/bookings`、`/{id}/pay`、`/{id}/cancel` |
| 提供者「我的厨房」 | 后端 `GET /api/kitchens/mine` |
| 管理员厨房总览（含待审核） | 后端 `GET /api/kitchens/all` |
| 管理员删除厨房（软删除，可恢复） | 后端 `DELETE /api/kitchens/{id}` → `deleted_kitchens` 表 |
| 我的预订列表 / 支付 / 退订、聊天记录与发送、提供者申请列表、管理员审批与用户列表、已删除厨房恢复 | 全部走后端（`GET /api/bookings/mine`、`/api/chat/*`、`/api/applications/*`、`/api/users`），后端不可用时自动回退 localStorage 演示数据 |

前端 9 个 JS 模块用 IIFE 隔离，无框架、无构建步骤。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | 原生 HTML5 / CSS3 / JavaScript（ES6+，IIFE 模块化，零依赖） |
| 后端 | Java 17 / Spring Boot 3.2.5 / Spring Data JPA |
| 数据库 | MySQL 8.x（utf8mb4） |
| 认证 | JWT（JJWT 0.12.5）+ BCrypt 密码哈希（spring-security-crypto 6.2.0） |
| 参数校验 | Jakarta Validation |
| 构建 | Maven 3.9+ |

## 目录结构

```
shared-kitchen/
├── index.html                  # 前端入口（直接用浏览器打开也能看）
├── css/styles.css
├── js/                         # 前端 9 个模块
│   ├── api-client.js           #   fetch 封装 + token + localStorage 降级
│   ├── core.js                 #   基础设施 + 演示数据 + 登录注册
│   ├── data.js                 #   业务函数层（列表/详情/预订/删除）
│   ├── auth.js                 #   标签切换 + 登录/注册/退出
│   ├── kitchen.js              #   厨房列表/分类/搜索
│   ├── booking.js              #   预订/支付/退订
│   ├── modal.js                #   自定义弹窗
│   ├── chat.js                 #   聊天界面
│   └── admin.js                #   管理员 + 提供者中心
├── images/                     # 4 张厨房图（前端演示数据用）
├── scripts/sync-frontend.mjs   # 根目录前端 → backend static 同步脚本
├── .github/workflows/ci.yml    # CI：前端语法 + 同步校验 + 后端 mvn package
├── LICENSE
└── backend/
    ├── pom.xml
    └── src/main/
        ├── java/com/sharedkitchen/
        │   ├── common/          # Result / BusinessException / Authz / 全局异常
        │   ├── config/          # CorsConfig / WebMvcConfig
        │   ├── security/        # JwtUtil / JwtInterceptor
        │   ├── entity/          # 6 个 JPA 实体
        │   ├── repository/      # 6 个 Spring Data JPA 接口
        │   ├── controller/      # 5 个 REST Controller
        │   └── dto/request/     # LoginRequest / RegisterRequest
        └── resources/
            ├── application.properties
            ├── data.sql         # 初始数据（幂等：ON DUPLICATE KEY UPDATE / INSERT IGNORE）
            └── static/          # 前端副本（由 scripts/sync-frontend.mjs 生成）
```

> 根目录的 `index.html` / `css` / `js` / `images` 是**源文件**，`backend/src/main/resources/static/` 是打包用的**副本**。
> 改完前端请执行一次 `node scripts/sync-frontend.mjs`（`--check` 只校验不写入）。

## 快速开始

### 方式一：Docker Compose（最省事）

```bash
docker compose up --build
```

起来后打开 http://localhost:8088 。Compose 里包含 MySQL 8 和应用，数据落在 `mysql-data` volume。

### 方式二：本地 JDK + Maven + MySQL

前置：JDK 17、Maven 3.9+、MySQL 8.x。

1）建库（`createDatabaseIfNotExist=true` 也会自动建，手动建更直观）：

```sql
CREATE DATABASE IF NOT EXISTS shared_kitchen DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;
```

2）打包并启动：

```bash
cd backend
mvn clean package -DskipTests
java -jar target/shared-kitchen-fixed.jar
```

看到 `Started SharedKitchenApplication in ... seconds` 后访问 http://localhost:8088 。

### 方式三：只看前端（不启动后端）

直接双击根目录 `index.html`，或用任意静态服务器：

```bash
python -m http.server 8080
```

后端不可用时前端会整体降级到 localStorage 演示数据（登录、预订、聊天、管理页都能点）。
注意 `file://` 下浏览器会拦截 fetch，这正是降级生效的场景。

## 配置与环境变量

所有敏感项都支持环境变量覆盖，未设置时用开发默认值（`application.properties`）：

| 环境变量 | 默认值 | 说明 |
|---|---|---|
| `SERVER_PORT` | `8088` | HTTP 端口 |
| `DB_URL` | `jdbc:mysql://127.0.0.1:3306/shared_kitchen?...` | JDBC 连接串 |
| `DB_USERNAME` | `root` | 数据库用户 |
| `DB_PASSWORD` | `123456` | 数据库密码 |
| `JWT_SECRET` | 开发用固定串 | **生产必须改**：至少 32 字节的随机串 |
| `CORS_ORIGINS` | `http://localhost:8088,...` | 允许的跨域来源，逗号分隔 |
| `SQL_INIT_MODE` | `always` | 是否每次启动都重新灌 `data.sql`；改成 `never` 就只在首次建库时灌一次 |

示例：

```bash
DB_PASSWORD=*** JWT_SECRET=$(openssl rand -base64 48) java -jar target/shared-kitchen-fixed.jar
```

## 测试账号

| 账号 | 密码 | 角色 |
|---|---|---|
| test | 123456 | 普通用户 |
| provider | 123456 | 厨房提供者 |
| admin | admin123 | 管理员 |

## API 一览

统一响应体 `{code, message, data}`。业务错误返回对应的真实 HTTP 状态码（400 参数不对 / 401 未认证 / 403 无权限 / 404 不存在 / 500 服务端异常），`code` 与 HTTP 状态一致，curl、Postman、监控都能直接看出成败。

| 方法 | 路径 | 权限 |
|---|---|---|
| POST | /api/users/login | 公开 |
| POST | /api/users/register | 公开 |
| GET | /api/users | 管理员 |
| GET | /api/users/me | 登录 |
| GET | /api/kitchens?type= | 公开 |
| GET | /api/kitchens/{id} | 公开 |
| GET | /api/kitchens/mine | 登录 |
| GET | /api/kitchens/all | 管理员 |
| DELETE | /api/kitchens/{id} | 管理员或该厨房提供者 |
| POST | /api/bookings | 登录 |
| GET | /api/bookings/mine | 登录 |
| GET | /api/bookings | 管理员 |
| GET | /api/bookings/kitchen/{id} | 管理员或该厨房提供者 |
| POST | /api/bookings/{id}/pay | 订单本人 |
| POST | /api/bookings/{id}/cancel | 订单本人 |
| GET | /api/chat/contacts | 登录 |
| GET | /api/chat/messages/{username} | 登录 |
| POST | /api/chat/messages | 登录 |
| POST | /api/applications/kitchen | 登录 |
| GET | /api/applications/kitchen/mine | 登录 |
| GET | /api/applications/kitchen | 管理员 |
| POST | /api/applications/kitchen/{id}/approve | 管理员 |
| POST | /api/applications/kitchen/{id}/reject | 管理员 |
| GET | /api/applications/deleted-kitchens | 登录 |
| POST | /api/applications/restore/{id} | 该厨房提供者或管理员 |

静态资源 `/`、`/index.html`、`/css/**`、`/js/**`、`/images/**` 全部公开。

## 数据库表

| 表 | 说明 |
|---|---|
| users | 用户（username 主键，type: user/provider/admin，密码不参与序列化） |
| kitchens | 厨房（status: available/pending/rejected） |
| bookings | 预订（kitchen_name 冗余保存，厨房改名/删除后历史订单仍可显示） |
| chat_messages | 聊天消息 |
| kitchen_applications | 提供者上架申请 |
| deleted_kitchens | 软删除快照（管理员可恢复） |

`data.sql` 在每次启动时执行（`SQL_INIT_MODE=always`）。注意 `kitchens` 的种子数据必须带显式 id：表里没有别的唯一键，不带 id 时 `ON DUPLICATE KEY UPDATE` 撞不上任何行，每次启动都会再插 4 条一模一样的厨房。
副作用：删掉某个种子厨房后重启会被重新插回来；不想要这种行为就把 `SQL_INIT_MODE` 设为 `never`。
`spring.jpa.defer-datasource-initialization=true` 保证它**在 Hibernate 建表之后**执行。

## 已修复的问题

| 问题 | 修复 |
|---|---|
| 拦截器 `excludePathPatterns` 写了 `/api/kitchens/{id}`，路径变量匹配任意单段，导致 `/kitchens/all`、`/kitchens/mine` 无需 token | 删除该规则，改为在 `JwtInterceptor` 里只放行 `GET /api/kitchens/{纯数字id}` |
| `GET /api/users`、`GET /api/chat/contacts` 直接序列化实体，返回全站用户**明文密码** | `User.password` 加 `@JsonProperty(access = WRITE_ONLY)` |
| 用户列表、全部订单、全部申请、审批通过/驳回、某个厨房的订单对任何登录用户开放 | 新增 `common/Authz.requireAdmin()`，逐个接口加管理员/属主校验 |
| 空库首次启动 `data.sql` 先于建表执行，报错被 `continue-on-error` 吞掉 → 启动成功但登录必失败 | 增加 `spring.jpa.defer-datasource-initialization=true` |
| 根目录 `index.html` 引用 `css/styles.css`，但根目录没有 `css/` 目录，直接打开首页无样式 | 根目录改为与 static 同构（`css/`、`images/`），并加同步脚本 |
| `const mockKitchens` 是顶层词法声明，不挂到 `window`，`kitchen.js` 的 `typeof window.mockKitchens` 恒为 undefined → 分类筛选空列表 | 显式 `window.mockKitchens = mockKitchens` |
| 搜索/排序直接操作内置假数据，一搜索就把真实列表打回演示数据 | 引入 `getCurrentKitchens()`，用当前数据源 |
| 演示数据图片指向 `trae-api-cn.mchost.guru` 第三方图床（他人 IDE 私有服务，随时失效） | 换成本仓库 `images/kitchen_*.jpg` |
| 管理员管理页/提供者页展示的是内置假数据，删除厨房只删 localStorage | 改为读 `/api/kitchens/all`、`/api/kitchens/mine`，删除走后端软删除 |
| 数据库账号密码、JWT 密钥硬编码 | 全部改为 `${ENV:default}` 形式 |
| README 声称 MIT 但没有 LICENSE | 增加 LICENSE |
| `data.sql` 的 kitchens 种子不带 id，每次启动重复插 4 条（跑两次首页就有 8 个一模一样的厨房） | 种子改为显式 id + `ON DUPLICATE KEY UPDATE`，并支持 `SQL_INIT_MODE` |
| 500 异常把 SQL 语句原文返回给调用方 | 只返回「服务器内部错误，请稍后重试」，详情留在服务端日志 |
| 审批通过的厨房没有图片和评分，前端出现坏图 | 按厨房类型映射到自带的 `/images/kitchen_*.jpg`，评分默认 4.5 |
| 提交上架申请缺字段时直接 500（数据库 NOT NULL 报错） | 先校验名称/类型/价格，返回 400 + 明确提示 |
| 启动 banner 写死 `localhost:8080` 和 `shared_kitchen` | 改为打印真实生效的端口与 JDBC 地址 |
| 密码明文入库（`data.sql` 种子和注册用户都是明文） | 引入 BCrypt（`PasswordConfig`）；`PasswordMigrationRunner` 启动时把历史明文密码就地升级为哈希；登录同时兼容两者 |
| 我的预订、聊天、管理员用户/预订列表、已删除厨房恢复页只读 localStorage，和后端数据对不上 | 这些页面统一改成「有 JWT 走后端、没有就退回演示数据」，见各页面 `xxxFromApi()` 分支 |

## 已知限制

- 前端没有框架、没有构建步骤；页面数据**优先后端**，后端不可用时回退 localStorage 演示数据。这是刻意保留的离线演示能力，不是鉴权机制。
- 前端登录是「先本地校验、再异步打后端换 JWT」：后端没起时仍能用内置演示账号进入演示界面。
- 后端没有「预订审批」接口：管理端「预订审批」页对后端数据只读展示待确认预订（用户可自行支付/退订），只有演示数据模式才有通过/拒绝按钮。
- 提交上架申请时后端没有「驳回原因」字段，驳回原因只在前端提示，不入库。
- 无自动化测试；CI 只做前端语法/同步校验和后端编译打包。无接口文档（未引入 springdoc）。
- 数据库和 JWT 都有开发默认值，生产部署请务必覆盖 `DB_PASSWORD` 与 `JWT_SECRET`。

## 许可证

MIT，见 [LICENSE](LICENSE)。
