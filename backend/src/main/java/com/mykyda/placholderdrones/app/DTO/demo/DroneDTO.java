package com.mykyda.placholderdrones.app.DTO.demo;

import com.mykyda.placholderdrones.app.database.entity.Order;
import com.mykyda.placholderdrones.app.database.enums.DroneStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DroneDTO {

    DroneStatus status;

    int progress;

    Order currentOrder;

    BigDecimal currentLatitude;

    BigDecimal currentLongitude;

    List<DroneLogDTO> logs;
}
