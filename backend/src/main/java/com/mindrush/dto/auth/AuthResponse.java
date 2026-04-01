package com.mindrush.dto.auth;

import com.mindrush.dto.user.UserResponse;

// Este formato segue o que o frontend atual espera (ver frontend/src/types).
public record AuthResponse(
    String token,
    UserResponse user
) {}
