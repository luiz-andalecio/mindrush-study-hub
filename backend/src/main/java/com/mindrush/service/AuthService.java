package com.mindrush.service;

import com.mindrush.dto.auth.AuthResponse;
import com.mindrush.dto.auth.LoginRequest;
import com.mindrush.dto.auth.RegisterRequest;
import com.mindrush.dto.user.UserResponse;
import com.mindrush.entity.User;
import com.mindrush.exception.ConflictException;
import com.mindrush.exception.UnauthorizedException;
import com.mindrush.repository.UserRepository;
import com.mindrush.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  public AuthResponse register(RegisterRequest request) {
    var email = request.email().trim().toLowerCase();
    if (userRepository.existsByEmailIgnoreCase(email)) {
      throw new ConflictException("Já existe um usuário cadastrado com esse e-mail.");
    }

    var user = new User();
    user.setName(request.name().trim());
    user.setEmail(email);
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setLevel(1);
    user.setXp(0);
    user.setCoins(0);
    user.setStreak(0);
    userRepository.save(user);

    var token = jwtService.generateToken(user.getEmail());
    return new AuthResponse(token, toUserResponse(user));
  }

  public AuthResponse login(LoginRequest request) {
    var email = request.email().trim().toLowerCase();
    var user = userRepository.findByEmailIgnoreCase(email)
        .orElseThrow(() -> new UnauthorizedException("E-mail ou senha inválidos."));

    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new UnauthorizedException("E-mail ou senha inválidos.");
    }

    var token = jwtService.generateToken(user.getEmail());
    return new AuthResponse(token, toUserResponse(user));
  }

  private static UserResponse toUserResponse(User user) {
    // Campos ainda “zerados” enquanto não implementamos gamificação/ranking.
    return new UserResponse(
        user.getId().toString(),
        user.getName(),
        user.getEmail(),
        null,
        user.getLevel(),
        user.getXp(),
        100,
        user.getCoins(),
        user.getStreak(),
        0,
        java.util.List.of(),
        java.util.List.of());
  }
}
