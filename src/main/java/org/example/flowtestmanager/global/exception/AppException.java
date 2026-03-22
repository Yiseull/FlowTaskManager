package org.example.flowtestmanager.global.exception;

import lombok.Getter;

@Getter
public class AppException extends RuntimeException {
	private ErrorCode errorCode;

	public AppException(final ErrorCode errorCode) {
		super(errorCode.getMessage());
		this.errorCode = errorCode;
	}
}
