package com.mindrush.controller;

import com.mindrush.dto.auth.AuthResponse;
import com.mindrush.dto.auth.LoginRequest;
import com.mindrush.dto.auth.RegisterRequest;
import com.mindrush.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/register")
  public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
    // OBS: Por enquanto retornamos um JWT único (sem refresh token) para simplificar.
    return authService.register(request);
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest request) {
    return authService.login(request);
  }

  @PostMapping("/forgot-password")
  public void forgotPassword() {
    // MVP: não implementado ainda.
    // Próximo passo: gerar token de reset + enviar e-mail.
    throw new UnsupportedOperationException("Recuperação de senha ainda não implementada.");
  }
}
