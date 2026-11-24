// kitchen.js — 添加厨房 / 分类 / 搜索 / 排序 / 厨房详情
(function() {
    'use strict';
    document.addEventListener('DOMContentLoaded', function() {
        // 共享变量（从 core.js 公共 DCL 注入的 window 对象）
        const pages = window.pages;
        const hideAllPages = window.hideAllPages;
        const showPage = window.showPage;
        const loginForms = window.loginForms;
        const registerPages = window.registerPages;
    
            // ==================== 5. 添加厨房功能 ====================
            const addKitchenBtn = document.getElementById('add-kitchen-btn');
            const addKitchenModal = document.getElementById('add-kitchen-modal');
            const closeAddKitchenModal = document.getElementById('close-add-kitchen-modal');
            const confirmAddKitchenBtn = document.getElementById('confirm-add-kitchen-btn');
            
            if (addKitchenBtn) {
                addKitchenBtn.addEventListener('click', function() {
                    
                    if (addKitchenModal) addKitchenModal.style.display = 'flex';
                });
            }
            
            // 申请恢复按钮
            const restoreKitchenBtn = document.getElementById('restore-kitchen-btn');
            if (restoreKitchenBtn) {
                restoreKitchenBtn.addEventListener('click', function() {
                    showPage('restore');
                });
            }
            
            // 恢复页面返回按钮
            const restoreBackBtn = document.getElementById('restore-back');
            if (restoreBackBtn) {
                restoreBackBtn.addEventListener('click', function() {
                    showPage('provider');
                });
            }
            
            // 提交恢复申请按钮
            const submitRestoreBtn = document.getElementById('submit-restore-btn');
            if (submitRestoreBtn) {
                submitRestoreBtn.addEventListener('click', function() {
                    if (typeof window.submitRestoreApplication === 'function') window.submitRestoreApplication();
                });
            }
            
            if (closeAddKitchenModal) {
                closeAddKitchenModal.addEventListener('click', function() {
                    if (addKitchenModal) addKitchenModal.style.display = 'none';
                });
            }
            
            if (addKitchenModal) {
                addKitchenModal.addEventListener('click', function(e) {
                    if (e.target === addKitchenModal) {
                        addKitchenModal.style.display = 'none';
                    }
                });
            }
            
            if (confirmAddKitchenBtn) {
                confirmAddKitchenBtn.addEventListener('click', function() {
                    const name = document.getElementById('add-kitchen-name')?.value;
                    const type = document.getElementById('add-kitchen-type')?.value;
                    const price = document.getElementById('add-kitchen-price')?.value;
                    const facilities = document.getElementById('add-kitchen-facilities')?.value;
                    
                    if (!name || !price) {
                        alert('请填写厨房名称和价格');
                        return;
                    }
                    
                    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                    
                    // 创建厨房申请
                    const newApplication = {
                        id: Date.now(),
                        name: name,
                        type: type,
                        price: parseFloat(price),
                        facilities: facilities || '标准设施',
                        applicant: currentUser.name || currentUser.username,
                        applicantId: currentUser.username,
                        status: '待审核',
                        applyTime: new Date().toLocaleString()
                    };
                    
                    const applications = getKitchenApplications();
                    applications.push(newApplication);
                    saveKitchenApplications(applications);
                    
                    alert('申请提交成功！请等待管理员审核');
                    if (addKitchenModal) addKitchenModal.style.display = 'none';
                    
                    // 清空表单
                    document.getElementById('add-kitchen-name').value = '';
                    document.getElementById('add-kitchen-price').value = '';
                    document.getElementById('add-kitchen-facilities').value = '';
                    
                    loadKitchenApplications();
                });
            }
            
            // ==================== 6. 分类按钮 ====================
            // 按钮文字就是数据库 type 值，直接传
            const TYPE_MAP = {
                '中式厨房': '中式厨房',
                '西式厨房': '西式厨房',
                '烘焙厨房': '烘焙厨房',
                '饮品厨房': '饮品厨房'
            };
            const categoryBtns = document.querySelectorAll('.category-btn');
            categoryBtns.forEach(btn => {
                btn.addEventListener('click', async function() {
                    categoryBtns.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    
                    const category = this.textContent.trim();
                    const type = TYPE_MAP[category] || null;
                    try {
                        let list;
                        if (type) {
                            list = await window.ApiClient.apiListKitchens(type);
                        } else {
                            list = await window.ApiClient.apiListKitchens();
                        }
                        if (!list || list.length === 0) {
                            // 后端没数据时 fallback mock
                            list = typeof window.mockKitchens !== 'undefined'
                                ? (type ? window.mockKitchens.filter(k => TYPE_MAP[k.type] === type || k.type === type) : window.mockKitchens)
                                : [];
                        }
                        renderKitchenItems(list);
                    } catch (e) {
                        
                        const fallback = typeof window.mockKitchens !== 'undefined'
                            ? (type ? window.mockKitchens.filter(k => TYPE_MAP[k.type] === type) : window.mockKitchens)
                            : [];
                        renderKitchenItems(fallback);
                    }
                });
            });
            
            // ==================== 搜索功能 ====================
            const searchInput = document.getElementById('kitchen-search-input');
            const searchBtn = document.getElementById('kitchen-search-btn');
            
            if (searchBtn) {
                searchBtn.addEventListener('click', function() {
                    searchKitchens();
                });
            }
            
            if (searchInput) {
                searchInput.addEventListener('keyup', function(e) {
                    if (e.key === 'Enter') {
                        searchKitchens();
                    }
                });
            }
            
            // ==================== 排序功能 ====================
            const sortPriceAscBtn = document.getElementById('sort-price-asc');
            const sortPriceDescBtn = document.getElementById('sort-price-desc');
            const sortRatingBtn = document.getElementById('sort-rating');
            
            if (sortPriceAscBtn) {
                sortPriceAscBtn.addEventListener('click', function() {
                    sortKitchens('price-asc');
                });
            }
            
            if (sortPriceDescBtn) {
                sortPriceDescBtn.addEventListener('click', function() {
                    sortKitchens('price-desc');
                });
            }
            
            if (sortRatingBtn) {
                sortRatingBtn.addEventListener('click', function() {
                    sortKitchens('rating');
                });
            }
            
            // ==================== 7. 厨房详情功能 ====================
            const kitchenDetailBack = document.getElementById('kitchen-detail-back');
            if (kitchenDetailBack) {
                kitchenDetailBack.addEventListener('click', function() {
                    const previousPage = localStorage.getItem('previousPage') || 'user';
                    
                    // 隐藏详情页面
                    const kitchenDetailPage = document.getElementById('kitchen-detail-page');
                    if (kitchenDetailPage) {
                        kitchenDetailPage.style.display = 'none';
                    }
                    
                    // 根据用户类型显示对应页面并重新加载数据
                    if (previousPage === 'provider') {
                        const providerPage = document.getElementById('provider-page');
                        if (providerPage) providerPage.style.display = 'block';
                        loadProviderData();
                    } else if (previousPage === 'admin') {
                        const adminPage = document.getElementById('admin-page');
                        if (adminPage) adminPage.style.display = 'block';
                        loadAdminData();
                    } else {
                        const userPage = document.getElementById('user-page');
                        if (userPage) userPage.style.display = 'block';
                        loadUserData();
                    }
                });
            }
            
    });
})();
