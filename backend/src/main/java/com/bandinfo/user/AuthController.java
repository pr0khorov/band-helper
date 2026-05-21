package com.bandinfo.user;

import com.bandinfo.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtService jwtService,
                          UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    public static class LoginRequest {
        @NotBlank public String username;
        @NotBlank public String password;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.username, req.password));
            UserDetails ud = (UserDetails) auth.getPrincipal();
            User u = userRepository.findByUsername(ud.getUsername()).orElseThrow();
            String token = jwtService.generate(u.getUsername(), u.getRole().name());
            Map<String, Object> resp = new HashMap<>();
            resp.put("token", token);
            resp.put("username", u.getUsername());
            resp.put("role", u.getRole().name());
            return ResponseEntity.ok(resp);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User u = userRepository.findByUsername(principal.getUsername()).orElseThrow();
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", u.getId());
        resp.put("username", u.getUsername());
        resp.put("role", u.getRole().name());
        return ResponseEntity.ok(resp);
    }
}
