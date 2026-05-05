package org.example.flowtaskmanager.api.interrupt;

import java.util.List;
import java.util.UUID;

import org.example.flowtaskmanager.domain.interrupt.Interrupt;
import org.example.flowtaskmanager.domain.interrupt.InterruptService;
import org.example.flowtaskmanager.domain.interrupt.InterruptStatus;
import org.example.flowtaskmanager.domain.task.Task;
import org.example.flowtaskmanager.global.exception.AppException;
import org.example.flowtaskmanager.global.exception.ErrorCode;
import org.example.flowtaskmanager.global.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/interrupts")
public class InterruptController {

	private final InterruptService interruptService;

	public InterruptController(InterruptService interruptService) {
		this.interruptService = interruptService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ApiResponse<InterruptResponse> createInterrupt(@RequestBody CreateInterruptRequest request) {
		if (request.title() == null || request.title().isBlank()) {
			throw new AppException(ErrorCode.INVALID_REQUEST);
		}
		Interrupt interrupt = interruptService.create(request.title(), request.priority());
		return ApiResponse.of(InterruptResponse.from(interrupt));
	}

	@GetMapping
	public ApiResponse<List<InterruptResponse>> getInterrupts(
		@RequestParam(required = false) InterruptStatus status
	) {
		List<InterruptResponse> response = interruptService.getInterrupts(status).stream()
			.map(InterruptResponse::from)
			.toList();
		return ApiResponse.of(response);
	}

	@PatchMapping("/{id}/convert")
	public ApiResponse<ConvertInterruptResponse> convertInterrupt(
		@PathVariable UUID id,
		@RequestBody(required = false) ConvertInterruptRequest request
	) {
		ConvertInterruptRequest req = request != null ? request : new ConvertInterruptRequest(false);
		Task task = interruptService.convert(id, req.startImmediately());
		return ApiResponse.of(new ConvertInterruptResponse(id, task.getId(), task.getStatus().name()));
	}

	@PatchMapping("/{id}/dismiss")
	public ApiResponse<InterruptResponse> dismissInterrupt(@PathVariable UUID id) {
		Interrupt interrupt = interruptService.dismiss(id);
		return ApiResponse.of(InterruptResponse.from(interrupt));
	}

	public record ConvertInterruptResponse(UUID interruptId, UUID taskId, String taskStatus) {}
}
