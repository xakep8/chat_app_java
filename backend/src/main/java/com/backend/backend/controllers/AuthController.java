package com.backend.backend.controllers;

import com.backend.backend.dto.LoginRequest;
import com.backend.backend.dto.LoginResponse;
import com.backend.backend.dto.RegisterRequest;
import com.backend.backend.entities.Token;
import com.backend.backend.entities.User;
import com.backend.backend.repositories.TokenRepository;
import com.backend.backend.repositories.UserRepository;
import com.backend.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final TokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request){
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
        
        LoginResponse.TokenDto token = new LoginResponse.TokenDto(accessToken, refreshToken);

        // 4. Return LoginResponse object
        return ResponseEntity.ok(new LoginResponse(token, userDto));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request){
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
        
        LoginResponse.TokenDto token = new LoginResponse.TokenDto(accessToken, refreshToken);
        
        return ResponseEntity.ok(new LoginResponse(token, userDto));
    }

    @GetMapping("/verify")
    public String verify(){
        return "Verified";
    }
}
