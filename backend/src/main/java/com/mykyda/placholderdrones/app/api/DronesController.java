package com.mykyda.placholderdrones.app.api;

import com.mykyda.placholderdrones.app.DTO.demo.DroneDTO;
import com.mykyda.placholderdrones.app.database.entity.Drone;
import com.mykyda.placholderdrones.app.database.entity.DroneLog;
import com.mykyda.placholderdrones.app.service.DroneLogService;
import com.mykyda.placholderdrones.app.service.DroneService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/drones")
public class DronesController {

    private final DroneService droneService;

    private final DroneLogService droneLogService;


    @Value("${placeholder-drones.delivery.origin.latitude}")
    private BigDecimal ORIGIN_LATITUDE;

    @Value("${placeholder-drones.delivery.origin.longitude}")
    private BigDecimal ORIGIN_LONGITUDE;


    @GetMapping
    public List<Drone> findAll() {
        return droneService.getAll();
    }

    @GetMapping("/home")
    public BigDecimal[] getHome() {
        return new BigDecimal[]{ORIGIN_LATITUDE, ORIGIN_LONGITUDE};
    }

    @GetMapping("/{id}")
    public DroneDTO findByDroneId(@PathVariable Long id) {
        return droneService.getById(id);
    }

    @GetMapping("/log/{id}")
    public List<DroneLog> findLogsByDroneId(@PathVariable Long id) {
        return droneLogService.getByDroneId(id);
    }

    @PostMapping("/facilitate")
    public ResponseEntity<String> facilitateDrone() {
        droneService.createDrone(ORIGIN_LATITUDE, ORIGIN_LONGITUDE);
        return ResponseEntity.ok().build();
    }
}
