package com.mindrush.dto.user;

import java.util.List;

// DTO que o frontend React espera.
public record UserResponse(
    String id,
    String name,
    String email,
    String avatar,
    int level,
    int xp,
    int xpToNextLevel,
    int coins,
    int streak,
    int rankPosition,
    List<Object> badges,
    List<Object> achievements
) {}
