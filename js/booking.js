// booking.js — 预订 / 时间段刷新 / 辅助函数
(function() {
    'use strict';
    document.addEventListener('DOMContentLoaded', function() {
        // 共享变量（从 core.js 公共 DCL 注入的 window 对象）
        const pages = window.pages;
        const loginForms = window.loginForms;
        const registerPages = window.registerPages;
    
            // ==================== 8. 预订功能 ====================
            const kitchenActionBtn = document.getElementById('kitchen-action-btn');
            const bookingModal = document.getElementById('booking-modal');
            const closeModal = document.getElementById('close-modal');
            const confirmBookingBtn = document.getElementById('confirm-booking-btn');
            let currentKitchen = null;
        
            // 刷新时间段可用性：选今天时禁掉已经开始的时间段
            function refreshTimeSlots() {
                const dateInput = document.getElementById('booking-date');
                const timeSelect = document.getElementById('booking-time');
                if (!dateInput || !timeSelect) return;
        
                const selectedDate = dateInput.value;
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                const isToday = selectedDate === todayStr;
                const nowMinutes = now.getHours() * 60 + now.getMinutes();
        
                const options = timeSelect.querySelectorAll('option');
                let currentDisabled = false;
        
                options.forEach(opt => {
                    // 还原文本（去掉之前可能加过的 "(已过)"）
                    const origText = opt.getAttribute('data-orig-text') || opt.textContent.replace(' (已过)', '');
                    if (!opt.getAttribute('data-orig-text')) opt.setAttribute('data-orig-text', origText);
        
                    if (isToday) {
                        const startHour = parseInt(opt.value.split('-')[0].split(':')[0], 10);
                        const startMinutes = startHour * 60;
                        if (startMinutes <= nowMinutes) {
                            opt.disabled = true;
                            opt.textContent = origText + ' (已过)';
                            if (opt.selected) currentDisabled = true;
                        } else {
                            opt.disabled = false;
                            opt.textContent = origText;
                        }
                    } else {
                        // 非今天全部启用
                        opt.disabled = false;
                        opt.textContent = origText;
                    }
                });
        
                // 如果当前选中的时间段被禁用了，清掉
                if (currentDisabled) timeSelect.value = '';
            }
            // 暴露到全局，供 showKitchenDetail 里的 onclick 使用
            window.refreshTimeSlots = refreshTimeSlots;
        
            // 日期变化时刷新时间段
            const dateInput = document.getElementById('booking-date');
            if (dateInput) {
                dateInput.addEventListener('change', refreshTimeSlots);
            }
            
            // 关闭预订弹窗
            if (closeModal && bookingModal) {
                closeModal.addEventListener('click', function() {
                    bookingModal.style.display = 'none';
                });
            }
            
            // 点击弹窗外部关闭
            if (bookingModal) {
                bookingModal.addEventListener('click', function(e) {
                    if (e.target === bookingModal) {
                        bookingModal.style.display = 'none';
                    }
                });
            }
            
            // 确认预订
            if (confirmBookingBtn) {
                confirmBookingBtn.addEventListener('click', function() {
                    const date = document.getElementById('booking-date')?.value;
                    const time = document.getElementById('booking-time')?.value;
                    const name = document.getElementById('booking-name')?.value;
                    const phone = document.getElementById('booking-phone')?.value;
                    
                    if (!date || !name) {
                        alert('请填写完整信息');
                        return;
                    }
                    
                    // 防止绕过 HTML min：JS 再校验一次日期是否早于今天
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selectedDate = new Date(date + 'T00:00:00');
                    if (isNaN(selectedDate.getTime()) || selectedDate < today) {
                        alert('不能选择今天之前的日期，请重新选择');
                        return;
                    }
        
                    // 校验时间段（选今天时不能选已经开始的时段）
                    const now = new Date();
                    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    if (date === todayStr && time) {
                        const startHour = parseInt(time.split('-')[0].split(':')[0], 10);
                        const startMinutes = startHour * 60;
                        const nowMinutes = now.getHours() * 60 + now.getMinutes();
                        if (startMinutes <= nowMinutes) {
                            alert('今天该时间段已过，请选择其他时间段');
                            return;
                        }
                    }
                    
                    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                    const kitchenName = document.getElementById('detail-name')?.textContent || '未知厨房';
                    const kitchenId = parseInt(document.getElementById('detail-name')?.dataset?.kitchenId || '0', 10);

                    // 创建新预订
                    const newBooking = {
                        id: Date.now(),
                        user: currentUser.username || name,
                        kitchenId: kitchenId,
                        kitchen: kitchenName,
                        date: date,
                        timeSlot: time,
                        time: time,
                        status: '待支付',
                        phone: phone
                    };

                    const bookings = getMockBookings();
                    bookings.push(newBooking);
                    saveMockBookings(bookings);

                    // 异步：后端在线就同步（把后端返回的 ID 存到 booking.backendId）
                    if (window.ApiClient && kitchenId) {
                        window.ApiClient.apiCreateBooking({
                            kitchenId, date, timeSlot: time, phone
                        }).then(r => {
                            if (r && r.success && r.booking) {
                                newBooking.backendId = r.booking.id;
                                saveMockBookings(bookings);
                            }
                        }).catch(() => {});
                    }
                    
                    bookingModal.style.display = 'none';
                    
                    // 清空表单
                    document.getElementById('booking-date').value = '';
                    document.getElementById('booking-phone').value = '';
                    
                    // 跳转到支付界面
                    showPaymentModal(newBooking.id);
                });
            }
            
            // 支付弹窗相关
            const paymentModal = document.getElementById('payment-modal');
            const closePaymentModal = document.getElementById('close-payment-modal');
            const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
            
            // 关闭支付弹窗
            if (closePaymentModal && paymentModal) {
                closePaymentModal.addEventListener('click', function() {
                    paymentModal.style.display = 'none';
                });
            }
            
            // 点击弹窗外部关闭
            if (paymentModal) {
                paymentModal.addEventListener('click', function(e) {
                    if (e.target === paymentModal) {
                        paymentModal.style.display = 'none';
                    }
                });
            }
            
            // 支付选项点击逻辑
            const paymentOptions = document.querySelectorAll('.payment-option');
            paymentOptions.forEach(option => {
                option.addEventListener('click', function(e) {
                    const radio = this.querySelector('input[type="radio"]');
                    if (radio && e.target !== radio && e.target.tagName !== 'LABEL') {
                        radio.checked = true;
                    }
                });
            });
            
            // 确认支付
            if (confirmPaymentBtn) {
                confirmPaymentBtn.addEventListener('click', function() {
                    const bookingId = paymentModal.dataset.bookingId;
                    if (bookingId) {
                        // 使用浏览器默认的confirm对话框
                        if (window.confirm('确定要支付这个预订吗？')) {
                            // 执行支付操作
                            payBooking(parseInt(bookingId));
                        } else {
                            // 如果用户取消，关闭支付弹窗
                            window.alert('已取消支付操作');
                            if (paymentModal) {
                                paymentModal.style.display = 'none';
                            }
                        }
                    }
                });
            }
            
            // 显示支付弹窗
            function showPaymentModal(bookingId) {
                const paymentModal = document.getElementById('payment-modal');
                const paymentDetails = document.getElementById('payment-details');
                
                if (!paymentModal || !paymentDetails) return;
                
                // 获取预订信息
                const bookings = getMockBookings();
                const booking = bookings.find(b => b.id === bookingId);
                
                if (booking) {
                    // 计算支付金额（假设每小时价格）
                    const pricePerHour = 100; // 假设每小时100元
                    const hours = 4; // 每个时间段4小时
                    const totalAmount = pricePerHour * hours;
                    
                    // 填充支付详情
                    paymentDetails.innerHTML = `
                        <div class="payment-item">厨房：${booking.kitchen}</div>
                        <div class="payment-item">日期：${booking.date}</div>
                        <div class="payment-item">时间：${booking.time}</div>
                        <div class="payment-item">金额：¥${totalAmount}</div>
                    `;
                    
                    // 存储预订ID
                    paymentModal.dataset.bookingId = bookingId;
                    
                    // 显示支付弹窗
                    paymentModal.style.display = 'flex';
                }
            }
            
            // ==================== 辅助函数 ====================
            
            function hideAllPages() {
                Object.values(pages).forEach(page => {
                    if (page) page.style.display = 'none';
                });
                Object.values(registerPages).forEach(page => {
                    if (page) page.style.display = 'none';
                });
            }
            
            function showPage(pageName) {
                hideAllPages();
                if (pages[pageName]) {
                    pages[pageName].style.display = 'block';
                }
                
                // 如果是聊天页面，加载联系人
                if (pageName === 'chat') {
                    setTimeout(function() {
                        if (typeof window.loadChatContacts === 'function') window.loadChatContacts();
                        // 清除选中状态
                        document.querySelectorAll('.contact-item').forEach(item => {
                            item.classList.remove('active');
                        });
                        if (typeof window !== 'undefined') { window.currentContactId = null; window.currentContactName = null; }
                        const contactNameEl = document.getElementById('current-contact-name');
                        if (contactNameEl) {
                            contactNameEl.textContent = '选择一个联系人开始聊天';
                        }
                        const chatMessagesEl = document.getElementById('chat-messages');
                        if (chatMessagesEl) {
                            chatMessagesEl.innerHTML = '<div class="no-messages">选择一个联系人开始聊天</div>';
                        }
                    }, 100);
                }
                
                // 如果是恢复页面，加载已删除厨房列表
                if (pageName === 'restore') {
                    setTimeout(function() {
                        if (typeof window.loadDeletedKitchens === 'function') window.loadDeletedKitchens();
                        if (typeof window.loadRestoreSelectOptions === 'function') window.loadRestoreSelectOptions();
                    }, 100);
                }
            }
            
            // ==================== 9. 聊天功能 ====================
            const chatBtns = document.querySelectorAll('.chat-btn');
            chatBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const chatType = this.dataset.type;
                    
                    showPage('chat');
                });
            });
            
            // 聊天返回按钮
            const chatBack = document.getElementById('chat-back');
            if (chatBack) {
                chatBack.addEventListener('click', function() {
                    const userType = localStorage.getItem('userType');
                    if (userType === 'admin') {
                        showPage('admin');
                    } else if (userType === 'provider') {
                        showPage('provider');
                    } else {
                        showPage('user');
                    }
                });
            }
            
            // 发送消息按钮
            const sendMessageBtn = document.getElementById('send-message-btn');
            const chatMessageInput = document.getElementById('chat-message-input');
            
            if (sendMessageBtn && chatMessageInput) {
                sendMessageBtn.addEventListener('click', function() {
                    if (typeof window.sendChatMessage === 'function') window.sendChatMessage();
                });
                
                chatMessageInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        if (typeof window.sendChatMessage === 'function') window.sendChatMessage();
                    }
                });
            }
            
            
    });
})();
