package org.example.flowtaskmanager.global.exception;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(AppException.class)
	public ResponseEntity<Map<String, Object>> handleAppException(AppException e) {
		ErrorCode errorCode = e.getErrorCode();
		return ResponseEntity.status(errorCode.getStatus())
			.body(errorBody(errorCode.name(), errorCode.getMessage()));
	}

	@ExceptionHandler(ObjectOptimisticLockingFailureException.class)
	public ResponseEntity<Map<String, Object>> handleOptimisticLock(ObjectOptimisticLockingFailureException e) {
		ErrorCode errorCode = ErrorCode.CONFLICT;
		return ResponseEntity.status(errorCode.getStatus())
			.body(errorBody(errorCode.name(), errorCode.getMessage()));
	}

	private Map<String, Object> errorBody(String code, String message) {
		return Map.of("error", Map.of("code", code, "message", message));
	}
}
