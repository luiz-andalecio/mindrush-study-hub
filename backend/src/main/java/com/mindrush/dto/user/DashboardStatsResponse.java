package com.mindrush.dto.user;

import java.util.List;

public record DashboardStatsResponse(
    int dailyProgress,
    int xp,
    int xpToNextLevel,
    int level,
    int rankPosition,
    int simuladosCompleted,
    int essayScore,
    int streak,
    List<WeeklyPerformance> weeklyPerformance
) {
  public record WeeklyPerformance(String day, int score) {}
}
