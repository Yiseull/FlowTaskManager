package org.example.flowtaskmanager;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("PostgreSQL DB 연결이 필요한 통합 테스트 — 로컬 DB 실행 후 활성화")
class FlowTaskManagerApplicationTests {

	@Test
	void contextLoads() {
	}

}
