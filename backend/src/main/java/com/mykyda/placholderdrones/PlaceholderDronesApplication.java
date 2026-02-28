package com.mykyda.placholderdrones;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PlaceholderDronesApplication {

    public static void main(String[] args) {
        SpringApplication.run(PlaceholderDronesApplication.class, args);
    }

}
