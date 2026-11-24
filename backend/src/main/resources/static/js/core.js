// core.js — Toast + 全局函数 + 数据存储 + 核心工具
// 共享厨房管理系统 - 完整版脚本


// ==================== Toast 工具 + 覆盖原生 alert ====================
function showToast(message, type = 'success', duration = 2200) {
    const colors = { success: '#4CAF50', error: '#f44336', warning: '#ff9800', info: '#2196F3' };
    const icons = { success: '✓', error: '✕', warning: '!', info: 'i' };
    const c = colors[type] || colors.success;
    const i = icons[type] || icons.success;
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:30px;left:50%;transform:translateX(-50%) translateY(100px);background:${c};color:#fff;padding:12px 22px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.2);display:flex;align-items:center;gap:10px;z-index:9999;opacity:0;transition:all 0.3s ease;font-size:14px;font-family:-apple-system,"PingFang SC","Microsoft YaHei",Arial,sans-serif;max-width:80%;`;
    toast.innerHTML = `<span style="flex-shrink:0;font-size:16px;font-weight:bold;width:22px;height:22px;background:rgba(255,255,255,0.22);border-radius:50%;display:flex;align-items:center;justify-content:center;">${i}</span><span style="word-break:break-word;">${message}</span>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(-50%) translateY(0)'; });
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(100px)'; setTimeout(() => toast.remove(), 300); }, duration);
}
// 全局覆盖 alert → 自动变成 Toast（confirm 保留原生）
window.alert = function(msg) { showToast(String(msg)); };

// ==================== 全局函数（用于内联事件） ====================

// 打开添加厨房弹窗
function openAddKitchenModal() {
    
    const addKitchenModal = document.getElementById('add-kitchen-modal');
    if (addKitchenModal) {
        addKitchenModal.style.display = 'flex';
    }
}

// 跳转到恢复页面
function goToRestorePage() {
    
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    // 显示恢复页面
    const restorePage = document.getElementById('restore-page');
    if (restorePage) {
        restorePage.style.display = 'block';
        // 加载恢复页面内容
        setTimeout(function() {
            if (typeof window.loadDeletedKitchens === 'function') window.loadDeletedKitchens();
            if (typeof window.loadRestoreSelectOptions === 'function') window.loadRestoreSelectOptions();
        }, 100);
    }
}

// ==================== 数据存储 ====================

// 模拟数据：后端没起来时首页仍然能演示。
// 图片换成本仓库自带的 images/ 本地图：原来指向 trae-api-cn.mchost.guru 的第三方图床，
// 那是上一个作者 IDE 的私有服务，随时可能失效（失效后首页整片白图）。
const mockKitchens = [
    { id: 1, name: '阳光厨房', type: '中式厨房', price: 100, rating: 4.5, image: 'images/kitchen_1_sunny.jpg', facilities: '天然气灶、抽油烟机、冰箱、工作台' },
    { id: 2, name: '西式烘焙坊', type: '烘焙厨房', price: 120, rating: 4.7, image: 'images/kitchen_2_bakery.jpg', facilities: '烤箱、发酵箱、工作台、冰箱' },
    { id: 3, name: '西餐厨房', type: '西式厨房', price: 110, rating: 4.3, image: 'images/kitchen_3_western.jpg', facilities: '电烤箱、平底锅、工作台、冰箱' },
    { id: 4, name: '饮品工作室', type: '饮品厨房', price: 80, rating: 4.0, image: 'images/kitchen_4_beverage.jpg', facilities: '搅拌机、咖啡机、冷藏柜、工作台' }
];

// const 在经典脚本顶层只进入全局词法环境，不会成为 window 的属性；
// kitchen.js 用 typeof window.mockKitchens 判断时因此恒为 undefined，分类筛选永远拿到空列表。
window.mockKitchens = mockKitchens;

// 首页当前实际使用的数据集（后端返回优先），搜索 / 排序 / 收藏都基于它，
// 否则一搜索就会把真实数据打回内置假数据。
window.currentKitchens = [];

function getCurrentKitchens() {
    const live = window.currentKitchens;
    return (Array.isArray(live) && live.length) ? live : window.mockKitchens;
}

// 从localStorage获取预订数据，如果没有则使用默认值
function getMockBookings() {
    const stored = localStorage.getItem('mockBookings');
    if (stored) {
        return JSON.parse(stored);
    }
    // 默认预订数据，使用test用户，使用未来的日期
    const defaultBookings = [
        { id: 1, user: 'test', kitchen: '阳光厨房', date: '2026-06-20', time: '09:00-12:00', status: '已确认' },
        { id: 2, user: 'test', kitchen: '西式烘焙坊', date: '2026-06-21', time: '14:00-17:00', status: '待确认' }
    ];
    localStorage.setItem('mockBookings', JSON.stringify(defaultBookings));
    return defaultBookings;
}

// 保存预订数据到localStorage
function saveMockBookings(bookings) {
    localStorage.setItem('mockBookings', JSON.stringify(bookings));
}

// 兼容旧代码
const mockBookings = getMockBookings();

// 获取收藏的厨房列表
function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
}

// 保存收藏列表
function saveFavorites(favorites) {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// 切换收藏状态
function toggleFavorite(kitchenId) {
    const favorites = getFavorites();
    const index = favorites.indexOf(kitchenId);
    if (index > -1) {
        favorites.splice(index, 1);
        saveFavorites(favorites);
        return false;
    } else {
        favorites.push(kitchenId);
        saveFavorites(favorites);
        return true;
    }
}

// 检查是否已收藏
function isFavorite(kitchenId) {
    const favorites = getFavorites();
    return favorites.includes(kitchenId);
}

// 获取统计数据
function getStatistics() {
    const bookings = getMockBookings();
    const users = getRegisteredUsers();
    const kitchens = mockKitchens;
    
    return {
        totalUsers: users.length,
        totalKitchens: kitchens.length,
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === '待确认').length,
        confirmedBookings: bookings.filter(b => b.status === '已确认').length,
        completedBookings: bookings.filter(b => b.status === '待使用').length,
        cancelledBookings: bookings.filter(b => b.status === '已取消').length
    };
}

// 加载统计数据
function loadStatistics() {
    const stats = getStatistics();
    
    const usersEl = document.getElementById('stat-users');
    const kitchensEl = document.getElementById('stat-kitchens');
    const bookingsEl = document.getElementById('stat-bookings');
    const pendingEl = document.getElementById('stat-pending');
    
    if (usersEl) usersEl.textContent = stats.totalUsers;
    if (kitchensEl) kitchensEl.textContent = stats.totalKitchens;
    if (bookingsEl) bookingsEl.textContent = stats.totalBookings;
    if (pendingEl) pendingEl.textContent = stats.pendingBookings;
}

// 获取注册用户列表
function getRegisteredUsers() {
    return JSON.parse(localStorage.getItem('registeredUsers') || '[]');
}

// 获取厨房申请列表
function getKitchenApplications() {
    return JSON.parse(localStorage.getItem('kitchenApplications') || '[]');
}

// 保存厨房申请列表
function saveKitchenApplications(applications) {
    localStorage.setItem('kitchenApplications', JSON.stringify(applications));
}

// ==================== 核心功能函数 ====================

// 登录函数（保持同步返回 true/false；后端在线时自动校验 + 存 JWT）
function login(username, password, type) {
    // 同步：先用 localStorage 快速返回（离线可用）
    let syncOk = false;
    let syncUser = null;

    // 测试账号
    if (username === 'test' && password === '123456') {
        syncUser = { username, name: '测试用户', type };
        syncOk = true;
    } else if (username === 'admin' && password === 'admin123') {
        syncUser = { username, name: '管理员', type: 'admin' };
        syncOk = true;
    } else {
        const users = getRegisteredUsers();
        const u = users.find(x => x.username === username && x.password === password && x.type === type);
        if (u) { syncUser = u; syncOk = true; }
        else { alert('登录失败，请检查账号密码和角色'); return false; }
    }

    // 写 localStorage（同步部分）
    localStorage.setItem('userType', type);
    localStorage.setItem('currentUser', JSON.stringify(syncUser));

    // 异步：后端在线就拉真实 token（失败忽略，不影响用户体验）
    if (window.ApiClient) {
        window.ApiClient.apiLogin(username, password).then(r => {
            if (r && r.success) {
                // 后端返回了 token + 最新用户数据，覆盖本地
                const u = r.data;
                if (u) {
                    const backendType = u.type || type;
                    localStorage.setItem('userType', backendType);
                    localStorage.setItem('currentUser', JSON.stringify({
                        username: u.username, name: u.name, type: backendType
                    }));
                    // 拿到 JWT 后，把该角色页面的数据从演示数据切换成后端真实数据
                    refreshDataForRole(backendType);
                }
            }
        }).catch(() => { /* 后端离线，保留 localStorage 结果 */ });
    }

    return syncOk;
}

// 登录成功（或页面刷新后恢复会话）时，按角色重新加载页面数据。
// 各加载函数内部都是「有 token 走后端、没有就退回演示数据」，所以这里可以无脑调用。
function refreshDataForRole(type) {
    setTimeout(function() {
        if (type === 'admin' && typeof loadAdminData === 'function') {
            loadAdminData();
        } else if (type === 'provider' && typeof loadProviderData === 'function') {
            loadProviderData();
        } else if (typeof loadUserData === 'function') {
            loadUserData();
        }
        if (typeof loadChatContacts === 'function') loadChatContacts();
        if (typeof loadDeletedKitchens === 'function') loadDeletedKitchens();
        if (typeof loadRestoreSelectOptions === 'function') loadRestoreSelectOptions();
    }, 150);
}

// 注册函数（保持同步返回 {success, message}）
function registerUser(userData) {
    const users = getRegisteredUsers();
    if (users.find(u => u.username === userData.username)) {
        return { success: false, message: '用户名已存在' };
    }
    // 同步：localStorage 先存
    users.push(userData);
    localStorage.setItem('registeredUsers', JSON.stringify(users));

    // 异步：后端在线就提交（失败忽略）
    if (window.ApiClient) {
        window.ApiClient.apiRegister(userData).then(r => {
            if (!r || !r.success) { /* 注册冲突等，忽略 */ }
        }).catch(() => {});
    }

    return { success: true, message: '注册成功' };
}

// ==================== 页面加载 ====================

// ---- 公共初始化 DCL（最先执行，给所有模块准备好共享变量） ----
document.addEventListener('DOMContentLoaded', function() {
    

    // 共享 DOM 引用（所有模块都要用）
    window.pages = {
        login: document.getElementById('login-page'),
        user: document.getElementById('user-page'),
        provider: document.getElementById('provider-page'),
        admin: document.getElementById('admin-page'),
        kitchenDetail: document.getElementById('kitchen-detail-page'),
        chat: document.getElementById('chat-page'),
        restore: document.getElementById('restore-page')
    };

    window.loginForms = {
        provider: document.getElementById('provider-login'),
        user: document.getElementById('user-login'),
        admin: document.getElementById('admin-login')
    };

    window.registerPages = {
        provider: document.getElementById('provider-register-page'),
        user: document.getElementById('user-register-page')
    };

    // 页面切换工具函数
    window.hideAllPages = function() {
        Object.values(window.pages).forEach(page => { if (page) page.style.display = 'none'; });
        Object.values(window.registerPages).forEach(page => { if (page) page.style.display = 'none'; });
    };

    window.showPage = function(pageName) {
        window.hideAllPages();
        if (window.pages[pageName]) {
            window.pages[pageName].style.display = 'block';
        }
        if (pageName === 'chat' && typeof window.loadChatContacts === 'function') {
            setTimeout(function() {
                window.loadChatContacts();
                document.querySelectorAll('.contact-item').forEach(item => item.classList.remove('active'));
            }, 100);
        }
    };
});

