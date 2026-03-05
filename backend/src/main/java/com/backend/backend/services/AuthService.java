package com.backend.backend.services;

import com.backend.backend.dto.LoginResponse;
import com.backend.backend.entities.Token;
import com.backend.backend.entities.User;
import com.backend.backend.repositories.TokenRepository;
import com.backend.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final TokenRepository tokenRepository;
    private final JwtUtil jwtUtil;

    public AuthResponse createAuthResponse(User user) {
        LoginResponse.UserDto userDto = convertToDto(user);

        // 2. Generate actual tokens
        String accessToken = jwtUtil.generateAccessToken(user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        // 3. Save Refresh Token to DB
        Token tokenEntity = new Token(refreshToken, user);
        tokenRepository.save(tokenEntity);

        LoginResponse loginResponse = createLoginResponse(accessToken, userDto);

        // 4. Set Refresh Token as HttpOnly Cookie
        ResponseCookie cookie = createRefreshTokenCookie(refreshToken, 7 * 24 * 60 * 60);

        return new AuthResponse(loginResponse, cookie);
    }

    public LoginResponse.UserDto convertToDto(User user) {
        return new LoginResponse.UserDto(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail()
        );
    }

    public LoginResponse createLoginResponse(String accessToken, LoginResponse.UserDto userDto) {
        LoginResponse.TokenDto tokenDto = new LoginResponse.TokenDto(accessToken, null);
        return new LoginResponse(tokenDto, userDto);
    }

    public ResponseCookie createRefreshTokenCookie(String refreshToken, long maxAge) {
        return ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(false) // Set to true in production (HTTPS)
                .path("/")
                .maxAge(maxAge)
                .sameSite("Lax")
                .build();
    }

    public record AuthResponse(LoginResponse loginResponse, ResponseCookie cookie) {}
}
