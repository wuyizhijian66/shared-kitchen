// data.js — 数据加载函数 / cancelBooking / payBooking / showKitchenDetail / loadXxx
// ==================== 数据加载函数 ====================

function renderKitchenItems(kitchens) {
    const container = document.querySelector('.kitchen-items');
    if (!container) return;
    
    container.innerHTML = '';
    kitchens.forEach(kitchen => {
        const isFav = isFavorite(kitchen.id);
        const item = document.createElement('div');
        item.className = 'kitchen-item';
        item.innerHTML = `
            <img src="${kitchen.image}" alt="${kitchen.name}">
            <div class="kitchen-info">
                <div class="kitchen-header">
                    <h3>${kitchen.name}</h3>
                    <button class="favorite-btn ${isFav ? 'favorited' : ''}" data-kitchen-id="${kitchen.id}">
                        ${isFav ? '★' : '☆'}
                    </button>
                </div>
                <div class="type">${kitchen.type}</div>
                <div class="price">¥${kitchen.price}/小时</div>
                <div class="rating">★★★★★ ${kitchen.rating}分</div>
                <div class="facilities">${kitchen.facilities}</div>
                <button class="view-detail-btn" data-kitchen-id="${kitchen.id}">查看详情</button>
            </div>
        `;
        container.appendChild(item);
        
        // 绑定查看详情按钮事件
        const viewDetailBtn = item.querySelector('.view-detail-btn');
        viewDetailBtn.addEventListener('click', function() {
            showKitchenDetail(kitchen);
        });
        
        // 绑定收藏按钮事件
        const favoriteBtn = item.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const wasFavorited = toggleFavorite(kitchen.id);
            if (wasFavorited) {
                this.classList.add('favorited');
                this.textContent = '★';
            } else {
                this.classList.remove('favorited');
                this.textContent = '☆';
            }
        });
    });
}

// 通过ID处理管理厨房
function handleManageKitchen(kitchenId, status) {
    const kitchen = findKitchenById(kitchenId);
    if (kitchen) {
        alert(`厨房管理信息\n名称: ${kitchen.name}\n类型: ${kitchen.type}\n价格: ¥${kitchen.price}/小时\n评分: ${kitchen.rating}分\n设施: ${kitchen.facilities}\n当前状态: ${status}`);
    }
}

// 通过ID处理删除厨房
// 后端返回的厨房不在 mockKitchens 里，按 id 反查要同时看当前列表
function findKitchenById(kitchenId) {
    const pools = [window.adminKitchens, window.providerKitchens, window.currentKitchens, mockKitchens];
    for (const pool of pools) {
        if (!Array.isArray(pool)) continue;
        const hit = pool.find(k => k.id === kitchenId);
        if (hit) return hit;
    }
    return null;
}

function handleDeleteKitchenById(kitchenId) {
    const kitchen = findKitchenById(kitchenId);
    if (kitchen) {
        handleDeleteKitchen(kitchen);
    }
}

// 处理删除厨房
function handleDeleteKitchen(kitchen) {
    
    
    // 提供删除原因选项
    const reasons = [
        '厨房设施不符合要求',
        '提供者违反平台规定',
        '厨房长期未使用',
        '用户投诉过多',
        '其他原因'
    ];
    
    let reasonOptions = '请选择删除原因：\n\n';
    reasons.forEach((reason, index) => {
        reasonOptions += `${index + 1}. ${reason}\n`;
    });
    
    const reasonIndex = prompt(reasonOptions);
    if (!reasonIndex || isNaN(reasonIndex) || reasonIndex < 1 || reasonIndex > reasons.length) {
        alert('请选择有效的删除原因！');
        return;
    }
    
    const selectedReason = reasons[parseInt(reasonIndex) - 1];
    
    // 第一次确认
    const firstConfirm = confirm(`确认删除原因：${selectedReason}\n\n厨房名称：${kitchen.name}\n\n这是第一次确认，请点击确定继续。`);
    if (!firstConfirm) {
        return;
    }
    
    // 第二次确认
    const secondConfirm = confirm(`这是第二次确认！\n\n即将删除 "${kitchen.name}" 厨房。\n删除原因：${selectedReason}\n\n此操作将通知厨房提供者，删除后无法恢复！\n\n确定要继续吗？`);
    if (!secondConfirm) {
        return;
    }
    
    // 执行删除
    deleteKitchen(kitchen.id, selectedReason);
}

