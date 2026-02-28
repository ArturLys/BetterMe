package com.mykyda.placholderdrones.security.database.filter;

import com.mykyda.placholderdrones.security.database.service.AccessTokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final AccessTokenService accessTokenService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        var cookies = request.getCookies();
        if (cookies != null) {
            String access = null;

            for (Cookie cookie : cookies) {
                if ("accessToken".equals(cookie.getName())) {
                    access = cookie.getValue();
                }
            }

            if (access != null && accessTokenService.validate(access)) {
                log.debug("successful validate access token");
            }
        }
        filterChain.doFilter(request, response);
    }

}
