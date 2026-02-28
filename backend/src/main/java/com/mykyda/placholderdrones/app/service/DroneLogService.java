package com.mykyda.placholderdrones.app.service;

import com.mykyda.placholderdrones.app.database.entity.DroneLog;
import com.mykyda.placholderdrones.app.database.repository.DroneLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DroneLogService {

    private final DroneLogRepository droneLogRepository;

    @Transactional(readOnly = true)
    public List<DroneLog> getByDroneId(Long id) {
        return droneLogRepository.findAllByDroneIdOrderByFinishedAtDesc(id);
    }

    public void save(DroneLog droneLog) {
        droneLogRepository.save(droneLog);
    }

    @Transactional(readOnly = true)
    public DroneLog getByOrderId(Long id) {
        return droneLogRepository.getDroneLogByOrderId(id).orElse(null);
    }
}
