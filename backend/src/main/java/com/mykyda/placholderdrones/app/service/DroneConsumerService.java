package com.mykyda.placholderdrones.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class DroneConsumerService {

    private final DeliveryService deliveryService;

    private final OrderService orderService;

    private final DroneService droneService;

    @Scheduled(fixedDelay = 20000)
    public void progressDelivery(){
        var orders = orderService.getAllOnTheWayOrder();
        if (orders.isEmpty()){
            log.debug("No orders to process");
        } else {
            deliveryService.progressDelivery(orders);
        }
    }

    @Scheduled(fixedDelay = 30000)
    public void droneReturn(){
        var drones = droneService.getAllReturning();
        if (drones.isEmpty()){
            log.debug("No returning drones");
        } else {
            deliveryService.progressReturn(drones);
        }
    }
}
