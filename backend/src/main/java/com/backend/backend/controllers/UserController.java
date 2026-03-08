package com.backend.backend.controllers;

import com.backend.backend.dto.UserDto;
import com.backend.backend.entities.User;
import com.backend.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/search")
    public ResponseEntity<List<UserDto>> searchUsers(@RequestParam(required = false, defaultValue = "") String query, Principal principal) {
        User currentUser = (User) ((UsernamePasswordAuthenticationToken) principal).getPrincipal();
        
        List<User> usersList;
        if (query == null || query.trim().isEmpty()) {
            usersList = userRepository.findAll();
        } else {
            usersList = userRepository.findAllByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                    query, query, query);
        }

        List<UserDto> users = usersList.stream()
                .filter(user -> !user.getId().equals(currentUser.getId())) // Exclude current user
                .map(user -> UserDto.builder()
                        .id(user.getId())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .email(user.getEmail())
                        .isOnline(user.isOnline())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(users);
    }
}
