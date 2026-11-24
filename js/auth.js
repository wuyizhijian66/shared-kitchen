// auth.js — 标签切换 / 登录 / 注册 / 退出
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        const pages = window.pages;
        const hideAllPages = window.hideAllPages;
        const showPage = window.showPage;
        const loginForms = window.loginForms;
        const registerPages = window.registerPages;

        // ==================== 1. 标签切换功能 ====================
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                tabBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                Object.values(loginForms).forEach(form => {
                    if (form) form.style.display = 'none';
                });
                const tab = this.dataset.tab;
                if (loginForms[tab]) {
                    loginForms[tab].style.display = 'block';
                }
            });
        });

        // ==================== 2. 登录功能 ====================
        const loginBtns = {
            provider: document.getElementById('provider-login-btn'),
            user: document.getElementById('user-login-btn'),
            admin: document.getElementById('admin-login-btn')
        };

        if (loginBtns.provider) {
            loginBtns.provider.addEventListener('click', function(e) {
                e.preventDefault();
                const username = document.getElementById('provider-username')?.value;
                const password = document.getElementById('provider-password')?.value;
                if (!username || !password) { alert('请输入用户名和密码'); return; }
                if (login(username, password, 'provider')) {
                    showPage('provider');
                    loadProviderData();
                } else {
                    alert('登录失败，请检查账号和密码');
                }
            });
        }

        if (loginBtns.user) {
            loginBtns.user.addEventListener('click', function(e) {
                e.preventDefault();
                const username = document.getElementById('user-username')?.value;
                const password = document.getElementById('user-password')?.value;
                if (!username || !password) { alert('请输入用户名和密码'); return; }
                if (login(username, password, 'user')) {
                    showPage('user');
                    loadUserData();
                } else {
                    alert('登录失败，请检查账号和密码');
                }
            });
        }

        if (loginBtns.admin) {
            loginBtns.admin.addEventListener('click', function(e) {
                e.preventDefault();
                const username = document.getElementById('admin-username')?.value;
                const password = document.getElementById('admin-password')?.value;
                if (!username || !password) { alert('请输入用户名和密码'); return; }
                if (username === 'admin' && password === 'admin123') {
                    localStorage.setItem('userType', 'admin');
                    localStorage.setItem('currentUser', JSON.stringify({
                        username: 'admin', name: '管理员', type: 'admin'
                    }));
                    showPage('admin');
                    loadAdminData();
                } else {
                    alert('管理员登录失败');
                }
            });
        }

        // ==================== 3. 注册功能 ====================
        const registerLinks = {
            provider: document.getElementById('provider-register-link'),
            user: document.getElementById('user-register-link')
        };
        const backToLoginLinks = {
            provider: document.getElementById('provider-back-to-login'),
            user: document.getElementById('user-back-to-login')
        };
        const registerBtns = {
            provider: document.getElementById('provider-register-btn'),
            user: document.getElementById('user-register-btn')
        };

        Object.entries(registerLinks).forEach(([type, link]) => {
            if (link) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    hideAllPages();
                    if (registerPages[type]) registerPages[type].style.display = 'block';
                });
            }
        });

        Object.entries(backToLoginLinks).forEach(([type, link]) => {
            if (link) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    hideAllPages();
                    if (pages.login) pages.login.style.display = 'block';
                    if (loginForms[type]) loginForms[type].style.display = 'block';
                });
            }
        });

        if (registerBtns.provider) {
            registerBtns.provider.addEventListener('click', function() {
                const username = document.getElementById('provider-reg-username')?.value;
                const name = document.getElementById('provider-reg-name')?.value;
                const password = document.getElementById('provider-reg-password')?.value;
                if (!username || !password || !name) { alert('请填写必填项'); return; }
                const result = registerUser({ username, password, name, type: 'provider' });
                if (result.success) {
                    alert('注册成功！');
                    login(username, password, 'provider');
                    showPage('provider');
                    loadProviderData();
                } else {
                    alert(result.message);
                }
            });
        }

        if (registerBtns.user) {
            registerBtns.user.addEventListener('click', function() {
                const username = document.getElementById('user-reg-username')?.value;
                const name = document.getElementById('user-reg-name')?.value;
                const password = document.getElementById('user-reg-password')?.value;
                if (!username || !password || !name) { alert('请填写必填项'); return; }
                const result = registerUser({ username, password, name, type: 'user' });
                if (result.success) {
                    alert('注册成功！');
                    login(username, password, 'user');
                    showPage('user');
                    loadUserData();
                } else {
                    alert(result.message);
                }
            });
        }

        // ==================== 4. 退出功能 ====================
        const logoutBtns = {
            user: document.getElementById('user-logout'),
            provider: document.getElementById('provider-logout'),
            admin: document.getElementById('admin-logout')
        };
        Object.entries(logoutBtns).forEach(([type, btn]) => {
            if (btn) {
                btn.addEventListener('click', function() {
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('userType');
                    showPage('login');
                    if (loginForms[type]) loginForms[type].style.display = 'block';
                });
            }
        });
    });
})();
