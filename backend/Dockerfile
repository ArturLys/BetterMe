FROM gradle:8.5-jdk21 AS build
WORKDIR /app
COPY . .
RUN ./gradlew build --no-daemon -x test

FROM ghcr.io/graalvm/graalvm-community:23.0.2
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]