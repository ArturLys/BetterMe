package com.mykyda.placholderdrones.app.service;

import com.mykyda.placholderdrones.app.DTO.demo.DroneDTO;
import com.mykyda.placholderdrones.app.DTO.demo.OrderDemoDTO;
import com.mykyda.placholderdrones.app.database.repository.DroneRepository;
import com.mykyda.placholderdrones.app.database.repository.OrderRepository;
import com.mykyda.placholderdrones.app.exception.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DemoService {

    private final OrderRepository orderRepository;

    private final DroneRepository droneRepository;

    @Transactional(readOnly = true)
    public OrderDemoDTO demoById(long id) {
        var order = orderRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("No order with id " + id));
        var optionalDrone = droneRepository.findByLastOrderId(id);
        DroneDTO droneGet = null;
        if (optionalDrone.isPresent()) {
            var drone = optionalDrone.get();
            droneGet = DroneDTO.builder()
                    .currentLatitude(drone.getCurrentLatitude())
                    .currentLongitude(drone.getCurrentLongitude())
                    .progress(drone.getProgress())
                    .status(drone.getStatus())
                    .build();
        }
        return OrderDemoDTO.builder()
                .id(order.getId())
                .orderStatus(order.getOrderStatus())
                .receiverEmail(order.getReceiverEmail())
                .latitude(order.getLatitude())
                .longitude(order.getLongitude())
                .drone(droneGet)
                .compositeTax(order.getCompositeTax())
                .subtotal(order.getSubtotal())
                .kitType(order.getKitType())
                .taxAmount(order.getTaxAmount())
                .timestamp(order.getTimestamp())
                .build();
    }
}
