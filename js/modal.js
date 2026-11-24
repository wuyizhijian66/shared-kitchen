// modal.js — 自定义弹窗 + 初始化
(function() {
    'use strict';
    document.addEventListener('DOMContentLoaded', function() {
        // 共享变量（从 core.js 公共 DCL 注入的 window 对象）
        const pages = window.pages;
        const hideAllPages = window.hideAllPages;
        const showPage = window.showPage;
        const loginForms = window.loginForms;
        const registerPages = window.registerPages;
    
        // ==================== 自定义弹窗功能 ====================
        let confirmCallback = null;
        let confirmModal, alertModal, confirmMessage, alertMessage, confirmCancelBtn, confirmOkBtn, alertOkBtn, closeConfirmModal, closeAlertModal;
        let eventsBound = false;
        
        // 初始化弹窗元素
        function initModalElements() {
            if (!confirmModal || !confirmMessage) {
                confirmModal = document.getElementById('confirm-modal');
                alertModal = document.getElementById('alert-modal');
                confirmMessage = document.getElementById('confirm-message');
                alertMessage = document.getElementById('alert-message');
                confirmCancelBtn = document.getElementById('confirm-cancel-btn');
                confirmOkBtn = document.getElementById('confirm-ok-btn');
                alertOkBtn = document.getElementById('alert-ok-btn');
                closeConfirmModal = document.getElementById('close-confirm-modal');
                closeAlertModal = document.getElementById('close-alert-modal');
            }
        }
        
        // 绑定弹窗事件
        function bindModalEvents() {
            if (eventsBound) return;
            
            // 重新获取所有弹窗元素，确保能够找到它们
            confirmModal = document.getElementById('confirm-modal');
            alertModal = document.getElementById('alert-modal');
            confirmMessage = document.getElementById('confirm-message');
            alertMessage = document.getElementById('alert-message');
            confirmCancelBtn = document.getElementById('confirm-cancel-btn');
            confirmOkBtn = document.getElementById('confirm-ok-btn');
            alertOkBtn = document.getElementById('alert-ok-btn');
            closeConfirmModal = document.getElementById('close-confirm-modal');
            closeAlertModal = document.getElementById('close-alert-modal');
            
            // 为所有弹窗按钮添加样式，确保它们是可点击的
            const modalButtons = [confirmCancelBtn, confirmOkBtn, alertOkBtn, closeConfirmModal, closeAlertModal];
            modalButtons.forEach(btn => {
                if (btn) {
                    btn.style.cursor = 'pointer';
                    btn.style.zIndex = '1001';
                    btn.style.position = 'relative';
                }
            });
            
            // 关闭确认弹窗
            if (closeConfirmModal && confirmModal) {
                closeConfirmModal.addEventListener('click', function(e) {
                    e.stopPropagation();
                    confirmModal.style.display = 'none';
                    confirmCallback = null;
                });
            }
            
            // 关闭提示弹窗
            if (closeAlertModal && alertModal) {
                closeAlertModal.addEventListener('click', function(e) {
                    e.stopPropagation();
                    alertModal.style.display = 'none';
                });
            }
            
            // 确认弹窗取消按钮
            if (confirmCancelBtn && confirmModal) {
                confirmCancelBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    confirmModal.style.display = 'none';
                    if (confirmCallback) {
                        confirmCallback(false);
                        confirmCallback = null;
                    }
                });
            }
            
            // 确认弹窗确定按钮
            if (confirmOkBtn && confirmModal) {
                confirmOkBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    confirmModal.style.display = 'none';
                    if (confirmCallback) {
                        confirmCallback(true);
                        confirmCallback = null;
                    }
                });
            }
            
            // 提示弹窗确定按钮
            if (alertOkBtn && alertModal) {
                alertOkBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    alertModal.style.display = 'none';
                });
            }
            
            // 点击弹窗外部关闭
            if (confirmModal) {
                confirmModal.addEventListener('click', function(e) {
                    if (e.target === confirmModal) {
                        confirmModal.style.display = 'none';
                        confirmCallback = null;
                    }
                });
            }
            
            if (alertModal) {
                alertModal.addEventListener('click', function(e) {
                    if (e.target === alertModal) {
                        alertModal.style.display = 'none';
                    }
                });
            }
            
            eventsBound = true;
        }
        
        // 自定义确认弹窗
        function showConfirm(message, callback) {
            // 每次都重新获取弹窗元素
            confirmModal = document.getElementById('confirm-modal');
            confirmMessage = document.getElementById('confirm-message');
            confirmCancelBtn = document.getElementById('confirm-cancel-btn');
            confirmOkBtn = document.getElementById('confirm-ok-btn');
            closeConfirmModal = document.getElementById('close-confirm-modal');
            
            if (!confirmModal || !confirmMessage) {
                
                return;
            }
            
            // 先设置callback
            confirmCallback = callback;
            
            // 直接使用onclick绑定事件处理函数
            if (confirmOkBtn) {
                confirmOkBtn.onclick = function(e) {
                    if (e) e.stopPropagation();
                    confirmModal.style.display = 'none';
                    if (confirmCallback) {
                        confirmCallback(true);
                        confirmCallback = null;
                    }
                };
            }
            
            if (confirmCancelBtn) {
                confirmCancelBtn.onclick = function(e) {
                    if (e) e.stopPropagation();
                    confirmModal.style.display = 'none';
                    if (confirmCallback) {
                        confirmCallback(false);
                        confirmCallback = null;
                    }
                };
            }
            
            if (closeConfirmModal) {
                closeConfirmModal.onclick = function(e) {
                    if (e) e.stopPropagation();
                    confirmModal.style.display = 'none';
                    confirmCallback = null;
                };
            }
            
            // 点击弹窗背景关闭
            confirmModal.onclick = function(e) {
                if (e.target === confirmModal) {
                    confirmModal.style.display = 'none';
                    confirmCallback = null;
                }
            };
            
            // 为按钮添加样式
            const buttons = [confirmCancelBtn, confirmOkBtn, closeConfirmModal];
            buttons.forEach(btn => {
                if (btn) {
                    btn.style.cursor = 'pointer';
                    btn.style.position = 'relative';
                    btn.style.zIndex = '10001';
                }
            });
            
            confirmMessage.textContent = message;
            confirmModal.style.display = 'flex';
        }
        
        // 自定义提示弹窗
        function showAlert(message) {
            // 每次都重新获取弹窗元素
            alertModal = document.getElementById('alert-modal');
            alertMessage = document.getElementById('alert-message');
            alertOkBtn = document.getElementById('alert-ok-btn');
            closeAlertModal = document.getElementById('close-alert-modal');
            
            if (!alertModal || !alertMessage) {
                
                return;
            }
            
            // 直接使用onclick绑定事件处理函数
            if (alertOkBtn) {
                alertOkBtn.onclick = function(e) {
                    if (e) e.stopPropagation();
                    alertModal.style.display = 'none';
                };
            }
            
            if (closeAlertModal) {
                closeAlertModal.onclick = function(e) {
                    if (e) e.stopPropagation();
                    alertModal.style.display = 'none';
                };
            }
            
            // 点击弹窗背景关闭
            alertModal.onclick = function(e) {
                if (e.target === alertModal) {
                    alertModal.style.display = 'none';
                }
            };
            
            // 为按钮添加样式
            const buttons = [alertOkBtn, closeAlertModal];
            buttons.forEach(btn => {
                if (btn) {
                    btn.style.cursor = 'pointer';
                    btn.style.position = 'relative';
                    btn.style.zIndex = '10001';
                }
            });
            
            alertMessage.textContent = message;
            alertModal.style.display = 'flex';
        }
        
        // 不覆盖全局confirm和alert函数，使用浏览器默认的对话框
        
        // DOM 已 ready（外层 DCL 保证），直接初始化弹窗
        initModalElements();
        bindModalEvents();
        
    });
})();