// 显示厨房详情
function showKitchenDetail(kitchen) {
    const pages = {
        login: document.getElementById('login-page'),
        user: document.getElementById('user-page'),
        provider: document.getElementById('provider-page'),
        admin: document.getElementById('admin-page'),
        kitchenDetail: document.getElementById('kitchen-detail-page'),
        chat: document.getElementById('chat-page')
    };
    
    // 获取当前用户类型
    const userType = localStorage.getItem('userType');
    
    // 隐藏所有页面
    Object.values(pages).forEach(page => {
        if (page) page.style.display = 'none';
    });
    
    // 显示详情页面
    if (pages.kitchenDetail) {
        pages.kitchenDetail.style.display = 'block';
    }
    
    // 填充详情数据
    document.getElementById('detail-image').src = kitchen.image;
    document.getElementById('detail-name').textContent = kitchen.name;
    document.getElementById('detail-type').textContent = kitchen.type;
    document.getElementById('detail-price').textContent = `¥${kitchen.price}/小时`;
    document.getElementById('detail-rating').textContent = `★★★★★ ${kitchen.rating}分`;
    document.getElementById('detail-facilities').textContent = kitchen.facilities;
    
    // 更新操作按钮（直接在这里实现）
    const kitchenActionBtn = document.getElementById('kitchen-action-btn');
    const kitchenDeleteBtn = document.getElementById('kitchen-delete-btn');
    const bookingModal = document.getElementById('booking-modal');
    
    
    
    
    // 隐藏删除按钮（默认）
    if (kitchenDeleteBtn) {
        kitchenDeleteBtn.style.display = 'none';
    }
    
    if (kitchenActionBtn) {
        if (userType === 'admin') {
            
            kitchenActionBtn.textContent = '查看管理';
            kitchenActionBtn.className = 'admin-action-btn';
            kitchenActionBtn.onclick = function() {
                alert(`厨房管理信息\n名称: ${kitchen.name}\n类型: ${kitchen.type}\n价格: ¥${kitchen.price}/小时\n评分: ${kitchen.rating}分\n设施: ${kitchen.facilities}`);
            };
            
            // 显示删除按钮
            if (kitchenDeleteBtn) {
                kitchenDeleteBtn.style.display = 'inline-block';
                kitchenDeleteBtn.onclick = function(e) {
                    e.stopPropagation();
                    
                    // 提供删除原因选项
                    const reasons = [
                        '厨房设施不符合要求',
                        '提供者违反平台规定',
                        '厨房长期未使用',
                        '用户投诉过多',
                        '其他原因'
                    ];
                    
                    let reasonOptions = '请选择删除原因：\n\n';
                    reasons.forEach((reason, index) => {
                        reasonOptions += `${index + 1}. ${reason}\n`;
                    });
                    
                    const reasonIndex = prompt(reasonOptions);
                    if (!reasonIndex || isNaN(reasonIndex) || reasonIndex < 1 || reasonIndex > reasons.length) {
                        alert('请选择有效的删除原因！');
                        return;
                    }
                    
                    const selectedReason = reasons[parseInt(reasonIndex) - 1];
                    
                    // 第一次确认
                    const firstConfirm = confirm(`确认删除原因：${selectedReason}\n\n厨房名称：${kitchen.name}\n\n这是第一次确认，请点击确定继续。`);
                    if (!firstConfirm) {
                        return;
                    }
                    
                    // 第二次确认
                    const secondConfirm = confirm(`这是第二次确认！\n\n即将删除 "${kitchen.name}" 厨房。\n删除原因：${selectedReason}\n\n此操作将通知厨房提供者，删除后无法恢复！\n\n确定要继续吗？`);
                    if (!secondConfirm) {
                        return;
                    }
                    
                    // 执行删除
                    deleteKitchen(kitchen.id, selectedReason);
                };
            }
        } else if (userType === 'provider') {
            kitchenActionBtn.textContent = '查看预订';
            kitchenActionBtn.className = 'provider-action-btn';
            kitchenActionBtn.onclick = function() {
                const bookings = getMockBookings();
                const kitchenBookings = bookings.filter(b => b.kitchen === kitchen.name);
                
                // 过滤出前三天、后三天及今天的预订
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const threeDaysAgo = new Date(today);
                threeDaysAgo.setDate(today.getDate() - 3);
                const threeDaysLater = new Date(today);
                threeDaysLater.setDate(today.getDate() + 3);
                
                const filteredBookings = kitchenBookings.filter(b => {
                    const bookingDate = new Date(b.date);
                    bookingDate.setHours(0, 0, 0, 0);
                    return bookingDate >= threeDaysAgo && bookingDate <= threeDaysLater;
                });
                
                if (filteredBookings.length === 0) {
                    alert(`${kitchen.name} 在最近7天内暂无预订记录`);
                    return;
                }
                
                // 按日期排序
                filteredBookings.sort((a, b) => new Date(a.date) - new Date(b.date));
                
                let bookingInfo = `${kitchen.name} 的预订记录（最近7天）:\n\n`;
                filteredBookings.forEach((b, i) => {
                    const bookingDate = new Date(b.date);
                    const diffDays = Math.floor((bookingDate - today) / (1000 * 60 * 60 * 24));
                    let dateLabel = b.date;
                    if (diffDays === 0) {
                        dateLabel = '今天 ' + b.date;
                    } else if (diffDays === 1) {
                        dateLabel = '明天 ' + b.date;
                    } else if (diffDays === -1) {
                        dateLabel = '昨天 ' + b.date;
                    }
                    bookingInfo += `${i + 1}. 日期: ${dateLabel} 时间: ${b.time} 状态: ${b.status}\n`;
                });
                alert(bookingInfo);
            };
        } else {
            kitchenActionBtn.textContent = '立即预订';
            kitchenActionBtn.className = 'book-kitchen-btn';
            kitchenActionBtn.onclick = function() {
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                document.getElementById('booking-name').value = currentUser.name || currentUser.username || '';
                bookingModal.dataset.kitchenId = kitchen.id;
                bookingModal.dataset.kitchenName = kitchen.name;
                bookingModal.dataset.kitchenPrice = kitchen.price;
                // 设置日期最小值为今天，禁止选过去日期
                const dateInput = document.getElementById('booking-date');
                if (dateInput) {
                    const today = new Date();
                    const y = today.getFullYear();
                    const m = String(today.getMonth() + 1).padStart(2, '0');
                    const d = String(today.getDate()).padStart(2, '0');
                    dateInput.min = `${y}-${m}-${d}`;
                    if (dateInput.value && dateInput.value < dateInput.min) {
                        dateInput.value = '';
                    }
                }
                // 刷新时间段可用性
                refreshTimeSlots();
                bookingModal.style.display = 'flex';
            };
        }
    }
    
    // 存储当前页面，用于返回
    localStorage.setItem('previousPage', userType || 'user');
}

// 搜索厨房
function searchKitchens() {
    const searchInput = document.getElementById('kitchen-search-input');
    const keyword = searchInput.value.toLowerCase().trim();
    
    if (!keyword) {
        loadKitchenItems();
        return;
    }
    
    const filtered = getCurrentKitchens().filter(kitchen => 
        kitchen.name.toLowerCase().includes(keyword) || 
        kitchen.type.toLowerCase().includes(keyword)
    );
    
    renderKitchenItems(filtered);
}

// 排序厨房
function sortKitchens(sortBy) {
    let sorted = [...getCurrentKitchens()];
    
    switch(sortBy) {
        case 'price-asc':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            sorted.sort((a, b) => b.rating - a.rating);
            break;
    }
    
    renderKitchenItems(sorted);
}

