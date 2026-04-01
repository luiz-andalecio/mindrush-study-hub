package com.mindrush.controller;

import com.mindrush.dto.user.DashboardStatsResponse;
import com.mindrush.dto.user.UserResponse;
import com.mindrush.service.UserService;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users/me")
public class UserController {

  private final UserService userService;

  public UserController(UserService userService) {
    this.userService = userService;
  }

  @GetMapping
  public UserResponse me(@AuthenticationPrincipal org.springframework.security.core.userdetails.User principal) {
    return userService.getMe(principal.getUsername());
  }

  @PutMapping
  public UserResponse update(
      @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal,
      @RequestBody Map<String, Object> patch) {
    // MVP: atualização parcial bem simples.
    // Futuro: trocar por DTO + validação (ex: nome, avatar, etc.)
    return userService.patchMe(principal.getUsername(), patch);
  }

  @GetMapping("/dashboard")
  public DashboardStatsResponse dashboard(
      @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal) {
    return userService.getDashboard(principal.getUsername());
  }
}
