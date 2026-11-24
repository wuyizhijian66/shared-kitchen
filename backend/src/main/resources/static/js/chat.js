// chat.js — 聊天系统
// 说明：登录拿到后端 JWT 后，联系人和聊天记录都走后端接口；
//       没有后端（或后端不可用）时自动退回 localStorage 演示数据。
(function() {
    'use strict';
    document.addEventListener('DOMContentLoaded', function() {
        // 共享变量（从 core.js 公共 DCL 注入的 window 对象）
        const pages = window.pages;
        const hideAllPages = window.hideAllPages;
        const showPage = window.showPage;
        const loginForms = window.loginForms;
        const registerPages = window.registerPages;

        // ==================== 聊天系统功能 ====================

        // 演示用联系人（后端不可见时使用）
        const mockUsers = [
            { id: 'admin', name: '管理员', type: 'admin' },
            { id: 'provider', name: '厨房提供者', type: 'provider' },
            { id: 'test', name: '测试用户', type: 'user' }
        ];

        // 获取聊天消息（本地缓存）
        function getChatMessages() {
            return JSON.parse(localStorage.getItem('chatMessages') || '[]');
        }

        // 保存聊天消息（本地缓存）
        function saveChatMessages(messages) {
            localStorage.setItem('chatMessages', JSON.stringify(messages));
        }

        function hasSession() {
            return !!(window.ApiClient && window.ApiClient.hasSession && window.ApiClient.hasSession());
        }

        // 获取联系人列表：后端 GET /api/chat/contacts，失败退回演示用户
        async function getContacts(currentUserId) {
            if (hasSession() && window.ApiClient.apiChatContacts) {
                const rows = await window.ApiClient.apiChatContacts().catch(() => null);
                if (Array.isArray(rows)) {
                    return rows
                        .filter(u => u.username !== currentUserId)
                        .map(u => ({ id: u.username, name: u.name || u.username, type: u.type }));
                }
            }
            return mockUsers.filter(u => u.id !== currentUserId);
        }

        // 获取两人之间的聊天记录：后端 GET /api/chat/messages/{other}
        async function getConversation(userId1, userId2) {
            if (hasSession() && window.ApiClient.apiGetConversation) {
                const rows = await window.ApiClient.apiGetConversation(userId2).catch(() => null);
                if (Array.isArray(rows)) {
                    return rows.map(m => ({
                        id: m.id,
                        from: m.fromUsername,
                        to: m.toUsername,
                        content: m.content,
                        time: m.timestamp
                    }));
                }
            }
            const allMessages = getChatMessages();
            return allMessages.filter(m =>
                (m.from === userId1 && m.to === userId2) ||
                (m.from === userId2 && m.to === userId1)
            ).sort((a, b) => new Date(a.time) - new Date(b.time));
        }

        // 获取最后一条消息
        async function getLastMessage(userId1, userId2) {
            const conversation = await getConversation(userId1, userId2);
            return conversation.length > 0 ? conversation[conversation.length - 1] : null;
        }

        // 全局聊天变量
        let currentContactId = null;
        let currentContactName = null;

        // 初始化演示聊天数据（仅本地模式使用）
        function initMockChatData() {
            let existingMessages = getChatMessages();

            const mockMessages = [
                { id: 1, from: 'admin', to: 'provider', content: '您好，您申请的厨房已通过审核', time: new Date(Date.now() - 3600000).toISOString() },
                { id: 2, from: 'provider', to: 'admin', content: '感谢管理员！', time: new Date(Date.now() - 3500000).toISOString() },
                { id: 3, from: 'test', to: 'provider', content: '您好，请问厨房周末有空吗？', time: new Date(Date.now() - 7200000).toISOString() },
                { id: 4, from: 'provider', to: 'test', content: '您好，周末有空的，欢迎预订！', time: new Date(Date.now() - 7100000).toISOString() },
                { id: 5, from: 'admin', to: 'test', content: '您好，欢迎使用共享厨房平台！', time: new Date(Date.now() - 1800000).toISOString() }
            ];

            if (existingMessages.length === 0) {
                saveChatMessages(mockMessages);
                existingMessages = mockMessages;
            }
            return existingMessages;
        }

        function ensureChatData() {
            // 有后端会话时不需要本地演示数据
            if (hasSession()) return;
            initMockChatData();
        }

        // 渲染预订列表（聊天页面内的我的预订）
        function renderBookingItems(bookings) {
            const container = document.querySelector('#chat-page .booking-list') || document.querySelector('.booking-list');
            if (!container) return;
            container.innerHTML = '';
            bookings.forEach(booking => {
                const item = document.createElement('div');
                item.className = 'booking-item';
                item.innerHTML = `
                    <div class="booking-info">
                        <h4>${booking.kitchen || booking.kitchenName || ''}</h4>
                        <p>日期: ${booking.date || ''} ${booking.time || booking.timeSlot || ''}</p>
                        <p>状态: ${booking.status || ''}</p>
                        <p>金额: ¥${booking.total || booking.price || 0}</p>
                    </div>
                `;
                container.appendChild(item);
            });
        }

        // 筛选订单（有后端会话时用 window.userBookings，避免和主预订页抢容器）
        function filterBookings() {
            const statusFilter = document.getElementById('booking-status-filter');
            if (!statusFilter) return;

            const status = statusFilter.value;
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const currentUserId = currentUser.username || '';

            if (hasSession() && Array.isArray(window.userBookings) && window.userBookings.length) {
                let rows = window.userBookings.slice();
                if (status !== 'all') rows = rows.filter(b => b.status === status);
                renderBookingItems(rows);
                return;
            }

            let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            bookings = bookings.filter(b => b.user === currentUserId);
            if (status !== 'all') {
                bookings = bookings.filter(b => b.status === status);
            }
            renderBookingItems(bookings);
        }

        // 筛选和排序厨房
        function filterKitchens() {
            const searchInput = document.getElementById('kitchen-search-input');
            const sortSelect = document.getElementById('kitchen-sort');
            if (!searchInput || !sortSelect) return;

            const searchText = searchInput.value.toLowerCase();
            const sortBy = sortSelect.value;

            let kitchens = JSON.parse(localStorage.getItem('kitchens') || '[]');
            if (kitchens.length === 0) {
                kitchens = typeof window.getCurrentKitchens === 'function'
                    ? window.getCurrentKitchens().slice()
                    : [...mockKitchens];
            }

            if (searchText) {
                kitchens = kitchens.filter(k =>
                    (k.name || '').toLowerCase().includes(searchText) ||
                    (k.type || '').toLowerCase().includes(searchText)
                );
            }

            switch (sortBy) {
                case 'price-asc':
                    kitchens.sort((a, b) => a.price - b.price);
                    break;
                case 'price-desc':
                    kitchens.sort((a, b) => b.price - a.price);
                    break;
                case 'rating':
                    kitchens.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                    break;
            }

            renderKitchenItems(kitchens);
        }

        // 加载聊天联系人
        async function loadChatContacts() {
            const container = document.getElementById('chat-contacts');
            if (!container) return;

            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const currentUserId = currentUser.username || 'test';
            const contacts = await getContacts(currentUserId);

            container.innerHTML = '';

            for (const contact of contacts) {
                const lastMessage = await getLastMessage(currentUserId, contact.id);
                const lastMsgContent = lastMessage ? lastMessage.content : '暂无消息';
                const lastMsgTime = lastMessage ? formatTime(lastMessage.time) : '';

                const item = document.createElement('div');
                item.className = 'contact-item';
                item.dataset.contactId = contact.id;
                item.innerHTML = `
                    <div class="contact-avatar">${(contact.name || contact.id).charAt(0)}</div>
                    <div class="contact-info">
                        <div class="contact-name">${contact.name || contact.id}</div>
                        <div class="contact-last-message">${lastMsgContent}</div>
                    </div>
                    <div class="contact-time">${lastMsgTime}</div>
                `;

                item.addEventListener('click', function() {
                    selectContact(contact.id, contact.name || contact.id);
                });

                container.appendChild(item);
            }
        }

        // 选择联系人
        function selectContact(contactId, contactName) {
            currentContactId = contactId;
            currentContactName = contactName;
            window.currentContactId = contactId;
            window.currentContactName = contactName;

            document.querySelectorAll('.contact-item').forEach(item => {
                item.classList.remove('active');
            });
            const active = document.querySelector(`[data-contact-id="${contactId}"]`);
            if (active) active.classList.add('active');

            const titleEl = document.getElementById('current-contact-name');
            if (titleEl) titleEl.textContent = contactName;

            loadChatMessages();
        }

        // 加载聊天消息
        async function loadChatMessages() {
            const container = document.getElementById('chat-messages');
            if (!container) return;
            if (!currentContactId) {
                container.innerHTML = '<div class="no-messages">选择一个联系人开始聊天</div>';
                return;
            }

            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const currentUserId = currentUser.username || 'test';
            const messages = await getConversation(currentUserId, currentContactId);

            container.innerHTML = '';

            messages.forEach(message => {
                const isOwn = message.from === currentUserId;
                const item = document.createElement('div');
                item.className = `message ${isOwn ? 'message-own' : 'message-other'}`;
                item.innerHTML = `
                    <div class="message-content">${message.content}</div>
                    <div class="message-time">${formatTime(message.time)}</div>
                `;
                container.appendChild(item);
            });

            container.scrollTop = container.scrollHeight;
        }

        // 发送聊天消息
        async function sendChatMessage() {
            const input = document.getElementById('chat-message-input');
            if (!input) return;
            const messageContent = input.value.trim();

            if (!messageContent || !currentContactId) return;

            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const currentUserId = currentUser.username || 'test';

            if (hasSession() && window.ApiClient.apiSendChatMessage) {
                const r = await window.ApiClient.apiSendChatMessage(currentContactId, messageContent).catch(() => null);
                if (!r || !r.success) {
                    showToast('发送失败：' + ((r && r.message) || '网络错误'), 'error');
                    return;
                }
                input.value = '';
                await loadChatMessages();
                await loadChatContacts();

                // 已发送的消息也留在本地缓存，断网时还能看到
                const cache = getChatMessages();
                cache.push({
                    id: Date.now(),
                    from: currentUserId,
                    to: currentContactId,
                    content: messageContent,
                    time: new Date().toISOString()
                });
                saveChatMessages(cache);
                return;
            }

            const message = {
                id: Date.now(),
                from: currentUserId,
                to: currentContactId,
                content: messageContent,
                time: new Date().toISOString()
            };

            const messages = getChatMessages();
            messages.push(message);
            saveChatMessages(messages);

            input.value = '';
            await loadChatMessages();
            await loadChatContacts();
        }

        // 格式化时间
        function formatTime(timeString) {
            const date = new Date(timeString);
            if (isNaN(date)) return '';
            const now = new Date();
            const diff = now - date;

            if (diff < 60000) {
                return '刚刚';
            } else if (diff < 3600000) {
                return `${Math.floor(diff / 60000)}分钟前`;
            } else if (diff < 86400000) {
                return `${Math.floor(diff / 3600000)}小时前`;
            } else {
                return date.toLocaleDateString();
            }
        }

        // 暴露到 window（内联 onclick + 跨模块调用）
        window.filterKitchens = filterKitchens;
        window.filterBookings = filterBookings;
        window.initMockChatData = initMockChatData;
        window.ensureChatData = ensureChatData;
        window.loadChatContacts = loadChatContacts;
        window.sendChatMessage = sendChatMessage;
        window.currentContactId = currentContactId;
        window.currentContactName = currentContactName;

    });
})();
