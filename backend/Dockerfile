
# STAGE 1: Build Phase
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copy the pom.xml config first to cache dependency layers
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy the full codebase and build the production-ready executable package
COPY src ./src
RUN mvn clean package -DskipTests

# STAGE 2: Secure Runtime Phase
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Ensure we do not run the container as root to limit security exposures
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy build artifact from builder stage and rename to prevent filename-leaks
COPY --from=builder /app/target/*.jar app.jar

# Spring Boot default port representation
EXPOSE 8080

# Configure production Java environment variables
# G1GC is recommended for microservices memory usage
ENV JAVA_OPTS="-XX:+UseG1GC -XX:+UseStringDeduplication -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
