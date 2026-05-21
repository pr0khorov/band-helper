package com.bandinfo.config;

import com.bandinfo.user.Role;
import com.bandinfo.user.User;
import com.bandinfo.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-username}")
    private String adminUsername;
    @Value("${app.seed.admin-password}")
    private String adminPassword;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            User u = new User();
            u.setUsername(adminUsername);
            u.setPasswordHash(passwordEncoder.encode(adminPassword));
            u.setRole(Role.ADMIN);
            userRepository.save(u);
            System.out.println("[band-info] Seeded admin user: " + adminUsername);
        }
    }
}
