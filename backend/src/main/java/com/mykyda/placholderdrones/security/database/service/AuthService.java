package com.mykyda.placholderdrones.security.database.service;

import com.mykyda.placholderdrones.security.DTO.UserLoginDTO;
import com.mykyda.placholderdrones.security.database.entity.User;
import com.mykyda.placholderdrones.security.database.exception.AuthFailException;
import jakarta.servlet.http.Cookie;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;

    private final AccessTokenService accessTokenService;

    @Transactional
    public Cookie login(UserLoginDTO userDTO) {
        Authentication authenticationRequest = UsernamePasswordAuthenticationToken
                .unauthenticated(userDTO.getUsername(), userDTO.getPassword());
        try {
            var authToken = authenticationManager.authenticate(authenticationRequest);
            var userId = ((User) Objects.requireNonNull(authToken.getPrincipal())).getId();

            var accessCookie = createAccessCookie(authToken, userId);

            log.info("Authentication Successful with username {}", userDTO.getUsername());
            return accessCookie;
        } catch (AuthenticationException e) {
            throw new AuthFailException("Incorrect credentials");
        }
    }

    private Cookie createAccessCookie(Authentication authToken, Long userId) {
        return accessTokenService.createCookie(userId, authToken.getName(), authToken.getAuthorities());
    }

    public Cookie logout() {
        return accessTokenService.emptyCookie();
    }
}