// 加载收藏列表
function loadFavoritesList() {
    const container = document.querySelector('.favorites-list');
    if (!container) return;
    
    const favorites = getFavorites();
    const favoriteKitchens = getCurrentKitchens().filter(k => favorites.includes(k.id));
    
    container.innerHTML = '';
    
    if (favoriteKitchens.length === 0) {
        container.innerHTML = '<div class="no-data">暂无收藏的厨房</div>';
        return;
    }
    
    favoriteKitchens.forEach(kitchen => {
        const item = document.createElement('div');
        item.className = 'kitchen-item favorite-item';
        item.innerHTML = `
            <img src="${kitchen.image}" alt="${kitchen.name}">
            <h3>${kitchen.name}</h3>
            <div class="type">${kitchen.type}</div>
            <div class="price">¥${kitchen.price}/小时</div>
            <div class="rating">★★★★★ ${kitchen.rating}分</div>
            <button class="view-detail-btn" data-kitchen-id="${kitchen.id}">查看详情</button>
        `;
        container.appendChild(item);
        
        const viewDetailBtn = item.querySelector('.view-detail-btn');
        viewDetailBtn.addEventListener('click', function() {
            showKitchenDetail(kitchen);
        });
    });
}

// 加载通知列表
function loadNotifications() {
    const container = document.querySelector('.notifications-list');
    if (!container) return;
    
    const notifications = getNotifications();
    
    container.innerHTML = '';
    
    if (notifications.length === 0) {
        container.innerHTML = '<div class="no-data">暂无通知消息</div>';
        return;
    }
    
    notifications.forEach(notification => {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
        item.innerHTML = `
            <div class="notification-title">${notification.title}</div>
            <div class="notification-content">${notification.content}</div>
            <div class="notification-time">${notification.time}</div>
        `;
        item.addEventListener('click', function() {
            markNotificationAsRead(notification.id);
            item.classList.add('read');
            item.classList.remove('unread');
        });
        container.appendChild(item);
    });
}

// 获取通知列表
function getNotifications() {
    return JSON.parse(localStorage.getItem('notifications') || '[]');
}

// 保存通知
function saveNotifications(notifications) {
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

// 添加通知
function addNotification(title, content) {
    const notifications = getNotifications();
    notifications.unshift({
        id: Date.now(),
        title: title,
        content: content,
        time: new Date().toLocaleString(),
        read: false
    });
    // 只保留最近20条通知
    if (notifications.length > 20) {
        notifications.pop();
    }
    saveNotifications(notifications);
}

// 标记通知为已读
function markNotificationAsRead(notificationId) {
    const notifications = getNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
        saveNotifications(notifications);
    }
}

// 显示成功提示
function showSuccessToast(message) {
    // 创建 Toast 元素
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.innerHTML = `
        <div class="toast-icon">✓</div>
        <div class="toast-message">${message}</div>
    `;
    
    // 添加到页面
    document.body.appendChild(toast);
    
    // 显示动画
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // 3秒后自动消失
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// ==================== 厨房列表加载（优先后端，失败 fallback localStorage）====================
async function loadKitchenItems() {
    let kitchens = mockKitchens; // 默认 fallback

    // 后端在线 → 调 API
    if (window.ApiClient) {
        const fromApi = await window.ApiClient.apiListKitchens();
        if (fromApi && fromApi.length > 0) {
            kitchens = fromApi;
        }
    }

    // 记住首页的完整数据源，供搜索 / 排序 / 收藏复用
    window.currentKitchens = kitchens;
    renderKitchenItems(kitchens);
}

function loadUserBookings() {
    const container = document.querySelector('.booking-list');
    if (!container) return;

    const api = window.ApiClient;

    // 有后端会话时以服务端为准：/api/bookings/mine 只返回当前用户自己的预订
    if (api && api.hasSession && api.hasSession()) {
        return loadUserBookingsFromApi(container);
    }

    // 没有后端会话 → 走 localStorage 演示数据
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    renderUserBookings(container, getMockBookings().filter(b =>
        b.user === currentUser.name || b.user === currentUser.username
    ));
}

// 后端版本：异步取数后复用同一套渲染
async function loadUserBookingsFromApi(container) {
    const api = window.ApiClient;
    const rows = await api.apiMyBookings().catch(() => null);
    if (!Array.isArray(rows)) {
        // 后端临时不可用 → 降级到演示数据，避免白屏
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const bookings = getMockBookings().filter(b =>
            b.user === currentUser.name || b.user === currentUser.username
        );
        renderUserBookings(container, bookings);
        return;
    }
    renderUserBookings(container, rows.map(normalizeBooking));
}

// 后端 Booking 实体 → 前端渲染字段
function normalizeBooking(b) {
    return {
        id: b.id,
        backendId: b.id,
        fromBackend: true,
        user: b.username,
        kitchen: b.kitchenName,
        date: b.date,
        time: b.timeSlot || '',
        status: b.status,
        paymentStatus: b.paymentStatus,
        refundStatus: b.refundStatus
    };
}

function renderUserBookings(container, userBookings) {
    window.userBookings = userBookings;

    container.innerHTML = '';
    if (!userBookings.length) {
        container.innerHTML = '<div class="no-data">暂无预订记录</div>';
        return;
    }

    const now = new Date();

    userBookings.forEach(booking => {
        // 检查预订是否已过期
        const startTime = (booking.time || '').split('-')[0];
        const bookingDateTime = new Date(booking.date + ' ' + startTime);
        const isExpired = !isNaN(bookingDateTime) && bookingDateTime < now && booking.status !== '已取消' && booking.status !== '已过期';

        // 确定实际显示的状态
        let displayStatus = booking.status;
        if (isExpired && booking.status !== '已取消') {
            displayStatus = '已过期';
        }

        // 已过期或已取消的不能支付或退订
        const canCancel = (booking.status === '待支付' || booking.status === '待确认' || booking.status === '已确认' || booking.status === '待使用') && !isExpired;
        const canPay = (booking.status === '待支付' || booking.status === '待确认' || booking.status === '已确认') && !isExpired;

        const item = document.createElement('div');
        item.className = 'booking-item';
        item.innerHTML = `
            <h3>预订 #${booking.id}</h3>
            <div class="booking-info">厨房: ${booking.kitchen}</div>
            <div class="booking-info">日期: ${booking.date}</div>
            <div class="booking-info">时间: ${booking.time}</div>
            <div class="booking-info">状态: <span class="status-${displayStatus === '已过期' ? 'cancelled' : displayStatus === '已取消' ? 'cancelled' : displayStatus === '待使用' ? 'pending' : 'normal'}">${displayStatus}</span></div>
        `;

        if (canPay) {
            const payBtn = document.createElement('button');
            payBtn.className = 'pay-booking-btn';
            payBtn.textContent = '支付';
            payBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                payBooking(booking.id);
            });
            item.appendChild(payBtn);
        }

        if (canCancel) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'cancel-booking-btn';
            cancelBtn.textContent = '退订';
            cancelBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                cancelBooking(booking.id);
            });
            item.appendChild(cancelBtn);
        }

        container.appendChild(item);
    });
}

