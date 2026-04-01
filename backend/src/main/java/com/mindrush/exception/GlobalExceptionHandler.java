package com.mindrush.exception;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
    var details = ex.getBindingResult().getFieldErrors().stream()
        .map(err -> err.getField() + ": " + err.getDefaultMessage())
        .collect(Collectors.toList());
    return ResponseEntity.badRequest().body(ApiError.of("Dados inválidos.", details));
  }

  @ExceptionHandler(UnsupportedOperationException.class)
  public ResponseEntity<ApiError> handleUnsupported(UnsupportedOperationException ex) {
    return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
        .body(ApiError.of(ex.getMessage(), List.of()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> handleGeneric(Exception ex) {
    // Em produção: não retornar detalhes internos.
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiError.of("Erro interno no servidor.", List.of(ex.getClass().getSimpleName())));
  }
}
