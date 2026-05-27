# ============================================================
# Stage 1: Build
# ============================================================
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Dependencies zuerst (Layer-Caching)
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn
RUN mvn dependency:go-offline -B

# Source kopieren und bauen
COPY src src
RUN mvn clean package -DskipTests -B

# ============================================================
# Stage 2: Runtime
# ============================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=builder /app/target/bewerbungstracker-*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]