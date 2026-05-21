package com.bandinfo.user;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public static class CreateUserRequest {
        @NotBlank public String username;
        @NotBlank public String password;
        public String role; // USER | ADMIN
    }

    public static class UpdateUserRequest {
        public String role;
    }

    public static class PasswordRequest {
        @NotBlank public String password;
    }

    private Map<String, Object> toDto(User u) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", u.getId());
        m.put("username", u.getUsername());
        m.put("role", u.getRole().name());
        m.put("createdAt", u.getCreatedAt());
        return m;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        return userRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateUserRequest req) {
        if (userRepository.existsByUsername(req.username)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }
        User u = new User();
        u.setUsername(req.username);
        u.setPasswordHash(passwordEncoder.encode(req.password));
        u.setRole(req.role != null ? Role.valueOf(req.role) : Role.USER);
        userRepository.save(u);
        return ResponseEntity.ok(toDto(u));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody UpdateUserRequest req) {
        User u = userRepository.findById(id).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();
        if (req.role != null) u.setRole(Role.valueOf(req.role));
        userRepository.save(u);
        return ResponseEntity.ok(toDto(u));
    }

    @PostMapping("/{id}/password")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @Valid @RequestBody PasswordRequest req) {
        User u = userRepository.findById(id).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();
        u.setPasswordHash(passwordEncoder.encode(req.password));
        userRepository.save(u);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id,
                                    @AuthenticationPrincipal UserDetails principal) {
        User u = userRepository.findById(id).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();
        if (principal != null && principal.getUsername().equals(u.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot delete current user"));
        }
        userRepository.delete(u);
        return ResponseEntity.noContent().build();
    }
}
