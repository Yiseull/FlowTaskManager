package org.example.flowtestmanager.global.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
	INVALID_REQUEST(HttpStatus.BAD_REQUEST, "잘못된 요청입니다."),
	INVALID_STATUS_TRANSITION(HttpStatus.BAD_REQUEST, "허용되지 않는 상태 전이입니다."),
	DAILY_TASK_LIMIT(HttpStatus.BAD_REQUEST, "오늘의 작업 한도를 초과했습니다."),
	SWITCH_REASON_REQUIRED(HttpStatus.BAD_REQUEST, "작업 전환 사유가 필요합니다."),
	CONFLICT(HttpStatus.CONFLICT, "동시 요청으로 인한 충돌입니다. 다시 시도해주세요."),
	TASK_NOT_FOUND(HttpStatus.NOT_FOUND, "작업을 찾을 수 없습니다."),
	NO_ACTIVE_SESSION(HttpStatus.NOT_FOUND, "현재 진행 중인 세션이 없습니다."),
	;

	private final HttpStatus status;
	private final String message;
}
