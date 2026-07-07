package com.OmniDoc.backend.service;

import com.OmniDoc.backend.dto.LoginRequest;
import com.OmniDoc.backend.dto.LoginResponse;

public interface UserService {
    LoginResponse login(LoginRequest loginRequest);
}
