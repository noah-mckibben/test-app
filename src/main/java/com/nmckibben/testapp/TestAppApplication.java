package com.nmckibben.testapp;

import com.nmckibben.testapp.repository.UserRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TestAppApplication {

    public static void main(String[] args) {
        SpringApplication.run(TestAppApplication.class, args);
    }

    @Bean
    ApplicationRunner resetUserStatuses(UserRepository userRepository) {
        return args -> userRepository.findAll().forEach(user -> {
            user.setStatus("OFFLINE");
            userRepository.save(user);
        });
    }
}
