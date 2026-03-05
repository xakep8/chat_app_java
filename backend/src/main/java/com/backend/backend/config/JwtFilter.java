package com.backend.backend.config;

import com.backend.backend.entities.User;
import com.backend.backend.repositories.UserRepository;
import com.backend.backend.security.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        System.out.println("[JwtFilter] Processing request: " + path);

        // Do not skip /auth or /ws here, let the header check handle it
        // and let SecurityConfig decide if authentication is required.

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null) {
            // Check for lowercase just in case
            authHeader = request.getHeader("authorization");
        }

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String jwt = authHeader.substring(7);
            System.out.println("[JwtFilter] Found token in header for: " + path);

            try {
                if (jwtUtil.isTokenValid(jwt)) {
                    Long userId = jwtUtil.getUserIdLong(jwt);
                    System.out.println("[JwtFilter] Token is valid for userId: " + userId);

                    if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                        User user = userRepository.findById(userId).orElse(null);

                        if (user != null) {
                            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                    user,
                                    null,
                                    List.of(new SimpleGrantedAuthority("ROLE_USER"))
                            );

                            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authToken);
                            System.out.println("[JwtFilter] Successfully authenticated user: " + user.getEmail());
                        } else {
                            System.out.println("[JwtFilter] User not found in DB for ID: " + userId);
                        }
                    }
                } else {
                    System.out.println("[JwtFilter] Token is EXPIRED or INVALID for: " + path);
                }
            } catch (Exception e) {
                System.out.println("[JwtFilter] Exception validating token: " + e.getMessage());
            }
        } else {
            System.out.println("[JwtFilter] No Bearer token for: " + path);
        }

        filterChain.doFilter(request, response);
    }
}
