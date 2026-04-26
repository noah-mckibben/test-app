package com.nmckibben.testapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Enables Spring's @Async support so domain event listeners run on a
 * separate thread pool and never block the HTTP request thread.
 *
 * This means a slow CallTrace write cannot delay TwiML being returned to
 * Twilio (which times out after 15 seconds).
 *
 * When services are extracted, @Async goes away — the listener becomes a
 * Kafka consumer running in its own process.
 */
@Configuration
@EnableAsync
public class AsyncConfig {
    // Spring Boot's default SimpleAsyncTaskExecutor is fine for now.
    // When call volume grows, swap in a ThreadPoolTaskExecutor bean here.
}
