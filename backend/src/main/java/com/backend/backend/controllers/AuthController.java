package com.backend.backend.controllers;

import com.backend.backend.dto.LoginRequest;
import com.backend.backend.dto.LoginResponse;
import com.backend.backend.dto.RefreshTokenRequest;
import com.backend.backend.dto.RegisterRequest;
import com.backend.backend.entities.Token;
import com.backend.backend.entities.User;
import com.backend.backend.repositories.TokenRepository;
import com.backend.backend.repositories.UserRepository;
import com.backend.backend.security.JwtUtil;
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
    private final TokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletResponse response){
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow(()->new RuntimeException("User not found"));
        if(!passwordEncoder.matches(request.getPassword(),user.getPassword())){
            return ResponseEntity.badRequest().body("Invalid Credentials");
        }

        // 1. Create UserDto from User entity
        LoginResponse.UserDto userDto = new LoginResponse.UserDto(
            user.getId(),
            user.getFirstName(),
            user.getLastName(),
            user.getEmail()
        );

        // 2. Generate actual tokens
        String accessToken = jwtUtil.generateAccessToken(user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());
        
        // 3. Save Refresh Token to DB
        Token tokenEntity = new Token(refreshToken, user);
        tokenRepository.save(tokenEntity);
        
        LoginResponse.TokenDto token = new LoginResponse.TokenDto(accessToken, null); // Don't send refresh token in body

        // 4. Set Refresh Token as HttpOnly Cookie
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(false) // Set to true in production (HTTPS)
                .path("/")
                .maxAge(7 * 24 * 60 * 60) // 7 days
                .sameSite("Lax")
                .build();
        
        // 5. Return LoginResponse object with Cookie
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new LoginResponse(token, userDto));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request, HttpServletResponse response){
        if(userRepository.findByEmail(request.getEmail()).isPresent()){
            return ResponseEntity.badRequest().body("Email already exists");
        }
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        User user = new User(request.getFirstName(),request.getLastName(),request.getEmail(),hashedPassword);
        userRepository.save(user);
        
        LoginResponse.UserDto userDto = new LoginResponse.UserDto(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail()
        );
        
        // Generate actual tokens
        String accessToken = jwtUtil.generateAccessToken(user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());
        
        // Save Refresh Token to DB
        Token tokenEntity = new Token(refreshToken, user);
        tokenRepository.save(tokenEntity);
        
        LoginResponse.TokenDto token = new LoginResponse.TokenDto(accessToken, null); // Don't send refresh token in body
        
        // Set Refresh Token as HttpOnly Cookie
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(false) // Set to true in production (HTTPS)
                .path("/")
                .maxAge(7 * 24 * 60 * 60) // 7 days
                .sameSite("Lax")
                .build();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new LoginResponse(token, userDto));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshTokens(@CookieValue(value = "refreshToken", required = false) String refreshToken){
        if (refreshToken == null) {
            return ResponseEntity.status(401).body("Refresh token is missing");
        }
        if(!jwtUtil.isTokenValid(refreshToken)){
            return ResponseEntity.badRequest().body("Token is expired");
        }
        String accessToken = jwtUtil.generateAccessToken(jwtUtil.getUserIdLong(refreshToken));
        return ResponseEntity.ok(new LoginResponse.TokenDto(accessToken, null));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // Clear the HttpOnly cookie by setting maxAge to 0
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false) // Set to true in production (HTTPS)
                .path("/")
                .maxAge(0) // Expire immediately
                .sameSite("Lax")
                .build();
                
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body("Logged out successfully");
    }
}
