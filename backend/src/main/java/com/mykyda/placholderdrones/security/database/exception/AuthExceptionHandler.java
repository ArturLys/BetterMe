package com.mykyda.placholderdrones.security.database.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
@Slf4j
public class AuthExceptionHandler {

    @ExceptionHandler(AuthFailException.class)
    public ResponseEntity<String> handleAuthFailException(AuthFailException ex) {
        log.warn(ex.getMessage());
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.UNAUTHORIZED);
    }
}
