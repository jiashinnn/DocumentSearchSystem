package com.OmniDoc.backend.config;

import com.OmniDoc.backend.entity.User;
import com.OmniDoc.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {

        // Seed the default test employee if missing
        if (userRepository.findByEmail("name@company.com").isEmpty()) {
            User employee = new User();
            employee.setEmail("name@company.com");
            employee.setName("Test Employee");
            // Automatically hash the password using BCrypt on startup!
            employee.setPassword(passwordEncoder.encode(""));
            userRepository.save(employee);
        }

        // Seed a new admin user if missing
        if (userRepository.findByEmail("admin@company.com").isEmpty()) {
            User admin = new User();
            admin.setEmail("admin@company.com");
            admin.setName("Admin User");
            admin.setPassword(passwordEncoder.encode(""));
            userRepository.save(admin);
        }
    }
}
