# syntax=docker/dockerfile:1

# --- build stage ---
FROM eclipse-temurin:26-jdk AS build
WORKDIR /app

# Wrapper와 빌드 정의 먼저 복사 (의존성 캐시 활용)
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
RUN chmod +x gradlew

# 소스 복사 후 fat jar 빌드
COPY src ./src
RUN ./gradlew bootJar --no-daemon

# --- runtime stage ---
FROM eclipse-temurin:26-jre
WORKDIR /app

COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -jar app.jar"]
