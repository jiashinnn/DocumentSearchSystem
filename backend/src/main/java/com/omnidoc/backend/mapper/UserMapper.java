package com.OmniDoc.backend.mapper;

import com.OmniDoc.backend.dto.LoginResponse;
import com.OmniDoc.backend.entity.User;

public class UserMapper {

    public static LoginResponse toLoginResponse(User user, String message) {
        return new LoginResponse(
                user.getEmail(),
                user.getName(),
                message
        );
    }
}
