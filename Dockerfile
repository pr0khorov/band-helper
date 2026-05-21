# Сборка из корня репозитория (Railway по умолчанию смотрит сюда)
FROM maven:3.9-eclipse-temurin-11 AS build
WORKDIR /app
COPY backend/pom.xml .
COPY backend/src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:11-jre-jammy
WORKDIR /app
RUN mkdir -p /app/data /app/backups
COPY --from=build /app/target/band-info-backend-0.0.1-SNAPSHOT.jar app.jar
ENV JAVA_OPTS=""
EXPOSE 8080
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