function cancelBooking(bookingId) {
    const api = window.ApiClient;
    const target = (window.userBookings || []).find(b => b.id === bookingId);

    // 后端预订：以服务端为准，成功后再刷新
    if (target && target.fromBackend && api && api.hasSession && api.hasSession()) {
        return cancelBackendBooking(target);
    }

    const bookings = getMockBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) { alert('预订不存在'); return; }

    // 时间检查：使用前 1 小时以上才能退订
    const dt = new Date(booking.date + ' ' + booking.timeSlot?.split('-')[0] + ':00');
    const now = new Date();
    const diff = (dt - now) / 3600000;
    if (diff < 1 && !booking.refundStatus) {
        alert('只能在使用前 1 小时以上退订');
        return;
    }

    const confirmed = window.confirm('确定要退订这个预订吗？退订后将退还费用。');
    if (!confirmed) return;

    // 同步：localStorage 先改（UI 立即更新）
    booking.status = '已取消';
    booking.refundStatus = '已退款';
    booking.refundTime = new Date().toLocaleString();
    saveMockBookings(bookings);
    alert('退订成功！费用已退还。');
    loadUserBookings();

    // 异步：后端在线就同步
    if (window.ApiClient) {
        const backendId = booking.backendId || booking.id;
        window.ApiClient.apiCancelBooking(backendId).catch(() => {});
    }
}

async function cancelBackendBooking(booking) {
    const confirmed = window.confirm('确定要退订这个预订吗？退订后将退还费用。');
    if (!confirmed) return;

    const r = await window.ApiClient.apiCancelBooking(booking.backendId).catch(() => null);
    if (!r || !r.success) {
        showToast('退订失败：' + ((r && r.message) || '网络错误'), 'error');
        return;
    }
    showToast('退订成功！费用已退还。');
    loadUserBookings();
}

function payBooking(bookingId) {
    const api = window.ApiClient;
    const target = (window.userBookings || []).find(b => b.id === bookingId);

    // 后端预订：以服务端为准
    if (target && target.fromBackend && api && api.hasSession && api.hasSession()) {
        return payBackendBooking(target);
    }

    const bookings = getMockBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) { alert('预订不存在'); return; }

    // 同步：localStorage 先改
    booking.status = '待使用';
    booking.paymentTime = new Date().toLocaleString();
    booking.paymentStatus = '已支付';
    saveMockBookings(bookings);
    alert('支付成功！状态已更新为待使用');

    const paymentModal = document.getElementById('payment-modal');
    if (paymentModal) paymentModal.style.display = 'none';
    loadUserBookings();

    // 异步：后端在线就同步
    if (window.ApiClient) {
        const backendId = booking.backendId || booking.id;
        window.ApiClient.apiPayBooking(backendId).catch(() => {});
    }
}

async function payBackendBooking(booking) {
    const r = await window.ApiClient.apiPayBooking(booking.backendId).catch(() => null);
    if (!r || !r.success) {
        showToast('支付失败：' + ((r && r.message) || '网络错误'), 'error');
        return;
    }
    const paymentModal = document.getElementById('payment-modal');
    if (paymentModal) paymentModal.style.display = 'none';
    showToast('支付成功！状态已更新为待使用');
    loadUserBookings();
}

async function loadProviderKitchens() {
    const container = document.querySelector('#provider-page .kitchen-list');
    if (!container) return;

    // 提供者只应看到自己的厨房
    let kitchens = mockKitchens;
    if (window.ApiClient && window.ApiClient.apiMyKitchens) {
        try {
            const mine = await window.ApiClient.apiMyKitchens();
            if (Array.isArray(mine) && mine.length) kitchens = mine;
        } catch (e) { /* 后端不可用，保持演示数据 */ }
    }
    window.providerKitchens = kitchens;
    
    container.innerHTML = '';
    kitchens.forEach(kitchen => {
        const item = document.createElement('div');
        item.className = 'kitchen-item';
        item.innerHTML = `
            <img src="${kitchen.image}" alt="${kitchen.name}">
            <h3>${kitchen.name}</h3>
            <div class="type">${kitchen.type}</div>
            <div class="price">¥${kitchen.price}/小时</div>
        `;
        item.style.cursor = 'pointer';
        item.addEventListener('click', function() {
            showKitchenDetail(kitchen);
        });
        container.appendChild(item);
    });
}

function loadProviderBookings() {
    const container = document.querySelector('#provider-page .booking-list');
    if (!container) return;

    const api = window.ApiClient;

    // 有后端会话：按名下厨房逐个查预订再合并（后端只提供 /bookings/kitchen/{id}）
    if (api && api.hasSession && api.hasSession()) {
        return loadProviderBookingsFromApi(container);
    }

    container.innerHTML = '';
    const bookings = getMockBookings();

    // 获取今天和未来6天的日期范围
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sixDaysLater = new Date(today);
    sixDaysLater.setDate(today.getDate() + 6);

    // 过滤出近六天的预订
    const recentBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate >= today && bookingDate <= sixDaysLater;
    });

    if (recentBookings.length === 0) {
        container.innerHTML = '<div class="no-data">近六天暂无预订记录</div>';
        return;
    }

    // 按日期排序
    recentBookings.sort((a, b) => new Date(a.date) - new Date(b.date));
    renderProviderBookings(container, recentBookings, '近六天暂无预订记录');
}

