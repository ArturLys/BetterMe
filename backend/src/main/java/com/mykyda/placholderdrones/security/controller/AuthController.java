package com.mykyda.placholderdrones.security.controller;

import com.mykyda.placholderdrones.security.DTO.UserLoginDTO;
import com.mykyda.placholderdrones.security.database.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody UserLoginDTO userDTO, HttpServletResponse response) {
        var cookie = authService.login(userDTO);
        response.addCookie(cookie);
        return ResponseEntity.ok(cookie.getValue());
    }

    @GetMapping("/logout")
    public String logout(HttpServletResponse response) {
        var cookie = authService.logout();
        response.addCookie(cookie);
        SecurityContextHolder.clearContext();
        return "redirect:/login?logout";
    }
}
