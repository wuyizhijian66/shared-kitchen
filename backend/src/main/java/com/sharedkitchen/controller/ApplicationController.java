package com.sharedkitchen.controller;

import com.sharedkitchen.common.Authz;
import com.sharedkitchen.common.BusinessException;
import com.sharedkitchen.common.Result;
import com.sharedkitchen.entity.DeletedKitchen;
import com.sharedkitchen.entity.Kitchen;
import com.sharedkitchen.entity.KitchenApplication;
import com.sharedkitchen.repository.DeletedKitchenRepository;
import com.sharedkitchen.repository.KitchenApplicationRepository;
import com.sharedkitchen.repository.KitchenRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final KitchenApplicationRepository applicationRepository;
    private final KitchenRepository kitchenRepository;
    private final DeletedKitchenRepository deletedKitchenRepository;

    public ApplicationController(KitchenApplicationRepository applicationRepository,
                                  KitchenRepository kitchenRepository,
                                  DeletedKitchenRepository deletedKitchenRepository) {
        this.applicationRepository = applicationRepository;
        this.kitchenRepository = kitchenRepository;
        this.deletedKitchenRepository = deletedKitchenRepository;
    }

    /** 提供者：提交添加厨房申请 */
    @PostMapping("/kitchen")
    public Result<KitchenApplication> submitKitchen(@RequestBody KitchenApplication body,
                                                     @RequestAttribute("currentUsername") String provider) {
        // 必填项先校验，否则直接落到数据库会抛 500（NOT NULL 约束）
        if (body.getKitchenName() == null || body.getKitchenName().isBlank()
                || body.getKitchenType() == null || body.getKitchenType().isBlank()) {
            throw new BusinessException(400, "厨房名称和类型不能为空");
        }
        if (body.getPrice() == null || body.getPrice() <= 0) {
            throw new BusinessException(400, "价格必须大于 0");
        }
        body.setProviderUsername(provider);
        body.setStatus("pending");
        return Result.ok("申请已提交，等待审核", applicationRepository.save(body));
    }

    /** 提供者：我的申请 */
    @GetMapping("/kitchen/mine")
    public Result<List<KitchenApplication>> mine(@RequestAttribute("currentUsername") String provider) {
        return Result.ok(applicationRepository.findByProviderUsername(provider));
    }

    /** 管理员：所有申请 */
    @GetMapping("/kitchen")
    public Result<List<KitchenApplication>> all(@RequestParam(required = false) String status,
                                                @RequestAttribute("currentRole") String role) {
        Authz.requireAdmin(role);
        List<KitchenApplication> list = (status != null)
                ? applicationRepository.findByStatus(status)
                : applicationRepository.findAll();
        return Result.ok(list);
    }

    /** 管理员：审批申请 */
    @PostMapping("/kitchen/{id}/approve")
    public Result<Kitchen> approve(@PathVariable Long id,
                                   @RequestAttribute("currentRole") String role) {
        Authz.requireAdmin(role);
        KitchenApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("申请不存在"));
        app.setStatus("approved");
        applicationRepository.save(app);

        // 审批通过 → 创建厨房
        Kitchen k = new Kitchen();
        k.setName(app.getKitchenName());
        k.setType(app.getKitchenType());
        k.setPrice(app.getPrice());
        // 申请里没有图片，按厨房类型给一张仓库自带的图，避免前端出现坏图
        k.setImage(imageForType(app.getKitchenType()));
        k.setRating(4.5);
        k.setFacilities(app.getFacilities());
        k.setProviderUsername(app.getProviderUsername());
        k.setStatus("available");
        return Result.ok("审批通过", kitchenRepository.save(k));
    }

    /** 管理员：驳回申请 */
    @PostMapping("/kitchen/{id}/reject")
    public Result<KitchenApplication> reject(@PathVariable Long id,
                                             @RequestAttribute("currentRole") String role) {
        Authz.requireAdmin(role);
        KitchenApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("申请不存在"));
        app.setStatus("rejected");
        return Result.ok("已驳回", applicationRepository.save(app));
    }

    /** 申请里没有图片字段，按类型映射到 static/images 下自带的图 */
    private static String imageForType(String type) {
        if (type == null) return "/images/kitchen_1_sunny.jpg";
        return switch (type) {
            case "烘焙厨房" -> "/images/kitchen_2_bakery.jpg";
            case "西式厨房" -> "/images/kitchen_3_western.jpg";
            case "饮品厨房" -> "/images/kitchen_4_beverage.jpg";
            default -> "/images/kitchen_1_sunny.jpg";
        };
    }

    /** 提供者：我的已删除厨房 */
    @GetMapping("/deleted-kitchens")
    public Result<List<DeletedKitchen>> myDeleted(@RequestAttribute("currentUsername") String provider) {
        return Result.ok(deletedKitchenRepository.findByProviderUsername(provider));
    }

    /** 提供者：恢复厨房（从 deletedKitchens 移回 kitchens） */
    @PostMapping("/restore/{deletedKitchenId}")
    public Result<Kitchen> restore(@PathVariable Long deletedKitchenId,
                                   @RequestAttribute("currentUsername") String provider) {
        DeletedKitchen dk = deletedKitchenRepository.findById(deletedKitchenId)
                .orElseThrow(() -> BusinessException.notFound("已删除的厨房不存在"));
        if (!dk.getProviderUsername().equals(provider)) {
            throw new BusinessException(403, "无权限");
        }

        Kitchen k = new Kitchen();
        k.setName(dk.getName());
        k.setType(dk.getType());
        k.setPrice(dk.getPrice());
        k.setRating(dk.getRating());
        k.setImage(dk.getImage());
        k.setFacilities(dk.getFacilities());
        k.setProviderUsername(dk.getProviderUsername());
        k.setStatus("available");

        deletedKitchenRepository.delete(dk);
        return Result.ok("恢复成功", kitchenRepository.save(k));
    }
}