async function loadProviderBookingsFromApi(container) {
    const api = window.ApiClient;
    const mine = await api.apiMyKitchens().catch(() => null);

    if (!Array.isArray(mine)) {
        container.innerHTML = '';
        container.innerHTML = '<div class="no-data">后端暂不可用，无法加载预订</div>';
        return;
    }
    if (mine.length === 0) {
        container.innerHTML = '';
        container.innerHTML = '<div class="no-data">名下还没有厨房</div>';
        return;
    }

    const lists = await Promise.all(mine.map(k => api.apiKitchenBookings(k.id).catch(() => [])));
    const bookings = lists.filter(Array.isArray).flat().map(normalizeBooking);
    bookings.sort((a, b) => new Date(a.date) - new Date(b.date));
    renderProviderBookings(container, bookings, '名下厨房暂无预订');
}

function renderProviderBookings(container, bookings, emptyText) {
    container.innerHTML = '';
    if (!bookings.length) {
        container.innerHTML = '<div class="no-data">' + emptyText + '</div>';
        return;
    }
    bookings.forEach(booking => {
        const item = document.createElement('div');
        item.className = 'booking-item';
        item.innerHTML = `
            <h3>预订 #${booking.id}</h3>
            <div class="booking-info">用户: ${booking.user}</div>
            <div class="booking-info">厨房: ${booking.kitchen || ''}</div>
            <div class="booking-info">日期: ${booking.date}</div>
            <div class="booking-info">时间: ${booking.time}</div>
            <div class="booking-info">状态: <span class="status-${booking.status === '已取消' ? 'cancelled' : 'normal'}">${booking.status}</span></div>
        `;
        container.appendChild(item);
    });
}

function loadKitchenApplications() {
    const container = document.querySelector('.application-list');
    if (!container) return;

    const api = window.ApiClient;

    // 有后端会话：GET /api/applications/kitchen/mine
    if (api && api.hasSession && api.hasSession()) {
        return loadKitchenApplicationsFromApi(container);
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const applications = getKitchenApplications().filter(a =>
        a.applicantId === currentUser.username
    );
    renderKitchenApplications(container, applications);
}

async function loadKitchenApplicationsFromApi(container) {
    const rows = await window.ApiClient.apiMyApplications().catch(() => null);
    if (!Array.isArray(rows)) {
        container.innerHTML = '';
        container.innerHTML = '<div class="no-data">后端暂不可用，无法加载申请</div>';
        return;
    }
    renderKitchenApplications(container, rows.map(normalizeApplication));
}

// 后端 KitchenApplication → 前端字段（状态转成页面里用的中文）
function normalizeApplication(a) {
    const statusText = a.status === 'approved' ? '已通过'
        : a.status === 'rejected' ? '已拒绝'
        : a.status === 'pending' ? '待审核'
        : (a.status || '待审核');
    return {
        id: a.id,
        backendId: a.id,
        fromBackend: true,
        name: a.kitchenName,
        type: a.kitchenType,
        price: a.price,
        facilities: a.facilities,
        address: a.address,
        applicant: a.providerUsername,
        applicantId: a.providerUsername,
        applyTime: a.createdAt ? String(a.createdAt).replace('T', ' ').slice(0, 16) : '',
        status: statusText,
        rawStatus: a.status
    };
}

function renderKitchenApplications(container, applications) {
    container.innerHTML = '';
    if (applications.length === 0) {
        container.innerHTML = '<div class="no-data">暂无申请记录</div>';
        return;
    }

    applications.forEach(app => {
        const item = document.createElement('div');
        item.className = 'application-item';
        let replyHtml = '';
        if (app.reply) {
            replyHtml = `<div class="application-reply">管理员回复: ${app.reply}</div>`;
        }
        item.innerHTML = `
            <h3>${app.name}</h3>
            <div class="application-info">类型: ${app.type}</div>
            <div class="application-info">价格: ¥${app.price}/小时</div>
            <div class="application-info">申请时间: ${app.applyTime}</div>
            <div class="application-info">状态: <span class="status-${app.status}">${app.status}</span></div>
            ${replyHtml}
        `;
        container.appendChild(item);

        // 添加点击事件，显示详情
        item.addEventListener('click', function() {
            showApplicationDetail(app);
        });
    });
}

function showApplicationDetail(application) {
    // 创建详情弹窗
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>申请详情</h2>
                <button class="close-btn" id="close-application-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="application-detail-item">
                    <strong>厨房名称:</strong> ${application.name}
                </div>
                <div class="application-detail-item">
                    <strong>厨房类型:</strong> ${application.type}
                </div>
                <div class="application-detail-item">
                    <strong>价格:</strong> ¥${application.price}/小时
                </div>
                <div class="application-detail-item">
                    <strong>设施:</strong> ${application.facilities}
                </div>
                <div class="application-detail-item">
                    <strong>申请人:</strong> ${application.applicant}
                </div>
                <div class="application-detail-item">
                    <strong>申请时间:</strong> ${application.applyTime}
                </div>
                <div class="application-detail-item">
                    <strong>状态:</strong> <span class="status-${application.status}">${application.status}</span>
                </div>
            </div>
            <div class="modal-footer">
                <button id="close-application-btn">关闭</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // 关闭按钮事件
    const closeBtn = modal.querySelector('#close-application-modal');
    const closeApplicationBtn = modal.querySelector('#close-application-btn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
    }
    
    if (closeApplicationBtn) {
        closeApplicationBtn.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
    }
    
    // 点击弹窗外部关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

function loadAdminUsers() {
    const container = document.querySelector('.user-list');
    if (!container) return;

    const api = window.ApiClient;

    // 有后端会话：GET /api/users（管理员限定，password 已在后端 @JsonProperty WRITE_ONLY 隐藏）
    if (api && api.hasSession && api.hasSession()) {
        return loadAdminUsersFromApi(container);
    }

    const registeredUsers = getRegisteredUsers();
    const users = [
        ...registeredUsers,
        { username: 'test', name: '测试用户', type: 'user' },
        { username: 'provider1', name: '厨房提供者1', type: 'provider' }
    ];
    renderAdminUsers(container, users);
}

async function loadAdminUsersFromApi(container) {
    const users = await window.ApiClient.apiListUsers().catch(() => null);
    if (!Array.isArray(users)) {
        container.innerHTML = '';
        container.innerHTML = '<div class="no-data">后端暂不可用，无法加载用户（需要管理员登录）</div>';
        return;
    }
    renderAdminUsers(container, users);
}

function renderAdminUsers(container, users) {
    container.innerHTML = '';
    users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'user-item';
        item.innerHTML = `
            <h3>${user.name || user.username}</h3>
            <div class="user-info">用户名: ${user.username}</div>
            <div class="user-info">类型: ${user.type === 'provider' ? '厨房提供者' : user.type === 'admin' ? '管理员' : '厨房使用者'}</div>
            <div class="user-info">注册时间: ${user.registerTime || '未知'}</div>
            <div class="user-info">联系电话: ${user.phone || '未填写'}</div>
        `;
        container.appendChild(item);
    });
}

