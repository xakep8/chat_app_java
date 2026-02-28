package com.backend.backend.config;

import org.springframework.security.core.context.SecurityContextHolder;

import com.sun.security.auth.UserPrincipal;

public class SecurityUtils {

    public static UserPrincipal getCurrentUser() {
        return (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
    }
}