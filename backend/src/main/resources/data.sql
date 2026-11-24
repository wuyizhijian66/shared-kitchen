-- ==================== Users ====================
INSERT INTO users (username, password, name, type, phone, address) VALUES
('admin',    'admin123', '管理员',   'admin',    '13800000000', '平台管理'),
('test',     '123456',   '测试用户', 'user',     '13811112222', '测试地址'),
('provider', '123456',   '提供者张三','provider', '13833334444', '提供者地址')
ON DUPLICATE KEY UPDATE password=VALUES(password), name=VALUES(name), type=VALUES(type), phone=VALUES(phone), address=VALUES(address);

-- ==================== Kitchens ====================
-- 必须带显式 id：否则每次启动 APP 都会再插 4 条一模一样的厨房（ON DUPLICATE KEY 没有唯一键可撞）
INSERT INTO kitchens (id, name, type, price, rating, image, facilities, provider_username, status) VALUES
(1, '阳光厨房', '中式厨房', 100, 4.5, '/images/kitchen_1_sunny.jpg', '燃气灶、油烟机、冰箱、工作台', 'provider', 'available'),
(2, '烘焙时光', '烘焙厨房', 120, 4.7, '/images/kitchen_2_bakery.jpg', '烤箱、发酵箱、工作台、冰箱',   'provider', 'available'),
(3, '西式厨房', '西式厨房', 110, 4.3, '/images/kitchen_3_western.jpg', '电烤箱、烤架、锅具、工作台',   'provider', 'available'),
(4, '饮品站',   '饮品厨房',  80, 4.0, '/images/kitchen_4_beverage.jpg', '搅拌机、咖啡机、冷柜、吧台',   'provider', 'available')
ON DUPLICATE KEY UPDATE name=VALUES(name), type=VALUES(type), price=VALUES(price), rating=VALUES(rating),
                        image=VALUES(image), facilities=VALUES(facilities), status=VALUES(status);

-- ==================== Bookings ====================
INSERT IGNORE INTO bookings (id, username, kitchen_id, kitchen_name, date, time_slot, status, phone, payment_status, created_at) VALUES
(1, 'test', 1, '阳光厨房', '2026-11-23', '08:00-12:00', '待使用', '13811112222', '已支付', NOW()),
(2, 'test', 2, '烘焙时光', '2026-11-24', '14:00-17:00', '待支付', '13811112222', NULL, NOW());

-- ==================== Chat ====================
INSERT IGNORE INTO chat_messages (id, from_username, to_username, content, timestamp) VALUES
(1, 'admin', 'test', '欢迎使用共享厨房平台！', NOW());