async function loadAdminKitchens() {
    const container = document.querySelector('#admin-page .kitchen-list');
    if (!container) return;

    // 管理员页优先展示后端真实数据（含 pending / rejected），后端不可用才退回演示数据
    let kitchens = mockKitchens;
    if (window.ApiClient && window.ApiClient.apiAllKitchens) {
        try {
            const all = await window.ApiClient.apiAllKitchens();
            if (Array.isArray(all) && all.length) kitchens = all;
        } catch (e) { /* 后端不可用，保持演示数据 */ }
    }
    // 管理 / 删除按钮要按 id 反查厨房，这里存一份当前列表
    window.adminKitchens = kitchens;
    
    container.innerHTML = '';
    kitchens.forEach(kitchen => {
        // 模拟厨房当前状态
        const currentBookings = getMockBookings().filter(b => 
            b.kitchen === kitchen.name && b.date === '2026-03-23'
        );
        
        const status = currentBookings.length > 0 ? '使用中' : '空闲';
        
        const item = document.createElement('div');
        item.className = 'kitchen-item admin-kitchen';
        
        // 使用唯一ID
        const uniqueId = kitchen.id;
        
        item.innerHTML = `
            <img src="${kitchen.image}" alt="${kitchen.name}">
            <h3>${kitchen.name}</h3>
            <div class="type">${kitchen.type}</div>
            <div class="price">¥${kitchen.price}/小时</div>
            <div class="status">状态: <span class="status-${status === '使用中' ? 'busy' : 'available'}">${status}</span></div>
            <div class="booking-count">今日预订: ${currentBookings.length} 次</div>
            <div class="kitchen-actions">
                <button class="manage-kitchen-btn" data-kitchen-id="${uniqueId}" onclick="handleManageKitchen(${uniqueId}, '${status}')">管理</button>
                <button class="delete-kitchen-btn" data-kitchen-id="${uniqueId}" onclick="handleDeleteKitchenById(${uniqueId})">删除</button>
            </div>
        `;
        item.style.cursor = 'pointer';
        item.addEventListener('click', function() {
            showKitchenDetail(kitchen);
        });
        container.appendChild(item);
    });
}



// 执行删除厨房
async function deleteKitchen(kitchenId, reason) {
    // 后端在线：执行真实软删除（写入 deleted_kitchens，之后可在恢复页还原）
    if (window.ApiClient && window.ApiClient.getToken && window.ApiClient.getToken()) {
        const api = await window.ApiClient.apiDeleteKitchen(kitchenId, reason).catch(() => null);
        if (api && api.success === false && !api.offline) {
            alert('删除失败：' + (api.message || '后端拒绝该操作'));
            return;
        }
        if (api && api.success) {
            loadAdminKitchens();
            loadProviderKitchens();
            loadKitchenItems();
            showSuccessToast('厨房已删除（后端），删除原因：' + reason);
            return;
        }
    }

    // 后端不可用：走本地演示数据
    const index = mockKitchens.findIndex(k => k.id === kitchenId);
    if (index > -1) {
        const kitchen = mockKitchens[index];
        
        // 保存到已删除列表
        const deletedKitchens = JSON.parse(localStorage.getItem('deletedKitchens') || '[]');
        deletedKitchens.push({
            ...kitchen,
            deletedAt: new Date().toISOString(),
            deleteReason: reason
        });
        localStorage.setItem('deletedKitchens', JSON.stringify(deletedKitchens));
        
        // 删除厨房
        mockKitchens.splice(index, 1);
        
        // 发送消息给提供者
        sendMessageToProvider(kitchen, reason);
        
        // 添加删除成功通知
        addNotification('厨房删除成功', `厨房 "${kitchen.name}" 已被成功删除，删除原因：${reason}`);
        
        // 重置确认次数
        delete deleteConfirmCount[kitchenId];
        
        // 关闭详情弹窗
        const detailModal = document.getElementById('kitchen-detail-modal');
        if (detailModal) {
            detailModal.style.display = 'none';
        }
        
        // 刷新所有页面的列表
        loadAdminKitchens();
        loadProviderKitchens();
        loadKitchenItems();
        
        // 显示成功提示
showSuccessToast(`厨房 "${kitchen.name}" 已删除\n原因：${reason}\n已通知提供者。`);
    }
}

// 发送消息给厨房提供者
function sendMessageToProvider(kitchen, reason) {
    // 模拟发送消息
    const message = {
        id: Date.now(),
        from: '管理员',
        to: '厨房提供者',
        subject: `您的厨房 "${kitchen.name}" 已被删除`,
content: `你的厨房 "${kitchen.name}" 被管理员删除了。\n原因：${reason}\n有疑问直接在这里回我。`
        time: new Date().toLocaleString(),
        read: false
    };
    
    // 保存消息到本地存储
    const messages = JSON.parse(localStorage.getItem('adminMessages') || '[]');
    messages.push(message);
    localStorage.setItem('adminMessages', JSON.stringify(messages));
    
    
}

