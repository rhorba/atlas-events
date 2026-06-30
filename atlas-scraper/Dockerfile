# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace

COPY pom.xml pom.xml
COPY atlas-api/pom.xml atlas-api/pom.xml
COPY atlas-scraper/pom.xml atlas-scraper/pom.xml

RUN --mount=type=cache,target=/root/.m2 \
    mvn -f pom.xml dependency:go-offline -pl atlas-scraper -am -q

COPY atlas-api/src atlas-api/src
COPY atlas-scraper/src atlas-scraper/src

RUN --mount=type=cache,target=/root/.m2 \
    mvn -f pom.xml package -pl atlas-scraper -am -DskipTests -q

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S atlas && adduser -S atlas -G atlas
WORKDIR /app

COPY --from=build /workspace/atlas-scraper/target/atlas-scraper-*.jar app.jar
RUN chown atlas:atlas app.jar

USER atlas
EXPOSE 8081

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", \
            "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
