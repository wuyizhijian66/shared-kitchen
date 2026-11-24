// admin.js — 恢复厨房 / 管理员 / 提供者中心
(function() {
    'use strict';
    document.addEventListener('DOMContentLoaded', function() {
        // 共享变量（从 core.js 公共 DCL 注入的 window 对象）
        const pages = window.pages;
        const hideAllPages = window.hideAllPages;
        const showPage = window.showPage;
        const loginForms = window.loginForms;
        const registerPages = window.registerPages;
    
        // ==================== 恢复厨房功能 ====================
        
        // 显示恢复厨房弹窗
        function showRestoreKitchenModal() {
            const modal = document.getElementById('restore-kitchen-modal');
            const select = document.getElementById('restore-kitchen-select');
            
            if (!modal || !select) return;
            
            // 清空选项
            select.innerHTML = '<option value="">请选择已删除的厨房</option>';
            
            // 获取已删除的厨房
            const deletedKitchens = JSON.parse(localStorage.getItem('deletedKitchens') || '[]');
            
            if (deletedKitchens.length === 0) {
                select.innerHTML = '<option value="">暂无已删除的厨房</option>';
                select.disabled = true;
            } else {
                deletedKitchens.forEach(kitchen => {
                    const option = document.createElement('option');
                    option.value = kitchen.id;
                    option.textContent = `${kitchen.name} (删除原因: ${kitchen.deleteReason})`;
                    select.appendChild(option);
                });
                select.disabled = false;
            }
            
            modal.style.display = 'flex';
            
            // 绑定关闭按钮
            const closeBtn = document.getElementById('close-restore-kitchen-modal');
            if (closeBtn) {
                closeBtn.onclick = function() {
                    modal.style.display = 'none';
                };
            }
            
            // 绑定确认按钮
            const confirmBtn = document.getElementById('confirm-restore-kitchen-btn');
            if (confirmBtn) {
                confirmBtn.onclick = function() {
                    confirmRestoreKitchen();
                };
            }
        }
        
        // 提交恢复申请
        function confirmRestoreKitchen() {
            const kitchenId = document.getElementById('restore-kitchen-select').value;
            const reason = document.getElementById('restore-reason').value.trim();
            
            if (!kitchenId) {
                alert('请选择要恢复的厨房');
                return;
            }
            
            if (!reason) {
                alert('请填写恢复原因');
                return;
            }
            
            // 获取已删除的厨房
            const deletedKitchens = JSON.parse(localStorage.getItem('deletedKitchens') || '[]');
            const kitchenIndex = deletedKitchens.findIndex(k => k.id === kitchenId);
            
            if (kitchenIndex === -1) {
                alert('未找到该厨房');
                return;
            }
            
            const kitchen = deletedKitchens[kitchenIndex];
            
            // 创建恢复申请
            const restoreApplications = JSON.parse(localStorage.getItem('restoreApplications') || '[]');
            restoreApplications.push({
                id: Date.now(),
                kitchenId: kitchen.id,
                kitchenName: kitchen.name,
                reason: reason,
                status: '待审核',
                applyTime: new Date().toLocaleString(),
                kitchenData: kitchen
            });
            localStorage.setItem('restoreApplications', JSON.stringify(restoreApplications));
            
            // 关闭弹窗
            const modal = document.getElementById('restore-kitchen-modal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            showSuccessToast(`恢复申请已提交！\n厨房: ${kitchen.name}\n等待管理员审核。`);
        }
        
        // 获取恢复申请列表
        function getRestoreApplications() {
            return JSON.parse(localStorage.getItem('restoreApplications') || '[]');
        }
        
        // 保存恢复申请列表
        function saveRestoreApplications(applications) {
            localStorage.setItem('restoreApplications', JSON.stringify(applications));
        }
        
        // 已删除厨房列表：有后端会话时读 GET /api/applications/deleted-kitchens，否则读 localStorage
        async function loadDeletedKitchens() {
            const container = document.getElementById('deleted-kitchens-list');
            if (!container) return;

            let deletedKitchens = null;
            const api = window.ApiClient;
            if (api && api.hasSession && api.hasSession() && api.apiMyDeletedKitchens) {
                const rows = await api.apiMyDeletedKitchens().catch(() => null);
                if (Array.isArray(rows)) deletedKitchens = rows;
            }
            if (!deletedKitchens) {
                deletedKitchens = JSON.parse(localStorage.getItem('deletedKitchens') || '[]');
            }

            container.innerHTML = '';

            if (deletedKitchens.length === 0) {
                container.innerHTML = '<div class="no-data">暂无已删除的厨房</div>';
                return;
            }

            deletedKitchens.forEach(kitchen => {
                const item = document.createElement('div');
                item.className = 'deleted-kitchen-item';
                const deletedAt = kitchen.deletedAt ? new Date(kitchen.deletedAt).toLocaleString() : '';
                item.innerHTML = `
                    <h3>${kitchen.name}</h3>
                    <div class="info">类型: ${kitchen.type}</div>
                    <div class="info">价格: ¥${kitchen.price}/小时</div>
                    <div class="info">删除时间: ${deletedAt}</div>
                    <div class="delete-reason">删除原因: ${kitchen.deleteReason || '未填写'}</div>
                `;
                if (kitchen.fromBackend !== false && kitchen.id != null) {
                    const btn = document.createElement('button');
                    btn.className = 'restore-btn';
                    btn.textContent = '恢复';
                    btn.addEventListener('click', function() {
                        restoreDeletedKitchen(kitchen.id);
                    });
                    item.appendChild(btn);
                }
                container.appendChild(item);
            });
        }

        // 直接恢复（后端 POST /api/applications/restore/{id}）
        async function restoreDeletedKitchen(deletedKitchenId) {
            if (!window.confirm('确定要恢复这个厨房吗？')) return;
            const r = await window.ApiClient.apiRestoreKitchen(deletedKitchenId).catch(() => null);
            if (!r || !r.success) {
                showToast('恢复失败：' + ((r && r.message) || '网络错误'), 'error');
                return;
            }
            showToast('厨房已恢复上架');
            loadDeletedKitchens();
            if (typeof loadAdminKitchens === 'function') loadAdminKitchens();
            if (typeof loadProviderKitchens === 'function') loadProviderKitchens();
        }

        // 加载恢复选择选项
        async function loadRestoreSelectOptions() {
            const select = document.getElementById('restore-kitchen-select');
            if (!select) return;

            select.innerHTML = '<option value="">请选择已删除的厨房</option>';

            let deletedKitchens = null;
            const api = window.ApiClient;
            if (api && api.hasSession && api.hasSession() && api.apiMyDeletedKitchens) {
                const rows = await api.apiMyDeletedKitchens().catch(() => null);
                if (Array.isArray(rows)) deletedKitchens = rows;
            }
            if (!deletedKitchens) {
                deletedKitchens = JSON.parse(localStorage.getItem('deletedKitchens') || '[]');
            }

            if (deletedKitchens.length === 0) {
                select.innerHTML = '<option value="">暂无已删除的厨房</option>';
                select.disabled = true;
                return;
            }

            deletedKitchens.forEach(kitchen => {
                const option = document.createElement('option');
                option.value = kitchen.id;
                option.textContent = `${kitchen.name} (${kitchen.type})`;
                select.appendChild(option);
            });
            select.disabled = false;
        }
        
        // 提交恢复申请
        function submitRestoreApplication() {
            const kitchenId = document.getElementById('restore-kitchen-select').value;
            const reason = document.getElementById('restore-reason').value.trim();
            
            if (!kitchenId) {
                alert('请选择要恢复的厨房');
                return;
            }
            
            if (!reason) {
                alert('请填写恢复原因');
                return;
            }
            
            const deletedKitchens = JSON.parse(localStorage.getItem('deletedKitchens') || '[]');
            const kitchenIndex = deletedKitchens.findIndex(k => k.id === kitchenId);
            
            if (kitchenIndex === -1) {
                alert('未找到该厨房');
                return;
            }
            
            const kitchen = deletedKitchens[kitchenIndex];
            
            const restoreApplications = getRestoreApplications();
            restoreApplications.push({
                id: Date.now(),
                kitchenId: kitchen.id,
                kitchenName: kitchen.name,
                reason: reason,
                status: '待审核',
                applyTime: new Date().toLocaleString(),
                kitchenData: kitchen
            });
            saveRestoreApplications(restoreApplications);
            
            showSuccessToast(`恢复申请已提交！\n厨房: ${kitchen.name}\n等待管理员审核。`);
            
            // 清空表单
            document.getElementById('restore-kitchen-select').value = '';
            document.getElementById('restore-reason').value = '';
            
            // 更新已删除厨房列表
            loadDeletedKitchens();
        }
        
        // 暴露到 window（core.js / booking.js / kitchen.js 跨模块调用）
        window.loadDeletedKitchens = loadDeletedKitchens;
        window.loadRestoreSelectOptions = loadRestoreSelectOptions;
        window.submitRestoreApplication = submitRestoreApplication;
        
    });
})();