// 加载提供者消息列表
function loadProviderMessages() {
    const container = document.querySelector('#provider-page .messages-list');
    if (!container) return;
    
    const messages = JSON.parse(localStorage.getItem('adminMessages') || '[]');
    
    container.innerHTML = '';
    
    if (messages.length === 0) {
        container.innerHTML = '<div class="no-data">暂无系统消息</div>';
        return;
    }
    
    messages.forEach(message => {
        const item = document.createElement('div');
        item.className = `message-item ${message.read ? 'read' : 'unread'}`;
        item.innerHTML = `
            <div class="message-header">
                <span class="message-from">${message.from}</span>
                <span class="message-time">${message.time}</span>
            </div>
            <h3 class="message-subject">${message.subject}</h3>
            <p class="message-content">${message.content}</p>
        `;
        item.addEventListener('click', function() {
            markMessageAsRead(message.id);
            item.classList.add('read');
            item.classList.remove('unread');
        });
        container.appendChild(item);
    });
}

// 标记消息为已读
function markMessageAsRead(messageId) {
    const messages = JSON.parse(localStorage.getItem('adminMessages') || '[]');
    const message = messages.find(m => m.id === messageId);
    if (message) {
        message.read = true;
        localStorage.setItem('adminMessages', JSON.stringify(messages));
    }
}

function loadAdminBookings() {
    const container = document.querySelector('#admin-page .booking-list');
    if (!container) return;

    const api = window.ApiClient;

    // 有后端会话：GET /api/bookings（管理员限定，返回全站预订）
    if (api && api.hasSession && api.hasSession()) {
        return loadAdminBookingsFromApi(container);
    }

    container.innerHTML = '';
    getMockBookings().forEach(booking => {
        container.appendChild(buildAdminBookingItem(booking));
    });
}

async function loadAdminBookingsFromApi(container) {
    const rows = await window.ApiClient.apiAdminBookings().catch(() => null);
    container.innerHTML = '';
    if (!Array.isArray(rows)) {
        container.innerHTML = '<div class="no-data">后端暂不可用，无法加载预订（需要管理员登录）</div>';
        return;
    }
    if (rows.length === 0) {
        container.innerHTML = '<div class="no-data">暂无预订记录</div>';
        return;
    }
    rows.map(normalizeBooking).forEach(booking => {
        container.appendChild(buildAdminBookingItem(booking));
    });
}

function buildAdminBookingItem(booking) {
    const item = document.createElement('div');
    item.className = 'booking-item';
    item.innerHTML = `
        <h3>预订 #${booking.id}</h3>
        <div class="booking-info">用户: ${booking.user}</div>
        <div class="booking-info">厨房: ${booking.kitchen || ''}</div>
        <div class="booking-info">日期: ${booking.date || ''}　时间: ${booking.time || ''}</div>
        <div class="booking-info">状态: <span class="status-${booking.status === '已取消' ? 'cancelled' : 'normal'}">${booking.status}</span></div>
    `;
    return item;
}

function loadAdminBookingApplications() {
    const container = document.querySelector('.booking-applications-list');
    if (!container) return;

    const api = window.ApiClient;

    // 有后端会话：后端没有预订审批接口，只读展示"待确认"的预订
    if (api && api.hasSession && api.hasSession()) {
        return loadAdminBookingApplicationsFromApi(container);
    }

    container.innerHTML = '';
    const pendingBookings = getMockBookings().filter(b => b.status === '待确认');

    if (pendingBookings.length === 0) {
        container.innerHTML = '<div class="no-applications">暂无待处理的预订申请</div>';
        return;
    }

    pendingBookings.forEach(booking => {
        const item = document.createElement('div');
        item.className = 'booking-application-item';
        item.innerHTML = `
            <h3>预订 #${booking.id}</h3>
            <div class="info">用户: ${booking.user}</div>
            <div class="info">厨房: ${booking.kitchen}</div>
            <div class="info">日期: ${booking.date}</div>
            <div class="info">时间: ${booking.time}</div>
            <div class="info">状态: <span class="status-pending">${booking.status}</span></div>
            <div class="application-actions">
                <button class="approve-btn" onclick="approveBooking(${booking.id})">通过</button>
                <button class="reject-btn" onclick="rejectBooking(${booking.id})">拒绝</button>
            </div>
        `;
        container.appendChild(item);
    });
}

async function loadAdminBookingApplicationsFromApi(container) {
    const rows = await window.ApiClient.apiAdminBookings('待确认').catch(() => null);
    container.innerHTML = '';
    if (!Array.isArray(rows)) {
        container.innerHTML = '<div class="no-applications">后端暂不可用，无法加载（需要管理员登录）</div>';
        return;
    }
    if (rows.length === 0) {
        container.innerHTML = '<div class="no-applications">暂无待确认的预订</div>';
        return;
    }
    rows.map(normalizeBooking).forEach(booking => {
        const item = document.createElement('div');
        item.className = 'booking-application-item';
        item.innerHTML = `
            <h3>预订 #${booking.id}</h3>
            <div class="info">用户: ${booking.user}</div>
            <div class="info">厨房: ${booking.kitchen || ''}</div>
            <div class="info">日期: ${booking.date || ''}</div>
            <div class="info">时间: ${booking.time || ''}</div>
            <div class="info">状态: <span class="status-pending">${booking.status}</span></div>
            <div class="info" style="color:#888">后端暂未提供预订审批接口，此处只读展示；用户可自行支付或退订。</div>
        `;
        container.appendChild(item);
    });
}

function loadAdminKitchenApplications() {
    const container = document.querySelector('.kitchen-applications-list');
    if (!container) return;

    const api = window.ApiClient;

    // 有后端会话：GET /api/applications/kitchen?status=pending（管理员限定）
    if (api && api.hasSession && api.hasSession()) {
        return loadAdminKitchenApplicationsFromApi(container);
    }

    container.innerHTML = '';
    const pendingApplications = getKitchenApplications().filter(a => a.status === '待审核');
    renderAdminKitchenApplications(container, pendingApplications);
}

async function loadAdminKitchenApplicationsFromApi(container) {
    const rows = await window.ApiClient.apiAllApplications('pending').catch(() => null);
    container.innerHTML = '';
    if (!Array.isArray(rows)) {
        container.innerHTML = '<div class="no-applications">后端暂不可用，无法加载（需要管理员登录）</div>';
        return;
    }
    renderAdminKitchenApplications(container, rows.map(normalizeApplication));
}

