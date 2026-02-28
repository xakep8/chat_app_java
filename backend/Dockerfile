# ---- Stage 1: Build ----
FROM maven:3.9-eclipse-temurin-17 AS build
LABEL authors="kunaldubey"

WORKDIR /app

# Copy pom first (better caching)
COPY pom.xml .
COPY src ./src

# Build jar
RUN mvn clean package -DskipTests


# ---- Stage 2: Runtime ----
FROM eclipse-temurin:17-jdk

WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port (Spring Boot default)
EXPOSE 8080

# Run app
ENTRYPOINT ["java", "-jar", "app.jar"]
