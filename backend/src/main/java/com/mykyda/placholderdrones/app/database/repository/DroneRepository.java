package com.mykyda.placholderdrones.app.database.repository;

import com.mykyda.placholderdrones.app.database.entity.Drone;
import com.mykyda.placholderdrones.app.database.enums.DroneStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DroneRepository extends JpaRepository<Drone, Long> {

    @Query(value = """
        SELECT *
        FROM drone
        WHERE status = 'FREE'
        ORDER BY RANDOM()
        LIMIT 1
        """, nativeQuery = true)
    Optional<Drone> getRandomUnoccupied();

    List<Drone> getAllByStatusIs(DroneStatus status);

    Optional<Drone> findByLastOrderId(Long lastOrderId);
}