function renderAdminKitchenApplications(container, applications) {
    if (applications.length === 0) {
        container.innerHTML = '<div class="no-applications">暂无待处理的厨房申请</div>';
        return;
    }

    applications.forEach(app => {
        const item = document.createElement('div');
        item.className = 'kitchen-application-item';
        item.innerHTML = `
            <h3>${app.name}</h3>
            <div class="info">类型: ${app.type}</div>
            <div class="info">价格: ¥${app.price}/小时</div>
            <div class="info">设施: ${app.facilities || ''}</div>
            <div class="info">申请人: ${app.applicant}</div>
            <div class="info">申请时间: ${app.applyTime}</div>
            <div class="info">状态: <span class="status-pending">${app.status}</span></div>
            <div class="application-actions">
                <button class="approve-btn" onclick="approveKitchenApplication(${app.backendId || app.id})">通过</button>
                <button class="reject-btn" onclick="rejectKitchenApplication(${app.backendId || app.id})">拒绝</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function approveBooking(bookingId) {
    const bookings = getMockBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.status = '已确认';
        saveMockBookings(bookings);
        alert('预订申请已通过');
        loadAdminBookingApplications();
    }
}

// 拒绝预订
function rejectBooking(bookingId) {
    const bookings = getMockBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.status = '已拒绝';
        saveMockBookings(bookings);
        alert('预订申请已拒绝');
        loadAdminBookingApplications();
    }
}

// 申请通过后新厨房用的占位图，按类型从仓库自带图片里挑
const KITCHEN_IMAGES_BY_TYPE = {
    '中式厨房': 'images/kitchen_1_sunny.jpg',
    '烘焙厨房': 'images/kitchen_2_bakery.jpg',
    '西式厨房': 'images/kitchen_3_western.jpg',
    '饮品厨房': 'images/kitchen_4_beverage.jpg'
};

function kitchenImageForType(type) {
    return KITCHEN_IMAGES_BY_TYPE[type] || 'images/kitchen_1_sunny.jpg';
}

// 批准厨房申请
function approveKitchenApplication(applicationId) {
    const api = window.ApiClient;

    // 有后端会话：POST /api/applications/kitchen/{id}/approve（后端会生成厨房并带图带评分）
    if (api && api.hasSession && api.hasSession()) {
        return approveKitchenApplicationOnBackend(applicationId);
    }

    const applications = getKitchenApplications();
    const application = applications.find(a => a.id === applicationId);
    if (application) {
        application.status = '已通过';
        saveKitchenApplications(applications);

        // 将新厨房添加到mockKitchens
        const newKitchen = {
            id: application.id,
            name: application.name,
            type: application.type,
            price: application.price,
            facilities: application.facilities,
            rating: 4.0,
            image: kitchenImageForType(application.type)
        };
        mockKitchens.push(newKitchen);

        alert('厨房申请已通过');
        loadAdminKitchenApplications();
        loadAdminKitchens();
    }
}

async function approveKitchenApplicationOnBackend(applicationId) {
    const r = await window.ApiClient.apiApproveApplication(applicationId).catch(() => null);
    if (!r || !r.success) {
        showToast('审批失败：' + ((r && r.message) || '网络错误'), 'error');
        return;
    }
    showToast('厨房申请已通过，厨房已上架');
    loadAdminKitchenApplications();
    loadAdminKitchens();
    loadKitchenItems();
}

function rejectKitchenApplication(applicationId) {
    const api = window.ApiClient;

    // 有后端会话：POST /api/applications/kitchen/{id}/reject
    if (api && api.hasSession && api.hasSession()) {
        return rejectKitchenApplicationOnBackend(applicationId);
    }

    const applications = getKitchenApplications();
    const application = applications.find(a => a.id === applicationId);
    if (application) {
        // 提供拒绝原因选项
        const reasons = [
            '厨房设施不符合平台要求',
            '价格设置不合理',
            '信息填写不完整',
            '重复申请',
            '其他原因'
        ];

        let reasonOptions = '请选择拒绝原因：\n\n';
        reasons.forEach((reason, index) => {
            reasonOptions += `${index + 1}. ${reason}\n`;
        });

        const reasonIndex = prompt(reasonOptions);
        if (!reasonIndex || isNaN(reasonIndex) || reasonIndex < 1 || reasonIndex > reasons.length) {
            alert('请选择有效的拒绝原因！');
            return;
        }

        const selectedReason = reasons[parseInt(reasonIndex) - 1];

        application.status = '已拒绝';
        application.reply = selectedReason;
        saveKitchenApplications(applications);

        // 发送通知给申请者
        addNotification('厨房申请被拒绝', `您的厨房申请 "${application.name}" 已被拒绝。\n拒绝原因：${selectedReason}`);

        showSuccessToast(`厨房申请 "${application.name}" 已拒绝！\n拒绝原因：${selectedReason}`);
        loadAdminKitchenApplications();
    }
}

async function rejectKitchenApplicationOnBackend(applicationId) {
    // 后端暂不支持驳回原因字段，原因只在前端提示
    const reasons = [
        '厨房设施不符合平台要求',
        '价格设置不合理',
        '信息填写不完整',
        '重复申请',
        '其他原因'
    ];
    let reasonOptions = '请选择拒绝原因：\n\n';
    reasons.forEach((reason, index) => {
        reasonOptions += `${index + 1}. ${reason}\n`;
    });
    const reasonIndex = prompt(reasonOptions);
    if (!reasonIndex || isNaN(reasonIndex) || reasonIndex < 1 || reasonIndex > reasons.length) {
        alert('请选择有效的拒绝原因！');
        return;
    }

    const r = await window.ApiClient.apiRejectApplication(applicationId).catch(() => null);
    if (!r || !r.success) {
        showToast('驳回失败：' + ((r && r.message) || '网络错误'), 'error');
        return;
    }
    showToast('厨房申请已拒绝');
    loadAdminKitchenApplications();
}

function loadUserData() {
    loadKitchenItems();
    loadUserBookings();
    loadFavoritesList();
    loadNotifications();
}

function loadProviderData() {
    loadProviderMessages();
    loadProviderKitchens();
    loadProviderBookings();
    loadKitchenApplications();
}

function loadAdminData() {
    loadStatistics();
    loadAdminUsers();
    loadAdminKitchens();
    loadAdminBookingApplications();
    loadAdminKitchenApplications();
}

