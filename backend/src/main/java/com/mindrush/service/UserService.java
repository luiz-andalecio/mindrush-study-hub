package com.mindrush.service;

import com.mindrush.dto.user.DashboardStatsResponse;
import com.mindrush.dto.user.UserResponse;
import com.mindrush.entity.User;
import com.mindrush.exception.NotFoundException;
import com.mindrush.repository.UserRepository;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class UserService {

  private final UserRepository userRepository;

  public UserService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public UserResponse getMe(String email) {
    var user = userRepository.findByEmailIgnoreCase(email)
        .orElseThrow(() -> new NotFoundException("Usuário não encontrado."));
    return toUserResponse(user);
  }

  public UserResponse patchMe(String email, Map<String, Object> patch) {
    var user = userRepository.findByEmailIgnoreCase(email)
        .orElseThrow(() -> new NotFoundException("Usuário não encontrado."));

    // Atualizações permitidas (MVP): name.
    if (patch.containsKey("name") && patch.get("name") instanceof String name) {
      user.setName(name.trim());
    }

    userRepository.save(user);
    return toUserResponse(user);
  }

  public DashboardStatsResponse getDashboard(String email) {
    var user = userRepository.findByEmailIgnoreCase(email)
        .orElseThrow(() -> new NotFoundException("Usuário não encontrado."));

    // MVP: estatísticas fake para a UI renderizar.
    return new DashboardStatsResponse(
        0,
        user.getXp(),
        100,
        user.getLevel(),
        0,
        0,
        0,
        user.getStreak(),
        List.of(
            new DashboardStatsResponse.WeeklyPerformance("Seg", 0),
            new DashboardStatsResponse.WeeklyPerformance("Ter", 0),
            new DashboardStatsResponse.WeeklyPerformance("Qua", 0),
            new DashboardStatsResponse.WeeklyPerformance("Qui", 0),
            new DashboardStatsResponse.WeeklyPerformance("Sex", 0),
            new DashboardStatsResponse.WeeklyPerformance("Sáb", 0),
            new DashboardStatsResponse.WeeklyPerformance("Dom", 0)
        )
    );
  }

  private static UserResponse toUserResponse(User user) {
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
        List.of(),
        List.of());
  }
}
