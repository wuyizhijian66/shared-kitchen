package com.sharedkitchen.controller;

import com.sharedkitchen.common.Authz;
import com.sharedkitchen.common.BusinessException;
import com.sharedkitchen.common.Result;
import com.sharedkitchen.entity.DeletedKitchen;
import com.sharedkitchen.entity.Kitchen;
import com.sharedkitchen.repository.DeletedKitchenRepository;
import com.sharedkitchen.repository.KitchenRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kitchens")
public class KitchenController {

    private final KitchenRepository kitchenRepository;
    private final DeletedKitchenRepository deletedKitchenRepository;

    public KitchenController(KitchenRepository kitchenRepository,
                              DeletedKitchenRepository deletedKitchenRepository) {
        this.kitchenRepository = kitchenRepository;
        this.deletedKitchenRepository = deletedKitchenRepository;
    }

    /** 所有可用厨房 */
    @GetMapping
    public Result<List<Kitchen>> list(@RequestParam(required = false) String type) {
        List<Kitchen> list = (type != null)
                ? kitchenRepository.findByTypeAndStatus(type, "available")
                : kitchenRepository.findByStatus("available");
        return Result.ok(list);
    }

    /** 厨房详情 */
    @GetMapping("/{id}")
    public Result<Kitchen> detail(@PathVariable Long id) {
        return kitchenRepository.findById(id)
                .map(Result::ok)
                .orElseThrow(() -> BusinessException.notFound("厨房不存在"));
    }

    /** 提供者的厨房 */
    @GetMapping("/mine")
    public Result<List<Kitchen>> mine(@RequestAttribute("currentUsername") String username) {
        return Result.ok(kitchenRepository.findByProviderUsername(username));
    }

    /** 提供者删除厨房（移入 deletedKitchens） */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id,
                               @RequestParam(required = false) String reason,
                               @RequestAttribute("currentRole") String role,
                               @RequestAttribute("currentUsername") String username) {
        Kitchen kitchen = kitchenRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("厨房不存在"));

        // 权限校验：管理员或所属提供者
        if (!"admin".equals(role) && !kitchen.getProviderUsername().equals(username)) {
            throw new BusinessException(403, "无权限");
        }

        // 移入 deleted
        DeletedKitchen dk = new DeletedKitchen();
        dk.setOriginalKitchenId(kitchen.getId());
        dk.setName(kitchen.getName());
        dk.setType(kitchen.getType());
        dk.setPrice(kitchen.getPrice());
        dk.setRating(kitchen.getRating());
        dk.setImage(kitchen.getImage());
        dk.setFacilities(kitchen.getFacilities());
        dk.setProviderUsername(kitchen.getProviderUsername());
        dk.setDeleteReason(reason);
        deletedKitchenRepository.save(dk);

        // 从 kitchens 删除
        kitchenRepository.delete(kitchen);
        return Result.ok();
    }

    /** 管理员：所有厨房（含 pending/rejected） */
    @GetMapping("/all")
    public Result<List<Kitchen>> all(@RequestAttribute("currentRole") String role) {
        Authz.requireAdmin(role);
        return Result.ok(kitchenRepository.findAll());
    }
}
