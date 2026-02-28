package com.mykyda.placholderdrones.app.DTO.demo;

import com.mykyda.placholderdrones.app.database.enums.DeliveryStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DroneLogDTO {

    Long droneId;

    OrderDTO order;

    LocalDateTime startedAt;

    LocalDateTime finishedAt;

    DeliveryStatus status;
}
