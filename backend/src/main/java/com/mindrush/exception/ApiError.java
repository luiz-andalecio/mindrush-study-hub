package com.mindrush.exception;

import java.time.Instant;
import java.util.List;

public record ApiError(
    String message,
    List<String> details,
    String timestamp
) {
  public static ApiError of(String message, List<String> details) {
    return new ApiError(message, details, Instant.now().toString());
  }
}
