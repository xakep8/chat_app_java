package com.backend.backend.controllers;

import com.backend.backend.dto.LoginRequest;
import com.backend.backend.dto.LoginResponse;
import com.backend.backend.dto.RegisterRequest;
import com.backend.backend.entities.User;
import com.backend.backend.repositories.UserRepository;
import com.backend.backend.security.JwtUtil;
import com.backend.backend.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response){
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow(()->new RuntimeException("User not found"));
        if(!passwordEncoder.matches(request.getPassword(),user.getPassword())){
            return ResponseEntity.badRequest().body("Invalid Credentials");
        }

        AuthService.AuthResponse authResponse = authService.createAuthResponse(user);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authResponse.cookie().toString())
                .body(authResponse.loginResponse());
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response){
        if(userRepository.findByEmail(request.getEmail()).isPresent()){
            return ResponseEntity.badRequest().body("Email already exists");
        }
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        User user = new User(request.getFirstName(),request.getLastName(),request.getEmail(),hashedPassword);
        userRepository.save(user);

        AuthService.AuthResponse authResponse = authService.createAuthResponse(user);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authResponse.cookie().toString())
                .body(authResponse.loginResponse());
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshTokens(@CookieValue(value = "refreshToken", required = false) String refreshToken){
        if (refreshToken == null) {
            return ResponseEntity.status(401).body("Refresh token is missing");
        }
        if(!jwtUtil.isTokenValid(refreshToken)){
            return ResponseEntity.badRequest().body("Token is expired");
        }
        
        Long userId = jwtUtil.getUserIdLong(refreshToken);
        String accessToken = jwtUtil.generateAccessToken(userId);
        
        User user = userRepository.findById(userId).orElseThrow(()->new RuntimeException("User not found"));
        
        LoginResponse response = authService.createLoginResponse(accessToken, authService.convertToDto(user));
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        ResponseCookie cookie = authService.createRefreshTokenCookie("", 0);
                
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body("Logged out successfully");
    }
}
