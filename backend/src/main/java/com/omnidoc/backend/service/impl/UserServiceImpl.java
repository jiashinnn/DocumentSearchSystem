package com.OmniDoc.backend.service.impl;

import com.OmniDoc.backend.dto.LoginRequest;
import com.OmniDoc.backend.dto.LoginResponse;
import com.OmniDoc.backend.entity.User;
import com.OmniDoc.backend.mapper.UserMapper;
import com.OmniDoc.backend.repository.UserRepository;
import com.OmniDoc.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public LoginResponse login(LoginRequest loginRequest) {
        // Find user by email
        Optional<User> userOptional = userRepository.findByEmail(loginRequest.getEmail());

        if (userOptional.isEmpty()) {
            throw new RuntimeException("User not found.");
        }

        User user = userOptional.get();

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials.");
        }

        return UserMapper.toLoginResponse(user, "Login successful.");
    }
}
