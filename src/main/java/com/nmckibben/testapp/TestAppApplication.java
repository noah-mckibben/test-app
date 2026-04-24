package com.nmckibben.testapp;

import com.nmckibben.testapp.repository.UserRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class TestAppApplication {

	public static void main(String[] args) {
		SpringApplication.run(TestAppApplication.class, args);
	}

	/**
	 * On every server startup, reset all user statuses to OFFLINE.
	 * This clears any stale ONLINE flags left over from a previous run
	 * where users closed the browser without logging out.
	 */
	@Bean
	ApplicationRunner resetUserStatuses(UserRepository userRepository) {
		return args -> userRepository.findAll().forEach(user -> {
			user.setStatus("OFFLINE");
			userRepository.save(user);
		});
	}
}
