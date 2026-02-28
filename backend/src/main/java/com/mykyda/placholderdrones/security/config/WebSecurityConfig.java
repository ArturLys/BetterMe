package com.mykyda.placholderdrones.security.config;

import com.mykyda.placholderdrones.security.database.filter.JwtFilter;
import com.mykyda.placholderdrones.security.database.service.AccessTokenService;
import com.mykyda.placholderdrones.security.database.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
class WebSecurityConfig {

    @Value("${spring.security.cors.allowed-origins}")
    private String ALLOWED_ORIGINS;

    private final UserService userDetailsService;

    @Bean
    @Order(1)
    SecurityFilterChain apiSecurityFilterChain(HttpSecurity http, JwtFilter jwtFilter){
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/orders/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/orders").permitAll()
                        .requestMatchers(HttpMethod.POST, "/orders/pay/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/drones/home").permitAll()


                        .requestMatchers(HttpMethod.GET, "/drones").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/drones/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/drones/log/*").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/orders/import").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/orders/deliver/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/drones/facilitate").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.PUT, "/orders/*").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.DELETE, "/orders/*").hasRole("ADMIN")

                        .anyRequest().permitAll()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(ALLOWED_ORIGINS.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) {
        return config.getAuthenticationManager();
    }

    @Bean
    public JwtFilter jwtFilter(AccessTokenService accessTokenService) {
        return new JwtFilter(accessTokenService);
    }



}