package com.sharedkitchen.controller;

import com.sharedkitchen.common.Authz;
import com.sharedkitchen.common.BusinessException;
import com.sharedkitchen.common.Result;
import com.sharedkitchen.entity.Booking;
import com.sharedkitchen.entity.Kitchen;
import com.sharedkitchen.repository.BookingRepository;
import com.sharedkitchen.repository.KitchenRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingRepository bookingRepository;
    private final KitchenRepository kitchenRepository;

    public BookingController(BookingRepository bookingRepository,
                              KitchenRepository kitchenRepository) {
        this.bookingRepository = bookingRepository;
        this.kitchenRepository = kitchenRepository;
    }

    /** 创建预订 */
    @PostMapping
    public Result<Booking> create(@RequestBody Booking body,
                                   @RequestAttribute("currentUsername") String username) {
        if (body.getKitchenId() == null) {
            throw new BusinessException("厨房ID不能为空");
        }
        Kitchen kitchen = kitchenRepository.findById(body.getKitchenId())
                .orElseThrow(() -> BusinessException.notFound("厨房不存在"));

        Booking b = new Booking();
        b.setUsername(username);
        b.setKitchenId(kitchen.getId());
        b.setKitchenName(kitchen.getName());
        b.setDate(body.getDate());
        b.setTimeSlot(body.getTimeSlot());
        b.setPhone(body.getPhone());
        b.setStatus("待支付");
        return Result.ok("预订成功", bookingRepository.save(b));
    }

    /** 我的预订 */
    @GetMapping("/mine")
    public Result<List<Booking>> mine(@RequestAttribute("currentUsername") String username) {
        return Result.ok(bookingRepository.findByUsername(username));
    }

    /** 厨房的预订（提供者） */
    @GetMapping("/kitchen/{kitchenId}")
    public Result<List<Booking>> byKitchen(@PathVariable Long kitchenId,
                                           @RequestAttribute("currentRole") String role,
                                           @RequestAttribute("currentUsername") String username) {
        // 只有该厨房的提供者本人或管理员能看这件事的订单
        Kitchen kitchen = kitchenRepository.findById(kitchenId)
                .orElseThrow(() -> BusinessException.notFound("厨房不存在"));
        if (!"admin".equals(role) && !username.equals(kitchen.getProviderUsername())) {
            throw new BusinessException(403, "无权限");
        }
        return Result.ok(bookingRepository.findByKitchenId(kitchenId));
    }

    /** 管理员：所有预订 */
    @GetMapping
    public Result<List<Booking>> all(@RequestParam(required = false) String status,
                                     @RequestAttribute("currentRole") String role) {
        Authz.requireAdmin(role);
        List<Booking> list = (status != null)
                ? bookingRepository.findByStatus(status)
                : bookingRepository.findAll();
        return Result.ok(list);
    }

    /** 支付 */
    @PostMapping("/{id}/pay")
    public Result<Booking> pay(@PathVariable Long id,
                                @RequestAttribute("currentUsername") String username) {
        Booking b = bookingRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("预订不存在"));
        if (!b.getUsername().equals(username)) {
            throw new BusinessException(403, "无权限");
        }
        if (!"待支付".equals(b.getStatus()) && !"待确认".equals(b.getStatus())) {
            throw new BusinessException("当前状态不可支付: " + b.getStatus());
        }
        b.setStatus("待使用");
        b.setPaymentStatus("已支付");
        b.setPaymentTime(LocalDateTime.now());
        return Result.ok("支付成功", bookingRepository.save(b));
    }

    /** 退订 */
    @PostMapping("/{id}/cancel")
    public Result<Booking> cancel(@PathVariable Long id,
                                   @RequestAttribute("currentUsername") String username) {
        Booking b = bookingRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("预订不存在"));
        if (!b.getUsername().equals(username)) {
            throw new BusinessException(403, "无权限");
        }
        if ("已取消".equals(b.getStatus()) || "已使用".equals(b.getStatus())) {
            throw new BusinessException("当前状态不可退订: " + b.getStatus());
        }
        b.setStatus("已取消");
        b.setRefundStatus("已退款");
        b.setRefundTime(LocalDateTime.now());
        return Result.ok("退订成功，费用已退还", bookingRepository.save(b));
    }
}
