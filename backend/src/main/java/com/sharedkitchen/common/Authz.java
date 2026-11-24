package com.sharedkitchen.common;

/**
 * 最小权限校验工具。
 *
 * <p>修复前 /api/users、/api/kitchens/all、/api/bookings(all)、/api/applications 的
 * 审批接口对任何已登录用户开放，普通账号即可看到全站数据甚至审批通过别人的厨房申请。</p>
 */
public final class Authz {

    private Authz() {
    }

    /** 仅管理员可通过，否则抛 403。role 为 null（未登录）同样拒绝。 */
    public static void requireAdmin(String role) {
        if (!"admin".equals(role)) {
            throw new BusinessException(403, "无权限：该操作仅管理员可用");
        }
    }
}
