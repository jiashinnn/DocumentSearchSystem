package com.OmniDoc.backend.controller;

import com.OmniDoc.backend.dto.LoginRequest;
import com.OmniDoc.backend.dto.LoginResponse;
import com.OmniDoc.backend.entity.User;
import com.OmniDoc.backend.repository.UserRepository;
import com.OmniDoc.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            LoginResponse response = userService.login(loginRequest);
            return ResponseEntity.ok(response);
        }  catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @PostMapping("/register-temp")
    public ResponseEntity<?> registerTemp(@RequestBody LoginRequest registration) {
        if (userRepository.findByEmail(registration.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("User already exists.");
        }
        User user = new User();
        user.setEmail(registration.getEmail());
        user.setName("Test Employee");
        // Hash the password using the exact same encoder!
        user.setPassword(passwordEncoder.encode(registration.getPassword()));
        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully with hashed password.");
    }
}
