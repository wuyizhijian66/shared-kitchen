// ==================== api-client.js — 前端 <-> Spring Boot 后端通信层 ====================
// 设计模式：优先走后端 REST API，后端不可用时自动 fallback localStorage
// 所有 fetch 都统一经过这一层，其他文件不需要知道细节

// ====== 配置 ======
// 用相对路径，让前端静态页和后端 API 同端口同域，避开 CORS
// 开发时可以把 Spring Boot 跑在 8080，前端静态页也由它托管
const API_BASE = '/api';

// ====== 状态 ======
let _token = localStorage.getItem('authToken') || null;

function setToken(t) {
    _token = t;
    if (t) localStorage.setItem('authToken', t);
    else localStorage.removeItem('authToken');
}

function getToken() { return _token; }

// 是否已经拿到后端 JWT（有 token 才走后端数据，否则退回 localStorage 演示）
function hasSession() { return !!_token; }

// ====== 核心 fetch 封装 ======
// 返回 { ok, code, message, data }，网络错误返回 { ok:false, error:'网络失败' }
async function apiFetch(method, path, body) {
    const url = API_BASE + path;
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (_token) opts.headers['Authorization'] = 'Bearer ' + _token;
    if (body !== undefined) opts.body = JSON.stringify(body);

    try {
        const res = await fetch(url, opts);
        const json = await res.json().catch(() => ({}));
        return { ok: res.ok, code: res.status, ...json };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

// ====== 业务 API ======

// --- 用户 ---
async function apiLogin(username, password) {
    const r = await apiFetch('POST', '/users/login', { username, password });
    if (r.ok && r.data && r.data.token) {
        setToken(r.data.token);
        localStorage.setItem('currentUser', JSON.stringify({
            username: r.data.username, name: r.data.name, type: r.data.type
        }));
        return { success: true, token: r.data.token, user: r.data };
    }
    return { success: false, message: r.message || '登录失败' };
}

async function apiRegister(user) {
    const r = await apiFetch('POST', '/users/register', user);
    if (r.ok) return { success: true, message: r.message || '注册成功' };
    return { success: false, message: r.message || '注册失败' };
}

async function apiMe() {
    const r = await apiFetch('GET', '/users/me');
    return r.ok ? r.data : null;
}

// 管理员：用户列表
async function apiListUsers(type) {
    const q = type ? ('?type=' + encodeURIComponent(type)) : '';
    const r = await apiFetch('GET', '/users' + q);
    return r.ok ? r.data : null;
}

// --- 厨房 ---
async function apiListKitchens(type) {
    const q = type ? ('?type=' + encodeURIComponent(type)) : '';
    const r = await apiFetch('GET', '/kitchens' + q);
    return r.ok ? r.data : null;
}

async function apiKitchenDetail(id) {
    const r = await apiFetch('GET', '/kitchens/' + id);
    return r.ok ? r.data : null;
}

async function apiMyKitchens() {
    const r = await apiFetch('GET', '/kitchens/mine');
    return r.ok ? r.data : null;
}

async function apiDeleteKitchen(id, reason) {
    const q = reason ? ('?reason=' + encodeURIComponent(reason)) : '';
    const r = await apiFetch('DELETE', '/kitchens/' + id + q);
    if (r.ok) return { success: true };
    // offline=true 表示请求没发出去（后端没起），调用方可以退回本地演示流程
    if (r.error) return { success: false, offline: true, message: r.error };
    return { success: false, message: r.message || '删除失败' };
}

async function apiAllKitchens() {
    const r = await apiFetch('GET', '/kitchens/all');
    return r.ok ? r.data : null;
}

// --- 预订 ---
async function apiCreateBooking(body) {
    const r = await apiFetch('POST', '/bookings', body);
    if (r.ok) return { success: true, booking: r.data };
    return { success: false, message: r.message || '预订失败' };
}

async function apiMyBookings() {
    const r = await apiFetch('GET', '/bookings/mine');
    return r.ok ? r.data : null;
}

async function apiPayBooking(id) {
    const r = await apiFetch('POST', '/bookings/' + id + '/pay');
    if (r.ok) return { success: true, booking: r.data };
    return { success: false, message: r.message || '支付失败' };
}

// 提供者：某个厨房的预订（只有该厨房的提供者或管理员能看）
async function apiKitchenBookings(kitchenId) {
    const r = await apiFetch('GET', '/bookings/kitchen/' + kitchenId);
    return r.ok ? r.data : null;
}

// 管理员：所有预订（可按状态过滤）
async function apiAdminBookings(status) {
    const q = status ? ('?status=' + encodeURIComponent(status)) : '';
    const r = await apiFetch('GET', '/bookings' + q);
    return r.ok ? r.data : null;
}

async function apiCancelBooking(id) {
    const r = await apiFetch('POST', '/bookings/' + id + '/cancel');
    if (r.ok) return { success: true, booking: r.data };
    return { success: false, message: r.message || '退订失败' };
}

// --- 聊天 ---
async function apiChatContacts() {
    const r = await apiFetch('GET', '/chat/contacts');
    return r.ok ? r.data : null;
}

async function apiGetConversation(otherUsername) {
    const r = await apiFetch('GET', '/chat/messages/' + encodeURIComponent(otherUsername));
    return r.ok ? r.data : null;
}

async function apiSendChatMessage(to, content) {
    const r = await apiFetch('POST', '/chat/messages', { to, content });
    return r.ok ? r.data : null;
}

// --- 申请 ---
async function apiSubmitKitchenApplication(app) {
    const r = await apiFetch('POST', '/applications/kitchen', app);
    if (r.ok) return { success: true, message: r.message || '申请已提交' };
    return { success: false, message: r.message || '申请失败' };
}

async function apiMyApplications() {
    const r = await apiFetch('GET', '/applications/kitchen/mine');
    return r.ok ? r.data : null;
}

async function apiAllApplications(status) {
    const q = status ? ('?status=' + encodeURIComponent(status)) : '';
    const r = await apiFetch('GET', '/applications/kitchen' + q);
    return r.ok ? r.data : null;
}

async function apiApproveApplication(id) {
    const r = await apiFetch('POST', '/applications/kitchen/' + id + '/approve');
    if (r.ok) return { success: true, kitchen: r.data };
    return { success: false, message: r.message || '审批失败' };
}

async function apiRejectApplication(id) {
    const r = await apiFetch('POST', '/applications/kitchen/' + id + '/reject');
    if (r.ok) return { success: true, application: r.data };
    return { success: false, message: r.message || '驳回失败' };
}

async function apiMyDeletedKitchens() {
    const r = await apiFetch('GET', '/applications/deleted-kitchens');
    return r.ok ? r.data : null;
}

async function apiRestoreKitchen(deletedKitchenId) {
    const r = await apiFetch('POST', '/applications/restore/' + deletedKitchenId);
    if (r.ok) return { success: true, kitchen: r.data };
    return { success: false, message: r.message || '恢复失败' };
}

// ====== 检测后端是否可用 ======
// 只要登录端点可达就算后端在线
async function isBackendAlive() {
    try {
        const r = await fetch(API_BASE + '/users/login', { method: 'OPTIONS' });
        return true; // CORS preflight 就会返回 204
    } catch { return false; }
}

// ====== 暴露到 window ======
window.ApiClient = {
    API_BASE,
    setToken, getToken, hasSession,
    apiLogin, apiRegister, apiMe, apiListUsers,
    apiListKitchens, apiKitchenDetail, apiMyKitchens, apiDeleteKitchen, apiAllKitchens,
    apiCreateBooking, apiMyBookings, apiPayBooking, apiCancelBooking,
    apiKitchenBookings, apiAdminBookings,
    apiChatContacts, apiGetConversation, apiSendChatMessage,
    apiSubmitKitchenApplication, apiMyApplications, apiAllApplications,
    apiApproveApplication, apiRejectApplication,
    apiMyDeletedKitchens, apiRestoreKitchen,
    isBackendAlive,
};
