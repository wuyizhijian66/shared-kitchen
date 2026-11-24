package com.sharedkitchen.controller;

import com.sharedkitchen.common.BusinessException;
import com.sharedkitchen.common.Result;
import com.sharedkitchen.entity.ChatMessage;
import com.sharedkitchen.entity.User;
import com.sharedkitchen.repository.ChatMessageRepository;
import com.sharedkitchen.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    public ChatController(ChatMessageRepository chatMessageRepository,
                          UserRepository userRepository) {
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
    }

    /** 获取与某人的完整对话 */
    @GetMapping("/messages/{otherUsername}")
    public Result<List<ChatMessage>> conversation(@PathVariable String otherUsername,
                                                    @RequestAttribute("currentUsername") String me) {
        List<ChatMessage> msgs = chatMessageRepository
                .findByFromUsernameAndToUsernameOrFromUsernameAndToUsernameOrderByTimestampAsc(
                        me, otherUsername, otherUsername, me);
        return Result.ok(msgs);
    }

    /** 发送消息 */
    @PostMapping("/messages")
    public Result<ChatMessage> send(@RequestBody Map<String, String> body,
                                     @RequestAttribute("currentUsername") String me) {
        String to = body.get("to");
        String content = body.get("content");
        if (to == null || content == null || content.trim().isEmpty()) {
            throw new BusinessException("收件人和内容不能为空");
        }
        if (!userRepository.existsByUsername(to)) {
            throw new BusinessException("收件人不存在");
        }
        ChatMessage msg = new ChatMessage();
        msg.setFromUsername(me);
        msg.setToUsername(to);
        msg.setContent(content.trim());
        return Result.ok(chatMessageRepository.save(msg));
    }

    /** 联系人列表（当前用户 + 其他所有用户） */
    @GetMapping("/contacts")
    public Result<List<User>> contacts(@RequestAttribute("currentUsername") String me) {
        List<User> users = userRepository.findAll();
        users.removeIf(u -> u.getUsername().equals(me));
        return Result.ok(users);
    }
}
