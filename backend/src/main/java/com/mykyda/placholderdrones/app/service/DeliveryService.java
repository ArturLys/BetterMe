package com.mykyda.placholderdrones.app.service;

import com.mykyda.placholderdrones.app.database.entity.Drone;
import com.mykyda.placholderdrones.app.database.entity.DroneLog;
import com.mykyda.placholderdrones.app.database.entity.Order;
import com.mykyda.placholderdrones.app.database.enums.DeliveryStatus;
import com.mykyda.placholderdrones.app.database.enums.DroneStatus;
import com.mykyda.placholderdrones.app.database.enums.OrderStatus;
import com.mykyda.placholderdrones.app.exception.OrderStatusException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final DroneService droneService;

    private final DroneLogService droneLogService;

    private final OrderService orderService;

    @Value("${placeholder-drones.delivery.origin.latitude}")
    private BigDecimal ORIGIN_LATITUDE;

    @Value("${placeholder-drones.delivery.origin.longitude}")
    private BigDecimal ORIGIN_LONGITUDE;

    @Transactional
    public void startDelivery(long orderId) {
        var order = orderService.findById(orderId);
        if (order.getOrderStatus() == OrderStatus.ORDERED || order.getOrderStatus() == OrderStatus.WAITING_FOR_PAYMENT) {
            var drone = droneService.getUnoccupied();
            drone.setStatus(DroneStatus.OCCUPIED);
            drone.setLastOrderId(orderId);
            order.setOrderStatus(OrderStatus.ON_THE_WAY);
            var droneLog = DroneLog.builder()
                    .drone(drone)
                    .order(order)
                    .build();
            droneService.update(drone);
            orderService.update(order);
            droneLogService.save(droneLog);
        } else throw new OrderStatusException("Order is not suitable for delivery");
    }

    @Transactional
    public void progressDelivery(List<Order> orders) {
        for (Order order : orders) {
            var log = droneLogService.getByOrderId(order.getId());
            if (log == null) {
                order.setOrderStatus(OrderStatus.ORDERED);
                orderService.update(order);
            } else {
                var drone = log.getDrone();

                int newProgress = drone.getProgress() + 10;

                if (newProgress < 100) {

                    BigDecimal progressFactor = BigDecimal.valueOf(newProgress)
                            .divide(BigDecimal.valueOf(100));

                    BigDecimal deltaLat = order.getLatitude()
                            .subtract(ORIGIN_LATITUDE);

                    BigDecimal deltaLon = order.getLongitude()
                            .subtract(ORIGIN_LONGITUDE);

                    BigDecimal newLat = ORIGIN_LATITUDE
                            .add(deltaLat.multiply(progressFactor));

                    BigDecimal newLon = ORIGIN_LONGITUDE
                            .add(deltaLon.multiply(progressFactor));

                    drone.setCurrentLatitude(newLat);
                    drone.setCurrentLongitude(newLon);
                    drone.setProgress(newProgress);

                } else {
                    drone.setStatus(DroneStatus.RETURNING);
                    drone.setProgress(0);

                    drone.setCurrentLatitude(order.getLatitude());
                    drone.setCurrentLongitude(order.getLongitude());

                    order.setOrderStatus(OrderStatus.DELIVERED);
                    orderService.update(order);

                    log.setFinishedAt(LocalDateTime.now());
                    log.setDeliveryStatus(DeliveryStatus.FINISHED);
                    droneLogService.save(log);
                }
                droneService.update(drone);
            }
        }
    }

    @Transactional
    public void progressReturn(List<Drone> drones) {
        for (Drone drone : drones) {

            int newProgress = drone.getProgress() + 10;

            Order lastOrder = orderService.findById(drone.getLastOrderId());

            BigDecimal startLat = lastOrder.getLatitude();
            BigDecimal startLon = lastOrder.getLongitude();

            if (newProgress < 100) {

                BigDecimal progressFactor = BigDecimal.valueOf(newProgress)
                        .divide(BigDecimal.valueOf(100));

                BigDecimal deltaLat = ORIGIN_LATITUDE.subtract(startLat);
                BigDecimal deltaLon = ORIGIN_LONGITUDE.subtract(startLon);

                BigDecimal newLat = startLat
                        .add(deltaLat.multiply(progressFactor));

                BigDecimal newLon = startLon
                        .add(deltaLon.multiply(progressFactor));

                drone.setCurrentLatitude(newLat);
                drone.setCurrentLongitude(newLon);
                drone.setProgress(newProgress);

            } else {
                drone.setStatus(DroneStatus.FREE);
                drone.setProgress(0);

                drone.setCurrentLatitude(ORIGIN_LATITUDE);
                drone.setCurrentLongitude(ORIGIN_LONGITUDE);
            }

            droneService.update(drone);
        }
    }
}
