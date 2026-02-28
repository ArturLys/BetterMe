package com.mykyda.placholderdrones.app.database.repository;

import com.mykyda.placholderdrones.app.database.entity.DroneLog;
import com.mykyda.placholderdrones.app.database.enums.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DroneLogRepository extends JpaRepository<DroneLog, Long> {
    List<DroneLog> findAllByDroneIdOrderByFinishedAtDesc(Long droneId);

    Optional<DroneLog> getDroneLogByOrderId(Long orderId);

    Optional<DroneLog> findByDroneIdAndDeliveryStatus(Long droneId, DeliveryStatus deliveryStatus);
}
